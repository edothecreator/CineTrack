"use client";

import { motion } from "framer-motion";
import { VIBE_FILTERS, type VibeFilterId } from "@/lib/vibeFilters";

type VibeFilterBarProps = {
  activeId: VibeFilterId | null;
  onChange: (next: VibeFilterId | null) => void;
};

export function VibeFilterBar({ activeId, onChange }: VibeFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onChange(null)}
        className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
          activeId === null
            ? "border-primary bg-primary/15 text-primary"
            : "border-white/[0.07] bg-white/[0.04] text-white/45 hover:border-primary/40 hover:text-foreground"
        }`}
      >
        All vibes
      </motion.button>
      {VIBE_FILTERS.map((v) => (
        <motion.button
          key={v.id}
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange(activeId === v.id ? null : v.id)}
          className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
            activeId === v.id
              ? "border-primary bg-primary/15 text-primary shadow-[0_0_20px_rgba(245,197,24,0.15)]"
              : "border-white/[0.07] bg-white/[0.04] text-foreground/80 backdrop-blur-md hover:border-primary/35"
          }`}
        >
          {v.label}
        </motion.button>
      ))}
    </div>
  );
}
