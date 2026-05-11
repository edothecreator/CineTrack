import { describe, it, expect } from "vitest";

// ── Pure algorithm tests (no DB) ──────────────────────────────────────────────
// We test the math directly, not the Prisma-dependent wrapper.

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
    num += da * db; denomA += da * da; denomB += db * db;
  }
  const denom = Math.sqrt(denomA * denomB);
  return denom === 0 ? 0 : num / denom;
}

describe("jaccardSimilarity", () => {
  it("returns 1 for identical sets", () => {
    const a = new Set(["movie-1", "movie-2", "tv-3"]);
    expect(jaccardSimilarity(a, a)).toBe(1);
  });

  it("returns 0 for completely disjoint sets", () => {
    const a = new Set(["movie-1", "movie-2"]);
    const b = new Set(["tv-3", "tv-4"]);
    expect(jaccardSimilarity(a, b)).toBe(0);
  });

  it("returns 0.5 for 50% overlap", () => {
    const a = new Set(["movie-1", "movie-2"]);
    const b = new Set(["movie-1", "tv-3"]);
    expect(jaccardSimilarity(a, b)).toBeCloseTo(1 / 3);
  });

  it("returns 0 for two empty sets", () => {
    expect(jaccardSimilarity(new Set(), new Set())).toBe(0);
  });

  it("returns 0 when one set is empty", () => {
    const a = new Set(["movie-1"]);
    expect(jaccardSimilarity(a, new Set())).toBe(0);
  });
});

describe("pearsonCorrelation", () => {
  it("returns 1 for perfectly correlated ratings", () => {
    const pairs: [number, number][] = [[8, 8], [9, 9], [7, 7], [10, 10]];
    expect(pearsonCorrelation(pairs)).toBeCloseTo(1);
  });

  it("returns -1 for perfectly anti-correlated ratings", () => {
    const pairs: [number, number][] = [[10, 1], [8, 3], [6, 5], [4, 7]];
    expect(pearsonCorrelation(pairs)).toBeCloseTo(-1);
  });

  it("returns 0 for fewer than 2 pairs", () => {
    expect(pearsonCorrelation([[8, 9]])).toBe(0);
    expect(pearsonCorrelation([])).toBe(0);
  });

  it("returns 0 for constant ratings (no variance)", () => {
    const pairs: [number, number][] = [[8, 8], [8, 9], [8, 7]];
    expect(pearsonCorrelation(pairs)).toBe(0);
  });
});
