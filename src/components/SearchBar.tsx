"use client";

import { Search, X } from "lucide-react";
import { motion } from "framer-motion";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Search movies, series, anime…",
  id = "movie-search",
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">Search</label>
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-5 h-5 w-5 text-white/30" />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus
          className="h-[3.75rem] w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] pl-14 pr-14 text-[17px] font-medium text-foreground placeholder:text-white/20 backdrop-blur-xl transition-all focus:border-primary/35 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(245,197,66,0.08),0_8px_32px_rgba(0,0,0,0.3)] focus:outline-none"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)" }}
        />
        {value && (
          <motion.button
            type="button"
            onClick={() => onChange("")}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute right-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] text-white/40 transition hover:bg-white/12 hover:text-white/70"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
