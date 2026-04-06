import type { MovieSummary } from "@/types/movie";
import { getTvdbBearerToken } from "@/lib/server/tvdbAuth";
import { TVDB_CACHE_TTL, withTvdbCache } from "@/lib/server/tvdbCache";

const API = "https://api4.thetvdb.com/v4";
const SEARCH_URL = `${API}/search`;

const PLACEHOLDER_POSTER =
  "https://placehold.co/300x450/ddd/666?text=No+poster";

const BROWSE_MOVIE_COUNT = 12;
const BROWSE_SERIES_COUNT = 12;

export function tvdbArtworkUrl(image: string | null | undefined): string {
  if (!image?.trim()) return PLACEHOLDER_POSTER;
  const s = image.trim();
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  return `https://artworks.thetvdb.com${path}`;
}

type TvdbSearchHit = {
  objectID?: string;
  id?: string;
  type?: string;
  tvdb_id?: string;
  name?: string;
  title?: string;
  image_url?: string;
  poster?: string;
  thumbnail?: string;
  year?: string;
  first_air_time?: string;
  score?: number;
  averageRating?: number;
};

type TvdbSearchJson = {
  data?: TvdbSearchHit[];
};

type MovieBaseRecord = {
  id: number;
  name?: string;
  image?: string;
  year?: string;
  score?: number;
};

type SeriesBaseRecord = {
  id: number;
  name?: string;
  image?: string;
  year?: string;
  firstAired?: string;
  score?: number;
};

export type TvdbMovieBaseRecord = MovieBaseRecord;
export type TvdbSeriesBaseRecord = SeriesBaseRecord;

function mapSearchHit(hit: TvdbSearchHit): MovieSummary | null {
  const t = (hit.type ?? "").toLowerCase();
  if (t !== "movie" && t !== "series") return null;

  const id = hit.objectID || hit.id || (hit.tvdb_id ? `${t}-${hit.tvdb_id}` : "");
  if (!id) return null;

  const title = hit.name?.trim() || hit.title?.trim() || "Untitled";

  const out: MovieSummary = {
    id,
    title,
    posterUrl: tvdbArtworkUrl(hit.image_url || hit.poster || hit.thumbnail),
    releaseDate: pickReleaseFromHit(hit),
  };

  const rawScore =
    typeof hit.score === "number"
      ? hit.score
      : typeof hit.averageRating === "number"
        ? hit.averageRating
        : undefined;
  if (rawScore != null && Number.isFinite(rawScore) && rawScore > 0) {
    let r = rawScore;
    if (r > 10) r = r / 10;
    out.rating = Math.round(Math.min(10, Math.max(0, r)) * 10) / 10;
  }

  return out;
}

function pickReleaseFromHit(hit: TvdbSearchHit): string {
  if (hit.first_air_time?.trim()) return hit.first_air_time.slice(0, 10);
  if (hit.year?.trim()) return `${hit.year}-01-01`;
  return "";
}

function mapRating(score: number | undefined): number | undefined {
  if (score == null || !Number.isFinite(score) || score <= 0) return undefined;
  let r = score;
  if (r > 10) r = r / 10;
  return Math.round(Math.min(10, Math.max(0, r)) * 10) / 10;
}

export function mapMovieRecord(m: MovieBaseRecord): MovieSummary {
  const out: MovieSummary = {
    id: `movie-${m.id}`,
    title: m.name?.trim() || "Untitled",
    posterUrl: tvdbArtworkUrl(m.image),
    releaseDate: m.year?.trim() ? `${m.year}-01-01` : "",
  };
  const r = mapRating(m.score);
  if (r !== undefined) out.rating = r;
  return out;
}

export function mapSeriesRecord(s: SeriesBaseRecord): MovieSummary {
  let releaseDate = "";
  if (s.firstAired?.trim()) releaseDate = s.firstAired.slice(0, 10);
  else if (s.year?.trim()) releaseDate = `${s.year}-01-01`;

  const out: MovieSummary = {
    id: `series-${s.id}`,
    title: s.name?.trim() || "Untitled",
    posterUrl: tvdbArtworkUrl(s.image),
    releaseDate,
  };
  const r = mapRating(s.score);
  if (r !== undefined) out.rating = r;
  return out;
}

export async function searchTvdbMoviesAndSeries(
  query: string,
): Promise<MovieSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const norm = q.toLowerCase().slice(0, 120);
  return withTvdbCache(
    `tvdb:search:${norm}`,
    TVDB_CACHE_TTL.search,
    async () => {
      const token = await getTvdbBearerToken();
      const url = new URL(SEARCH_URL);
      url.searchParams.set("query", q);
      url.searchParams.set("limit", "25");
      url.searchParams.set("language", "eng");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`TVDB_SEARCH_${res.status}`);
      }

      const json = (await res.json()) as TvdbSearchJson;
      const rows = json.data ?? [];

      const mapped = rows
        .map(mapSearchHit)
        .filter((x): x is MovieSummary => x != null);

      const seen = new Set<string>();
      const deduped: MovieSummary[] = [];
      for (const m of mapped) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);
        deduped.push(m);
      }
      return deduped;
    },
  );
}

/** First pages of movies + series for the empty-search state. */
export async function getTvdbBrowseDefaults(): Promise<MovieSummary[]> {
  return withTvdbCache(
    "tvdb:browse:p0",
    TVDB_CACHE_TTL.browse,
    async () => {
      const token = await getTvdbBearerToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [moviesRes, seriesRes] = await Promise.all([
        fetch(`${API}/movies?page=0`, { headers, cache: "no-store" }),
        fetch(`${API}/series?page=0`, { headers, cache: "no-store" }),
      ]);

      if (!moviesRes.ok || !seriesRes.ok) {
        throw new Error("TVDB_BROWSE_FAILED");
      }

      const moviesJson = (await moviesRes.json()) as { data?: MovieBaseRecord[] };
      const seriesJson = (await seriesRes.json()) as { data?: SeriesBaseRecord[] };

      const movies = (moviesJson.data ?? [])
        .slice(0, BROWSE_MOVIE_COUNT)
        .map(mapMovieRecord);
      const series = (seriesJson.data ?? [])
        .slice(0, BROWSE_SERIES_COUNT)
        .map(mapSeriesRecord);

      return [...movies, ...series];
    },
  );
}
