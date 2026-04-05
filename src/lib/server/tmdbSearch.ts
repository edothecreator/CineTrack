import type { MovieSummary } from "@/types/movie";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w300";

type TmdbMovieResult = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string | null;
};

type TmdbSearchJson = {
  results?: TmdbMovieResult[];
};

function mapTmdbMovie(m: TmdbMovieResult): MovieSummary {
  return {
    id: String(m.id),
    title: m.title,
    posterUrl: m.poster_path
      ? `${TMDB_IMAGE_BASE}${m.poster_path}`
      : "https://placehold.co/300x450/ddd/666?text=No+poster",
    rating: m.vote_average,
    releaseDate: m.release_date ?? "",
  };
}

/**
 * Server-only TMDB search. Replace this module if the upstream provider changes;
 * the route handler can keep calling a function with the same contract.
 */
export async function searchTmdbMovies(query: string): Promise<MovieSummary[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY_MISSING");
  }

  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`TMDB_HTTP_${res.status}`);
  }

  const data = (await res.json()) as TmdbSearchJson;
  return (data.results ?? []).map(mapTmdbMovie);
}
