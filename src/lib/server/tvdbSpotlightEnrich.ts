import type { MovieSummary } from "@/types/movie";
import { getTvdbBearerToken } from "@/lib/server/tvdbAuth";
import { tvdbArtworkUrl } from "@/lib/server/tvdbSearch";

const API = "https://api4.thetvdb.com/v4";

type Artwork = {
  image?: string;
  width?: number;
  height?: number;
  type?: number;
};

function bestBackdropFromArtworks(
  artworks: Artwork[] | undefined,
  posterFallback: string,
): string {
  if (!Array.isArray(artworks) || artworks.length === 0) return posterFallback;
  const scored = [...artworks]
    .filter((a) => a.image?.trim())
    .sort(
      (a, b) =>
        (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0),
    );
  const pick = scored[0];
  return pick?.image ? tvdbArtworkUrl(pick.image) : posterFallback;
}

/**
 * Fetches extended records so spotlight/backdrops and posters resolve via TVDB artworks.
 */
export async function enrichSummariesForSpotlight(
  items: MovieSummary[],
): Promise<MovieSummary[]> {
  const token = await getTvdbBearerToken();
  const headers = { Authorization: `Bearer ${token}` };

  const tasks = items.map(async (m) => {
    const movieMatch = /^movie-(\d+)$/i.exec(m.id);
    const seriesMatch = /^series-(\d+)$/i.exec(m.id);
    const posterFallback = m.posterUrl?.trim()
      ? m.posterUrl
      : tvdbArtworkUrl(null);

    try {
      if (movieMatch) {
        const nid = Number(movieMatch[1]);
        const res = await fetch(
          `${API}/movies/${nid}/extended?meta=translations`,
          { headers, cache: "no-store" },
        );
        if (!res.ok) {
          return { ...m, posterUrl: posterFallback };
        }
        const json = (await res.json()) as {
          data?: {
            image?: string;
            artworks?: Artwork[];
            score?: number;
          };
        };
        const d = json.data;
        const poster = d?.image?.trim()
          ? tvdbArtworkUrl(d.image)
          : posterFallback;
        const hero = bestBackdropFromArtworks(d?.artworks, poster);
        const rating =
          typeof d?.score === "number" && Number.isFinite(d.score)
            ? Math.min(10, Math.max(0, d.score > 10 ? d.score / 10 : d.score))
            : m.rating;
        return {
          ...m,
          posterUrl: poster,
          heroBackdropUrl: hero,
          rating: rating ?? m.rating,
        };
      }

      if (seriesMatch) {
        const nid = Number(seriesMatch[1]);
        const res = await fetch(
          `${API}/series/${nid}/extended?meta=translations`,
          { headers, cache: "no-store" },
        );
        if (!res.ok) {
          return { ...m, posterUrl: posterFallback };
        }
        const json = (await res.json()) as {
          data?: {
            image?: string;
            artworks?: Artwork[];
            score?: number;
            genres?: { name?: string }[];
          };
        };
        const d = json.data;
        const poster = d?.image?.trim()
          ? tvdbArtworkUrl(d.image)
          : posterFallback;
        const hero = bestBackdropFromArtworks(d?.artworks, poster);
        const rating =
          typeof d?.score === "number" && Number.isFinite(d.score)
            ? Math.min(10, Math.max(0, d.score > 10 ? d.score / 10 : d.score))
            : m.rating;
        const genres = Array.isArray(d?.genres)
          ? d.genres.map((g) => g.name).filter((n): n is string => Boolean(n?.trim()))
          : m.genres;
        return {
          ...m,
          posterUrl: poster,
          heroBackdropUrl: hero,
          rating: rating ?? m.rating,
          genres: genres?.length ? genres : m.genres,
        };
      }
    } catch {
      /* keep original */
    }

    return { ...m, posterUrl: posterFallback };
  });

  return Promise.all(tasks);
}
