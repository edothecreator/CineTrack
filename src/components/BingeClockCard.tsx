"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatBingeClock } from "@/lib/bingeClock";

type BingeClockCardProps = {
  titleIds: string[];
};

export function BingeClockCard({ titleIds }: BingeClockCardProps) {
  const [minutes, setMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (titleIds.length === 0) {
        setMinutes(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/binge-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: titleIds }),
        });
        const data = (await res.json()) as {
          totalMinutes?: number;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setErr(data.error ?? "Stats unavailable");
          setMinutes(null);
          return;
        }
        setMinutes(
          typeof data.totalMinutes === "number" ? data.totalMinutes : 0,
        );
      } catch {
        if (!cancelled) setErr("Could not reach server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [titleIds]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-8 shadow-xl backdrop-blur-xl">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-white/[0.06]" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive backdrop-blur-xl">
        {err}
      </div>
    );
  }

  const m = minutes ?? 0;
  const { days, hours } = formatBingeClock(m);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-primary/5 p-8 shadow-2xl backdrop-blur-2xl"
    >
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
        <Clock className="h-3.5 w-3.5" />
        Binge clock
      </div>
      <p className="text-lg font-medium text-white/50">
        You&apos;ve spent
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        <span className="text-primary">{days}</span>{" "}
        <span className="text-lg font-bold text-white/45 sm:text-xl">
          Days,
        </span>{" "}
        <span className="text-primary">{hours}</span>{" "}
        <span className="text-lg font-bold text-white/45 sm:text-xl">
          Hours
        </span>{" "}
        <span className="block text-base font-semibold text-white/45 sm:inline sm:text-lg">
          watching.
        </span>
      </p>
      <p className="mt-4 text-xs text-white/30">
        Estimated from TMDB runtimes for titles on your list (movies + full
        series episode totals).
      </p>
    </motion.div>
  );
}
