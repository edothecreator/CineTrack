"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LibrarySearch } from "@/components/LibrarySearch";
import { SkeletonGrid } from "@/components/Skeletons";

export function HistoryList() {
  const { hydrated, historyList, removeFromHistory, getUserRating, rateTitle } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return historyList;
    const q = query.toLowerCase();
    return historyList.filter((m) => m.title.toLowerCase().includes(q));
  }, [historyList, query]);

  if (!hydrated) return <SkeletonGrid count={6} />;

  if (historyList.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-20 text-center">
        <p className="text-lg font-bold text-foreground">No watched titles yet</p>
        <p className="mt-3 text-sm text-white/40">Mark something as watched on its detail page.</p>
        <Link href="/my-list" className="mt-8 inline-flex rounded-full border border-white/[0.07] bg-white/[0.04] px-8 py-3 text-sm font-bold text-foreground transition hover:border-primary/40">My list</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LibrarySearch value={query} onChange={setQuery} placeholder="Search watched titles…" count={filtered.length} total={historyList.length} />

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/30">No titles match &ldquo;{query}&rdquo;</p>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((movie) => {
              const userRating = getUserRating(movie.id);
              return (
                <motion.div layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.22 }} key={movie.id} className="group relative">
                  <Link href={`/movie/${encodeURIComponent(movie.id)}`} className="block">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/[0.07]">
                      <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 45vw, 200px" />
                    </div>
                  </Link>
                  <div className="mt-2 px-0.5">
                    <p className="truncate text-xs font-bold text-foreground/80">{movie.title}</p>
                    <div className="mt-1">
                      {userRating ? (
                        <button type="button" onClick={() => void rateTitle(movie.id, null)} className="flex items-center gap-1 text-[10px] font-black text-primary transition hover:text-primary/70" title="Click to remove rating">
                          <Star className="h-3 w-3 fill-current" />{userRating}/10
                        </button>
                      ) : (
                        <button type="button" onClick={() => void rateTitle(movie.id, 7)} className="text-[10px] font-bold text-white/20 transition hover:text-primary/60" title="Quick rate 7/10">+ Rate</button>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={(e) => { e.preventDefault(); void removeFromHistory(movie.id); }}
                    className="absolute right-1.5 top-1.5 hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/50 opacity-0 shadow-lg backdrop-blur-md transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-300 group-hover:flex group-hover:opacity-100" aria-label="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
