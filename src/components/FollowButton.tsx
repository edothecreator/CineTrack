"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, UserMinus, UserPlus } from "lucide-react";
import type { FollowState } from "@/types/social";
import { spring } from "@/lib/motionPresets";

type FollowButtonProps = {
  username: string;
  initialState: FollowState;
  size?: "sm" | "md";
};

export function FollowButton({ username, initialState, size = "md" }: FollowButtonProps) {
  const [state, setState] = useState<FollowState>(initialState);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    const action = state === "not_following" ? "follow" : "unfollow";
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/follow`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = (await res.json()) as { followState: FollowState };
        setState(data.followState);
      }
    } finally {
      setLoading(false);
    }
  }

  const isFollowing = state !== "not_following";
  const isMutual = state === "mutual";

  const label = isFollowing
    ? hovered
      ? "Unfollow"
      : isMutual
        ? "Mutual"
        : "Following"
    : "Follow";

  const Icon = isFollowing
    ? hovered
      ? UserMinus
      : UserCheck
    : UserPlus;

  const sm = size === "sm";

  return (
    <motion.button
      type="button"
      onClick={() => void toggle()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={loading}
      whileTap={{ scale: 0.97 }}
      transition={spring.snappy}
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider transition-all disabled:opacity-60 ${
        sm ? "px-3 py-1.5 text-[10px]" : "px-5 py-2.5 text-xs"
      } ${
        isFollowing
          ? hovered
            ? "border border-red-400/40 bg-red-500/10 text-red-400"
            : "border border-white/[0.08] bg-white/[0.04] text-foreground"
          : "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(232,188,45,0.25)] hover:bg-primary/90"
      }`}
    >
      <Icon className={sm ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {loading ? "..." : label}
    </motion.button>
  );
}
