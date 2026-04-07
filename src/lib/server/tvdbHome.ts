import type { MovieSummary } from "@/types/movie";
import { getTvdbBearerToken } from "@/lib/server/tvdbAuth";
import { TVDB_CACHE_TTL, withTvdbCache } from "@/lib/server/tvdbCache";
import {
  mapMovieRecord,
  mapSeriesRecord,
  type TvdbMovieBaseRecord,
  type TvdbSeriesBaseRecord,
} from "@/lib/server/tvdbSearch";

const API = "https://api4.thetvdb.com/v4";

function dedupeOrdered(items: MovieSummary[]): MovieSummary[] {
  const seen = new Set<string>();
  const out: MovieSummary[] = [];
  for (const m of items) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
}

async function readMovieRows(res: Response): Promise<TvdbMovieBaseRecord[]> {
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: TvdbMovieBaseRecord[] };
  return json.data ?? [];
}

async function readSeriesRows(res: Response): Promise<TvdbSeriesBaseRecord[]> {
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: TvdbSeriesBaseRecord[] };
  return json.data ?? [];
}

/**
 * Trending: newest theatrical / air dates. Popular: TVDB score-weighted catalog slice.
 */
export async function fetchTvdbHomeRows(
  genre?: number,
): Promise<{ trending: MovieSummary[]; popular: MovieSummary[] }> {
  const key = `tvdb:home:${genre != null && Number.isFinite(genre) ? Math.floor(genre) : "all"}`;
  return withTvdbCache(key, TVDB_CACHE_TTL.home, async () => {
    const token = await getTvdbBearerToken();
    const headers = { Authorization: `Bearer ${token}` };
    const g =
      genre != null && Number.isFinite(genre) ? `&genre=${Math.floor(genre)}` : "";

    const qMovies = `country=usa&lang=eng&sort=firstAired${g}`;
    const qSeriesTrend = `country=usa&lang=eng&sort=firstAired&sortType=desc${g}`;
    const qMoviesPop = `country=usa&lang=eng&sort=score${g}`;
    const qSeriesPop = `country=usa&lang=eng&sort=score&sortType=desc${g}`;

    const [tM, tS, pM, pS] = await Promise.all([
      fetch(`${API}/movies/filter?${qMovies}`, { headers, cache: "no-store" }),
      fetch(`${API}/series/filter?${qSeriesTrend}`, { headers, cache: "no-store" }),
      fetch(`${API}/movies/filter?${qMoviesPop}`, { headers, cache: "no-store" }),
      fetch(`${API}/series/filter?${qSeriesPop}`, { headers, cache: "no-store" }),
    ]);

    const trendMovies = (await readMovieRows(tM)).slice(0, 14).map(mapMovieRecord);
    const trendSeries = (await readSeriesRows(tS)).slice(0, 14).map(mapSeriesRecord);
    const popMovies = (await readMovieRows(pM)).slice(0, 16).map(mapMovieRecord);
    const popSeries = (await readSeriesRows(pS)).slice(0, 16).map(mapSeriesRecord);

    return {
      trending: dedupeOrdered([...trendMovies, ...trendSeries]).slice(0, 24),
      popular: dedupeOrdered([...popMovies, ...popSeries]).slice(0, 28),
    };
  });
}
