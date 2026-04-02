"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MovieSummary } from "@/types/movie";
import type { SeriesEpisodeWatchMap } from "@/types/library";
import type { HistoryEntry } from "@/lib/movieGuards";
import type { MeBootstrap } from "@/types/meBootstrap";

export type { SeriesEpisodeWatchMap } from "@/types/library";
export type { HistoryEntry } from "@/lib/movieGuards";

export type CurrentUser = {
  id: string;
  username: string;
  email: string;
  watchlistMovies: string[];
  watchlistSummaries: MovieSummary[];
  historyEntries: HistoryEntry[];
  watchedEpisodesBySeries: SeriesEpisodeWatchMap;
  profileBio: string;
  profileAvatarDataUrl: string | null;
  memberSince: number;
  // Social fields
  displayName: string | null;
  bannerUrl: string | null;
  isPublic: boolean;
  followersCount: number;
  followingCount: number;
};

type GuestProfile = {
  bio: string;
  avatarDataUrl: string | null;
  memberSince: number;
};

type AuthResult =
  | { ok: true }
  | { ok: false; message: string; field?: string };

type ProfilePatch = {
  bio?: string;
  avatarDataUrl?: string | null;
  displayName?: string | null;
  bannerUrl?: string | null;
  isPublic?: boolean;
};

type AuthContextValue = {
  hydrated: boolean;
  currentUser: CurrentUser | null;
  watchlist: MovieSummary[];
  historyList: HistoryEntry[];
  guestProfile: GuestProfile;
  signup: (input: { username: string; email: string; password: string }) => Promise<AuthResult>;
  login: (input: { email: string; password: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  isInWatchlist: (movieId: string) => boolean;
  isInHistory: (movieId: string) => boolean;
  getUserRating: (movieId: string) => number | null;
  toggleWatchlist: (movie: MovieSummary) => Promise<void>;
  markCompleted: (movie: MovieSummary, userRating?: number) => Promise<void>;
  rateTitle: (movieId: string, userRating: number | null) => Promise<void>;
  removeFromHistory: (movieId: string) => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  isEpisodeWatched: (seriesId: string, episodeId: string) => boolean;
  toggleEpisodeWatched: (seriesId: string, episodeId: string) => Promise<void>;
  allTrackedTitleIds: string[];
  trackedEpisodesMap: SeriesEpisodeWatchMap;
};

const GUEST_WATCHLIST_KEY = "movie-tracker-guest-watchlist-v2";
const LEGACY_GUEST_WATCHED_KEY = "movie-tracker-guest-watched-v1";
const GUEST_HISTORY_KEY = "movie-tracker-guest-history-v1";
const GUEST_EPISODES_KEY = "movie-tracker-guest-episodes-v1";
const GUEST_PROFILE_KEY = "movie-tracker-guest-profile-v1";

const JSON_HEADERS = { "Content-Type": "application/json" };

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isMovieSummaryShape(x: unknown): x is MovieSummary {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.posterUrl === "string" &&
    (o.rating === undefined || typeof o.rating === "number") &&
    typeof o.releaseDate === "string"
  );
}

function isHistoryEntryShape(x: unknown): x is HistoryEntry {
  if (!isMovieSummaryShape(x)) return false;
  const o = x as HistoryEntry;
  return typeof o.completedAt === "number" && Number.isFinite(o.completedAt);
}

function normalizeEpisodeMap(raw: unknown): SeriesEpisodeWatchMap {
  if (!raw || typeof raw !== "object") return {};
  const out: SeriesEpisodeWatchMap = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(v)) continue;
    const ids = v.filter((x): x is string => typeof x === "string" && x.length > 0);
    if (ids.length) out[k] = [...new Set(ids)];
  }
  return out;
}

function bootstrapToCurrentUser(b: MeBootstrap): CurrentUser {
  const historyEntries = [...b.history].sort(
    (a, c) => c.completedAt - a.completedAt,
  );
  return {
    id: b.user.id,
    username: b.user.username,
    email: b.user.email,
    watchlistMovies: b.watchlist.map((m) => m.id),
    watchlistSummaries: b.watchlist,
    historyEntries,
    watchedEpisodesBySeries: b.episodes,
    profileBio: b.user.profileBio,
    profileAvatarDataUrl: b.user.profileAvatarDataUrl,
    memberSince: new Date(b.user.memberSince).getTime(),
    displayName: b.user.displayName,
    bannerUrl: b.user.bannerUrl,
    isPublic: b.user.isPublic,
    followersCount: b.user.followersCount,
    followingCount: b.user.followingCount,
  };
}

