import { prisma } from "@/lib/server/prisma";
import { fetchTmdbDetail } from "@/lib/server/tmdb";
import type {
  PostItem,
  PostAuthor,
  ReactionCounts,
  ReactionType,
  CommentItem,
  CreatePostInput,
} from "@/types/post";

const REACTION_TYPES: ReactionType[] = ["love", "haha", "wow", "sad", "fire"];

function emptyReactions(): ReactionCounts {
  return { love: 0, haha: 0, wow: 0, sad: 0, fire: 0 };
}

function mapAuthor(u: {
  id: string;
  username: string;
  displayName: string | null;
  profileAvatar: string | null;
}): PostAuthor {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.profileAvatar,
  };
}

type RawPost = {
  id: string;
  type: string;
  text: string | null;
  imageUrl: string | null;
  mediaType: string | null;
  tmdbId: string | null;
  episodeId: string | null;
  rating: number | null;
  isSpoiler: boolean;
  takeType: string | null;
  createdAt: Date;
  user: { id: string; username: string; displayName: string | null; profileAvatar: string | null };
  reactions: { userId: string; type: string }[];
  _count: { comments: number };
};

async function resolveMediaSnapshot(
  tmdbId: string | null,
): Promise<{ mediaTitle: string | null; mediaPoster: string | null; mediaBackdrop: string | null }> {
  if (!tmdbId) return { mediaTitle: null, mediaPoster: null, mediaBackdrop: null };
  try {
    const detail = await fetchTmdbDetail(tmdbId);
    return {
      mediaTitle: detail?.title ?? null,
      mediaPoster: detail?.posterUrl ?? null,
      mediaBackdrop: detail?.backdropUrl ?? null,
    };
  } catch {
    return { mediaTitle: null, mediaPoster: null, mediaBackdrop: null };
  }
}

async function mapPost(raw: RawPost, viewerUserId?: string): Promise<PostItem> {
  const counts = emptyReactions();
  for (const r of raw.reactions) {
    const t = r.type as ReactionType;
    if (REACTION_TYPES.includes(t)) counts[t]++;
  }
  const viewerReaction =
    viewerUserId
      ? (raw.reactions.find((r) => r.userId === viewerUserId)?.type as ReactionType | undefined) ?? null
      : null;

  const media = await resolveMediaSnapshot(raw.tmdbId);

  return {
    id: raw.id,
    type: raw.type as PostItem["type"],
    text: raw.text,
    imageUrl: raw.imageUrl,
    mediaType: raw.mediaType as PostItem["mediaType"],
    tmdbId: raw.tmdbId,
    episodeId: raw.episodeId,
    rating: raw.rating,
    isSpoiler: raw.isSpoiler,
    takeType: raw.takeType as PostItem["takeType"],
    createdAt: raw.createdAt.toISOString(),
    author: mapAuthor(raw.user),
    reactions: counts,
    viewerReaction,
    commentCount: raw._count.comments,
    ...media,
  };
}

const POST_INCLUDE = {
  user: { select: { id: true, username: true, displayName: true, profileAvatar: true } },
  reactions: { select: { userId: true, type: true } },
  _count: { select: { comments: true } },
} as const;

// ─── Feed ─────────────────────────────────────────────────────────────────────

export async function getFeed(
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<{ items: PostItem[]; nextCursor: string | null }> {
  const following = await prisma.userFollow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const authorIds = [userId, ...following.map((f) => f.followingId)];

  const rows = await prisma.post.findMany({
    where: { userId: { in: authorIds } },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: POST_INCLUDE,
  });

  const hasMore = rows.length > limit;
  const items = await Promise.all(rows.slice(0, limit).map((r) => mapPost(r as RawPost, userId)));

  return {
    items,
    nextCursor: hasMore ? (rows[limit - 1]?.id ?? null) : null,
  };
}

// ─── User posts ───────────────────────────────────────────────────────────────

export async function getUserPosts(
  profileUserId: string,
  viewerUserId?: string,
  cursor?: string,
  limit = 20,
): Promise<{ items: PostItem[]; nextCursor: string | null }> {
  const rows = await prisma.post.findMany({
    where: { userId: profileUserId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: POST_INCLUDE,
  });

  const hasMore = rows.length > limit;
  const items = await Promise.all(rows.slice(0, limit).map((r) => mapPost(r as RawPost, viewerUserId)));

  return {
    items,
    nextCursor: hasMore ? (rows[limit - 1]?.id ?? null) : null,
  };
}

// ─── Single post ──────────────────────────────────────────────────────────────

export async function getPost(
  postId: string,
  viewerUserId?: string,
): Promise<PostItem | null> {
  const raw = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      ...POST_INCLUDE,
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, username: true, displayName: true, profileAvatar: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, username: true, displayName: true, profileAvatar: true } },
            },
          },
        },
      },
    },
  });

  if (!raw) return null;

  const post = await mapPost(raw as RawPost, viewerUserId);

  post.comments = (raw.comments as {
    id: string;
    postId: string;
    parentId: string | null;
    content: string;
    createdAt: Date;
    user: { id: string; username: string; displayName: string | null; profileAvatar: string | null };
    replies: {
      id: string;
      postId: string;
      parentId: string | null;
      content: string;
      createdAt: Date;
      user: { id: string; username: string; displayName: string | null; profileAvatar: string | null };
    }[];
  }[]).map((c) => ({
    id: c.id,
    postId: c.postId,
    parentId: c.parentId,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    author: mapAuthor(c.user),
    replies: c.replies.map((r) => ({
      id: r.id,
      postId: r.postId,
      parentId: r.parentId,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      author: mapAuthor(r.user),
    })),
  }));

  return post;
}

// ─── Global feed ──────────────────────────────────────────────────────────────

