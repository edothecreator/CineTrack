import type { CastMember, MovieDetail } from "@/types/movie";
import { getTvdbBearerToken } from "@/lib/server/tvdbAuth";
import { TVDB_CACHE_TTL, withTvdbCache } from "@/lib/server/tvdbCache";

const API = "https://api4.thetvdb.com/v4";

const PLACEHOLDER =
  "https://placehold.co/300x450/1a1a24/888?text=No+poster";

type OverviewTrans = { language?: string; overview?: string };
type NameTrans = { language?: string; name?: string };
type TranslationBlock = {
  overviewTranslations?: OverviewTrans[];
  nameTranslations?: NameTrans[];
};

type Artwork = { image?: string; width?: number; height?: number; type?: number };

type TvdbCharacter = {
  personName?: string;
  name?: string;
  peopleType?: string;
  personImgURL?: string;
  image?: string;
  peopleId?: number;
  personId?: number;
};

function pickEnglishOverview(translations: TranslationBlock | undefined): string {
  const list = translations?.overviewTranslations;
  if (!Array.isArray(list)) return "";
  const eng =
    list.find((o) => o.language === "eng") ??
    list.find((o) => o.language === "en") ??
    list[0];
  return eng?.overview?.trim() ?? "";
}

function pickEnglishName(
  fallback: string,
  translations: TranslationBlock | undefined,
): string {
  const list = translations?.nameTranslations;
  if (!Array.isArray(list) || list.length === 0) return fallback;
  const eng =
    list.find((o) => o.language === "eng" || o.language === "en") ?? list[0];
  return eng?.name?.trim() || fallback;
}

function pickBackdrop(
  posterUrl: string,
  artworks: Artwork[] | undefined,
  primaryImage?: string,
): string {
  if (Array.isArray(artworks) && artworks.length > 0) {
    const sorted = [...artworks].sort(
      (a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0),
    );
    const best = sorted.find((a) => a.image?.startsWith("http"));
    if (best?.image) return best.image;
  }
  if (primaryImage?.startsWith("http")) return primaryImage;
  return posterUrl;
}

function mapCast(chars: TvdbCharacter[] | undefined, limit = 18): CastMember[] {
  if (!Array.isArray(chars)) return [];
  return chars.slice(0, limit).map((c) => ({
    actorName: c.personName?.trim() || "—",
    characterName: c.name?.trim() || "—",
    roleType: c.peopleType,
    imageUrl: c.personImgURL || c.image,
    peopleId:
      typeof c.peopleId === "number"
        ? c.peopleId
        : typeof c.personId === "number"
          ? c.personId
          : undefined,
  }));
}

function mapRating(score: number | undefined): number | undefined {
  if (score == null || !Number.isFinite(score) || score <= 0) return undefined;
  // TVDB extended endpoint returns scores on a 0–10 scale already.
  // Guard: if somehow >10 (shouldn't happen on extended), normalise down.
  const r = score > 10 ? score / 10 : score;
  return Math.round(Math.min(10, Math.max(0, r)) * 10) / 10;
}

function usaOrFirstRelease(
  releases: { country?: string; date?: string }[] | undefined,
): string {
  if (!Array.isArray(releases)) return "";
  const usa = releases.find((r) => r.country?.toLowerCase() === "usa");
  const d = usa?.date ?? releases[0]?.date;
  return d?.slice(0, 10) ?? "";
}

