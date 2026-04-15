import type { MovieSummary } from "@/types/movie";

export const WATCHED_STORAGE_KEY = "movie-tracker-watched";

export function loadWatchedFromStorage(): MovieSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WATCHED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMovieSummaryShape);
  } catch {
    return [];
  }
}

export function saveWatchedToStorage(items: MovieSummary[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota / private mode */
  }
}

function isMovieSummaryShape(x: unknown): x is MovieSummary {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.posterUrl === "string" &&
    typeof o.rating === "number" &&
    typeof o.releaseDate === "string"
  );
}
