"use client";

import Link from "next/link";
import { ChevronRight, Flame, TrendingUp } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import type { MovieSummary } from "@/types/movie";
import { fetchHomeDiscovery } from "@/lib/homeDiscoveryClient";
import { VIBE_FILTERS, type VibeFilterId } from "@/lib/vibeFilters";
import { HomeHeroCarousel } from "@/components/HomeHeroCarousel";
import { MovieCard } from "@/components/MovieCard";
import { SkeletonGrid, SkeletonHero } from "@/components/Skeletons";
import { spring } from "@/lib/motionPresets";

function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "AbortError") return true;
  if (e && typeof e === "object" && "name" in e && (e as Error).name === "AbortError")
    return true;
  return false;
}

const VIBES = [{ id: null, label: "All" }, ...VIBE_FILTERS.map((v) => ({ id: v.id as VibeFilterId | null, label: v.label }))] as const;

export default function Home() {
  const reduceMotion = useReducedMotion();
  const [trending, setTrending] = useState<MovieSummary[]>([]);
  const [popular, setPopular] = useState<MovieSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vibe, setVibe] = useState<VibeFilterId | null>(null);
  const [activeRail, setActiveRail] = useState<"trending" | "popular">("trending");
  const fetchGen = useRef(0);

  const genreId = useMemo(() => {
    if (!vibe) return undefined;
    return VIBE_FILTERS.find((v) => v.id === vibe)?.genreId;
  }, [vibe]);

  useEffect(() => {
    const generation = ++fetchGen.current;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { trending: t, popular: p, error: err } = await fetchHomeDiscovery(genreId, controller.signal);
        if (generation !== fetchGen.current || controller.signal.aborted) return;
        setLoading(false);
        setTrending(t);
        setPopular(p);
        setError(err ?? null);
      } catch (e) {
        if (generation !== fetchGen.current || controller.signal.aborted || isAbortError(e)) return;
        setLoading(false);
        setTrending([]);
        setPopular([]);
        setError("Couldn't load discovery. Try again.");
      }
    })();
    return () => controller.abort();
  }, [genreId]);

  const carouselSlides = trending.slice(0, 7);
  const hasHero = !loading && !error && carouselSlides.length > 0;
  const displayMovies = activeRail === "trending" ? trending.slice(7) : popular;

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden bg-background text-white">
        {loading && <SkeletonHero />}
        {!loading && error && (
          <div className="container relative z-10 flex min-h-[60vh] items-center pt-20">
            <div className="max-w-lg space-y-4 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <p className="font-semibold text-white">{error}</p>
              <Link href="/search" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
                Browse catalog
              </Link>
            </div>
          </div>
        )}
        {hasHero && <HomeHeroCarousel slides={carouselSlides} />}
      </section>

      {/* ── Rail tabs + grid ── */}
      <section className="container relative z-10 mt-8 pb-28 sm:mt-12">
        {/* Section header */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={spring.smooth}
          className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Rail toggle */}
          <div className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.04] p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setActiveRail("trending")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeRail === "trending"
                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(245,197,66,0.3)]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              Trending
            </button>
            <button
              type="button"
              onClick={() => setActiveRail("popular")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeRail === "popular"
                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(245,197,66,0.3)]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Popular
            </button>
          </div>

          {/* Vibe chips — horizontal scroll on mobile */}
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {VIBES.map((v) => (
              <button
                key={String(v.id)}
                type="button"
                onClick={() => setVibe(v.id)}
                className={`shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-all ${
                  vibe === v.id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/[0.07] bg-white/[0.03] text-white/40 hover:border-white/15 hover:text-white/70"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <SkeletonGrid count={12} />
        ) : error ? (
          <p className="text-muted-foreground">
            Grid unavailable —{" "}
            <Link href="/search" className="font-semibold text-primary underline">
              try Browse
            </Link>
            .
          </p>
        ) : (
          <motion.div
            key={`${activeRail}-${genreId ?? "all"}`}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.smooth}
          >
            {/* Mobile horizontal scroll */}
            <div className="md:hidden">
              <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {displayMovies.slice(0, 16).map((movie) => (
                  <div key={movie.id} className="w-[42vw] max-w-[180px] shrink-0 snap-start">
                    <MovieCard movie={movie} href={`/movie/${encodeURIComponent(movie.id)}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop grid */}
            <div className="hidden grid-cols-3 gap-4 md:grid lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {displayMovies.slice(0, 18).map((movie) => (
                <MovieCard key={movie.id} movie={movie} href={`/movie/${encodeURIComponent(movie.id)}`} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/search"
                className="btn btn-ghost group"
              >
                Explore full catalog
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}
