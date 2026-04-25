"use client";

import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type LibrarySearchProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  count?: number;
  total?: number;
};

export function LibrarySearch({ value, onChange, placeholder = "Search your library…", count, total }: LibrarySearchProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] pl-11 pr-10 text-sm text-foreground placeholder:text-white/20 focus:border-primary/40 focus:outline-none transition"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              type="button" onClick={() => onChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {total !== undefined && (
        <p className="text-xs text-white/30 shrink-0">
          {value ? `${count ?? 0} of ${total}` : `${total} title${total !== 1 ? "s" : ""}`}
        </p>
      )}
    </div>
  );
}
