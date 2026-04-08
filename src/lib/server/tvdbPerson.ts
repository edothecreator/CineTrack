import type { PersonCredit, PersonPublicDetail } from "@/types/person";
import { getTvdbBearerToken } from "@/lib/server/tvdbAuth";
import { TVDB_CACHE_TTL, withTvdbCache } from "@/lib/server/tvdbCache";

const API = "https://api4.thetvdb.com/v4";

type NameTrans = { name?: string; language?: string };
type TranslationBlock = {
  nameTranslations?: NameTrans[];
};

type RecordInfo = { name?: string };
type RawChar = {
  movieId?: number | null;
  seriesId?: number | null;
  movie?: RecordInfo;
  series?: RecordInfo;
};

function pickEnglishName(
  fallback: string,
  translations: TranslationBlock | undefined,
): string {
  const list = translations?.nameTranslations;
  if (!Array.isArray(list) || list.length === 0) return fallback;
  const eng =
    list.find((t) => t.language === "eng" || t.language === "en") ?? list[0];
  return eng?.name?.trim() || fallback;
}

async function fetchPersonUncached(
  peopleId: number,
): Promise<PersonPublicDetail | null> {
  const token = await getTvdbBearerToken();
  const res = await fetch(`${API}/people/${peopleId}/extended?meta=translations`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Record<string, unknown> };
  const d = json.data;
  if (!d) return null;

  const translations = d.translations as TranslationBlock | undefined;
  const name = pickEnglishName(
    typeof d.name === "string" ? d.name : "Performer",
    translations,
  );
  const image =
    typeof d.image === "string" && d.image.startsWith("http") ? d.image : null;

  const chars = Array.isArray(d.characters) ? (d.characters as RawChar[]) : [];
  const bySlug = new Map<string, PersonCredit>();

  for (const c of chars) {
    if (typeof c.movieId === "number" && c.movieId > 0) {
      const slug = `movie-${c.movieId}`;
      const title = c.movie?.name?.trim() || "Untitled film";
      bySlug.set(slug, { slug, title, kind: "movie" });
    } else if (typeof c.seriesId === "number" && c.seriesId > 0) {
      const slug = `series-${c.seriesId}`;
      const title = c.series?.name?.trim() || "Untitled series";
      bySlug.set(slug, { slug, title, kind: "series" });
    }
  }

  return {
    id: peopleId,
    name,
    imageUrl: image,
    credits: [...bySlug.values()],
  };
}

export function fetchPersonPublicDetail(
  peopleId: number,
): Promise<PersonPublicDetail | null> {
  return withTvdbCache(
    `tvdb:person:${peopleId}`,
    TVDB_CACHE_TTL.person,
    () => fetchPersonUncached(peopleId),
  );
}