async function fetchBootstrap(): Promise<MeBootstrap | null> {
  const res = await fetch("/api/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return (await res.json()) as MeBootstrap;
}

function readGuestWatchlist(): MovieSummary[] {
  if (typeof window === "undefined") return [];
  try {
    let raw = window.localStorage.getItem(GUEST_WATCHLIST_KEY);
    if (!raw) raw = window.localStorage.getItem(LEGACY_GUEST_WATCHED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMovieSummaryShape);
  } catch {
    return [];
  }
}

function writeGuestWatchlist(items: MovieSummary[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_WATCHLIST_KEY, JSON.stringify(items));
  } catch {
    /* quota */
  }
}

function readGuestHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntryShape);
  } catch {
    return [];
  }
}

function writeGuestHistory(entries: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* quota */
  }
}

function readGuestEpisodes(): SeriesEpisodeWatchMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GUEST_EPISODES_KEY);
    if (!raw) return {};
    return normalizeEpisodeMap(JSON.parse(raw) as unknown);
  } catch {
    return {};
  }
}

function writeGuestEpisodes(map: SeriesEpisodeWatchMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_EPISODES_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

function readGuestProfile(): GuestProfile {
  if (typeof window === "undefined") {
    return { bio: "", avatarDataUrl: null, memberSince: 0 };
  }
  try {
    const raw = window.localStorage.getItem(GUEST_PROFILE_KEY);
    if (!raw) {
      return { bio: "", avatarDataUrl: null, memberSince: 0 };
    }
    const p = JSON.parse(raw) as Partial<GuestProfile>;
    return {
      bio: typeof p.bio === "string" ? p.bio : "",
      avatarDataUrl:
        typeof p.avatarDataUrl === "string" || p.avatarDataUrl === null
          ? p.avatarDataUrl
          : null,
      memberSince: typeof p.memberSince === "number" ? p.memberSince : 0,
    };
  } catch {
    return { bio: "", avatarDataUrl: null, memberSince: Date.now() };
  }
}

function writeGuestProfile(p: GuestProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* quota */
  }
}

function clearGuestWatchlist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_WATCHLIST_KEY);
    window.localStorage.removeItem(LEGACY_GUEST_WATCHED_KEY);
  } catch {
    /* ignore */
  }
}

function clearGuestHistoryStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

function clearGuestEpisodes() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_EPISODES_KEY);
  } catch {
    /* ignore */
  }
}

function readGuestMergePayload() {
  const watchlist = readGuestWatchlist();
  const history = readGuestHistory();
  const episodes = readGuestEpisodes();
  const has =
    watchlist.length > 0 ||
    history.length > 0 ||
    Object.keys(episodes).length > 0;
  return { watchlist, history, episodes, has };
}

