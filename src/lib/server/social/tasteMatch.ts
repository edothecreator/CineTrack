/**
 * Taste Match — computes a 0–100 alignment score between two users.
 *
 * Three signals, weighted:
 *   40% — Watch overlap (Jaccard: shared titles / union of titles)
 *   40% — Rating correlation (Pearson on titles both rated)
 *   20% — Genre affinity overlap (cosine similarity of genre vectors)
 */

import { prisma } from "@/lib/server/prisma";

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const id of a) { if (b.has(id)) intersection++; }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function pearsonCorrelation(pairs: [number, number][]): number {
  const n = pairs.length;
  if (n < 2) return 0;
  const meanA = pairs.reduce((s, [a]) => s + a, 0) / n;
  const meanB = pairs.reduce((s, [, b]) => s + b, 0) / n;
  let num = 0, denomA = 0, denomB = 0;
  for (const [a, b] of pairs) {
    const da = a - meanA, db = b - meanB;
    num += da * db;
    denomA += da * da;
    denomB += db * db;
  }
  const denom = Math.sqrt(denomA * denomB);
  return denom === 0 ? 0 : num / denom;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, magA = 0, magB = 0;
  for (const [k, v] of a) { magA += v * v; if (b.has(k)) dot += v * b.get(k)!; }
  for (const [, v] of b) { magB += v * v; }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function buildGenreVector(genres: (string[] | null)[]): Map<string, number> {
  const vec = new Map<string, number>();
  for (const list of genres) {
    if (!list) continue;
    for (const g of list) {
      vec.set(g, (vec.get(g) ?? 0) + 1);
    }
  }
  return vec;
}

export async function computeTasteMatch(
  viewerUserId: string,
  targetUserId: string,
): Promise<number> {
  if (viewerUserId === targetUserId) return 100;

  const [viewerTitles, targetTitles] = await Promise.all([
    prisma.watchedTitle.findMany({
      where: { userId: viewerUserId },
      select: { tvdbId: true, userRating: true, genres: true },
    }),
    prisma.watchedTitle.findMany({
      where: { userId: targetUserId },
      select: { tvdbId: true, userRating: true, genres: true },
    }),
  ]);

  if (viewerTitles.length === 0 || targetTitles.length === 0) return 0;

  // ── 1. Watch overlap (Jaccard) ──────────────────────────────────────────────
  const viewerIds = new Set(viewerTitles.map((t) => t.tvdbId));
  const targetIds = new Set(targetTitles.map((t) => t.tvdbId));
  const watchScore = jaccardSimilarity(viewerIds, targetIds);

  // ── 2. Rating correlation (Pearson) ────────────────────────────────────────
  const targetRatingMap = new Map(
    targetTitles
      .filter((t) => t.userRating != null)
      .map((t) => [t.tvdbId, t.userRating!]),
  );
  const ratingPairs: [number, number][] = viewerTitles
    .filter((t) => t.userRating != null && targetRatingMap.has(t.tvdbId))
    .map((t) => [t.userRating!, targetRatingMap.get(t.tvdbId)!]);

  // Pearson ranges -1 to 1 → normalize to 0–1
  const rawPearson = pearsonCorrelation(ratingPairs);
  const ratingScore = ratingPairs.length >= 2 ? (rawPearson + 1) / 2 : 0;

  // ── 3. Genre affinity (cosine) ─────────────────────────────────────────────
  const viewerGenreVec = buildGenreVector(
    viewerTitles.map((t) => t.genres as string[] | null),
  );
  const targetGenreVec = buildGenreVector(
    targetTitles.map((t) => t.genres as string[] | null),
  );
  const genreScore = cosineSimilarity(viewerGenreVec, targetGenreVec);

  // ── Weighted combination ───────────────────────────────────────────────────
  const weighted = watchScore * 0.4 + ratingScore * 0.4 + genreScore * 0.2;

  // Scale to 0–100, round to nearest integer
  return Math.round(Math.min(100, Math.max(0, weighted * 100)));
}
