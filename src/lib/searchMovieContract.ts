import type { MovieSummary } from "@/types/movie";

/** JSON body from GET /api/search-movie — keep in sync with the route handler. */
export type SearchMovieApiResponse = {
  movies: MovieSummary[];
  error?: string;
};
