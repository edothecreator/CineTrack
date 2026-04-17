"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { LibrarySearch } from "@/components/LibrarySearch";
import { useAuth } from "@/context/AuthContext";
import { SurpriseRoulette } from "@/components/SurpriseRoulette";
import { PremiereCountdown } from "@/components/PremiereCountdown";
import { SkeletonGrid } from "@/components/Skeletons";

function releaseIsFuture(iso: string): boolean {
  if (!iso?.trim()) return false;
  const t = new Date(iso + (iso.length <= 10 ? "T12:00:00" : "")).getTime();
  return Number.isFinite(t) && t > Date.now();
}

export function WatchlistGrid() {
  const { hydrated, watchlist, toggleWatchlist, currentUser } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return watchlist;
    const q = query.toLowerCase();
    return watchlist.filter((m) => m.title.toLowerCase().includes(q));
  }, [watchlist, query]);

  const upcoming = useMemo(
    () => watchlist.filter((m) => releaseIsFuture(m.releaseDate)),
    [watchlist],
  );

  if (!hydrated) return <SkeletonGrid count={6} />;

  if (watchlist.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-20 text-center">
        <p className="text-lg font-medium text-white/80">Your list is empty</p>
        <p className="mt-3 text-sm text-white/45">
          {currentUser ? 'Save titles from Browse with "Save to list".' : "Guest list stays in this browser. Sign in to sync."}
        </p>
        <Link href="/search" className="mt-8 inline-flex rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">Browse</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LibrarySearch value={query} onChange={setQuery} placeholder="Search your list…" count={filtered.length} total={watchlist.length} />

      <SurpriseRoulette items={watchlist} />

      {!query && upcoming.length > 0 && (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5 backdrop-blur-xl">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-amber-400/70">Release radar</h2>
          <ul className="flex flex-col gap-2">
            {upcoming.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <Link href={`/movie/${encodeURIComponent(m.id)}`} className="font-semibold text-foreground hover:text-primary transition">{m.title}</Link>
                <PremiereCountdown releaseDate={m.releaseDate} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/30">No titles match &ldquo;{query}&rdquo;</p>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((movie) => (
              <motion.div layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.22 }} key={movie.id}>
                <MovieCard
                  movie={movie}
                  href={`/movie/${encodeURIComponent(movie.id)}`}
                  trailing={
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); void toggleWatchlist(movie); }}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-200" aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
