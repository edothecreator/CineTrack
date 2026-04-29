import type { MovieSummary } from "@/types/movie";

/** Public profile — safe to expose to any authenticated user */
export type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  profileBio: string;
  profileAvatarDataUrl: string | null;
  bannerUrl: string | null;
  memberSince: string;
  isPublic: boolean;
  followersCount: number;
  followingCount: number;
  /** Only present when the viewer is authenticated */
  isFollowing?: boolean;
  isMutual?: boolean;
  // Public library (only when isPublic or viewer is following)
  recentWatched?: MovieSummary[];
  watchlistCount?: number;
  watchedCount?: number;
};

export type ActivityItem = {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  type: "WATCHED" | "ADDED_TO_LIST" | "FOLLOWED_USER" | "RATED_TITLE";
  tvdbId?: string;
  title?: string;
  posterUrl?: string;
  targetUserId?: string;
  targetUsername?: string;
  createdAt: string; // ISO
};

export type NotificationItem = {
  id: string;
  type: "NEW_FOLLOWER" | "FOLLOW_BACK" | "FRIEND_WATCHED" | "FRIEND_ADDED_LIST" | "SCENE_REACTION" | "SCENE_COMMENT" | "SCENE_MENTION";
  read: boolean;
  actorId: string;
  actorUsername: string;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  tvdbId?: string;
  title?: string;
  posterUrl?: string;
  createdAt: string;
};

export type FollowState = "not_following" | "following" | "mutual";
