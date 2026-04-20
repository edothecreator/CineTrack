"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { MovieCard } from "@/components/MovieCard";
import type { MovieSummary } from "@/types/movie";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

const itemVar = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 28 },
  },
};

/** 12-column grid placement (sm+); mobile uses 2-column dense flow. */
const CELL = "min-w-0";

const PLACEMENT = [
  `${CELL} col-span-2 sm:col-span-6 sm:row-span-2 sm:col-start-1 sm:row-start-1`,
  `${CELL} col-span-1 sm:col-span-3 sm:col-start-7 sm:row-start-1`,
  `${CELL} col-span-1 sm:col-span-3 sm:col-start-10 sm:row-start-1`,
  `${CELL} col-span-1 sm:col-span-3 sm:col-start-7 sm:row-start-2`,
  `${CELL} col-span-1 sm:col-span-3 sm:col-start-10 sm:row-start-2`,
  `${CELL} col-span-2 sm:col-span-4 sm:col-start-1 sm:row-start-3`,
  `${CELL} col-span-1 sm:col-span-4 sm:col-start-5 sm:row-start-3`,
  `${CELL} col-span-1 sm:col-span-4 sm:col-start-9 sm:row-start-3`,
  `${CELL} col-span-2 sm:col-span-6 sm:col-start-1 sm:row-start-4`,
  `${CELL} col-span-2 sm:col-span-6 sm:col-start-7 sm:row-start-4`,
];

type DiscoveryBentoProps = {
  movies: MovieSummary[];
};

export const DiscoveryBento = memo(function DiscoveryBento({ movies }: DiscoveryBentoProps) {
  const list = movies.slice(0, 10);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      key={list.map((m) => m.id).join("|")}
      className="grid grid-cols-2 grid-flow-dense gap-3 sm:grid-cols-12 sm:gap-4 lg:gap-5"
    >
      {list.map((movie, i) => (
        <motion.div
          key={movie.id}
          variants={itemVar}
          className={PLACEMENT[i] ?? `${CELL} col-span-2 sm:col-span-3`}
        >
          <div className="h-full w-full">
            <MovieCard
              movie={movie}
              href={`/movie/${encodeURIComponent(movie.id)}`}
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
});

DiscoveryBento.displayName = "DiscoveryBento";
