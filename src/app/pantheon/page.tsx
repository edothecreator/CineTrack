"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Crown, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { MovieSummary } from "@/types/movie";
import { formatReleaseDate } from "@/lib/formatMovie";
import { spring } from "@/lib/motionPresets";

const PAGE_SIZE = 20;
const MAX_RANK = 100;

type PantheonResponse = {
  items?: MovieSummary[];
  nextPage?: number | null;
  page?: number;
  error?: string;
};

const pageCache = new Map<number, MovieSummary[]>();

const RANK_COLORS: Record<number, string> = {
  1: "text-[#F5C542] drop-shadow-[0_0_8px_rgba(245,197,66,0.6)]",
  2: "text-[#C0C0C0] drop-shadow-[0_0_6px_rgba(192,192,192,0.4)]",
  3: "text-[#CD7F32] drop-shadow-[0_0_6px_rgba(205,127,50,0.4)]",
};

export default function PantheonPage() {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<MovieSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    const cached = pageCache.get(p);
    if (cached) { setItems(cached); setLoading(false); setErr(null); return; }
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/pantheon?page=${p}`);
      const data = (await res.json()) as PantheonResponse;
      if (!res.ok) { setErr(data.error ?? "Failed to load."); setItems([]); return; }
      const result = Array.isArray(data.items) ? data.items : [];
      pageCache.set(p, result);
      setItems(result);
    } catch { setErr("Network error."); setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const rankStart = page * PAGE_SIZE + 1;
  const totalPages = Math.ceil(MAX_RANK / PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1 && items.length > 0 && rankStart + items.length <= MAX_RANK;

  return (
    <div className="min-h-screen">
      {/* ── Hero header ── */}
      <div className="page-header">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring.smooth}>
            <p className="label-overline mb-3 flex items-center gap-2">
              <Crown className="h-3.5 w-3.5" />
              Hall of Fame
            </p>
            <h1 className="text-hero text-foreground">Hall of Fame</h1>
            <p className="text-body mt-3 max-w-md">
              The top {MAX_RANK} movies &amp; series by TMDB score.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container max-w-3xl py-8 sm:py-10">
        {err && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
            {err}
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-[4.5rem] rounded-2xl" />
              ))}
            </motion.div>
          ) : (
            <motion.ol
              key={page}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-1.5"
            >
              {items.map((m, i) => {
                const rank = rankStart + i;
                if (rank > MAX_RANK) return null;
                const year = (() => {
                  const d = formatReleaseDate(m.releaseDate);
                  const parts = d.split(" ");
                  return parts.length >= 3 ? parts[2] : d === "—" ? "—" : d;
                })();
                const isTop3 = rank <= 3;

                return (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025, ...spring.smooth }}
                  >
                    <Link
                      href={`/movie/${encodeURIComponent(m.id)}`}
                      className={`group flex items-center gap-4 rounded-2xl border px-4 py-3 transition-all duration-200 ${
                        isTop3
                          ? "border-primary/20 bg-primary/5 hover:border-primary/35 hover:bg-primary/8"
                          : "border-white/[0.06] bg-white/[0.025] hover:border-white/12 hover:bg-white/[0.05]"
                      }`}
                    >
                      {/* Rank */}
                      <span className={`w-8 shrink-0 text-center text-sm font-black tabular-nums ${
                        RANK_COLORS[rank] ?? "text-white/30"
                      }`}>
                        {rank <= 3 ? ["🥇","🥈","🥉"][rank - 1] : rank}
                      </span>

                      {/* Poster */}
                      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        <Image
                          src={m.posterUrl}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="40px"
                          loading="lazy"
                        />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-foreground transition group-hover:text-primary">
                          {m.title}
                        </p>
                        <p className="text-xs text-white/35">{year}</p>
                      </div>

                      {/* Rating */}
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black tabular-nums ${
                        isTop3
                          ? "bg-primary/15 text-primary border border-primary/25"
                          : "bg-white/[0.06] text-white/50 border border-white/[0.07]"
                      }`}>
                        <Star className="h-3 w-3 fill-current" />
                        {m.rating != null && Number.isFinite(m.rating) ? m.rating.toFixed(1) : "—"}
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ol>
          )}
        </AnimatePresence>

        {/* ── Pagination ── */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <motion.button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={!canPrev || loading}
            whileHover={canPrev ? { x: -2 } : {}}
            whileTap={canPrev ? { scale: 0.95 } : {}}
            className="btn btn-ghost disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </motion.button>

          <span className="text-xs font-bold uppercase tracking-widest text-white/30">
            {page + 1} / {totalPages}
          </span>

          <motion.button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!canNext || loading}
            whileHover={canNext ? { x: 2 } : {}}
            whileTap={canNext ? { scale: 0.95 } : {}}
            className="btn btn-ghost disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
