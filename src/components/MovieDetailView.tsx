"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowLeft, Star, Calendar, Clock, Globe2, Film, Tv,
  Play, Users, ExternalLink,
  Clapperboard, Tag, Tv2, Award,
} from "lucide-react";
import { WatchlistButton } from "@/components/MarkWatchedButton";
import { MarkDoneButton } from "@/components/MarkDoneButton";
import { DropSceneButton } from "@/components/DropSceneButton";
import { AddToCollectionButton } from "@/components/AddToCollectionButton";
import { SeriesEpisodeTracker } from "@/components/SeriesEpisodeTracker";
import { TitleCommunityStats } from "@/components/TitleCommunityStats";
import { StarRating } from "@/components/StarRating";
import type { MovieDetail } from "@/types/movie";
import { formatReleaseDate } from "@/lib/formatMovie";
import { spring, staggerContainer, staggerItem } from "@/lib/motionPresets";
import { useAuth } from "@/context/AuthContext";

type MovieDetailViewProps = {
  movie: MovieDetail;
  seriesNumeric: number | null;
};

function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function formatRuntime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <h2 className="text-sm font-black uppercase tracking-[0.15em] text-foreground/80">{label}</h2>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}

export function MovieDetailView({ movie, seriesNumeric }: MovieDetailViewProps) {
  const reduce = useReducedMotion();
  const mainRef = useRef<HTMLDivElement>(null);
  const { isInHistory, getUserRating, rateTitle } = useAuth();
  const isWatched = isInHistory(movie.id);
  const userRating = getUserRating(movie.id);

  const { scrollYProgress } = useScroll({ target: mainRef, offset: ["start start", "end end"] });
  const bgScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.12]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  const summary = {
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    rating: movie.rating,
    releaseDate: movie.releaseDate,
    runtimeMinutes: movie.runtimeMinutes,
  };

  const hero = movie.backdropUrl ?? movie.posterUrl;
  const cast = movie.cast ?? [];
  const crew = movie.crew ?? [];
  const genres = movie.genres ?? [];
  const trailers = movie.trailers ?? [];
  const keywords = movie.keywords ?? [];
  const watchProviders = movie.watchProviders;
  const isSeries = movie.kind === "series";

  // Key crew roles
  const directors = crew.filter((c) => c.job === "Director");
  const writers = crew.filter((c) => ["Screenplay", "Writer", "Story"].includes(c.job));

  return (
    <div ref={mainRef} className="relative min-h-screen pb-32">

      {/* ── Cinematic parallax backdrop ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <motion.div
          style={{ scale: reduce ? 1 : bgScale, y: reduce ? 0 : bgY }}
          className="absolute inset-0"
        >
          <Image
            src={hero}
            alt=""
            fill
            className="object-cover opacity-[0.18] blur-[60px] saturate-[1.6]"
            sizes="100vw"
            priority
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0F]/60 via-[#0B0B0F]/85 to-[#0B0B0F]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(245,197,66,0.06),transparent)]" />
      </div>

      {/* ── Full-bleed hero image ── */}
      <div className="relative h-[55vw] max-h-[520px] min-h-[280px] w-full overflow-hidden sm:max-h-[600px]">
        <Image
          src={hero}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F]/60 via-transparent to-transparent" />

        {/* Back button */}
        <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
          <Link
            href="/search"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/70 backdrop-blur-xl transition hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
            Back
          </Link>
        </div>

        {/* Content rating badge */}
        {movie.contentRatings && movie.contentRatings.length > 0 && (
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
            <span className="rounded-lg border border-white/20 bg-black/50 px-2.5 py-1 text-xs font-black text-white/70 backdrop-blur-sm">
              {movie.contentRatings[0]}
            </span>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="container relative z-10 max-w-6xl -mt-32 sm:-mt-40 lg:-mt-48">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start xl:grid-cols-[300px_1fr]">

          {/* ── Left column: poster + actions ── */}
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={spring.float}
            className="mx-auto w-full max-w-[220px] space-y-4 lg:mx-0 lg:max-w-none lg:sticky lg:top-24"
          >
            {/* Poster */}
            <div
              className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10"
              style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06) inset" }}
            >
              <motion.div
                initial={reduce ? false : { scale: 1.04 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full"
              >
                <Image
                  src={movie.posterUrl}
                  alt={`${movie.title} poster`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 220px, 300px"
                  priority
                />
              </motion.div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/[0.03]" />
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <WatchlistButton movie={summary} />
              <MarkDoneButton movie={summary} />
              <DropSceneButton
                tmdbId={movie.id}
                title={movie.title}
                mediaType={isSeries ? "tv" : "movie"}
              />
              <AddToCollectionButton
                tmdbId={movie.id}
                title={movie.title}
                posterUrl={movie.posterUrl}
              />
            </div>

            {/* User rating (if watched and not shown in MarkDoneButton) */}
            {isWatched && (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/30">
                  Your rating
                </p>
                <StarRating
                  value={userRating}
                  size="sm"
                  onChange={(r) => void rateTitle(movie.id, r)}
                />
              </div>
            )}

            {/* Community stats */}
            <TitleCommunityStats tmdbId={movie.id} />

            {/* Watch providers */}
            {watchProviders?.flatrate && watchProviders.flatrate.length > 0 && (
              <div
                className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
              >
                <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest text-white/30">
                  Stream on
                </p>
                <div className="flex flex-wrap gap-2">
                  {watchProviders.flatrate.slice(0, 6).map((p) => (
                    <div
                      key={p.providerId}
                      title={p.providerName}
                      className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10"
                    >
                      <Image src={p.logoUrl} alt={p.providerName} fill className="object-cover" sizes="36px" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Homepage link */}
            {movie.homepage && (
              <a
                href={movie.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-xs font-bold text-white/40 transition hover:border-white/15 hover:text-white/70"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Official website
              </a>
            )}
          </motion.aside>

          {/* ── Right column: all info ── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="min-w-0 space-y-6"
          >
            {/* ── Title block ── */}
            <motion.div variants={staggerItem}>
              {/* Type + status badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                  isSeries
                    ? "bg-violet-500/12 text-violet-400 border border-violet-500/20"
                    : "bg-primary/12 text-primary border border-primary/20"
                }`}>
                  {isSeries ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                  {isSeries ? "Series" : "Movie"}
                </span>
                {movie.statusLabel && (
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    {movie.statusLabel}
                  </span>
                )}
                {movie.contentRatings?.[0] && (
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-[10px] font-bold text-white/40">
                    {movie.contentRatings[0]}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {movie.title}
              </h1>

              {/* Original title */}
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="mt-1.5 text-sm text-white/30 italic">{movie.originalTitle}</p>
              )}

              {/* Tagline */}
              {movie.tagline && (
                <p className="mt-3 text-base font-medium italic text-white/45">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              {/* Key stats row */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {movie.rating != null && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-primary text-primary drop-shadow-[0_0_6px_rgba(245,197,66,0.5)]" />
                    <span className="font-black text-foreground">{movie.rating.toFixed(1)}</span>
                    {movie.voteCount && (
                      <span className="text-white/30 text-xs">({movie.voteCount.toLocaleString()} votes)</span>
                    )}
                  </div>
                )}
                {movie.releaseDate && (
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Calendar className="h-3.5 w-3.5 text-white/30" />
                    {formatReleaseDate(movie.releaseDate)}
                  </div>
                )}
                {movie.runtimeMinutes != null && (
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Clock className="h-3.5 w-3.5 text-white/30" />
                    {formatRuntime(movie.runtimeMinutes)}
                  </div>
                )}
                {isSeries && movie.numberOfSeasons && (
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Tv2 className="h-3.5 w-3.5 text-white/30" />
                    {movie.numberOfSeasons} season{movie.numberOfSeasons !== 1 ? "s" : ""}
                    {movie.numberOfEpisodes && ` · ${movie.numberOfEpisodes} eps`}
                  </div>
                )}
                {movie.originalCountry && (
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Globe2 className="h-3.5 w-3.5 text-white/30" />
                    <span className="uppercase">{movie.originalCountry}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/55 transition hover:border-primary/30 hover:text-primary/80"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Synopsis ── */}
            <motion.section
              variants={staggerItem}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              <SectionHeading icon={Clapperboard} label="Synopsis" />
              <p className="text-[15px] leading-[1.75] text-white/65">{movie.description}</p>
            </motion.section>

            {/* ── Meta grid ── */}
            <motion.section variants={staggerItem}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {movie.originalLanguage && (
                  <MetaPill label="Language" value={movie.originalLanguage.toUpperCase()} />
                )}
                {movie.statusLabel && (
                  <MetaPill label="Status" value={movie.statusLabel} />
                )}
                {isSeries && movie.lastAirDate && (
                  <MetaPill label="Last aired" value={new Date(movie.lastAirDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })} />
                )}
                {movie.budget && (
                  <MetaPill label="Budget" value={formatMoney(movie.budget)} />
                )}
                {movie.revenue && (
                  <MetaPill label="Box office" value={formatMoney(movie.revenue)} />
                )}
                {movie.popularity && (
                  <MetaPill label="Popularity" value={movie.popularity.toFixed(0)} />
                )}
                {movie.productionCountries && movie.productionCountries.length > 0 && (
                  <MetaPill label="Country" value={movie.productionCountries[0]!} />
                )}
                {movie.spokenLanguages && movie.spokenLanguages.length > 1 && (
                  <MetaPill label="Languages" value={movie.spokenLanguages.slice(0, 2).join(", ")} />
                )}
              </div>
            </motion.section>

            {/* ── Created by / Directors / Writers ── */}
            {(movie.createdBy?.length || directors.length > 0 || writers.length > 0) && (
              <motion.section
                variants={staggerItem}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
              >
                <SectionHeading icon={Award} label="Filmmakers" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {movie.createdBy && movie.createdBy.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Created by</p>
                      <div className="flex flex-wrap gap-2">
                        {movie.createdBy.map((c) => (
                          <Link
                            key={c.id}
                            href={`/person/${c.id}`}
                            className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
                          >
                            {c.imageUrl && (
                              <div className="relative h-6 w-6 overflow-hidden rounded-full">
                                <Image src={c.imageUrl} alt="" fill className="object-cover" sizes="24px" />
                              </div>
                            )}
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {directors.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Director{directors.length > 1 ? "s" : ""}</p>
                      <div className="flex flex-wrap gap-2">
                        {directors.map((d) => (
                          <Link
                            key={d.peopleId ?? d.name}
                            href={d.peopleId ? `/person/${d.peopleId}` : "#"}
                            className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
                          >
                            {d.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {writers.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Writers</p>
                      <div className="flex flex-wrap gap-2">
                        {writers.slice(0, 4).map((w) => (
                          <Link
                            key={w.peopleId ?? w.name}
                            href={w.peopleId ? `/person/${w.peopleId}` : "#"}
                            className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
                          >
                            {w.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {(movie.studios ?? []).length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Studios</p>
                      <div className="flex flex-wrap gap-2">
                        {(movie.studios ?? []).slice(0, 4).map((s) => (
                          <span key={s} className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm text-white/55">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(movie.networks ?? []).length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Network</p>
                      <div className="flex flex-wrap gap-2">
                        {(movie.networks ?? []).map((n) => (
                          <span key={n} className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm text-white/55">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* ── Trailers ── */}
            {trailers.length > 0 && (
              <motion.section
                variants={staggerItem}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
              >
                <SectionHeading icon={Play} label="Trailers" />
                <div className="grid gap-2 sm:grid-cols-2">
                  {trailers.map((t) => (
                    <motion.a
                      key={t.url}
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={spring.snappy}
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 transition hover:border-primary/30 hover:bg-primary/6"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 transition group-hover:bg-primary/20">
                        <Play className="h-3.5 w-3.5 fill-primary text-primary" />
                      </div>
                      <span className="line-clamp-1 text-sm font-semibold text-white/65 transition group-hover:text-foreground">
                        {t.name}
                      </span>
                      <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-white/20 transition group-hover:text-primary/60" />
                    </motion.a>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ── Episode tracker (TV) ── */}
            {seriesNumeric != null && (
              <motion.div variants={staggerItem}>
                <div className="mb-5 flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12">
                    <Tv className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.15em] text-foreground/80">Episodes</h2>
                </div>
                <SeriesEpisodeTracker
                  seriesSlug={movie.id}
                  seriesNumericId={seriesNumeric}
                />
              </motion.div>
            )}

            {/* ── Cast ── */}
            {cast.length > 0 && (
              <motion.section
                variants={staggerItem}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
              >
                <SectionHeading icon={Users} label="Cast" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cast.map((c, i) => (
                    <motion.div
                      key={`${c.actorName}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{ delay: Math.min(i, 8) * 0.035, ...spring.smooth }}
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition hover:border-white/12 hover:bg-white/[0.05]"
                    >
                      {/* Avatar */}
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                        {c.imageUrl ? (
                          <Image src={c.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Users className="h-5 w-5 text-white/15" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {c.peopleId ? (
                          <Link
                            href={`/person/${c.peopleId}`}
                            className="block truncate text-sm font-bold text-foreground transition hover:text-primary"
                          >
                            {c.actorName}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-bold text-foreground">{c.actorName}</p>
                        )}
                        <p className="truncate text-xs text-white/35">{c.characterName}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ── Keywords ── */}
            {keywords.length > 0 && (
              <motion.section variants={staggerItem}>
                <div className="mb-3 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-white/25" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">Keywords</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-white/[0.05] bg-white/[0.025] px-2.5 py-1 text-[11px] text-white/30"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
