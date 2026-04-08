import { getTvdbBearerToken } from "@/lib/server/tvdbAuth";
import { TVDB_CACHE_TTL, withTvdbCache } from "@/lib/server/tvdbCache";

const API = "https://api4.thetvdb.com/v4";

export type TvdbEpisodeSummary = {
  id: string;
  name: string;
  overview: string;
  seasonNumber: number;
  episodeNumber: number;
  runtime?: number;
  aired?: string;
};

type RawEp = {
  id?: number;
  name?: string;
  overview?: string;
  seasonNumber?: number;
  number?: number;
  runtime?: number | null;
  aired?: string;
};

export async function fetchSeriesEpisodesForUi(
  seriesNumeric: number,
  maxPages = 12,
): Promise<TvdbEpisodeSummary[]> {
  return withTvdbCache(
    `tvdb:episodes:${seriesNumeric}:${maxPages}`,
    TVDB_CACHE_TTL.episodes,
    async () => {
      const token = await getTvdbBearerToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch first page to determine if there are more pages
      const firstRes = await fetch(
        `${API}/series/${seriesNumeric}/episodes/default?language=eng&page=0`,
        { headers, cache: "no-store" },
      );
      if (!firstRes.ok) return [];
      const firstJson = (await firstRes.json()) as { data?: { episodes?: RawEp[] } };
      const firstEps = firstJson.data?.episodes ?? [];
      if (firstEps.length === 0) return [];

      // If first page is full (50 items), fetch remaining pages in parallel
      let allEps: RawEp[] = [...firstEps];
      if (firstEps.length >= 50) {
        const remainingPages = Array.from(
          { length: maxPages - 1 },
          (_, i) => i + 1,
        );
        const pageResults = await Promise.allSettled(
          remainingPages.map((page) =>
            fetch(
              `${API}/series/${seriesNumeric}/episodes/default?language=eng&page=${page}`,
              { headers, cache: "no-store" },
            ).then(async (res) => {
              if (!res.ok) return [] as RawEp[];
              const json = (await res.json()) as { data?: { episodes?: RawEp[] } };
              return json.data?.episodes ?? [];
            }),
          ),
        );
        for (const result of pageResults) {
          if (result.status !== "fulfilled" || result.value.length === 0) break;
          allEps = allEps.concat(result.value);
          if (result.value.length < 50) break;
        }
      }

      const collected: TvdbEpisodeSummary[] = [];
      for (const e of allEps) {
        if (e.id == null) continue;
        collected.push({
          id: String(e.id),
          name: e.name?.trim() || `Episode ${e.number ?? "?"}`,
          overview: e.overview?.trim() ?? "",
          seasonNumber:
            typeof e.seasonNumber === "number" ? e.seasonNumber : 0,
          episodeNumber: typeof e.number === "number" ? e.number : 0,
          runtime:
            typeof e.runtime === "number" && e.runtime > 0
              ? e.runtime
              : undefined,
          aired: e.aired?.slice(0, 10),
        });
      }

      collected.sort((a, b) => {
        if (a.seasonNumber !== b.seasonNumber)
          return a.seasonNumber - b.seasonNumber;
        return a.episodeNumber - b.episodeNumber;
      });
      return collected;
    },
  );
}