async function fetchTvdbDetailUncached(slug: string): Promise<MovieDetail | null> {
  const movieMatch = /^movie-(\d+)$/i.exec(slug);
  const seriesMatch = /^series-(\d+)$/i.exec(slug);
  if (!movieMatch && !seriesMatch) return null;

  const token = await getTvdbBearerToken();
  const headers = { Authorization: `Bearer ${token}` };

  try {
    if (movieMatch) {
      const id = Number(movieMatch[1]);
      const url = `${API}/movies/${id}/extended?meta=translations`;
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) return null;
      const json = (await res.json()) as { data?: Record<string, unknown> };
      const d = json.data;
      if (!d) return null;

      const image = typeof d.image === "string" ? d.image : "";
      const posterUrl = image.startsWith("http") ? image : PLACEHOLDER;
      const artworks = d.artworks as Artwork[] | undefined;
      const backdropUrl = pickBackdrop(posterUrl, artworks, image);

      const genres = Array.isArray(d.genres)
        ? (d.genres as { name?: string }[])
            .map((g) => g.name)
            .filter((n): n is string => Boolean(n?.trim()))
        : [];

      const studios = Array.isArray(d.studios)
        ? (d.studios as { name?: string }[])
            .map((s) => s.name)
            .filter((n): n is string => Boolean(n?.trim()))
        : [];

      const releases = d.releases as { country?: string; date?: string }[] | undefined;
      const releaseDate =
        usaOrFirstRelease(releases) ||
        (typeof d.year === "string" && d.year ? `${d.year}-01-01` : "");

      const status = d.status as { name?: string } | undefined;
      const contentRatings = Array.isArray(d.contentRatings)
        ? (d.contentRatings as { name?: string; country?: string }[])
            .map((c) => [c.country, c.name].filter(Boolean).join(" ").trim())
            .filter((s): s is string => s.length > 0)
        : [];

      const trailers = Array.isArray(d.trailers)
        ? (d.trailers as { name?: string; url?: string }[])
            .filter((t) => t.url)
            .slice(0, 5)
            .map((t) => ({ name: t.name ?? "Trailer", url: t.url! }))
        : [];

      const translations = d.translations as TranslationBlock | undefined;
      const description =
        pickEnglishOverview(translations) || "No overview available.";
      const title = pickEnglishName(
        String(d.name ?? "Untitled"),
        translations,
      );

      const runtime =
        typeof d.runtime === "number" ? d.runtime : undefined;

      return {
        id: `movie-${id}`,
        title,
        posterUrl,
        backdropUrl,
        rating: mapRating(d.score as number | undefined),
        releaseDate,
        description,
        kind: "movie",
        genres,
        cast: mapCast(d.characters as TvdbCharacter[] | undefined),
        runtimeMinutes: runtime,
        statusLabel: status?.name,
        studios,
        networks: [],
        trailers,
        contentRatings,
        originalCountry:
          typeof d.originalCountry === "string" ? d.originalCountry : undefined,
      };
    }

    const id = Number(seriesMatch![1]);
    const url = `${API}/series/${id}/extended?meta=translations`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Record<string, unknown> };
    const d = json.data;
    if (!d) return null;

    const image = typeof d.image === "string" ? d.image : "";
    const posterUrl = image.startsWith("http") ? image : PLACEHOLDER;
    const artworks = d.artworks as Artwork[] | undefined;
    const backdropUrl = pickBackdrop(posterUrl, artworks, image);

    const genres = Array.isArray(d.genres)
      ? (d.genres as { name?: string }[])
          .map((g) => g.name)
          .filter((n): n is string => Boolean(n?.trim()))
      : [];

    const translations = d.translations as TranslationBlock | undefined;
    const description =
      pickEnglishOverview(translations) || "No overview available.";
    const title = pickEnglishName(String(d.name ?? "Untitled"), translations);

    const firstAired =
      typeof d.firstAired === "string" ? d.firstAired.slice(0, 10) : "";
    const year = typeof d.year === "string" ? d.year : "";
    const releaseDate = firstAired || (year ? `${year}-01-01` : "");

    const status = d.status as { name?: string } | undefined;

    const networks: string[] = [];
    const origNet = d.originalNetwork as { name?: string } | undefined;
    if (origNet?.name) networks.push(origNet.name);

    return {
      id: `series-${id}`,
      title,
      posterUrl,
      backdropUrl,
      rating: mapRating(d.score as number | undefined),
      releaseDate,
      description,
      kind: "series",
      genres,
      cast: mapCast(d.characters as TvdbCharacter[] | undefined),
      statusLabel: status?.name,
      studios: [],
      networks,
      trailers: [],
      contentRatings: [],
      originalCountry:
        typeof d.originalCountry === "string" ? d.originalCountry : undefined,
    };
  } catch {
    return null;
  }
}

export function fetchTvdbDetailBySlug(slug: string): Promise<MovieDetail | null> {
  return withTvdbCache(
    `tvdb:detail:${slug}`,
    TVDB_CACHE_TTL.detail,
    () => fetchTvdbDetailUncached(slug),
  );
}
