"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { spring } from "@/lib/motionPresets";

type StarRatingProps = {
  value: number | null;
  onChange: (rating: number | null) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
};

const SIZES = {
  sm: { star: "h-4 w-4", gap: "gap-0.5", text: "text-xs" },
  md: { star: "h-6 w-6", gap: "gap-1",   text: "text-sm" },
  lg: { star: "h-8 w-8", gap: "gap-1.5", text: "text-base" },
};

export function StarRating({ value, onChange, size = "md", readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const s = SIZES[size];
  const display = hovered ?? value;

  return (
    <div className={`flex items-center ${s.gap}`} role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
        const filled = display != null && star <= display;
        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            whileHover={readonly ? {} : { scale: 1.2 }}
            whileTap={readonly ? {} : { scale: 0.9 }}
            transition={spring.snappy}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(null)}
            onClick={() => {
              if (readonly) return;
              // Click same star = clear rating
              onChange(value === star ? null : star);
            }}
            className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`${s.star} transition-all duration-150 ${
                filled
                  ? "fill-primary text-primary drop-shadow-[0_0_6px_rgba(245,197,66,0.5)]"
                  : "fill-white/10 text-white/20"
              }`}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.button>
        );
      })}
      {display != null && (
        <span className={`ml-1.5 font-black tabular-nums text-primary ${s.text}`}>
          {display}/10
        </span>
      )}
    </div>
  );
}
