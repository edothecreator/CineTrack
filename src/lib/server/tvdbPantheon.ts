import type { MovieSummary } from "@/types/movie";
import { getTvdbBearerToken } from "@/lib/server/tvdbAuth";
import { mapSeriesRecord, type TvdbSeriesBaseRecord } from "@/lib/server/tvdbSearch";

const API = "https://api4.thetvdb.com/v4";

export type PantheonPageResult = {
  items: MovieSummary[];
  /** Next page index (0-based), or null when exhausted. */
  nextPage: number | null;
};

export async function fetchPantheonSeriesPage(
  page: number,
): Promise<PantheonPageResult> {
  const token = await getTvdbBearerToken();
  const headers = { Authorization: `Bearer ${token}` };
  const p = Math.max(0, Math.floor(page));
  const url = `${API}/series/filter?country=usa&lang=eng&sort=score&sortType=desc&page=${p}`;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`TVDB_PANTHEON_${res.status}`);
  }

  const json = (await res.json()) as {
    data?: TvdbSeriesBaseRecord[];
    links?: { next?: string | null; page_size?: number };
  };

  const rows = json.data ?? [];
  const items = rows.map(mapSeriesRecord);
  const hasNextLink = Boolean(
    json.links?.next &&
      typeof json.links.next === "string" &&
      json.links.next.trim(),
  );
  const pageSize = json.links?.page_size ?? 20;
  const nextPage =
    hasNextLink || rows.length >= pageSize ? p + 1 : null;

  return { items, nextPage };
}
