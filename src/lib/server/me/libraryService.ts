import type { EpisodeMark, WatchedTitle, WatchlistItem } from "@prisma/client";
import type { MovieSummary } from "@/types/movie";
import type { HistoryEntry } from "@/lib/movieGuards";
import type { MeBootstrap } from "@/types/meBootstrap";
import { prisma } from "@/lib/server/prisma";
import type { SeriesEpisodeWatchMap } from "@/types/library";

function genresFromJson(v: unknown): string[] | undefined {
  if (v == null) return undefined;
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x): x is string => typeof x === "string");
  return out.length ? out : undefined;
}

function watchlistRowToSummary(r: WatchlistItem): MovieSummary {
  const out: MovieSummary = {
    id: r.tvdbId,
    title: r.title,
    posterUrl: r.posterUrl,
    releaseDate: r.releaseDate,
  };
  if (r.rating != null && Number.isFinite(r.rating)) out.rating = r.rating;
  if (r.runtimeMinutes != null) out.runtimeMinutes = r.runtimeMinutes;
  if (r.heroBackdropUrl) out.heroBackdropUrl = r.heroBackdropUrl;
  const g = genresFromJson(r.genres);
  if (g) out.genres = g;
  return out;
}

function watchedRowToSummary(r: WatchedTitle): MovieSummary & { userRating?: number } {
  const out: MovieSummary & { userRating?: number } = {
    id: r.tvdbId,
    title: r.title,
    posterUrl: r.posterUrl,
    releaseDate: r.releaseDate,
  };
  if (r.rating != null && Number.isFinite(r.rating)) out.rating = r.rating;
  if (r.runtimeMinutes != null) out.runtimeMinutes = r.runtimeMinutes;
  if (r.userRating != null && Number.isFinite(r.userRating)) out.userRating = r.userRating;
  const g = genresFromJson(r.genres);
  if (g) out.genres = g;
  return out;
}

function episodeMapFromRows(rows: EpisodeMark[]): SeriesEpisodeWatchMap {
  const map: SeriesEpisodeWatchMap = {};
  for (const row of rows) {
    const cur = map[row.seriesId] ?? [];
    if (!cur.includes(row.episodeId)) cur.push(row.episodeId);
    map[row.seriesId] = cur;
  }
  return map;
}

function summaryToWatchlistCreate(userId: string, m: MovieSummary) {
  return {
    userId,
    tvdbId: m.id,
    title: m.title,
    posterUrl: m.posterUrl,
    rating: m.rating ?? null,
    releaseDate: m.releaseDate ?? "",
    runtimeMinutes: m.runtimeMinutes ?? null,
    heroBackdropUrl: m.heroBackdropUrl ?? null,
    genres: m.genres ? (m.genres as object) : undefined,
  };
}

function summaryToWatchedCreate(userId: string, m: MovieSummary, completedAt: Date) {
  return {
    userId,
    tvdbId: m.id,
    title: m.title,
    posterUrl: m.posterUrl,
    rating: m.rating ?? null,
    releaseDate: m.releaseDate ?? "",
    runtimeMinutes: m.runtimeMinutes ?? null,
    genres: m.genres ? (m.genres as object) : undefined,
    completedAt,
  };
}

export async function getBootstrap(userId: string): Promise<MeBootstrap | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      watchlistItems: { orderBy: { updatedAt: "desc" } },
      watchedTitles: { orderBy: { completedAt: "desc" } },
      episodeMarks: true,
      _count: { select: { followers: true, following: true } },
    },
  });
  if (!user) return null;

  const watchlist = user.watchlistItems.map(watchlistRowToSummary);
  const history: HistoryEntry[] = user.watchedTitles.map((r) => ({
    ...watchedRowToSummary(r),
    completedAt: r.completedAt.getTime(),
  }));

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      memberSince: user.memberSince.toISOString(),
      profileBio: user.profileBio,
      profileAvatarDataUrl: user.profileAvatar,
      displayName: user.displayName ?? null,
      bannerUrl: user.bannerUrl ?? null,
      isPublic: user.isPublic,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    },
    watchlist,
    history,
    episodes: episodeMapFromRows(user.episodeMarks),
  };
}

export async function toggleWatchlistItem(
  userId: string,
  movie: MovieSummary,
  inList: boolean,
): Promise<MeBootstrap | null> {
  if (inList) {
    await prisma.watchlistItem.deleteMany({
      where: { userId, tvdbId: movie.id },
    });
  } else {
    await prisma.watchlistItem.upsert({
      where: {
        userId_tvdbId: { userId, tvdbId: movie.id },
      },
      create: summaryToWatchlistCreate(userId, movie),
      update: summaryToWatchlistCreate(userId, movie),
    });
  }
  return getBootstrap(userId);
}

