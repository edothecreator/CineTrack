/**
 * TMDB API v3 service layer
 * All TMDB logic lives here — no API calls outside this file.
 * Auth: Bearer token (TMDB_API_READ_TOKEN env var)
 */

import { LRUCache } from "lru-cache";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new LRUCache<string, object>({ max: 900, ttlAutopurge: false });
const inflight = new Map<string, Promise<unknown>>();

export const TMDB_TTL = {
  search: 5 * 60 * 1000,
  browse: 10 * 60 * 1000,
  home: 12 * 60 * 1000,
  detail: 22 * 60 * 1000,
  person: 35 * 60 * 1000,
  episodes: 18 * 60 * 1000,
  pantheon: 10 * 60 * 1000,
} as const;

async function withCache<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as T | undefined;
  if (hit !== undefined) return hit;
  let p = inflight.get(key) as Promise<T> | undefined;
  if (p) return p;
  p = (async () => {
    try {
      const v = await fetcher();
      cache.set(key, v as object, { ttl: ttlMs });
      return v;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p as Promise<unknown>);
  return p;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function getToken(): string {
  const t = process.env.TMDB_API_READ_TOKEN;
  if (!t) throw new Error("TMDB_API_READ_TOKEN is not set");
  return t;
}

async function tmdbFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TMDB_${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ─── Image helpers ────────────────────────────────────────────────────────────

const PLACEHOLDER = "https://placehold.co/300x450/1a1a24/888?text=No+poster";
const BACKDROP_PLACEHOLDER = "https://placehold.co/1280x720/1a1a24/888?text=No+image";

export function posterUrl(path: string | null | undefined, size: "w342" | "w500" | "original" = "w342"): string {
  if (!path) return PLACEHOLDER;
  return `${IMG}/${size}${path}`;
}

export function backdropUrl(path: string | null | undefined, size: "w780" | "w1280" | "original" = "w1280"): string {
  if (!path) return BACKDROP_PLACEHOLDER;
  return `${IMG}/${size}${path}`;
}

export function profileUrl(path: string | null | undefined, size: "w185" | "h632" = "w185"): string {
  if (!path) return "https://placehold.co/185x278/1a1a24/888?text=No+photo";
  return `${IMG}/${size}${path}`;
}

// ─── Shared types ─────────────────────────────────────────────────────────────

import type { MovieSummary, MovieDetail, CastMember, CrewMember, SeasonInfo, WatchProvider } from "@/types/movie";
import type { PersonPublicDetail } from "@/types/person";

type TmdbMovie = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
  last_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  overview?: string;
  tagline?: string;
  media_type?: string;
  original_language?: string;
  original_title?: string;
  original_name?: string;
  original_country?: string[];
  origin_country?: string[];
  status?: string;
  homepage?: string;
  budget?: number;
  revenue?: number;
  spoken_languages?: { english_name: string; iso_639_1: string }[];
  networks?: { id: number; name: string; logo_path?: string | null }[];
  production_companies?: { id: number; name: string; logo_path?: string | null; origin_country?: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  videos?: { results: TmdbVideo[] };
  credits?: { cast: TmdbCast[]; crew: TmdbCrew[] };
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[] };
  seasons?: { id: number; season_number: number; episode_count: number; name: string; poster_path?: string | null; air_date?: string; overview?: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  created_by?: { id: number; name: string; profile_path?: string | null }[];
  recommendations?: { results: TmdbMovie[] };
  similar?: { results: TmdbMovie[] };
  keywords?: { keywords?: { id: number; name: string }[]; results?: { id: number; name: string }[] };
  images?: { backdrops?: TmdbImage[]; posters?: TmdbImage[] };
  "watch/providers"?: { results?: Record<string, { flatrate?: TmdbProvider[]; rent?: TmdbProvider[]; buy?: TmdbProvider[] }> };
};

type TmdbImage = {
  file_path: string;
  width: number;
  height: number;
  vote_average: number;
};

type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
};

type TmdbVideo = {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at?: string;
};

type TmdbCast = {
  id: number;
  name: string;
  character: string;
  profile_path?: string | null;
  order?: number;
  known_for_department?: string;
};

type TmdbCrew = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path?: string | null;
};

type TmdbEpisode = {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_number: number;
  runtime?: number | null;
  air_date?: string;
  still_path?: string | null;
  vote_average?: number;
  guest_stars?: { id: number; name: string; character: string; profile_path?: string | null }[];
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapRating(v: number | undefined): number | undefined {
  if (v == null || !Number.isFinite(v) || v <= 0) return undefined;
  return Math.round(Math.min(10, Math.max(0, v)) * 10) / 10;
}

function mapMovieSummary(m: TmdbMovie, mediaType: "movie" | "tv"): MovieSummary {
  const id = `${mediaType}-${m.id}`;
  const title = (m.title ?? m.name ?? "Untitled").trim();
  const releaseDate = (m.release_date ?? m.first_air_date ?? "").slice(0, 10);
  return {
    id,
    title,
    posterUrl: posterUrl(m.poster_path),
    heroBackdropUrl: m.backdrop_path ? backdropUrl(m.backdrop_path) : undefined,
    rating: mapRating(m.vote_average),
    releaseDate,
    genres: m.genres?.map((g) => g.name) ?? [],
  };
}

function mapTrailers(videos: TmdbVideo[] | undefined): { name: string; url: string }[] {
  if (!videos) return [];
  return videos
    .filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
    .slice(0, 5)
    .map((v) => ({ name: v.name, url: `https://www.youtube.com/watch?v=${v.key}` }));
}

function mapCast(cast: TmdbCast[] | undefined, limit = 18): CastMember[] {
  if (!cast) return [];
  return cast.slice(0, limit).map((c) => ({
    actorName: c.name,
    characterName: c.character || "—",
    imageUrl: c.profile_path ? profileUrl(c.profile_path) : undefined,
    peopleId: c.id,
  }));
}

function mapMovieDetail(m: TmdbMovie, mediaType: "movie" | "tv"): MovieDetail {
  const summary = mapMovieSummary(m, mediaType);
  const genres = m.genres?.map((g) => g.name) ?? [];
  const trailers = mapTrailers(m.videos?.results);
  const cast = mapCast(m.credits?.cast);

  // Crew — directors, writers, creators
  const crew: CrewMember[] = (m.credits?.crew ?? [])
    .filter((c) => ["Director", "Screenplay", "Writer", "Story", "Creator", "Executive Producer"].includes(c.job))
    .slice(0, 12)
    .map((c) => ({
      name: c.name,
      job: c.job,
      department: c.department,
      imageUrl: c.profile_path ? profileUrl(c.profile_path) : undefined,
      peopleId: c.id,
    }));

  let contentRatings: string[] = [];
  if (mediaType === "movie" && m.release_dates?.results) {
    const us = m.release_dates.results.find((r) => r.iso_3166_1 === "US");
    const cert = us?.release_dates?.find((d) => d.type === 3)?.certification
      ?? us?.release_dates?.[0]?.certification;
    if (cert) contentRatings = [cert];
  } else if (mediaType === "tv" && m.content_ratings?.results) {
    const us = m.content_ratings.results.find((r) => r.iso_3166_1 === "US");
    if (us?.rating) contentRatings = [us.rating];
  }

  const networks = m.networks?.map((n) => n.name) ?? [];
  const studios = m.production_companies?.map((c) => c.name) ?? [];

  let runtimeMinutes: number | undefined;
  if (mediaType === "movie") {
    runtimeMinutes = m.runtime ?? undefined;
  } else {
    const runs = m.episode_run_time;
    if (runs && runs.length > 0) runtimeMinutes = runs[0];
  }

  // Keywords
  const keywords = [
    ...(m.keywords?.keywords ?? []),
    ...(m.keywords?.results ?? []),
  ].slice(0, 20).map((k) => k.name);

  // Seasons (TV)
  const seasons: SeasonInfo[] = (m.seasons ?? [])
    .filter((s) => s.season_number > 0)
    .map((s) => ({
      id: s.id,
      seasonNumber: s.season_number,
      name: s.name,
      episodeCount: s.episode_count,
      posterUrl: s.poster_path ? posterUrl(s.poster_path, "w342") : undefined,
      airDate: s.air_date?.slice(0, 10),
      overview: s.overview,
    }));

  // Watch providers (US)
  const usProviders = (m["watch/providers"] as { results?: Record<string, { flatrate?: TmdbProvider[]; rent?: TmdbProvider[]; buy?: TmdbProvider[] }> } | undefined)?.results?.["US"];
  const mapProviders = (arr?: TmdbProvider[]): WatchProvider[] =>
    (arr ?? []).map((p) => ({
      providerId: p.provider_id,
      providerName: p.provider_name,
      logoUrl: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
    }));

  return {
    ...summary,
    description: m.overview?.trim() || "No overview available.",
    tagline: m.tagline?.trim() || undefined,
    kind: mediaType === "movie" ? "movie" : "series",
    genres,
    cast,
    crew,
    runtimeMinutes,
    statusLabel: m.status,
    studios,
    networks,
    trailers,
    backdropUrl: m.backdrop_path ? backdropUrl(m.backdrop_path) : summary.posterUrl,
    contentRatings,
    originalCountry: m.origin_country?.[0] ?? m.original_country?.[0] ?? m.original_language?.toUpperCase(),
    originalLanguage: m.original_language,
    originalTitle: (m.original_title ?? m.original_name)?.trim(),
    budget: m.budget && m.budget > 0 ? m.budget : undefined,
    revenue: m.revenue && m.revenue > 0 ? m.revenue : undefined,
    homepage: m.homepage?.trim() || undefined,
    voteCount: m.vote_count,
    popularity: m.popularity,
    spokenLanguages: m.spoken_languages?.map((l) => l.english_name) ?? [],
    productionCountries: m.production_countries?.map((c) => c.name) ?? [],
    keywords,
    seasons: seasons.length > 0 ? seasons : undefined,
    numberOfSeasons: m.number_of_seasons,
    numberOfEpisodes: m.number_of_episodes,
    lastAirDate: m.last_air_date?.slice(0, 10),
    createdBy: m.created_by?.map((c) => ({
      id: c.id,
      name: c.name,
      imageUrl: c.profile_path ? profileUrl(c.profile_path) : undefined,
    })),
    watchProviders: usProviders ? {
      flatrate: mapProviders(usProviders.flatrate),
      rent: mapProviders(usProviders.rent),
      buy: mapProviders(usProviders.buy),
    } : undefined,
  };
}

// ─── Search ───────────────────────────────────────────────────────────────────

type TmdbSearchResult = { results: (TmdbMovie & { media_type: string })[] };

export async function searchTmdb(query: string): Promise<MovieSummary[]> {
  const q = query.trim();
  if (!q) return [];
  return withCache(`tmdb:search:${q.toLowerCase().slice(0, 120)}`, TMDB_TTL.search, async () => {
    const data = await tmdbFetch<TmdbSearchResult>("/search/multi", {
      query: q,
      include_adult: "false",
      language: "en-US",
      page: "1",
    });
    const seen = new Set<string>();
    const out: MovieSummary[] = [];
    for (const r of data.results ?? []) {
      const mt = r.media_type === "tv" ? "tv" : r.media_type === "movie" ? "movie" : null;
      if (!mt) continue;
      const id = `${mt}-${r.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(mapMovieSummary(r, mt));
    }
    return out;
  });
}

// ─── Browse defaults (trending) ───────────────────────────────────────────────

type TmdbTrendingResult = { results: (TmdbMovie & { media_type: string })[] };

export async function getTmdbBrowseDefaults(): Promise<MovieSummary[]> {
  return withCache("tmdb:browse:trending", TMDB_TTL.browse, async () => {
    const data = await tmdbFetch<TmdbTrendingResult>("/trending/all/week", {
      language: "en-US",
    });
    return (data.results ?? []).slice(0, 24).map((r) => {
      const mt = r.media_type === "tv" ? "tv" : "movie";
      return mapMovieSummary(r, mt);
    });
  });
}

// ─── Home discovery ───────────────────────────────────────────────────────────

type TmdbListResult = { results: TmdbMovie[] };

export async function fetchTmdbHomeRows(genreId?: number): Promise<{
  trending: MovieSummary[];
  popular: MovieSummary[];
}> {
  const key = `tmdb:home:${genreId ?? "all"}`;
  return withCache(key, TMDB_TTL.home, async () => {
    const g = genreId ? String(genreId) : undefined;

    const movieParams: Record<string, string> = { language: "en-US", page: "1" };
    const tvParams: Record<string, string> = { language: "en-US", page: "1" };
    if (g) { movieParams.with_genres = g; tvParams.with_genres = g; }

    const [trendRes, popMovieRes, popTvRes] = await Promise.all([
      tmdbFetch<TmdbTrendingResult>("/trending/all/week", { language: "en-US" }),
      tmdbFetch<TmdbListResult>("/movie/popular", movieParams),
      tmdbFetch<TmdbListResult>("/tv/popular", tvParams),
    ]);

    const trending = (trendRes.results ?? []).slice(0, 24).map((r) => {
      const mt = r.media_type === "tv" ? "tv" : "movie";
      return mapMovieSummary(r, mt);
    });

    const popMovies = (popMovieRes.results ?? []).slice(0, 14).map((r) => mapMovieSummary(r, "movie"));
    const popTv = (popTvRes.results ?? []).slice(0, 14).map((r) => mapMovieSummary(r, "tv"));

    const seen = new Set(trending.map((m) => m.id));
    const popular: MovieSummary[] = [];
    for (const m of [...popMovies, ...popTv]) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      popular.push(m);
    }

    return { trending, popular };
  });
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function fetchTmdbDetail(id: string): Promise<MovieDetail | null> {
  const movieMatch = /^movie-(\d+)$/i.exec(id);
  const tvMatch = /^tv-(\d+)$/i.exec(id);
  if (!movieMatch && !tvMatch) return null;

  return withCache(`tmdb:detail:${id}`, TMDB_TTL.detail, async () => {
    if (movieMatch) {
      const tmdbId = movieMatch[1];
      const data = await tmdbFetch<TmdbMovie>(`/movie/${tmdbId}`, {
        language: "en-US",
        append_to_response: "credits,videos,release_dates,keywords,watch/providers",
      });
      return mapMovieDetail(data, "movie");
    }
    const tmdbId = tvMatch![1];
    const data = await tmdbFetch<TmdbMovie>(`/tv/${tmdbId}`, {
      language: "en-US",
      append_to_response: "credits,videos,content_ratings,keywords,watch/providers",
    });
    return mapMovieDetail(data, "tv");
  });
}

// ─── Episodes ─────────────────────────────────────────────────────────────────

export type TmdbEpisodeSummary = {
  id: string;
  name: string;
  overview: string;
  seasonNumber: number;
  episodeNumber: number;
  runtime?: number;
  aired?: string;
  stillUrl?: string;
  voteAverage?: number;
};

type TmdbSeasonDetail = { episodes: TmdbEpisode[] };
type TmdbTvBase = { number_of_seasons?: number; seasons?: { season_number: number; episode_count: number }[] };

export async function fetchTmdbEpisodes(tvId: number): Promise<TmdbEpisodeSummary[]> {
  return withCache(`tmdb:episodes:${tvId}`, TMDB_TTL.episodes, async () => {
    const show = await tmdbFetch<TmdbTvBase>(`/tv/${tvId}`, { language: "en-US" });
    const seasons = (show.seasons ?? []).filter((s) => s.season_number > 0);

    const results = await Promise.allSettled(
      seasons.map((s) =>
        tmdbFetch<TmdbSeasonDetail>(`/tv/${tvId}/season/${s.season_number}`, { language: "en-US" })
      )
    );

    const all: TmdbEpisodeSummary[] = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      for (const ep of r.value.episodes ?? []) {
        all.push({
          id: String(ep.id),
          name: ep.name?.trim() || `Episode ${ep.episode_number}`,
          overview: ep.overview?.trim() ?? "",
          seasonNumber: ep.season_number,
          episodeNumber: ep.episode_number,
          runtime: ep.runtime ?? undefined,
          aired: ep.air_date?.slice(0, 10),
          stillUrl: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : undefined,
          voteAverage: ep.vote_average && ep.vote_average > 0 ? Math.round(ep.vote_average * 10) / 10 : undefined,
        });
      }
    }

    all.sort((a, b) => a.seasonNumber !== b.seasonNumber ? a.seasonNumber - b.seasonNumber : a.episodeNumber - b.episodeNumber);
    return all;
  });
}

// ─── Person ───────────────────────────────────────────────────────────────────

type TmdbPersonDetail = {
  id: number;
  name: string;
  profile_path?: string | null;
  biography?: string;
  combined_credits?: {
    cast: { id: number; title?: string; name?: string; media_type: string }[];
  };
};

export async function fetchTmdbPerson(personId: number): Promise<PersonPublicDetail | null> {
  return withCache(`tmdb:person:${personId}`, TMDB_TTL.person, async () => {
    const data = await tmdbFetch<TmdbPersonDetail>(`/person/${personId}`, {
      language: "en-US",
      append_to_response: "combined_credits",
    });

    const credits = (data.combined_credits?.cast ?? [])
      .filter((c) => c.media_type === "movie" || c.media_type === "tv")
      .slice(0, 40)
      .map((c) => {
        const mt = c.media_type === "tv" ? "tv" : "movie";
        return {
          slug: `${mt}-${c.id}`,
          title: (c.title ?? c.name ?? "Untitled").trim(),
          kind: mt as "movie" | "series",
        };
      });

    // Dedupe
    const seen = new Set<string>();
    const deduped = credits.filter((c) => {
      if (seen.has(c.slug)) return false;
      seen.add(c.slug);
      return true;
    });

    return {
      id: personId,
      name: data.name,
      imageUrl: data.profile_path ? profileUrl(data.profile_path) : null,
      credits: deduped,
    };
  });
}

// ─── Pantheon (top rated) ─────────────────────────────────────────────────────

export type PantheonPageResult = {
  items: MovieSummary[];
  nextPage: number | null;
};

export async function fetchTmdbPantheonPage(page: number): Promise<PantheonPageResult> {
  const p = Math.max(1, page + 1); // TMDB pages are 1-based
  return withCache(`tmdb:pantheon:${p}`, TMDB_TTL.pantheon, async () => {
    const [moviesRes, tvRes] = await Promise.all([
      tmdbFetch<TmdbListResult>("/movie/top_rated", { language: "en-US", page: String(p) }),
      tmdbFetch<TmdbListResult>("/tv/top_rated", { language: "en-US", page: String(p) }),
    ]);

    const movies = (moviesRes.results ?? []).slice(0, 10).map((r) => mapMovieSummary(r, "movie"));
    const tv = (tvRes.results ?? []).slice(0, 10).map((r) => mapMovieSummary(r, "tv"));

    const items = [...movies, ...tv];
    const nextPage = items.length >= 20 ? page + 1 : null;
    return { items, nextPage };
  });
}

// ─── Binge runtime ────────────────────────────────────────────────────────────

export async function fetchTmdbRuntimeForId(id: string): Promise<number> {
  const movieMatch = /^movie-(\d+)$/i.exec(id);
  const tvMatch = /^tv-(\d+)$/i.exec(id);

  if (movieMatch) {
    try {
      const data = await tmdbFetch<TmdbMovie>(`/movie/${movieMatch[1]}`, { language: "en-US" });
      return data.runtime ?? 0;
    } catch { return 0; }
  }

  if (tvMatch) {
    try {
      const data = await tmdbFetch<TmdbMovie>(`/tv/${tvMatch[1]}`, { language: "en-US" });
      const avgRuntime = data.episode_run_time?.[0] ?? 0;
      const totalEps = data.number_of_episodes ?? 0;
      return avgRuntime * totalEps;
    } catch { return 0; }
  }

  return 0;
}

export async function fetchTotalBingeMinutesForIds(ids: string[]): Promise<number> {
  const unique = [...new Set(ids.filter(Boolean))];
  const results = await Promise.allSettled(unique.map((id) => fetchTmdbRuntimeForId(id)));
  return results.reduce((sum, r) => sum + (r.status === "fulfilled" ? r.value : 0), 0);
}
