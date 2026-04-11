"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import type { MovieSummary } from "@/types/movie";
import { fetchSearchMovies } from "@/lib/searchMovieClient";
import { MovieCard } from "@/components/MovieCard";
import { SearchBar } from "@/components/SearchBar";
import { SkeletonGrid } from "@/components/Skeletons";
import { spring } from "@/lib/motionPresets";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 24; // show in chunks for infinite scroll

function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "AbortError") return true;
  if (e && typeof e === "object" && "name" in e && (e as Error).name === "AbortError")
    return true;
  return false;
}

type ViewMode = "grid" | "list";

function ResultCount({ count, query }: { count: number; query: string }) {
  if (!query.trim()) return null;
  return (
    <p className="text-sm text-white/45">
      <span className="font-semibold text-foreground">{count}</span>{" "}
      {count === 1 ? "result" : "results"} for{" "}
      <span className="font-semibold text-foreground">&ldquo;{query.trim()}&rdquo;</span>
    </p>
  );
}

function ListRow({ movie }: { movie: MovieSummary }) {
  return (
    <motion.a
      href={`/movie/${encodeURIComponent(movie.id)}`}
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={spring.snappy}
      className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 transition hover:border-white/12 hover:bg-white/[0.05]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={movie.posterUrl}
        alt=""
        className="h-16 w-11 shrink-0 rounded-xl object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-foreground transition group-hover:text-primary">
          {movie.title}
        </p>
        <p className="mt-0.5 text-xs text-white/35">
          {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "—"}
          {movie.rating != null ? ` · ★ ${movie.rating.toFixed(1)}` : ""}
        </p>
      </div>
      <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
        {movie.id.startsWith("tv-") ? "Series" : "Movie"}
      </span>
    </motion.a>
  );
}

export function SearchResults() {
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState<MovieSummary[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    const q = query.trim();
    const generation = ++fetchGenerationRef.current;
    const controller = new AbortController();
    const debounceMs = q ? SEARCH_DEBOUNCE_MS : 0;

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      setVisibleCount(PAGE_SIZE);
      try {
        const { movies, error: err } = await fetchSearchMovies(q, controller.signal);
        if (generation !== fetchGenerationRef.current || controller.signal.aborted) return;
        setLoading(false);
        setAllResults(movies);
        setError(err);
      } catch (e) {
        if (generation !== fetchGenerationRef.current || controller.signal.aborted || isAbortError(e)) return;
        setLoading(false);
        setAllResults([]);
        setError("Search failed. Please try again.");
      }
    }, debounceMs);

    return () => { window.clearTimeout(timeoutId); controller.abort(); };
  }, [query]);

  const results = allResults.slice(0, visibleCount);
  const hasMore = visibleCount < allResults.length;

  const loadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + PAGE_SIZE, allResults.length));
  }, [allResults.length]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  const trimmed = query.trim();
  const showNoMatches = trimmed !== "" && !loading && !error && allResults.length === 0;

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Search input */}
      <SearchBar value={query} onChange={setQuery} />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <ResultCount count={allResults.length} query={query} />
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center rounded-full border border-white/[0.07] bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-[0_0_8px_rgba(245,197,66,0.3)]"
                  : "text-white/35 hover:text-white/60"
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow-[0_0_8px_rgba(245,197,66,0.3)]"
                  : "text-white/35 hover:text-white/60"
              }`}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-white/35 transition hover:border-white/15 hover:text-white/60"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive backdrop-blur-xl dark:text-red-200">
          {error}
        </p>
      )}

      {/* Results */}
      <div className="w-full">
        {loading ? (
          <SkeletonGrid count={viewMode === "grid" ? 12 : 8} />
        ) : (
          <AnimatePresence mode="wait">
            {showNoMatches ? (
              <motion.div
                key="no-matches"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] py-24 text-center"
              >
                <p className="text-3xl">🎬</p>
                <p className="font-bold text-foreground">No results for &ldquo;{trimmed}&rdquo;</p>
                <p className="text-sm text-white/40">Try a different title, actor, or keyword.</p>
              </motion.div>
            ) : viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              >
                {results.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} href={`/movie/${encodeURIComponent(movie.id)}`} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                {results.map((movie) => (
                  <ListRow key={movie.id} movie={movie} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