export async function getGlobalFeed(
  viewerUserId?: string,
  cursor?: string,
  sort: "recent" | "trending" = "recent",
  limit = 20,
): Promise<{ items: PostItem[]; nextCursor: string | null }> {
  // For trending: posts from last 7 days ordered by total reactions desc
  // For recent: all posts ordered by createdAt desc
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const rows = await prisma.post.findMany({
    where: sort === "trending" ? { createdAt: { gte: sevenDaysAgo } } : undefined,
    take: limit + 1,
    ...(cursor && sort === "recent" ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: sort === "trending"
      ? [{ reactions: { _count: "desc" } }, { createdAt: "desc" }]
      : { createdAt: "desc" },
    include: POST_INCLUDE,
  });

  const hasMore = rows.length > limit;
  const items = await Promise.all(
    rows.slice(0, limit).map((r) => mapPost(r as RawPost, viewerUserId))
  );

  return {
    items,
    nextCursor: hasMore && sort === "recent" ? (rows[limit - 1]?.id ?? null) : null,
  };
}

// ─── @mention parsing ─────────────────────────────────────────────────────────

/** Extract @usernames from post text and send notifications */
async function notifyMentions(authorId: string, postId: string, text: string | null) {
  if (!text) return;
  const mentions = [...text.matchAll(/@([a-zA-Z0-9_]{2,64})/g)].map((m) => m[1]!);
  if (mentions.length === 0) return;

  const users = await prisma.user.findMany({
    where: {
      username: { in: mentions, mode: "insensitive" },
      id: { not: authorId }, // don't notify self
    },
    select: { id: true },
  });

  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      actorId: authorId,
      type: "SCENE_MENTION" as const,
      tvdbId: null,
      title: null,
      posterUrl: null,
    })),
    skipDuplicates: true,
  });
}

export async function createPost(
  userId: string,
  input: CreatePostInput,
): Promise<PostItem> {
  const raw = await prisma.post.create({
    data: {
      userId,
      type: input.type,
      text: input.text ?? null,
      imageUrl: input.imageUrl ?? null,
      mediaType: input.mediaType ?? null,
      tmdbId: input.tmdbId ?? null,
      episodeId: input.episodeId ?? null,
      rating: input.rating ?? null,
      isSpoiler: input.isSpoiler ?? false,
      takeType: input.takeType ?? null,
    },
    include: POST_INCLUDE,
  });

  // Fire mention notifications async (don't block response)
  void notifyMentions(userId, raw.id, input.text ?? null);

  return mapPost(raw as RawPost, userId);
}

// ─── Delete post ──────────────────────────────────────────────────────────────

export async function deletePost(
  postId: string,
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { ok: false, message: "Post not found" };
  if (post.userId !== userId) return { ok: false, message: "Not authorized" };
  await prisma.post.delete({ where: { id: postId } });
  return { ok: true };
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function toggleReaction(
  userId: string,
  postId: string,
  type: ReactionType,
): Promise<{ viewerReaction: ReactionType | null; reactions: ReactionCounts }> {
  const existing = await prisma.reaction.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    if (existing.type === type) {
      await prisma.reaction.delete({ where: { userId_postId: { userId, postId } } });
    } else {
      await prisma.reaction.update({
        where: { userId_postId: { userId, postId } },
        data: { type },
      });
    }
  } else {
    await prisma.reaction.create({ data: { userId, postId, type } });

    // Notify post author (not self)
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          actorId: userId,
          type: "SCENE_REACTION",
          tvdbId: null,
          title: null,
          posterUrl: null,
        },
      });
    }
  }

  // Return fresh counts
  const all = await prisma.reaction.findMany({ where: { postId } });
  const counts = emptyReactions();
  for (const r of all) {
    const t = r.type as ReactionType;
    if (REACTION_TYPES.includes(t)) counts[t]++;
  }
  const newReaction = all.find((r) => r.userId === userId);
  return {
    viewerReaction: newReaction ? (newReaction.type as ReactionType) : null,
    reactions: counts,
  };
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function addComment(
  userId: string,
  postId: string,
  content: string,
  parentId?: string,
): Promise<CommentItem> {
  // Validate parent exists and belongs to same post
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.postId !== postId) throw new Error("Invalid parent comment");
    // Only 1 level of nesting
    if (parent.parentId) throw new Error("Cannot reply to a reply");
  }

  const raw = await prisma.comment.create({
    data: { userId, postId, parentId: parentId ?? null, content },
    include: {
      user: { select: { id: true, username: true, displayName: true, profileAvatar: true } },
    },
  });

  // Notify post author (not self, not on own reply)
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
  if (post && post.userId !== userId) {
    await prisma.notification.create({
      data: {
        userId: post.userId,
        actorId: userId,
        type: "SCENE_COMMENT",
        tvdbId: null,
        title: null,
        posterUrl: null,
      },
    });
  }

  // If this is a reply, also notify the parent comment author
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { userId: true },
    });
    if (parentComment && parentComment.userId !== userId && parentComment.userId !== post?.userId) {
      await prisma.notification.create({
        data: {
          userId: parentComment.userId,
          actorId: userId,
          type: "SCENE_COMMENT",
          tvdbId: null,
          title: null,
          posterUrl: null,
        },
      });
    }
  }

  return {
    id: raw.id,
    postId: raw.postId,
    parentId: raw.parentId,
    content: raw.content,
    createdAt: raw.createdAt.toISOString(),
    author: mapAuthor(raw.user),
  };
}

export async function deleteComment(
  commentId: string,
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { ok: false, message: "Comment not found" };
  if (comment.userId !== userId) return { ok: false, message: "Not authorized" };
  await prisma.comment.delete({ where: { id: commentId } });
  return { ok: true };
}
