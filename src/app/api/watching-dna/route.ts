import { NextResponse } from "next/server";
import { fetchTmdbDetail } from "@/lib/server/tmdb";

export type GenreInsight = {
  name: string;
  count: number;
  weight: number;
};

type HistRow = { id: string; completedAt: number; runtimeMinutes?: number };
type EpRow = { seriesId: string; count: number };

const EST_EP_MIN = 42;

function utcDayBucket(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000;
}

function longestBingeStreak(completedAts: number[]): number {
  const buckets = [...new Set(completedAts.map(utcDayBucket))].sort((a, b) => a - b);
  if (buckets.length === 0) return 0;
  let best = 1, run = 1;
  for (let i = 1; i < buckets.length; i++) {
    if (buckets[i] === buckets[i - 1]! + 1) { run++; best = Math.max(best, run); }
    else run = 1;
  }
  return best;
}

export async function POST(req: Request) {
  if (!process.env.TMDB_API_READ_TOKEN) {
    return NextResponse.json(
      { topGenres: [] as GenreInsight[], completionRate: 0, totalWatchMinutes: 0, bingeStreakDays: 0, trackedTitles: 0, error: "TMDB_API_READ_TOKEN missing." },
      { status: 503 },
    );
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const rec = body as Record<string, unknown>;
  const ids = Array.isArray(rec.ids) ? (rec.ids as string[]).filter(Boolean).slice(0, 24) : [];
  const history = Array.isArray(rec.history)
    ? (rec.history as HistRow[]).filter((h) => h && typeof h.id === "string" && typeof h.completedAt === "number" && Number.isFinite(h.completedAt))
    : [];
  const episodeProgress = Array.isArray(rec.episodeProgress)
    ? (rec.episodeProgress as EpRow[]).filter((r) => r && typeof r.seriesId === "string" && typeof r.count === "number" && r.count > 0)
    : [];

  const tracked = new Set<string>();
  for (const id of ids) tracked.add(id);
  for (const h of history) tracked.add(h.id);
  const trackedTitles = tracked.size;

  const completedUnique = new Set(history.map((h) => h.id)).size;
  const completionRate = trackedTitles > 0 ? completedUnique / trackedTitles : 0;

  let totalWatchMinutes = 0;
  for (const h of history) {
    const m = h.runtimeMinutes;
    if (typeof m === "number" && m > 0) totalWatchMinutes += m;
  }
  for (const e of episodeProgress) totalWatchMinutes += e.count * EST_EP_MIN;

  const bingeStreakDays = longestBingeStreak(history.map((h) => h.completedAt));

  const counts = new Map<string, number>();
  const detailResults = await Promise.allSettled(ids.slice(0, 20).map((id) => fetchTmdbDetail(id)));
  for (const result of detailResults) {
    if (result.status !== "fulfilled") continue;
    for (const name of result.value?.genres ?? []) {
      const n = name?.trim();
      if (!n) continue;
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
  }

  const weighted = [...counts.entries()].map(([name, count]) => ({ name, count, weight: Math.pow(count, 0.75) }));
  const maxW = Math.max(1, ...weighted.map((x) => x.weight));
  const topGenres: GenreInsight[] = weighted
    .map((row) => ({ name: row.name, count: row.count, weight: row.weight / maxW }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({ topGenres, completionRate, totalWatchMinutes, bingeStreakDays, trackedTitles });
}