export async function markCompleted(
  userId: string,
  movie: MovieSummary,
  userRating?: number | null,
): Promise<MeBootstrap | null> {
  await prisma.$transaction([
    prisma.watchlistItem.deleteMany({
      where: { userId, tvdbId: movie.id },
    }),
    prisma.watchedTitle.upsert({
      where: {
        userId_tvdbId: { userId, tvdbId: movie.id },
      },
      create: {
        ...summaryToWatchedCreate(userId, movie, new Date()),
        userRating: userRating ?? null,
      },
      update: {
        title: movie.title,
        posterUrl: movie.posterUrl,
        rating: movie.rating ?? null,
        releaseDate: movie.releaseDate ?? "",
        runtimeMinutes: movie.runtimeMinutes ?? null,
        genres: movie.genres ? (movie.genres as object) : undefined,
        completedAt: new Date(),
        ...(userRating !== undefined ? { userRating: userRating ?? null } : {}),
      },
    }),
  ]);
  return getBootstrap(userId);
}

export async function removeFromHistory(
  userId: string,
  tvdbId: string,
): Promise<MeBootstrap | null> {
  await prisma.watchedTitle.deleteMany({
    where: { userId, tvdbId },
  });
  return getBootstrap(userId);
}

export async function setEpisodeWatched(
  userId: string,
  seriesId: string,
  episodeId: string,
  watched: boolean,
): Promise<MeBootstrap | null> {
  if (watched) {
    await prisma.episodeMark.upsert({
      where: {
        userId_seriesId_episodeId: { userId, seriesId, episodeId },
      },
      create: { userId, seriesId, episodeId },
      update: {},
    });
  } else {
    await prisma.episodeMark.deleteMany({
      where: { userId, seriesId, episodeId },
    });
  }
  return getBootstrap(userId);
}

export async function patchProfile(
  userId: string,
  patch: {
    profileBio?: string;
    profileAvatar?: string | null;
    displayName?: string | null;
    bannerUrl?: string | null;
    isPublic?: boolean;
  },
): Promise<MeBootstrap | null> {
  const data: Record<string, unknown> = {};
  if (patch.profileBio !== undefined) data.profileBio = patch.profileBio.slice(0, 500);
  if (patch.profileAvatar !== undefined) data.profileAvatar = patch.profileAvatar;
  if (patch.displayName !== undefined) data.displayName = patch.displayName?.slice(0, 64) ?? null;
  if (patch.bannerUrl !== undefined) data.bannerUrl = patch.bannerUrl;
  if (patch.isPublic !== undefined) data.isPublic = patch.isPublic;
  if (Object.keys(data).length === 0) return getBootstrap(userId);
  await prisma.user.update({
    where: { id: userId },
    data: data as Parameters<typeof prisma.user.update>[0]["data"],
  });
  return getBootstrap(userId);
}

export async function mergeGuestData(
  userId: string,
  guest: {
    watchlist: MovieSummary[];
    history: HistoryEntry[];
    episodes: SeriesEpisodeWatchMap;
  },
): Promise<MeBootstrap | null> {
  await prisma.$transaction(async (tx) => {
    for (const m of guest.watchlist) {
      await tx.watchlistItem.upsert({
        where: { userId_tvdbId: { userId, tvdbId: m.id } },
        create: summaryToWatchlistCreate(userId, m),
        update: {
          title: m.title,
          posterUrl: m.posterUrl,
          rating: m.rating ?? null,
          releaseDate: m.releaseDate ?? "",
          runtimeMinutes: m.runtimeMinutes ?? null,
          heroBackdropUrl: m.heroBackdropUrl ?? null,
          genres: m.genres ? (m.genres as object) : undefined,
        },
      });
    }
    for (const h of guest.history) {
      const existing = await tx.watchedTitle.findUnique({
        where: { userId_tvdbId: { userId, tvdbId: h.id } },
      });
      const completedAt = new Date(h.completedAt);
      if (!existing || existing.completedAt.getTime() < completedAt.getTime()) {
        await tx.watchedTitle.upsert({
          where: { userId_tvdbId: { userId, tvdbId: h.id } },
          create: summaryToWatchedCreate(userId, h, completedAt),
          update: {
            title: h.title,
            posterUrl: h.posterUrl,
            rating: h.rating ?? null,
            releaseDate: h.releaseDate ?? "",
            runtimeMinutes: h.runtimeMinutes ?? null,
            genres: h.genres ? (h.genres as object) : undefined,
            completedAt,
          },
        });
      }
    }
    for (const [seriesId, eps] of Object.entries(guest.episodes)) {
      for (const episodeId of eps) {
        await tx.episodeMark.upsert({
          where: {
            userId_seriesId_episodeId: { userId, seriesId, episodeId },
          },
          create: { userId, seriesId, episodeId },
          update: {},
        });
      }
    }
  });
  return getBootstrap(userId);
}

export async function rateTitle(
  userId: string,
  tvdbId: string,
  userRating: number | null,
): Promise<MeBootstrap | null> {
  // Only allow rating titles that are in history
  const existing = await prisma.watchedTitle.findUnique({
    where: { userId_tvdbId: { userId, tvdbId } },
  });
  if (!existing) return getBootstrap(userId);

  await prisma.watchedTitle.update({
    where: { userId_tvdbId: { userId, tvdbId } },
    data: { userRating: userRating != null ? Math.min(10, Math.max(0, userRating)) : null },
  });

  return getBootstrap(userId);
}
