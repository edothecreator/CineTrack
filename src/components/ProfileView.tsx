"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Camera, CheckCircle2, Clock, Dna, Edit3,
  Film, Flame, ImageIcon, ListVideo, Save, Star, Trophy, User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { BingeClockCard } from "@/components/BingeClockCard";
import { spring, staggerContainer, staggerItem } from "@/lib/motionPresets";

type GenreInsight = { name: string; count: number; weight: number };
type Tab = "overview" | "stats" | "settings";

//  Stat card 
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={`flex flex-col gap-3 rounded-2xl border p-5 backdrop-blur-xl transition ${
        accent
          ? "border-primary/30 bg-primary/8 shadow-[0_0_32px_rgba(232,188,45,0.08)]"
          : "border-white/[0.07] bg-white/[0.025]"
      }`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent ? "bg-primary/20" : "bg-white/[0.06]"}`}>
        <Icon className={`h-4.5 w-4.5 ${accent ? "text-primary" : "text-white/40"}`} />
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight text-foreground">{value}</p>
        <p className="text-xs font-semibold text-white/40">{label}</p>
        {sub && <p className="mt-0.5 text-[10px] text-white/25">{sub}</p>}
      </div>
    </motion.div>
  );
}

//  Recent activity row 
function ActivityRow({ movie, date }: { movie: { id: string; title: string; posterUrl: string }; date: number }) {
  return (
    <Link
      href={`/movie/${encodeURIComponent(movie.id)}`}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 transition hover:border-primary/40 hover:bg-white/[0.04]"
    >
      <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
        <Image src={movie.posterUrl} alt="" fill className="object-cover" sizes="32px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {movie.title}
        </p>
        <p className="text-[10px] text-white/35">
          {new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary/60" />
    </Link>
  );
}

//  Genre bar 
function GenreBar({ genre, weight, max, index }: { genre: GenreInsight; weight: number; max: number; index: number }) {
  return (
    <li>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">{genre.name}</span>
        <span className="tabular-nums text-white/35">{genre.count} titles</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-amber-300"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round((weight / max) * 100)}%` }}
          transition={{ delay: 0.1 + index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </li>
  );
}

