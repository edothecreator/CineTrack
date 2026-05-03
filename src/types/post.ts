export type PostType = "MEDIA" | "TEXT" | "IMAGE";
export type MediaType = "movie" | "tv" | "anime";
export type TakeType = "hot" | "fact" | "question";
export type ReactionType = "love" | "haha" | "wow" | "sad" | "fire";

export const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  love: { emoji: "❤️",  label: "Love"  },
  haha: { emoji: "😂",  label: "Haha"  },
  wow:  { emoji: "😮",  label: "Wow"   },
  sad:  { emoji: "😢",  label: "Sad"   },
  fire: { emoji: "🔥",  label: "Fire"  },
};

export type ReactionCounts = Record<ReactionType, number>;

export type PostAuthor = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type CommentItem = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  author: PostAuthor;
  replies?: CommentItem[];
};

export type PostItem = {
  id: string;
  type: PostType;
  text: string | null;
  imageUrl: string | null;
  mediaType: MediaType | null;
  tmdbId: string | null;
  episodeId: string | null;
  rating: number | null;
  isSpoiler: boolean;
  takeType: TakeType | null;
  createdAt: string;
  author: PostAuthor;
  reactions: ReactionCounts;
  /** Viewer's current reaction, if any */
  viewerReaction: ReactionType | null;
  commentCount: number;
  /** Populated when fetching a single post */
  comments?: CommentItem[];
  /** TMDB media snapshot (title + poster) — resolved server-side */
  mediaTitle?: string | null;
  mediaPoster?: string | null;
  mediaBackdrop?: string | null;
};

export type CreatePostInput = {
  type: PostType;
  text?: string;
  imageUrl?: string;
  mediaType?: MediaType;
  tmdbId?: string;
  episodeId?: string;
  rating?: number;
  isSpoiler?: boolean;
  takeType?: TakeType;
};
