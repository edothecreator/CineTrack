import { getTvdbBearerToken } from "@/lib/server/tvdbAuth";

const API = "https://api4.thetvdb.com/v4";

type EpisodeRow = {
  id?: number;
  runtime?: number | null;
};

type EpisodesPage = {
  data?: { episodes?: EpisodeRow[] };
};

async function sumSeriesEpisodesRuntime(
  seriesNumeric: number,
  headers: HeadersInit,
): Promise<number> {
  let page = 0;
  let total = 0;
  let guard = 0;
  while (guard++ < 18) {
    const url = `${API}/series/${seriesNumeric}/episodes/default?page=${page}`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return total;
    const json = (await res.json()) as EpisodesPage;
    const eps = json.data?.episodes ?? [];
    for (const e of eps) {
      const r = e.runtime;
      if (typeof r === "number" && Number.isFinite(r) && r > 0) total += r;
    }
    if (eps.length === 0) break;
    page += 1;
    if (eps.length < 50) break;
  }
  return total;
}

/** Best-effort runtime in minutes for a TVDB slug id (`movie-1` / `series-2`). */
export async function fetchRuntimeMinutesForSlug(id: string): Promise<number> {
  const movieMatch = /^movie-(\d+)$/i.exec(id);
  const seriesMatch = /^series-(\d+)$/i.exec(id);
  const token = await getTvdbBearerToken();
  const headers = { Authorization: `Bearer ${token}` };

  if (movieMatch) {
    const mid = Number(movieMatch[1]);
    const res = await fetch(`${API}/movies/${mid}`, { headers, cache: "no-store" });
    if (!res.ok) return 0;
    const json = (await res.json()) as { data?: { runtime?: number | null } };
    const r = json.data?.runtime;
    return typeof r === "number" && Number.isFinite(r) && r > 0 ? r : 0;
  }

  if (seriesMatch) {
    const sid = Number(seriesMatch[1]);
    const ext = await fetch(`${API}/series/${sid}/extended?short=true`, {
      headers,
      cache: "no-store",
    });
    if (ext.ok) {
      const j = (await ext.json()) as {
        data?: { averageRuntime?: number | null };
      };
      const avg = j.data?.averageRuntime;
      const fromEpisodes = await sumSeriesEpisodesRuntime(sid, headers);
      if (fromEpisodes > 0) return fromEpisodes;
      if (typeof avg === "number" && Number.isFinite(avg) && avg > 0) {
        const countRes = await fetch(
          `${API}/series/${sid}/episodes/default?page=0`,
          { headers, cache: "no-store" },
        );
        if (countRes.ok) {
          const cj = (await countRes.json()) as EpisodesPage;
          const n = cj.data?.episodes?.length ?? 0;
          if (n > 0) return Math.round(avg * n);
        }
        return avg;
      }
    }
    return sumSeriesEpisodesRuntime(sid, headers);
  }

  return 0;
}

export async function fetchTotalBingeMinutesForIds(
  ids: string[],
): Promise<number> {
  const unique = [...new Set(ids.filter(Boolean))];
  // Parallelize all runtime fetches instead of sequential awaits
  const results = await Promise.allSettled(
    unique.map((id) => fetchRuntimeMinutesForSlug(id)),
  );
  return results.reduce((sum, r) => {
    return sum + (r.status === "fulfilled" ? r.value : 0);
  }, 0);
}
