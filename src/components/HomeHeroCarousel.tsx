"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Play, Info } from "lucide-react";
import { useEffect, useState } from "react";
import type { MovieSummary } from "@/types/movie";
import { WatchlistButton } from "@/components/MarkWatchedButton";
import { formatReleaseDate } from "@/lib/formatMovie";
import { spring, staggerContainer, staggerItem } from "@/lib/motionPresets";

const AUTO_MS = 7500;

function subtitle(movie: MovieSummary): string {
  const parts: string[] = [];
  if (movie.rating != null && Number.isFinite(movie.rating)) {
    parts.push(`${movie.rating.toFixed(1)} / 10`);
  }
  if (movie.releaseDate?.trim()) {
    try {
      const y = new Date(movie.releaseDate).getFullYear();
      if (Number.isFinite(y)) parts.push(String(y));
    } catch {
      const d = formatReleaseDate(movie.releaseDate);
      if (d !== "—") parts.push(d);
    }
  }
  parts.push("TMDB");
  return parts.join(" · ");
}

type HomeHeroCarouselProps = {
  slides: MovieSummary[];
};

export function HomeHeroCarousel({ slides }: HomeHeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const parallaxX = useSpring(
    useTransform(mouseX, [0, 1], reduce ? [0, 0] : [-14, 14]),
    { stiffness: 120, damping: 28 },
  );
  const parallaxY = useSpring(
    useTransform(mouseY, [0, 1], reduce ? [0, 0] : [-10, 10]),
    { stiffness: 110, damping: 30 },
  );

  const safe = slides.length > 0 ? slides : [];
  const current = safe[index % safe.length];

  useEffect(() => {
    if (safe.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % safe.length);
    }, AUTO_MS);
    return () => window.clearInterval(t);
  }, [safe.length]);

  if (!current) return null;

  return (
    <div
      className="relative h-full min-h-[min(90vh,900px)] w-full overflow-hidden"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - r.left) / r.width);
        mouseY.set((e.clientY - r.top) / r.height);
      }}
      onMouseLeave={() => {
        mouseX.set(0.5);
        mouseY.set(0.5);
      }}
    >
      {/* Depth layers — far field */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <motion.div
          style={{ x: parallaxX, y: parallaxY }}
          className="absolute -inset-[8%] opacity-40"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-indigo-500/20 blur-3xl" />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-[1]"
        >
          <motion.div
            initial={reduce ? false : { scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={current.heroBackdropUrl ?? current.posterUrl}
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
              priority={index === 0}
            />
          </motion.div>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-background/55 to-background"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 0%, black 52%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 52%, transparent 100%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/35 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(232,188,45,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,transparent_0%,var(--background)_78%)] opacity-95" />
        </motion.div>
      </AnimatePresence>

      <div className="container relative z-10 flex h-full min-h-[inherit] w-full items-center pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`txt-${current.id}`}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
            className="max-w-3xl space-y-8"
          >
            <motion.div variants={staggerItem} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary shadow-[0_0_32px_rgba(232,188,45,0.18)] backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                {!reduce ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                ) : null}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(232,188,45,0.8)]" />
              </span>
              Spotlight stage
            </motion.div>
            <motion.h1
              variants={staggerItem}
              className="text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.85)] sm:text-7xl lg:text-8xl"
            >
              {current.title}
            </motion.h1>
            <motion.p
              variants={staggerItem}
              className="max-w-xl text-lg font-medium leading-relaxed text-white/78 sm:text-xl"
            >
              {subtitle(current)}
            </motion.p>
            <motion.div
              variants={staggerItem}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={spring.snappy}>
                <Link
                  href={`/movie/${encodeURIComponent(current.id)}`}
                  className="inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(232,188,45,0.35)] transition-all hover:bg-primary/92"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Enter title
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={spring.snappy}>
                <Link
                  href={`/movie/${encodeURIComponent(current.id)}`}
                  className="flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.08] px-8 py-4 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl transition-all hover:border-primary/30 hover:bg-white/12"
                >
                  <Info className="h-5 w-5" />
                  Details
                </Link>
              </motion.div>
              <WatchlistButton movie={current} />
            </motion.div>

            {safe.length > 1 ? (
              <motion.div variants={staggerItem} className="flex gap-2 pt-6">
                {safe.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Show ${s.title}`}
                    onClick={() => setIndex(i)}
                    className="group/dot relative h-2 rounded-full transition-all"
                  >
                    <span
                      className={`block h-2 rounded-full transition-all duration-300 ${
                        i === index % safe.length
                          ? "w-12 bg-primary shadow-[0_0_16px_rgba(232,188,45,0.5)]"
                          : "w-6 bg-white/25 group-hover/dot:bg-white/45"
                      }`}
                    />
                  </button>
                ))}
              </motion.div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
