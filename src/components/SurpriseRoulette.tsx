"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { MovieSummary } from "@/types/movie";

type SurpriseRouletteProps = {
  items: MovieSummary[];
};

export function SurpriseRoulette({ items }: SurpriseRouletteProps) {
  const [spinning, setSpinning] = useState(false);
  const [pick, setPick] = useState<MovieSummary | null>(null);

  const pool = useMemo(() => (items.length > 0 ? items : []), [items]);

  function spin() {
    if (pool.length === 0 || spinning) return;
    setSpinning(true);
    setPick(null);
    const rounds = 14 + Math.floor(Math.random() * 6);
    let step = 0;
    const id = window.setInterval(() => {
      const flicker = pool[Math.floor(Math.random() * pool.length)];
      setPick(flicker);
      step += 1;
      if (step >= rounds) {
        window.clearInterval(id);
        const final = pool[Math.floor(Math.random() * pool.length)];
        setPick(final);
        setSpinning(false);
      }
    }, 70);
  }

  if (pool.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/80 to-background p-6 shadow-[0_0_40px_rgba(245,197,24,0.08)] backdrop-blur-xl sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
            Roulette
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
            Surprise me
          </h2>
          <p className="mt-1 max-w-md text-sm text-white/45">
            Spin through your list and land on tonight&apos;s watch.
          </p>
        </div>
        <motion.button
          type="button"
          onClick={spin}
          disabled={spinning}
          whileHover={{ scale: spinning ? 1 : 1.03 }}
          whileTap={{ scale: spinning ? 1 : 0.97 }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {spinning ? "Spinning…" : "Spin"}
        </motion.button>
      </div>

      <div className="relative mt-8 flex min-h-[200px] items-center justify-center">
        <AnimatePresence mode="wait">
          {pick ? (
            <motion.div
              key={pick.id + String(spinning)}
              initial={{ opacity: 0, rotateY: 90, scale: 0.85 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -70, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
              }}
              className="flex w-full max-w-sm flex-col items-center gap-4 text-center"
            >
              <div className="relative aspect-[2/3] w-[140px] overflow-hidden rounded-2xl border border-white/15 shadow-2xl sm:w-[160px]">
                <Image
                  src={pick.posterUrl}
                  alt={pick.title}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
              <div>
                <p className="line-clamp-2 text-lg font-bold text-foreground">
                  {pick.title}
                </p>
                <Link
                  href={`/movie/${encodeURIComponent(pick.id)}`}
                  className="mt-3 inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] px-5 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary/50 hover:text-primary"
                >
                  Open detail
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-white/40"
            >
              Hit spin to shuffle your collection.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