async function mergeGuestToServer() {
  const { watchlist, history, episodes, has } = readGuestMergePayload();
  if (!has) return;
  const res = await fetch("/api/me/merge-guest", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify({ watchlist, history, episodes }),
  });
  if (!res.ok) return;
  clearGuestWatchlist();
  clearGuestHistoryStorage();
  clearGuestEpisodes();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [guestWatchlist, setGuestWatchlist] = useState<MovieSummary[]>([]);
  const [guestHistory, setGuestHistory] = useState<HistoryEntry[]>([]);
  const [guestEpisodes, setGuestEpisodes] = useState<SeriesEpisodeWatchMap>({});
  const [guestProfile, setGuestProfile] = useState<GuestProfile>(() => ({
    bio: "",
    avatarDataUrl: null,
    memberSince: 0,
  }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchBootstrap();
      if (cancelled) return;
      if (me) {
        setCurrentUser(bootstrapToCurrentUser(me));
        setGuestWatchlist([]);
        setGuestHistory([]);
        setGuestEpisodes({});
      } else {
        setCurrentUser(null);
        setGuestWatchlist(readGuestWatchlist());
        setGuestHistory(
          readGuestHistory().sort((a, b) => b.completedAt - a.completedAt),
        );
        setGuestEpisodes(readGuestEpisodes());
      }
      setGuestProfile(readGuestProfile());
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const watchlist = currentUser?.watchlistSummaries ?? guestWatchlist;
  const historyList = currentUser?.historyEntries ?? guestHistory;

  const trackedEpisodesMap = useMemo(
    () => currentUser?.watchedEpisodesBySeries ?? guestEpisodes,
    [currentUser, guestEpisodes],
  );

  const allTrackedTitleIds = useMemo(() => {
    const s = new Set<string>();
    for (const m of watchlist) s.add(m.id);
    for (const h of historyList) s.add(h.id);
    return [...s];
  }, [watchlist, historyList]);

  const applyBootstrap = useCallback((b: MeBootstrap | null) => {
    if (b) setCurrentUser(bootstrapToCurrentUser(b));
  }, []);

  const isInWatchlist = useCallback(
    (movieId: string) => {
      if (currentUser)
        return currentUser.watchlistMovies.includes(movieId);
      return guestWatchlist.some((m) => m.id === movieId);
    },
    [currentUser, guestWatchlist],
  );

  const isInHistory = useCallback(
    (movieId: string) => {
      if (currentUser)
        return currentUser.historyEntries.some((h) => h.id === movieId);
      return guestHistory.some((h) => h.id === movieId);
    },
    [currentUser, guestHistory],
  );

  const getUserRating = useCallback(
    (movieId: string): number | null => {
      if (currentUser) {
        const entry = currentUser.historyEntries.find((h) => h.id === movieId);
        return entry?.userRating ?? null;
      }
      const entry = guestHistory.find((h) => h.id === movieId);
      return entry?.userRating ?? null;
    },
    [currentUser, guestHistory],
  );

  const signup = useCallback(
    async (input: { username: string; email: string; password: string }) => {
      const username = input.username.trim();
      const email = normalizeEmail(input.email);
      const password = input.password;

      if (username.length < 2 || username.length > 64) {
        return {
          ok: false,
          message: "Username must be 2-64 characters",
          field: "username",
        } as const;
      }
      if (!isValidEmail(email)) {
        return { ok: false, message: "Email format is invalid", field: "email" } as const;
      }
      if (!password || password.length < 8) {
        return {
          ok: false,
          message: "Password must be at least 8 characters",
          field: "password",
        } as const;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ username, email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!res.ok) {
        return {
          ok: false,
          message: data.message ?? "Registration failed",
        } as const;
      }

      await mergeGuestToServer();
      const me = await fetchBootstrap();
      if (me) {
        setCurrentUser(bootstrapToCurrentUser(me));
        setGuestWatchlist([]);
        setGuestHistory([]);
        setGuestEpisodes({});
      }

      return { ok: true } as const;
    },
    [],
  );

  const login = useCallback(async (input: { email: string; password: string }) => {
    const email = normalizeEmail(input.email);
    const password = input.password;

    if (!isValidEmail(email)) {
      return { ok: false, message: "Email format is invalid", field: "email" } as const;
    }
    if (!password) {
      return { ok: false, message: "Password cannot be empty", field: "password" } as const;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      return {
        ok: false,
        message: data.message ?? "Invalid email or password",
      } as const;
    }

    await mergeGuestToServer();
    const me = await fetchBootstrap();
    if (me) {
      setCurrentUser(bootstrapToCurrentUser(me));
      setGuestWatchlist([]);
      setGuestHistory([]);
      setGuestEpisodes({});
    }

    return { ok: true } as const;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setCurrentUser(null);
    setGuestWatchlist(readGuestWatchlist());
    setGuestHistory(
      readGuestHistory().sort((a, b) => b.completedAt - a.completedAt),
    );
    setGuestEpisodes(readGuestEpisodes());
    setGuestProfile(readGuestProfile());
  }, []);

  const toggleWatchlist = useCallback(
    async (movie: MovieSummary) => {
      if (!currentUser) {
        const id = movie.id;
        const list = readGuestWatchlist();
        const exists = list.some((m) => m.id === id);
        const next = exists ? list.filter((m) => m.id !== id) : [...list, movie];
        writeGuestWatchlist(next);
        setGuestWatchlist(next);
        return;
      }

      const inList = currentUser.watchlistMovies.includes(movie.id);
      const res = await fetch("/api/me/watchlist", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          action: inList ? "remove" : "add",
          movie,
        }),
      });
      if (res.ok) {
        const b = (await res.json()) as MeBootstrap;
        applyBootstrap(b);
      }
    },
    [currentUser, applyBootstrap],
  );

  const markCompleted = useCallback(
    async (movie: MovieSummary, userRating?: number) => {
      const entry: HistoryEntry = { ...movie, completedAt: Date.now(), userRating };
      if (!currentUser) {
        const id = movie.id;
        const wl = readGuestWatchlist().filter((m) => m.id !== id);
        writeGuestWatchlist(wl);
        setGuestWatchlist(wl);
        const hist = readGuestHistory().filter((h) => h.id !== id);
        const nextHist = [entry, ...hist].sort(
          (a, b) => b.completedAt - a.completedAt,
        );
        writeGuestHistory(nextHist);
        setGuestHistory(nextHist);
        return;
      }

      const res = await fetch("/api/me/history", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ action: "complete", movie, userRating: userRating ?? null }),
      });
      if (res.ok) {
        const b = (await res.json()) as MeBootstrap;
        applyBootstrap(b);
      }
    },
    [currentUser, applyBootstrap],
  );

  const removeFromHistory = useCallback(
    async (movieId: string) => {
      if (!currentUser) {
        const hist = readGuestHistory().filter((h) => h.id !== movieId);
        writeGuestHistory(hist);
        setGuestHistory(hist);
        return;
      }
      const res = await fetch("/api/me/history", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ action: "remove", movieId }),
      });
      if (res.ok) {
        const b = (await res.json()) as MeBootstrap;
        applyBootstrap(b);
      }
    },
    [currentUser, applyBootstrap],
  );

  const rateTitle = useCallback(
    async (movieId: string, userRating: number | null) => {
      if (!currentUser) {
        // Guest: update in localStorage
        const hist = readGuestHistory().map((h) =>
          h.id === movieId ? { ...h, userRating: userRating ?? undefined } : h
        );
        writeGuestHistory(hist);
        setGuestHistory(hist);
        return;
      }
      const res = await fetch("/api/me/rate", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ tvdbId: movieId, userRating }),
      });
      if (res.ok) {
        const b = (await res.json()) as MeBootstrap;
        applyBootstrap(b);
      }
    },
    [currentUser, applyBootstrap],
  );

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!currentUser) {
        const cur = readGuestProfile();
        const next: GuestProfile = {
          bio: patch.bio !== undefined ? patch.bio : cur.bio,
          avatarDataUrl:
            patch.avatarDataUrl !== undefined
              ? patch.avatarDataUrl
              : cur.avatarDataUrl,
          memberSince: cur.memberSince || Date.now(),
        };
        writeGuestProfile(next);
        setGuestProfile(next);
        return;
      }

      const body: Record<string, unknown> = {};
      if (patch.bio !== undefined) body.bio = patch.bio;
      if (patch.avatarDataUrl !== undefined) body.avatarDataUrl = patch.avatarDataUrl;
      if (patch.displayName !== undefined) body.displayName = patch.displayName;
      if (patch.bannerUrl !== undefined) body.bannerUrl = patch.bannerUrl;
      if (patch.isPublic !== undefined) body.isPublic = patch.isPublic;

      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const b = (await res.json()) as MeBootstrap;
        applyBootstrap(b);
      }
    },
    [currentUser, applyBootstrap],
  );

  const isEpisodeWatched = useCallback(
    (seriesId: string, episodeId: string) => {
      const map = currentUser?.watchedEpisodesBySeries ?? guestEpisodes;
      return (map[seriesId] ?? []).includes(episodeId);
    },
    [currentUser, guestEpisodes],
  );

  const toggleEpisodeWatched = useCallback(
    async (seriesId: string, episodeId: string) => {
      if (!currentUser) {
        const prev = readGuestEpisodes();
        const cur = new Set(prev[seriesId] ?? []);
        if (cur.has(episodeId)) cur.delete(episodeId);
        else cur.add(episodeId);
        const next: SeriesEpisodeWatchMap = { ...prev };
        if (cur.size === 0) delete next[seriesId];
        else next[seriesId] = [...cur];
        writeGuestEpisodes(next);
        setGuestEpisodes(next);
        return;
      }

      const curOn = (currentUser.watchedEpisodesBySeries[seriesId] ?? []).includes(
        episodeId,
      );
      const res = await fetch("/api/me/episodes", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          seriesId,
          episodeId,
          watched: !curOn,
        }),
      });
      if (res.ok) {
        const b = (await res.json()) as MeBootstrap;
        applyBootstrap(b);
      }
    },
    [currentUser, applyBootstrap],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      hydrated,
      currentUser,
      watchlist,
      historyList,
      guestProfile,
      signup,
      login,
      logout,
      isInWatchlist,
      isInHistory,
      getUserRating,
      toggleWatchlist,
      markCompleted,
      rateTitle,
      removeFromHistory,
      updateProfile,
      isEpisodeWatched,
      toggleEpisodeWatched,
      allTrackedTitleIds,
      trackedEpisodesMap,
    }),
    [
      hydrated,
      currentUser,
      watchlist,
      historyList,
      guestProfile,
      signup,
      login,
      logout,
      isInWatchlist,
      isInHistory,
      getUserRating,
      toggleWatchlist,
      markCompleted,
      rateTitle,
      removeFromHistory,
      updateProfile,
      isEpisodeWatched,
      toggleEpisodeWatched,
      allTrackedTitleIds,
      trackedEpisodesMap,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
