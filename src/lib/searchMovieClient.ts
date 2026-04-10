import type { SearchMovieApiResponse } from "@/lib/searchMovieContract";
import type { MovieSummary } from "@/types/movie";

export type SearchMovieClientResult = {
  movies: MovieSummary[];
  error: string | null;
};

/**
 * Calls the Next.js route. Swap this if the client should hit a different URL later.
 */
export async function fetchSearchMovies(
  query: string,
  signal?: AbortSignal,
): Promise<SearchMovieClientResult> {
  const q = query.trim();
  const params = new URLSearchParams();
  if (q) params.set("q", q);

  const qs = params.toString();
  const res = await fetch(
    qs ? `/api/search-movie?${qs}` : "/api/search-movie",
    { signal },
  );

  let data: SearchMovieApiResponse;
  try {
    data = (await res.json()) as SearchMovieApiResponse;
  } catch {
    return { movies: [], error: "Invalid response from search." };
  }

  const movies = Array.isArray(data.movies) ? data.movies : [];

  if (!res.ok) {
    return {
      movies: [],
      error: data.error ?? `Search failed (${res.status})`,
    };
  }

  return { movies, error: null };
}
