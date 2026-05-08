"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Bookmark, Star, Clapperboard } from "lucide-react";
import type { TitleStatsResponse } from "@/app/api/title-stats/route";
import { spring } from "@/lib/motionPresets";

type TitleCommunityStatsProps = {
  tmdbId: string;
};

function StatBubble({
  icon: Icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ...spring.smooth }}
      className={`flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-center ${
        accent
          ? "border-primary/25 bg-primary/8"
          : "border-white/[0.06] bg-white/[0.03]"
      }`}
    >
      <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-white/30"}`} />
      <p className={`text-lg font-black tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{label}</p>
    </motion.div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function TitleCommunityStats({ tmdbId }: TitleCommunityStatsProps) {
  const [stats, setStats] = useState<TitleStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/title-stats?id=${encodeURIComponent(tmdbId)}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as TitleStatsResponse;
        if (!cancelled) setStats(data);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [tmdbId]);

  // Don't render if no community data at all
  if (!loading && stats && stats.watchedCount === 0 && stats.inListCount === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="h-px flex-1 bg-white/[0.05]" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">
          CineTrack community
        </span>
        <div className="h-px flex-1 bg-white/[0.05]" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatBubble
          icon={Eye}
          label="Watched"
          value={formatCount(stats.watchedCount)}
          delay={0}
        />
        <StatBubble
          icon={Bookmark}
          label="In lists"
          value={formatCount(stats.inListCount)}
          delay={0.05}
        />
        <StatBubble
          icon={Star}
          label={stats.ratingCount > 0 ? `${stats.ratingCount} ratings` : "Avg rating"}
          value={stats.avgUserRating != null ? `${stats.avgUserRating}/10` : "—"}
          accent={stats.avgUserRating != null}
          delay={0.1}
        />
        <StatBubble
          icon={Clapperboard}
          label="Scenes (30d)"
          value={formatCount(stats.recentSceneCount)}
          delay={0.15}
        />
      </div>
    </div>
  );
}
