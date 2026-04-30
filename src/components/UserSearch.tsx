"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import type { PublicProfile } from "@/types/social";
import { spring } from "@/lib/motionPresets";

type UserResult = Pick<PublicProfile, "id" | "username" | "displayName" | "profileAvatarDataUrl" | "followersCount">;

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const genRef = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setOpen(false); return; }

    const gen = ++genRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=8`);
        if (!res.ok || gen !== genRef.current) return;
        const data = (await res.json()) as { users: UserResult[] };
        if (gen !== genRef.current) return;
        setResults(data.users);
        setOpen(data.users.length > 0);
      } finally {
        if (gen === genRef.current) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/30" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search users…"
          autoComplete="off"
          className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] pl-10 pr-9 text-sm text-foreground placeholder:text-white/25 outline-none transition focus:border-primary/60 focus:bg-white/[0.06] focus:ring-1 focus:ring-primary/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            className="absolute right-3 text-white/30 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={spring.snappy}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1020]/95 shadow-2xl backdrop-blur-2xl"
          >
            {loading ? (
              <div className="space-y-2 p-3">
                {[1, 2].map((i) => <div key={i} className="skeleton-shimmer h-12 rounded-xl" />)}
              </div>
            ) : (
              <ul>
                {results.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/user/${u.username}`}
                      onClick={() => { setOpen(false); setQuery(""); }}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.04]"
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/[0.07] bg-white/[0.04]">
                        {u.profileAvatarDataUrl ? (
                          <Image src={u.profileAvatarDataUrl} alt="" fill className="object-cover" sizes="36px" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Users className="h-4 w-4 text-white/25" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {u.displayName ?? u.username}
                        </p>
                        <p className="text-[10px] text-white/35">
                          @{u.username} · {u.followersCount} followers
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
                <li className="border-t border-white/[0.05]">
                  <Link
                    href={`/users?q=${encodeURIComponent(query)}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/5"
                  >
                    <Search className="h-3.5 w-3.5" />
                    See all results for &ldquo;{query}&rdquo;
                  </Link>
                </li>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
