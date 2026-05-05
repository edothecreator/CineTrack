"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, X, Send, Users, AlertTriangle, Star } from "lucide-react";
import Image from "next/image";
import type { CreatePostInput, PostItem } from "@/types/post";
import { spring } from "@/lib/motionPresets";

type PostComposerProps = {
  onPost: (post: PostItem) => void;
  avatarUrl?: string | null;
};

export function PostComposer({ onPost, avatarUrl }: PostComposerProps) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  }

  function removeImage() {
    setImagePreview(null);
    setImageUrl(null);
  }

  async function handleSubmit() {
    if (!text.trim() && !imageUrl) return;
    setError(null);

    const input: CreatePostInput = {
      type: imageUrl ? "IMAGE" : "TEXT",
      text: text.trim() || undefined,
      imageUrl: imageUrl ?? undefined,
      rating: rating ?? undefined,
      isSpoiler,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as PostItem & { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to post"); return; }
      onPost(data);
      setText("");
      setImagePreview(null);
      setImageUrl(null);
      setRating(null);
      setIsSpoiler(false);
      setFocused(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !submitting && (text.trim().length > 0 || imageUrl != null);
  const showOptions = focused || text.length > 0 || imagePreview != null;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* ── Input area ── */}
      <div className="flex gap-3 px-4 pt-4">
        {/* Avatar */}
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.05] mt-0.5">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" sizes="36px" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Users className="h-4 w-4 text-white/20" />
            </div>
          )}
        </div>

        {/* Text */}
        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="What's on your mind?"
          rows={focused || text.length > 0 ? 3 : 1}
          maxLength={500}
          className="flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-foreground placeholder:text-white/25 focus:outline-none transition-all"
          style={{ minHeight: focused || text.length > 0 ? "4.5rem" : "2.25rem" }}
        />
      </div>

      {/* ── Image preview ── */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative mx-4 mt-3 overflow-hidden rounded-xl border border-white/[0.07]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Preview" className="max-h-72 w-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white/80 transition hover:bg-black/90"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Options row (shown when focused or has content) ── */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 border-t border-white/[0.05] px-4 py-3">
              {/* Image attach */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/40 transition hover:bg-white/[0.05] hover:text-white/70"
                title="Add photo"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Photo</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFilePick} />

              {/* Rating */}
              <div className="flex items-center gap-1 rounded-full px-2 py-1.5">
                <Star className="h-3.5 w-3.5 text-primary/60" />
                <input
                  type="number" min={0} max={10} step={0.5}
                  placeholder="Rate /10"
                  value={rating ?? ""}
                  onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
                  className="w-16 bg-transparent text-xs text-foreground/70 placeholder:text-white/20 focus:outline-none"
                />
              </div>

              {/* Spoiler */}
              <button
                type="button"
                onClick={() => setIsSpoiler(!isSpoiler)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
                  isSpoiler ? "text-amber-400 bg-amber-500/10" : "text-white/30 hover:text-white/55"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Spoiler</span>
              </button>

              {/* Submit */}
              <motion.button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                whileTap={canSubmit ? { scale: 0.95 } : {}}
                transition={spring.snappy}
                className="ml-auto flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-30"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "Posting…" : "Post"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="px-4 pb-3 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
