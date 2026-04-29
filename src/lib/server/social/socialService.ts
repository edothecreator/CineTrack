import { prisma } from "@/lib/server/prisma";
import type { PublicProfile, ActivityItem, NotificationItem } from "@/types/social";

// ─── Public profile ───────────────────────────────────────────────────────────

export async function getPublicProfile(
  username: string,
  viewerUserId?: string,
): Promise<PublicProfile | null> {
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    include: {
      _count: { select: { followers: true, following: true, watchlistItems: true, watchedTitles: true } },
      watchedTitles: {
        orderBy: { completedAt: "desc" },
        take: 6,
        select: { tvdbId: true, title: true, posterUrl: true, rating: true, releaseDate: true },
      },
    },
  });
  if (!user) return null;

  let isFollowing = false;
  let isMutual = false;

  if (viewerUserId && viewerUserId !== user.id) {
    const [fwd, rev] = await Promise.all([
      prisma.userFollow.findUnique({
        where: { followerId_followingId: { followerId: viewerUserId, followingId: user.id } },
      }),
      prisma.userFollow.findUnique({
        where: { followerId_followingId: { followerId: user.id, followingId: viewerUserId } },
      }),
    ]);
    isFollowing = Boolean(fwd);
    isMutual = Boolean(fwd) && Boolean(rev);
  }

  const canSeeLibrary = user.isPublic || isFollowing || viewerUserId === user.id;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    profileBio: user.profileBio,
    profileAvatarDataUrl: user.profileAvatar ?? null,
    bannerUrl: user.bannerUrl ?? null,
    memberSince: user.memberSince.toISOString(),
    isPublic: user.isPublic,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing,
    isMutual,
    recentWatched: canSeeLibrary
      ? user.watchedTitles.map((t) => ({
          id: t.tvdbId,
          title: t.title,
          posterUrl: t.posterUrl,
          rating: t.rating ?? undefined,
          releaseDate: t.releaseDate,
        }))
      : [],
    watchlistCount: canSeeLibrary ? user._count.watchlistItems : undefined,
    watchedCount: canSeeLibrary ? user._count.watchedTitles : undefined,
  };
}

// ─── User search ──────────────────────────────────────────────────────────────

export async function searchUsers(
  query: string,
  limit = 20,
): Promise<Pick<PublicProfile, "id" | "username" | "displayName" | "profileAvatarDataUrl" | "followersCount">[]> {
  const q = query.trim();
  if (!q || q.length < 1) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: {
      id: true,
      username: true,
      displayName: true,
      profileAvatar: true,
      _count: { select: { followers: true } },
    },
    orderBy: { memberSince: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName ?? null,
    profileAvatarDataUrl: u.profileAvatar ?? null,
    followersCount: u._count.followers,
  }));
}

// ─── Follow / unfollow ────────────────────────────────────────────────────────

export async function followUser(
  followerId: string,
  followingId: string,
): Promise<{ ok: boolean; message?: string }> {
  if (followerId === followingId) {
    return { ok: false, message: "Cannot follow yourself" };
  }

  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) return { ok: false, message: "User not found" };

  await prisma.userFollow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });

  // Record activity
  await prisma.activity.create({
    data: { userId: followerId, type: "FOLLOWED_USER", targetUserId: followingId },
  });

  // Create notification for the followed user
  await createNotification({
    userId: followingId,
    actorId: followerId,
    type: "NEW_FOLLOWER",
  });

  // Check if it's a follow-back and notify the original follower
  const reverseFollow = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId: followingId, followingId: followerId } },
  });
  if (reverseFollow) {
    await createNotification({
      userId: followerId,
      actorId: followingId,
      type: "FOLLOW_BACK",
    });
  }

  return { ok: true };
}

export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<{ ok: boolean }> {
  await prisma.userFollow.deleteMany({ where: { followerId, followingId } });
  return { ok: true };
}

export async function getFollowState(
  viewerId: string,
  targetId: string,
): Promise<"not_following" | "following" | "mutual"> {
  const [fwd, rev] = await Promise.all([
    prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
    }),
    prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: targetId, followingId: viewerId } },
    }),
  ]);
  if (fwd && rev) return "mutual";
  if (fwd) return "following";
  return "not_following";
}

