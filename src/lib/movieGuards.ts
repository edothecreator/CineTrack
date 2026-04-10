import type { MovieSummary } from "@/types/movie";

export type HistoryEntry = MovieSummary & { completedAt: number; userRating?: number };

export function isMovieSummaryShape(x: unknown): x is MovieSummary {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.posterUrl === "string" &&
    (o.rating === undefined || typeof o.rating === "number") &&
    typeof o.releaseDate === "string"
  );
}

export function isHistoryEntryShape(x: unknown): x is HistoryEntry {
  if (!isMovieSummaryShape(x)) return false;
  const o = x as HistoryEntry;
  return typeof o.completedAt === "number" && Number.isFinite(o.completedAt);
}
