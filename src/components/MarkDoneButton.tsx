"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleCheck, Popcorn, X } from "lucide-react";
import type { MovieSummary } from "@/types/movie";
import { useAuth } from "@/context/AuthContext";
import { StarRating } from "@/components/StarRating";
import { spring } from "@/lib/motionPresets";

type MarkDoneButtonProps = {
  movie: MovieSummary;
};

export function MarkDoneButton({ movie }: MarkDoneButtonProps) {
  const { hydrated, isInHistory, markCompleted, getUserRating, rateTitle } = useAuth();
  const done = isInHistory(movie.id);
  const existingRating = getUserRating(movie.id);

  const [showModal, setShowModal] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!hydrated) {
    return <div className="skeleton-shimmer h-11 min-w-[160px] rounded-full" />;
  }

  // Already watched — show rating state + allow re-rating
  if (done) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary">
          <CircleCheck className="h-4 w-4" />
          Watched
        </div>
        {/* Inline re-rating */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            {existingRating ? "Your rating" : "Rate it"}
          </p>
          <StarRating
            value={existingRating}
            size="sm"
            onChange={(r) => void rateTitle(movie.id, r)}
          />
        </div>
      </div>
    );
  }

  async function handleConfirm() {
    setSubmitting(true);
    await markCompleted(movie, pendingRating ?? undefined);
    setSubmitting(false);
    setShowModal(false);
    setPendingRating(null);
  }

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowModal(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.04] px-5 text-sm font-bold text-white/70 transition hover:border-primary/40 hover:bg-primary/8 hover:text-primary"
      >
        <Popcorn className="h-4 w-4" />
        Mark as watched
      </motion.button>

      {/* Rating modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={spring.smooth}
              className="fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[81] mx-auto max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1020] shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
              style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Marking as watched</p>
                  <p className="mt-0.5 font-black text-foreground line-clamp-1">{movie.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-white/30 transition hover:text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Rating */}
              <div className="px-5 py-5">
                <p className="mb-4 text-sm font-semibold text-white/60">
                  How would you rate it? <span className="text-white/30">(optional)</span>
                </p>
                <StarRating
                  value={pendingRating}
                  onChange={setPendingRating}
                  size="lg"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 border-t border-white/[0.06] px-5 py-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.04] py-2.5 text-sm font-bold text-white/50 transition hover:text-white/80"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  onClick={() => void handleConfirm()}
                  disabled={submitting}
                  whileTap={{ scale: 0.96 }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-black text-primary-foreground shadow-[0_0_16px_rgba(245,197,66,0.3)] transition hover:bg-primary/90 disabled:opacity-50"
                >
                  <CircleCheck className="h-4 w-4" />
                  {submitting ? "Saving…" : "Confirm"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