export async function getFollowers(
  userId: string,
  viewerUserId?: string,
  cursor?: string,
  limit = 30,
) {
  const rows = await prisma.userFollow.findMany({
    where: { followingId: userId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      follower: {
        select: {
          id: true, username: true, displayName: true, profileAvatar: true,
          _count: { select: { followers: true } },
        },
      },
    },
  });

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);

  // Check which ones the viewer follows back
  let viewerFollowingSet = new Set<string>();
  if (viewerUserId) {
    const viewerFollows = await prisma.userFollow.findMany({
      where: { followerId: viewerUserId, followingId: { in: items.map((r) => r.followerId) } },
      select: { followingId: true },
    });
    viewerFollowingSet = new Set(viewerFollows.map((f) => f.followingId));
  }

  return {
    users: items.map((r) => ({
      id: r.follower.id,
      username: r.follower.username,
      displayName: r.follower.displayName ?? null,
      profileAvatarDataUrl: r.follower.profileAvatar ?? null,
      followersCount: r.follower._count.followers,
      isFollowing: viewerFollowingSet.has(r.follower.id),
      followedAt: r.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  };
}

export async function getFollowing(
  userId: string,
  viewerUserId?: string,
  cursor?: string,
  limit = 30,
) {
  const rows = await prisma.userFollow.findMany({
    where: { followerId: userId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      following: {
        select: {
          id: true, username: true, displayName: true, profileAvatar: true,
          _count: { select: { followers: true } },
        },
      },
    },
  });

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);

  let viewerFollowingSet = new Set<string>();
  if (viewerUserId) {
    const viewerFollows = await prisma.userFollow.findMany({
      where: { followerId: viewerUserId, followingId: { in: items.map((r) => r.followingId) } },
      select: { followingId: true },
    });
    viewerFollowingSet = new Set(viewerFollows.map((f) => f.followingId));
  }

  return {
    users: items.map((r) => ({
      id: r.following.id,
      username: r.following.username,
      displayName: r.following.displayName ?? null,
      profileAvatarDataUrl: r.following.profileAvatar ?? null,
      followersCount: r.following._count.followers,
      isFollowing: viewerFollowingSet.has(r.following.id),
      followedAt: r.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  };
}

// ─── Activity feed ────────────────────────────────────────────────────────────

export async function getFollowingFeed(
  userId: string,
  cursor?: string,
  limit = 30,
): Promise<{ items: ActivityItem[]; nextCursor: string | null }> {
  // Get IDs of people this user follows
  const following = await prisma.userFollow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  if (followingIds.length === 0) return { items: [], nextCursor: null };

  const rows = await prisma.activity.findMany({
    where: { userId: { in: followingIds } },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, profileAvatar: true },
      },
    },
  });

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);

  // Resolve targetUser usernames for FOLLOWED_USER activities
  const targetUserIds = items
    .filter((r) => r.targetUserId)
    .map((r) => r.targetUserId!);
  const targetUsers =
    targetUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: targetUserIds } },
          select: { id: true, username: true },
        })
      : [];
  const targetUserMap = new Map(targetUsers.map((u) => [u.id, u.username]));

  return {
    items: items.map((r) => ({
      id: r.id,
      userId: r.userId,
      username: r.user.username,
      displayName: r.user.displayName ?? null,
      avatarUrl: r.user.profileAvatar ?? null,
      type: r.type as ActivityItem["type"],
      tvdbId: r.tvdbId ?? undefined,
      title: r.title ?? undefined,
      posterUrl: r.posterUrl ?? undefined,
      targetUserId: r.targetUserId ?? undefined,
      targetUsername: r.targetUserId ? targetUserMap.get(r.targetUserId) : undefined,
      createdAt: r.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  };
}

/** Record a media activity (watched / added to list) */
export async function recordActivity(
  userId: string,
  type: "WATCHED" | "ADDED_TO_LIST",
  media: { tvdbId: string; title: string; posterUrl: string },
) {
  await prisma.activity.create({
    data: { userId, type, tvdbId: media.tvdbId, title: media.title, posterUrl: media.posterUrl },
  });

  // Notify followers
  const followers = await prisma.userFollow.findMany({
    where: { followingId: userId },
    select: { followerId: true },
  });

  const notifType = type === "WATCHED" ? "FRIEND_WATCHED" : "FRIEND_ADDED_LIST";
  if (followers.length > 0) {
    await prisma.notification.createMany({
      data: followers.map((f) => ({
        userId: f.followerId,
        actorId: userId,
        type: notifType,
        tvdbId: media.tvdbId,
        title: media.title,
        posterUrl: media.posterUrl,
      })),
      skipDuplicates: true,
    });
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

async function createNotification(data: {
  userId: string;
  actorId: string;
  type: "NEW_FOLLOWER" | "FOLLOW_BACK" | "FRIEND_WATCHED" | "FRIEND_ADDED_LIST";
  tvdbId?: string;
  title?: string;
  posterUrl?: string;
}) {
  // Don't notify yourself
  if (data.userId === data.actorId) return;
  await prisma.notification.create({ data });
}

export async function getNotifications(
  userId: string,
  limit = 30,
): Promise<{ items: NotificationItem[]; unreadCount: number }> {
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { id: true, username: true, displayName: true, profileAvatar: true },
        },
      },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      type: r.type as NotificationItem["type"],
      read: r.read,
      actorId: r.actorId,
      actorUsername: r.actor.username,
      actorDisplayName: r.actor.displayName ?? null,
      actorAvatarUrl: r.actor.profileAvatar ?? null,
      tvdbId: r.tvdbId ?? undefined,
      title: r.title ?? undefined,
      posterUrl: r.posterUrl ?? undefined,
      createdAt: r.createdAt.toISOString(),
    })),
    unreadCount,
  };
}

export async function markNotificationsRead(
  userId: string,
  ids?: string[],
): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, ...(ids ? { id: { in: ids } } : {}) },
    data: { read: true },
  });
}
