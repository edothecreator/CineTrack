"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, AlertTriangle, MessageCircle, Trash2,
  Users, Send, X, CornerDownRight,
} from "lucide-react";
import type { PostItem, ReactionType, CommentItem } from "@/types/post";
import { REACTION_META } from "@/types/post";
import { spring } from "@/lib/motionPresets";

/** Parse @username mentions and render them as links */
function renderTextWithMentions(text: string): React.ReactNode {
  const parts = text.split(/(@[a-zA-Z0-9_]{2,64})/g);
  return parts.map((part, i) => {
    if (/^@[a-zA-Z0-9_]{2,64}$/.test(part)) {
      return (
        <Link key={i} href={`/user/${part.slice(1)}`}
          className="font-semibold text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}>
          {part}
        </Link>
      );
    }
    return part;
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const TAKE_BADGES: Record<string, { label: string; color: string }> = {
  hot:      { label: "Hot take",  color: "text-orange-400/80 bg-orange-500/8 border-orange-500/15" },
  fact:     { label: "Fact",      color: "text-blue-400/80 bg-blue-500/8 border-blue-500/15"       },
  question: { label: "Question",  color: "text-violet-400/80 bg-violet-500/8 border-violet-500/15" },
};

type PostCardProps = {
  post: PostItem;
  viewerUserId?: string;
  onDelete?: (id: string) => void;
};

export function PostCard({ post, viewerUserId, onDelete }: PostCardProps) {
  const [reactions, setReactions] = useState(post.reactions);
  const [viewerReaction, setViewerReaction] = useState(post.viewerReaction);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>(post.comments ?? []);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = viewerUserId === post.author.id;
  const takeBadge = post.takeType ? TAKE_BADGES[post.takeType] : null;
  const showSpoilerShield = post.isSpoiler && !spoilerRevealed;

  async function handleReaction(type: ReactionType) {
    if (!viewerUserId) return;
    const prev = { reactions: { ...reactions }, viewerReaction };
    const isToggleOff = viewerReaction === type;
    const newCounts = { ...reactions };
    if (viewerReaction && viewerReaction !== type) newCounts[viewerReaction]--;
    if (isToggleOff) { newCounts[type]--; setViewerReaction(null); }
    else { newCounts[type]++; setViewerReaction(type); }
    setReactions(newCounts);
    try {
      const res = await fetch(`/api/posts/${post.id}/reactions`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) { setReactions(prev.reactions); setViewerReaction(prev.viewerReaction); return; }
      const data = (await res.json()) as { reactions: typeof reactions; viewerReaction: ReactionType | null };
      setReactions(data.reactions);
      setViewerReaction(data.viewerReaction);
    } catch {
      setReactions(prev.reactions);
      setViewerReaction(prev.viewerReaction);
    }
  }

  async function loadComments() {
    if (comments.length > 0 || loadingComments) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`);
      if (!res.ok) return;
      const data = (await res.json()) as PostItem;
      setComments(data.comments ?? []);
    } finally { setLoadingComments(false); }
  }

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next) await loadComments();
  }

  async function submitComment() {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim(), parentId: replyTo?.id }),
      });
      if (!res.ok) return;
      const comment = (await res.json()) as CommentItem;
      if (replyTo) {
        setComments((prev) => prev.map((c) =>
          c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), comment] } : c
        ));
      } else {
        setComments((prev) => [...prev, comment]);
      }
      setCommentCount((n) => n + 1);
      setCommentText("");
      setReplyTo(null);
    } finally { setSubmittingComment(false); }
  }

  async function handleDelete() {
    if (!isOwner || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) onDelete?.(post.id);
    } finally { setDeleting(false); }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={spring.smooth}
      className="overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06]"
    >
      {/* ── Media backdrop ── */}
      {post.mediaBackdrop && (
        <div className="relative h-32 w-full overflow-hidden sm:h-40">
          <Image src={post.mediaBackdrop} alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-[#0B0B0F]" />
          {post.mediaPoster && (
            <div className="absolute bottom-3 left-4 flex items-end gap-2.5">
              <div className="relative h-14 w-10 overflow-hidden rounded-lg border border-white/15 shadow-lg shrink-0">
                <Image src={post.mediaPoster} alt="" fill className="object-cover" sizes="40px" />
              </div>
              {post.mediaTitle && (
                <p className="mb-0.5 text-sm font-bold text-white leading-tight">{post.mediaTitle}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-4 sm:px-5">
        {/* ── Author row ── */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href={`/user/${post.author.username}`}
              className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.06] border border-white/[0.08]">
              {post.author.avatarUrl ? (
                <Image src={post.author.avatarUrl} alt="" fill className="object-cover" sizes="32px" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-white/20" />
                </div>
              )}
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link href={`/user/${post.author.username}`}
                  className="text-sm font-semibold text-foreground/90 hover:text-primary transition-colors leading-none">
                  {post.author.displayName ?? post.author.username}
                </Link>
                {takeBadge && (
                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${takeBadge.color}`}>
                    {takeBadge.label}
                  </span>
                )}
              </div>
              <p className="text-caption mt-0.5">{timeAgo(post.createdAt)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {post.rating != null && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                <Star className="h-2.5 w-2.5 fill-current" />
                {post.rating.toFixed(1)}
              </span>
            )}
            {post.isSpoiler && (
              <span className="hidden sm:flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/6 px-2 py-0.5 text-[10px] font-semibold text-amber-400/80">
                <AlertTriangle className="h-2.5 w-2.5" />
                Spoiler
              </span>
            )}
            {isOwner && (
              <button type="button" onClick={() => void handleDelete()} disabled={deleting}
                className="p-1.5 text-white/15 transition hover:text-red-400/70 disabled:opacity-30 rounded-lg"
                aria-label="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Media pill (no backdrop) ── */}
        {post.tmdbId && !post.mediaBackdrop && post.mediaTitle && (
          <Link href={`/movie/${encodeURIComponent(post.tmdbId)}`}
            className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 transition hover:border-white/10">
            {post.mediaPoster && (
              <div className="relative h-9 w-6 shrink-0 overflow-hidden rounded-md">
                <Image src={post.mediaPoster} alt="" fill className="object-cover" sizes="24px" />
              </div>
            )}
            <p className="truncate text-sm font-semibold text-foreground/80">{post.mediaTitle}</p>
          </Link>
        )}

        {/* ── Content ── */}
        {showSpoilerShield ? (
          <button type="button" onClick={() => setSpoilerRevealed(true)}
            className="mb-3 flex w-full items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-sm text-amber-400/80 transition hover:bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Spoiler — tap to reveal
          </button>
        ) : (
          <>
            {post.text && (
              <p className="mb-3 text-[15px] leading-[1.65] text-white/80">
                {renderTextWithMentions(post.text)}
              </p>
            )}
            {post.imageUrl && (
              <div className="mb-3 overflow-hidden rounded-xl border border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt=""
                  className="max-h-96 w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </>
        )}

        {/* ── Signals + resonance row ── */}
        <div className="flex items-center gap-0.5 flex-wrap">
          {(Object.entries(REACTION_META) as [ReactionType, { emoji: string; label: string }][]).map(([type, meta]) => {
            const count = reactions[type];
            const active = viewerReaction === type;
            return (
              <motion.button key={type} type="button"
                onClick={() => void handleReaction(type)}
                whileTap={{ scale: 0.82 }}
                transition={spring.snappy}
                title={meta.label}
                className={`group relative flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm transition-all min-h-[2.25rem] ${
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-white/35 hover:bg-white/[0.05] hover:text-white/70"
                }`}
                aria-label={meta.label}>
                <span className={`leading-none transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`}>
                  {meta.emoji}
                </span>
                {count > 0 && (
                  <span className={`tabular-nums text-[11px] font-semibold ${active ? "text-primary" : "text-white/40"}`}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}

          <button type="button" onClick={() => void toggleComments()}
            className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/30 transition hover:text-white/60 min-h-[2.25rem]">
            <MessageCircle className="h-3.5 w-3.5" />
            {commentCount > 0 && <span className="tabular-nums font-semibold text-white/50">{commentCount}</span>}
          </button>
        </div>

        {/* ── Resonance section ── */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden">
              <div className="mt-3 space-y-2.5 border-t border-white/[0.05] pt-3">
                {loadingComments && (
                  <div className="space-y-2">
                    {[1, 2].map((i) => <div key={i} className="skeleton-shimmer h-10 rounded-xl" />)}
                  </div>
                )}

                {comments.map((comment) => (
                  <CommentThread key={comment.id} comment={comment}
                    onReply={(id, username) => setReplyTo({ id, username })} />
                ))}

                {comments.length === 0 && !loadingComments && (
                  <p className="py-3 text-center text-xs text-white/20">No resonance yet.</p>
                )}

                {viewerUserId && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    {replyTo && (
                      <div className="flex items-center gap-1.5 text-xs text-white/35">
                        <CornerDownRight className="h-3 w-3" />
                        <span>Replying to <span className="font-semibold text-primary/80">@{replyTo.username}</span></span>
                        <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-white/25 hover:text-white/50">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input type="text" value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submitComment(); } }}
                        placeholder="Add your resonance…" maxLength={1000}
                        className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground placeholder:text-white/20 focus:border-primary/30 focus:outline-none transition min-h-[2.5rem]" />
                      <button type="button" onClick={() => void submitComment()}
                        disabled={!commentText.trim() || submittingComment}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-30">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

function CommentThread({ comment, onReply }: { comment: CommentItem; onReply: (id: string, username: string) => void }) {
  return (
    <div className="space-y-2">
      <CommentRow comment={comment} onReply={onReply} />
      {comment.replies?.map((reply) => (
        <div key={reply.id} className="ml-9 border-l border-white/[0.05] pl-3">
          <CommentRow comment={reply} onReply={onReply} isReply />
        </div>
      ))}
    </div>
  );
}

function CommentRow({ comment, onReply, isReply = false }: {
  comment: CommentItem;
  onReply: (id: string, username: string) => void;
  isReply?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Link href={`/user/${comment.author.username}`}
        className="relative mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/[0.05] border border-white/[0.07]">
        {comment.author.avatarUrl ? (
          <Image src={comment.author.avatarUrl} alt="" fill className="object-cover" sizes="24px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Users className="h-3 w-3 text-white/20" />
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-white/[0.03] px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/user/${comment.author.username}`}
              className="text-xs font-semibold text-foreground/80 hover:text-primary transition-colors">
              {comment.author.displayName ?? comment.author.username}
            </Link>
            <span className="text-caption">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-white/65">{comment.content}</p>
        </div>
        {!isReply && (
          <button type="button" onClick={() => onReply(comment.id, comment.author.username)}
            className="mt-1 text-[10px] font-semibold text-white/20 transition hover:text-primary/70 px-1">
            Reply
          </button>
        )}
      </div>
    </div>
  );
}
