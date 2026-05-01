"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { spring } from "@/lib/motionPresets";

type TasteMatchBadgeProps = {
  username: string;
  /** Show full card vs compact inline badge */
  variant?: "card" | "inline";
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/8";
  if (score >= 60) return "text-primary border-primary/30 bg-primary/8";
  if (score >= 40) return "text-blue-400 border-blue-500/30 bg-blue-500/8";
  return "text-white/40 border-white/[0.07] bg-white/[0.03]";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Twin taste";
  if (score >= 75) return "Strong match";
  if (score >= 60) return "Good alignment";
  if (score >= 40) return "Some overlap";
  if (score >= 20) return "Different tastes";
  return "No data yet";
}

export function TasteMatchBadge({ username, variant = "inline" }: TasteMatchBadgeProps) {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(username)}/taste-match`, {
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { score: number };
        if (!cancelled) setScore(data.score);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [username]);

  if (loading) {
    return (
      <div className={`skeleton-shimmer rounded-full ${variant === "card" ? "h-20 w-full" : "h-7 w-24"}`} />
    );
  }

  if (score === null) return null;

  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.smooth}
        className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-center ${scoreColor(score)}`}
      >
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">
          🧠 Taste Alignment
        </p>
        {/* Arc progress */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full -rotate-90">
            {/* Track */}
            <circle
              cx="40" cy="40" r="32"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 32}`}
            />
            {/* Fill */}
            <motion.circle
              cx="40" cy="40" r="32"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 32}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - score / 100) }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </svg>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, ...spring.smooth }}
            className="text-2xl font-black tabular-nums"
          >
            {score}%
          </motion.span>
        </div>
        <p className="text-xs font-bold">{scoreLabel(score)}</p>
      </motion.div>
    );
  }

  // Inline badge
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring.snappy}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${scoreColor(score)}`}
      title={`Taste Alignment: ${scoreLabel(score)}`}
    >
      🧠 {score}% match
    </motion.span>
  );
}