//  Main component 
export function ProfileView() {
  const {
    hydrated, currentUser, guestProfile, historyList,
    watchlist, allTrackedTitleIds, trackedEpisodesMap, updateProfile,
  } = useAuth();

  const [tab, setTab] = useState<Tab>("overview");
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [avatarUrlDraft, setAvatarUrlDraft] = useState("");
  const [topGenres, setTopGenres] = useState<GenreInsight[]>([]);
  const [dnaLoading, setDnaLoading] = useState(false);
  const [dnaCompletion, setDnaCompletion] = useState(0);
  const [dnaWatchMinutes, setDnaWatchMinutes] = useState(0);
  const [dnaStreak, setDnaStreak] = useState(0);

  const displayName = currentUser?.username ?? "Guest";
  const avatarUrl = currentUser?.profileAvatarDataUrl ?? guestProfile.avatarDataUrl;
  const bio = currentUser?.profileBio ?? guestProfile.bio;
  const memberSince = currentUser?.memberSince ?? (guestProfile.memberSince > 0 ? guestProfile.memberSince : null);
  const isGuest = !currentUser;

  const backdropMovie = historyList[0] ?? watchlist[0];

  useEffect(() => { setBioDraft(bio); }, [bio]);
  useEffect(() => { setAvatarUrlDraft(avatarUrl ?? ""); }, [avatarUrl]);

  // Fetch DNA stats
  useEffect(() => {
    if (!hydrated || allTrackedTitleIds.length === 0) {
      setTopGenres([]); setDnaCompletion(0); setDnaWatchMinutes(0); setDnaStreak(0);
      return;
    }
    let cancelled = false;
    (async () => {
      setDnaLoading(true);
      try {
        const episodeProgress = Object.entries(trackedEpisodesMap).map(([seriesId, eps]) => ({ seriesId, count: eps.length }));
        const res = await fetch("/api/watching-dna", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: allTrackedTitleIds.slice(0, 24),
            history: historyList.map((h) => ({ id: h.id, completedAt: h.completedAt, runtimeMinutes: h.runtimeMinutes })),
            episodeProgress,
          }),
        });
        const data = (await res.json()) as { topGenres?: GenreInsight[]; completionRate?: number; totalWatchMinutes?: number; bingeStreakDays?: number };
        if (!cancelled) {
          setTopGenres(Array.isArray(data.topGenres) ? data.topGenres : []);
          setDnaCompletion(typeof data.completionRate === "number" ? data.completionRate : 0);
          setDnaWatchMinutes(typeof data.totalWatchMinutes === "number" ? data.totalWatchMinutes : 0);
          setDnaStreak(typeof data.bingeStreakDays === "number" ? data.bingeStreakDays : 0);
        }
      } catch { if (!cancelled) { setTopGenres([]); } }
      finally { if (!cancelled) setDnaLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [hydrated, allTrackedTitleIds, historyList, trackedEpisodesMap]);

  const saveBio = useCallback(() => {
    void updateProfile({ bio: bioDraft.trim() });
    setEditingBio(false);
  }, [bioDraft, updateProfile]);

  const saveAvatarUrl = useCallback(() => {
    const cleaned = avatarUrlDraft.trim();
    void updateProfile({ avatarDataUrl: cleaned.length > 0 ? cleaned : null });
  }, [avatarUrlDraft, updateProfile]);

  const onAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") void updateProfile({ avatarDataUrl: reader.result }); };
    reader.readAsDataURL(file);
  }, [updateProfile]);

  const maxGenreWeight = useMemo(() => Math.max(0.0001, ...topGenres.map((g) => g.weight)), [topGenres]);
  const totalWatchedHours = useMemo(() => Math.round((dnaWatchMinutes / 60) * 10) / 10, [dnaWatchMinutes]);
  const recentActivity = useMemo(() => historyList.slice(0, 8), [historyList]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "stats", label: "Stats & DNA" },
    { id: "settings", label: "Settings" },
  ];

  if (!hydrated) {
    return (
      <div className="container max-w-5xl py-14 space-y-6">
        <div className="skeleton-shimmer h-56 rounded-3xl" />
        <div className="skeleton-shimmer h-32 rounded-3xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="pb-28">

      {/*  Cover / backdrop  */}
      <div className="relative h-48 w-full overflow-hidden sm:h-64 lg:h-72">
        {backdropMovie ? (
          <Image
            src={backdropMovie.posterUrl}
            alt=""
            fill
            className="object-cover opacity-35 blur-xl brightness-50 scale-110"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(232,188,45,0.06),transparent)]" />
      </div>

      <div className="container relative -mt-20 max-w-5xl sm:-mt-24">

        {/*  Identity card  */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05, ...spring.smooth }}
          className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {/* Avatar */}
            <div className="relative shrink-0 self-center sm:self-auto">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-white/[0.08] bg-white/[0.04] shadow-xl ring-2 ring-primary/20 sm:h-32 sm:w-32">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill className="object-cover" sizes="128px" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
                    <User className="h-12 w-12 text-white/20" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/[0.07] bg-[#0f1020] shadow-lg transition hover:border-primary/50 hover:bg-primary/10">
                <Camera className="h-4 w-4 text-foreground" />
                <input type="file" accept="image/*" className="sr-only" onChange={onAvatarChange} />
              </label>
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{displayName}</h1>
                  {memberSince ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/40">
                      <Calendar className="h-3.5 w-3.5 text-primary/70" />
                      Member since {new Date(memberSince).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-white/40">
                      Guest  <Link href="/signup" className="text-primary hover:underline">sign up</Link> to sync across devices
                    </p>
                  )}
                </div>
                {/* Quick stats pills */}
                <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-foreground">
                    <ListVideo className="h-3.5 w-3.5 text-primary" />
                    {watchlist.length} in list
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {historyList.length} watched
                  </span>
                  {dnaStreak > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                      <Flame className="h-3.5 w-3.5" />
                      {dnaStreak}-day streak
                    </span>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mt-4">
                {editingBio ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      rows={3}
                      autoFocus
                      placeholder="What are you into?"
                      className="w-full resize-none rounded-xl border border-primary/40 bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-white/25 outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveBio} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90">
                        <Save className="h-3.5 w-3.5" /> Save
                      </button>
                      <button onClick={() => { setBioDraft(bio); setEditingBio(false); }} className="rounded-lg border border-white/[0.07] px-4 py-2 text-xs font-bold text-white/40 transition hover:text-foreground">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingBio(true)}
                    className="group flex items-start gap-2 text-left"
                  >
                    <p className={`text-sm leading-relaxed ${bio ? "text-white/55" : "italic text-white/25"}`}>
                      {bio || "Add a bio"}
                    </p>
                    <Edit3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20 opacity-0 transition group-hover:opacity-100" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/*  Tabs  */}
        <div className="mb-6 flex gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                tab === t.id
                  ? "bg-white/[0.07] text-foreground"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/*  Tab content  */}
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring.smooth}
              className="space-y-8"
            >
              {/* Stat grid */}
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={CheckCircle2} label="Titles watched" value={historyList.length} accent />
                <StatCard icon={ListVideo} label="In watchlist" value={watchlist.length} />
                <StatCard icon={Clock} label="Hours watched" value={`${totalWatchedHours}h`} sub="incl. episodes" />
                <StatCard icon={Star} label="Completion rate" value={`${(dnaCompletion * 100).toFixed(0)}%`} />
              </motion.div>

              {/* Binge clock */}
              <BingeClockCard titleIds={allTrackedTitleIds} />

              {/* Recent activity */}
              {recentActivity.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-white/35">Recent activity</h2>
                    <Link href="/watched" className="text-xs font-bold text-primary hover:underline">View all</Link>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {recentActivity.map((m) => (
                      <ActivityRow key={`${m.id}-${m.completedAt}`} movie={m} date={m.completedAt} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick links */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { href: "/my-list", icon: ListVideo, label: "My list", count: watchlist.length },
                  { href: "/watched", icon: CheckCircle2, label: "Watched", count: historyList.length },
                  { href: "/pantheon", icon: Trophy, label: "Pantheon", count: null },
                  { href: "/search", icon: Film, label: "Browse", count: null },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] py-5 text-center backdrop-blur-sm transition hover:border-primary/40 hover:bg-white/[0.04]"
                  >
                    <item.icon className="h-5 w-5 text-white/40 transition group-hover:text-primary" />
                    <span className="text-xs font-bold text-foreground">{item.label}</span>
                    {item.count !== null && (
                      <span className="text-[10px] font-semibold text-white/35">{item.count} titles</span>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring.smooth}
              className="space-y-8"
            >
              {/* DNA card */}
              <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-2xl sm:p-8">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                    <Dna className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Watching DNA</h2>
                    <p className="text-xs text-white/40">Your genre fingerprint from TMDB</p>
                  </div>
                </div>

                {/* DNA stat pills */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {[
                    { label: "Completion", value: `${(dnaCompletion * 100).toFixed(0)}%` },
                    { label: "Total hours", value: `${totalWatchedHours}h` },
                    { label: "Binge streak", value: `${dnaStreak} days` },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-center">
                      <p className="text-lg font-black text-foreground">{s.value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">{s.label}</p>
                    </div>
                  ))}
                </div>

                {dnaLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-shimmer h-8 rounded-lg bg-muted/60" />)}
                  </div>
                ) : topGenres.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/[0.07] bg-white/[0.02] py-10 text-center">
                    <p className="text-sm text-white/40">Add titles to your list or history to see your genre DNA.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {topGenres.map((g, i) => (
                      <GenreBar key={g.name} genre={g} weight={g.weight} max={maxGenreWeight} index={i} />
                    ))}
                  </ul>
                )}
              </div>

              {/* Extended stats grid */}
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard icon={Film} label="Movies watched" value={historyList.filter((h) => h.id.startsWith("movie-")).length} />
                <StatCard icon={ListVideo} label="Series tracked" value={historyList.filter((h) => h.id.startsWith("series-")).length} />
                <StatCard icon={Flame} label="Longest streak" value={`${dnaStreak}d`} sub="consecutive days" accent />
              </motion.div>
            </motion.div>
          )}

          {tab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring.smooth}
              className="space-y-6"
            >
              {isGuest && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-5">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">You are browsing as a guest.</p>
                  <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">Your data is stored locally. Sign up to sync across devices.</p>
                  <div className="mt-4 flex gap-3">
                    <Link href="/signup" className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90">Create account</Link>
                    <Link href="/login" className="rounded-lg border border-white/[0.07] px-4 py-2 text-xs font-bold text-foreground transition hover:border-primary/40">Sign in</Link>
                  </div>
                </div>
              )}

              {/* Avatar URL */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Profile picture</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.04]">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="" fill className="object-cover" sizes="64px" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-7 w-7 text-white/25" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/35">Image URL</label>
                    <input
                      value={avatarUrlDraft}
                      onChange={(e) => setAvatarUrlDraft(e.target.value)}
                      onBlur={saveAvatarUrl}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm text-foreground placeholder:text-white/25 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[10px] text-white/30">Or upload a file using the camera icon on your avatar.</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Bio</h3>
                </div>
                <textarea
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  onBlur={saveBio}
                  rows={4}
                  placeholder="Tell the world what you are into"
                  className="w-full resize-y rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-white/25 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="mt-2 text-[10px] text-white/30">Saves automatically when you click away.</p>
              </div>

              {/* Data export */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <h3 className="mb-1 font-bold text-foreground">Export your data</h3>
                <p className="mb-4 text-xs text-white/40">Download your watched history, watchlist, and collections.</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/api/me/export?format=json"
                    download
                    className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-white/60 transition hover:border-primary/30 hover:text-primary"
                  >
                    ↓ JSON
                  </a>
                  <a
                    href="/api/me/export?format=csv"
                    download
                    className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-white/60 transition hover:border-primary/30 hover:text-primary"
                  >
                    ↓ CSV
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
