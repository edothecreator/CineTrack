import type { MovieSummary } from "@/types/movie";
import type { HistoryEntry } from "@/lib/movieGuards";
import type { SeriesEpisodeWatchMap } from "@/types/library";

export type MeBootstrap = {
  user: {
    id: string;
    username: string;
    email: string;
    memberSince: string;
    profileBio: string;
    profileAvatarDataUrl: string | null;
    displayName: string | null;
    bannerUrl: string | null;
    isPublic: boolean;
    followersCount: number;
    followingCount: number;
  };
  watchlist: MovieSummary[];
  history: HistoryEntry[];
  episodes: SeriesEpisodeWatchMap;
};
