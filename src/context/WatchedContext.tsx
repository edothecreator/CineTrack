"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MovieSummary } from "@/types/movie";
import {
  loadWatchedFromStorage,
  saveWatchedToStorage,
} from "@/lib/watchedStorage";

type WatchedContextValue = {
  /** false until client has read localStorage (avoid SSR/client mismatch flash). */
  hydrated: boolean;
  watched: MovieSummary[];
  isWatched: (id: string) => boolean;
  addWatched: (movie: MovieSummary) => void;
  removeWatched: (id: string) => void;
  toggleWatched: (movie: MovieSummary) => void;
};

const WatchedContext = createContext<WatchedContextValue | null>(null);

export function WatchedProvider({ children }: { children: React.ReactNode }) {
  const [watched, setWatched] = useState<MovieSummary[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWatched(loadWatchedFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveWatchedToStorage(watched);
  }, [watched, hydrated]);

  const isWatched = useCallback(
    (id: string) => watched.some((m) => m.id === id),
    [watched],
  );

  const addWatched = useCallback((movie: MovieSummary) => {
    setWatched((prev) => {
      if (prev.some((m) => m.id === movie.id)) return prev;
      return [...prev, movie];
    });
  }, []);

  const removeWatched = useCallback((id: string) => {
    setWatched((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const toggleWatched = useCallback((movie: MovieSummary) => {
    setWatched((prev) => {
      if (prev.some((m) => m.id === movie.id)) {
        return prev.filter((m) => m.id !== movie.id);
      }
      return [...prev, movie];
    });
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      watched,
      isWatched,
      addWatched,
      removeWatched,
      toggleWatched,
    }),
    [hydrated, watched, isWatched, addWatched, removeWatched, toggleWatched],
  );

  return (
    <WatchedContext.Provider value={value}>{children}</WatchedContext.Provider>
  );
}

export function useWatched() {
  const ctx = useContext(WatchedContext);
  if (!ctx) {
    throw new Error("useWatched must be used within WatchedProvider");
  }
  return ctx;
}
