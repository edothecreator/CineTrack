"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { PersonPublicDetail } from "@/types/person";

type PersonViewProps = {
  peopleId: number;
};

export function PersonView({ peopleId }: PersonViewProps) {
  const { watchlist, historyList } = useAuth();
  const [data, setData] = useState<PersonPublicDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/person/${peopleId}`);
        const json = (await res.json()) as PersonPublicDetail & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setErr(json.error ?? "Not found");
          setData(null);
          return;
        }
        setData(json as PersonPublicDetail);
      } catch {
        if (!cancelled) setErr("Request failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [peopleId]);

  const watched = new Set([
    ...watchlist.map((m) => m.id),
    ...historyList.map((h) => h.id),
  ]);
  const credits = data?.credits ?? [];
  const overlap = credits.filter((c) => watched.has(c.slug)).length;
  const pct =
    credits.length > 0 ? Math.round((overlap / credits.length) * 100) : 0;

  if (loading) {
    return (
      <div className="container max-w-4xl py-14">
        <div className="flex animate-pulse gap-8">
          <div className="h-40 w-40 rounded-3xl bg-white/[0.06]" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-2/3 rounded bg-white/[0.06]" />
            <div className="h-4 w-full rounded bg-white/[0.06]" />
          </div>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="container max-w-4xl py-20 text-center text-white/40">
        {err ?? "Unavailable"}
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 sm:py-14">
      <Link
        href="/search"
        className="mb-8 inline-flex text-xs font-bold uppercase tracking-widest text-primary hover:underline"
      >
        ← Back to browse
      </Link>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        <div className="relative mx-auto h-44 w-44 shrink-0 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.04] shadow-xl sm:mx-0">
          {data.imageUrl ? (
            <Image
              src={data.imageUrl}
              alt={data.name}
              fill
              className="object-cover"
              sizes="176px"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-6 text-center sm:text-left">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
              Performer
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              {data.name}
            </h1>
          </header>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-bold text-primary shadow-inner backdrop-blur-md"
          >
            You&apos;ve seen {pct}% of catalogued roles on your list (
            {overlap}/{credits.length})
          </motion.div>
          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/35">
              Credits
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {credits.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/movie/${encodeURIComponent(c.slug)}`}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition hover:border-primary/40 ${
                      watched.has(c.slug)
                        ? "border-primary/30 bg-primary/6"
                        : "border-white/[0.07] bg-white/[0.025]"
                    }`}
                  >
                    <span className="font-medium text-foreground">
                      {c.title}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                      {c.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
