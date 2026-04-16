"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Check } from "lucide-react";
import type { MovieSummary } from "@/types/movie";
import { useAuth } from "@/context/AuthContext";

type WatchlistButtonProps = {
  movie: MovieSummary;
};

/** Add/remove from “My list” (watchlist — want to watch). */
export function WatchlistButton({ movie }: WatchlistButtonProps) {
  const { hydrated, isInWatchlist, toggleWatchlist } = useAuth();
  const saved = isInWatchlist(movie.id);

  if (!hydrated) {
    return (
      <div
        className="skeleton-shimmer flex h-11 min-w-[160px] items-center justify-center rounded-full border border-white/10 bg-white/10"
        aria-hidden
      />
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 22,
      }}
      onClick={(e) => {
        e.preventDefault();
        void toggleWatchlist(movie);
      }}
      className={`flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-full px-5 text-sm font-bold tracking-tight shadow-lg transition-colors glass-card ${
        saved
          ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
          : "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={saved ? "saved" : "add"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-2"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4 stroke-[3]" />
              In my list
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 stroke-[3]" />
              Save to list
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

/** @deprecated Use `WatchlistButton`; alias kept for legacy imports. */
export const MarkWatchedButton = WatchlistButton;
