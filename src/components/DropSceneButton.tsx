"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clapperboard, X, Send, AlertTriangle, Star } from "lucide-react";
import type { CreatePostInput, PostItem } from "@/types/post";
import { spring } from "@/lib/motionPresets";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type DropSceneButtonProps = {
  tmdbId: string;
  title: string;
  mediaType: "movie" | "tv";
};

export function DropSceneButton({ tmdbId, title, mediaType }: DropSceneButtonProps) {
  const { currentUser, hydrated } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  if (!hydrated) return null;

  if (!currentUser) {
    return (
      <Link href="/login"
        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/50 transition hover:border-primary/30 hover:text-primary/70">
        <Clapperboard className="h-4 w-4" />
        Post about this
      </Link>
    );
  }

  async function handleSubmit() {
    if (!text.trim() && !rating) return;
    setError(null);
    setSubmitting(true);
    const input: CreatePostInput = {
      type: "MEDIA",
      text: text.trim() || undefined,
      mediaType,
      tmdbId,
      rating: rating ?? undefined,
      isSpoiler,
    };
    try {
      const res = await fetch("/api/posts", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as PostItem & { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to post"); return; }
      setPosted(true);
      setTimeout(() => {
        setOpen(false); setPosted(false);
        setText(""); setRating(null); setIsSpoiler(false);
      }, 1500);
    } catch { setError("Network error."); }
    finally { setSubmitting(false); }
  }

  const canSubmit = !submitting && (text.trim().length > 0 || rating != null);

  return (
    <>
      <motion.button type="button" onClick={() => setOpen(true)}
        whileTap={{ scale: 0.97 }} transition={spring.snappy}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/60 transition hover:border-primary/40 hover:text-primary">
        <Clapperboard className="h-4 w-4" />
        Post about this
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={spring.smooth}
              className="fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[81] mx-auto max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1020]"
              style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Posting about</p>
                  <p className="mt-0.5 font-bold text-foreground line-clamp-1">{title}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="p-1.5 text-white/30 hover:text-white/70">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                {posted ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <span className="text-4xl">🎬</span>
                    <p className="font-bold text-foreground">Posted!</p>
                    <p className="text-sm text-white/40">Live on the Stream.</p>
                  </div>
                ) : (
                  <>
                    <textarea value={text} onChange={(e) => setText(e.target.value)}
                      placeholder={`What do you think about ${title}?`}
                      rows={3} maxLength={500} autoFocus
                      className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-white/20 focus:border-primary/30 focus:outline-none transition" />

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5">
                        <Star className="h-3.5 w-3.5 text-primary/60" />
                        <input type="number" min={0} max={10} step={0.5} placeholder="Rate /10"
                          value={rating ?? ""}
                          onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
                          className="w-16 bg-transparent text-xs text-foreground/70 placeholder:text-white/20 focus:outline-none" />
                      </div>
                      <button type="button" onClick={() => setIsSpoiler(!isSpoiler)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${isSpoiler ? "text-amber-400 bg-amber-500/10" : "text-white/30 hover:text-white/55"}`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Spoiler
                      </button>
                    </div>

                    {error && <p className="text-xs text-red-400">{error}</p>}

                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => setOpen(false)}
                        className="flex-1 rounded-xl border border-white/[0.07] py-2.5 text-sm font-semibold text-white/40 hover:text-white/70">
                        Cancel
                      </button>
                      <button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-30">
                        <Send className="h-4 w-4" />
                        {submitting ? "Posting…" : "Post"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
