import type { MovieDetail } from "@/types/movie";
import { fetchTmdbDetail } from "@/lib/server/tmdb";

/**
 * Resolves a detail page for `movie-{id}` or `tv-{id}` slugs.
 */
export async function resolveMovieDetail(rawId: string): Promise<MovieDetail | undefined> {
  const id = decodeURIComponent(rawId);

  if (process.env.TMDB_API_READ_TOKEN) {
    try {
      const detail = await fetchTmdbDetail(id);
      if (detail) return detail;
    } catch (err) {
      console.error(`TMDB detail fetch error for ${id}:`, err);
    }
  }

  return undefined;
}
