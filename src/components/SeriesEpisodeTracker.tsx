"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Star, Clock, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { spring } from "@/lib/motionPresets";

type EpisodeRow = {
  id: string;
  name: string;
  overview: string;
  seasonNumber: number;
  episodeNumber: number;
  runtime?: number;
  aired?: string;
  stillUrl?: string;
  voteAverage?: number;
};

type SeriesEpisodeTrackerProps = {
  seriesSlug: string;
  seriesNumericId: number;
};

export function SeriesEpisodeTracker({ seriesSlug, seriesNumericId }: SeriesEpisodeTrackerProps) {
  const { hydrated, isEpisodeWatched, toggleEpisodeWatched } = useAuth();
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<number>(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/series-episodes?seriesId=${encodeURIComponent(String(seriesNumericId))}`);
        const data = (await res.json()) as { episodes?: EpisodeRow[]; error?: string };
        if (cancelled) return;
        if (!res.ok) { setErr(data.error ?? "Episodes unavailable."); return; }
        const eps = Array.isArray(data.episodes) ? data.episodes : [];
        setEpisodes(eps);
        // Default to first season
        const firstSeason = eps[0]?.seasonNumber ?? 1;
        setActiveSeason(firstSeason);
      } catch {
        if (!cancelled) setErr("Could not load episodes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [seriesNumericId]);

  // Group by season
  const seasons = useMemo(() => {
    const map = new Map<number, EpisodeRow[]>();
    for (const ep of episodes) {
      if (!map.has(ep.seasonNumber)) map.set(ep.seasonNumber, []);
      map.get(ep.seasonNumber)!.push(ep);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [episodes]);

  const currentEps = useMemo(
    () => seasons.find(([s]) => s === activeSeason)?.[1] ?? [],
    [seasons, activeSeason]
  );

  const totalWatched = episodes.filter((e) => isEpisodeWatched(seriesSlug, e.id)).length;
  const seasonWatched = currentEps.filter((e) => isEpisodeWatched(seriesSlug, e.id)).length;
  const pct = episodes.length > 0 ? Math.round((totalWatched / episodes.length) * 100) : 0;

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[rgba(16,18,28,0.75)] backdrop-blur-xl">
        <div className="border-b border-white/[0.06] p-5">
          <div className="skeleton-shimmer h-5 w-40 rounded-lg" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (err || episodes.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/35">
        {err ?? "No episode data available for this series."}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[rgba(16,18,28,0.75)] backdrop-blur-xl"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)" }}
    >
      {/* ── Header ── */}
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-black text-foreground">Episode Tracker</h2>
            <p className="mt-0.5 text-xs text-white/35">
              {totalWatched} / {episodes.length} episodes watched
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tabular-nums text-primary">{pct}%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-amber-300"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 24 }}
          />
        </div>
      </div>

      {/* ── Season tabs ── */}
      {seasons.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {seasons.map(([seasonNum, eps]) => {
            const watched = eps.filter((e) => isEpisodeWatched(seriesSlug, e.id)).length;
            const isActive = activeSeason === seasonNum;
            return (
              <button
                key={seasonNum}
                type="button"
                onClick={() => setActiveSeason(seasonNum)}
                className={`relative flex shrink-0 flex-col items-center rounded-xl px-3.5 py-2 text-center transition-all ${
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="season-pill"
                    className="absolute inset-0 rounded-xl border border-primary/25 bg-primary/8"
                    transition={spring.dock}
                  />
                )}
                <span className="relative text-[11px] font-black uppercase tracking-wider">
                  S{seasonNum}
                </span>
                <span className="relative text-[9px] font-semibold tabular-nums text-white/30">
                  {watched}/{eps.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Episode list ── */}
      <div className="max-h-[min(520px,60vh)] overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.ul
            key={activeSeason}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="divide-y divide-white/[0.04]"
          >
            {currentEps.map((ep) => (
              <EpisodeRow
                key={ep.id}
                ep={ep}
                seriesSlug={seriesSlug}
                hydrated={hydrated}
                isWatched={isEpisodeWatched(seriesSlug, ep.id)}
                onToggle={() => void toggleEpisodeWatched(seriesSlug, ep.id)}
              />
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      {/* ── Season quick-mark ── */}
      <div className="border-t border-white/[0.06] px-5 py-3">
        <button
          type="button"
          disabled={!hydrated || seasonWatched === currentEps.length}
          onClick={() => {
            for (const ep of currentEps) {
              if (!isEpisodeWatched(seriesSlug, ep.id)) {
                void toggleEpisodeWatched(seriesSlug, ep.id);
              }
            }
          }}
          className="text-[11px] font-bold uppercase tracking-wider text-white/25 transition hover:text-primary disabled:opacity-30"
        >
          {seasonWatched === currentEps.length
            ? `✓ Season ${activeSeason} complete`
            : `Mark all Season ${activeSeason} as watched`}
        </button>
      </div>
    </div>
  );
}

function EpisodeRow({
  ep,
  seriesSlug: _seriesSlug,
  hydrated,
  isWatched,
  onToggle,
}: {
  ep: EpisodeRow;
  seriesSlug: string;
  hydrated: boolean;
  isWatched: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(isWatched);
  const hasOverview = ep.overview.trim().length > 0;
  const showSpoiler = hasOverview && !isWatched && !spoilerRevealed;

  return (
    <li className={`transition-colors ${isWatched ? "bg-primary/[0.03]" : ""}`}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Still image */}
        {ep.stillUrl ? (
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.04]">
            <Image
              src={ep.stillUrl}
              alt=""
              fill
              className="object-cover"
              sizes="112px"
              loading="lazy"
            />
            {isWatched && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Check className="h-5 w-5 text-primary" strokeWidth={3} />
              </div>
            )}
          </div>
        ) : (
          <div className={`flex h-16 w-28 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] ${isWatched ? "bg-primary/10" : "bg-white/[0.03]"}`}>
            {isWatched
              ? <Check className="h-5 w-5 text-primary" strokeWidth={3} />
              : <span className="text-xs font-black text-white/20">E{ep.episodeNumber}</span>
            }
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                S{ep.seasonNumber} · E{ep.episodeNumber}
              </p>
              <p className={`mt-0.5 font-bold leading-snug ${isWatched ? "text-white/60" : "text-foreground"}`}>
                {ep.name}
              </p>
              <div className="mt-1 flex items-center gap-3 text-[10px] text-white/25">
                {ep.runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ep.runtime}m
                  </span>
                )}
                {ep.voteAverage && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-primary/60" />
                    {ep.voteAverage.toFixed(1)}
                  </span>
                )}
                {ep.aired && (
                  <span>{new Date(ep.aired).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                )}
              </div>
            </div>

            {/* Watch toggle */}
            <motion.button
              type="button"
              disabled={!hydrated}
              onClick={onToggle}
              whileTap={{ scale: 0.88 }}
              transition={spring.snappy}
              className={`shrink-0 rounded-full border p-1.5 transition-all ${
                isWatched
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-white/[0.07] bg-white/[0.04] text-white/25 hover:border-primary/30 hover:text-primary/60"
              }`}
              aria-label={isWatched ? "Mark unwatched" : "Mark watched"}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={isWatched ? 3 : 2} />
            </motion.button>
          </div>

          {/* Overview */}
          {hasOverview && (
            <div className="mt-2">
              {showSpoiler ? (
                <button
                  type="button"
                  onClick={() => setSpoilerRevealed(true)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/20 transition hover:text-amber-400/60"
                >
                  <Lock className="h-3 w-3" />
                  Spoiler — tap to reveal
                </button>
              ) : (
                <div>
                  <p className={`text-xs leading-relaxed text-white/45 ${!expanded ? "line-clamp-2" : ""}`}>
                    {ep.overview}
                  </p>
                  {ep.overview.length > 120 && (
                    <button
                      type="button"
                      onClick={() => setExpanded(!expanded)}
                      className="mt-1 flex items-center gap-1 text-[10px] font-bold text-white/20 transition hover:text-white/50"
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      {expanded ? "Less" : "More"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
