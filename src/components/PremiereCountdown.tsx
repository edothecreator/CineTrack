"use client";

import { CalendarClock } from "lucide-react";
import { useEffect, useState } from "react";

function daysUntil(iso: string): number | null {
  if (!iso?.trim()) return null;
  const t = new Date(iso + (iso.length <= 10 ? "T12:00:00" : "")).getTime();
  if (!Number.isFinite(t)) return null;
  const now = Date.now();
  const diff = t - now;
  if (diff <= 0) return null;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

type PremiereCountdownProps = {
  releaseDate: string;
  className?: string;
};

export function PremiereCountdown({
  releaseDate,
  className = "",
}: PremiereCountdownProps) {
  const [d, setD] = useState<number | null>(null);

  useEffect(() => {
    setD(daysUntil(releaseDate));
    const t = window.setInterval(() => setD(daysUntil(releaseDate)), 60_000);
    return () => window.clearInterval(t);
  }, [releaseDate]);

  if (d == null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-200 ${className}`}
    >
      <CalendarClock className="h-3.5 w-3.5" />
      {d}d to premiere
    </span>
  );
}
