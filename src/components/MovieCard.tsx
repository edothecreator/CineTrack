"use client";

import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Star } from "lucide-react";
import type { MovieSummary } from "@/types/movie";
import { formatReleaseDate } from "@/lib/formatMovie";
import { useHover } from "@/context/HoverContext";
import { spring } from "@/lib/motionPresets";

const POSTER_BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

type MovieCardProps = {
  movie: MovieSummary;
  href?: string;
  trailing?: React.ReactNode;
};

const MAGNET = 10;

export const MovieCard = memo(function MovieCard({ movie, href, trailing }: MovieCardProps) {
  const { setHoveredBackdrop } = useHover();
  const reduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mx = useSpring(x, { stiffness: 280, damping: 22 });
  const my = useSpring(y, { stiffness: 280, damping: 22 });

  const rotateX = useTransform(
    my,
    [-0.5, 0.5],
    reduce ? ["0deg", "0deg"] : ["8deg", "-8deg"],
  );
  const rotateY = useTransform(
    mx,
    [-0.5, 0.5],
    reduce ? ["0deg", "0deg"] : ["-8deg", "8deg"],
  );

  const mxn = useTransform(mx, (v) => v * MAGNET);
  const myn = useTransform(my, (v) => v * MAGNET);
  const lift = useMotionTemplate`translate3d(${mxn}px, ${myn}px, 0)`;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHoveredBackdrop(null);
  };

  const handleMouseEnter = () => setHoveredBackdrop(movie.posterUrl);

  const CardInner = (
    <motion.div
      style={{
        rotateX,
        rotateY,
        x: lift,
        transformStyle: "preserve-3d",
      }}
      whileTap={reduce ? {} : { scale: 0.97 }}
      transition={spring.snappy}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group/card relative flex aspect-[2/3] flex-col justify-end overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/40 shadow-[0_4px_6px_rgba(0,0,0,0.35),0_24px_48px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[2px] transition-[box-shadow] duration-500 group-hover/card:border-primary/25 group-hover/card:shadow-[0_4px_6px_rgba(0,0,0,0.25),0_32px_64px_-16px_rgba(0,0,0,0.65),0_0_0_1px_rgba(232,188,45,0.12),0_0_48px_-8px_rgba(232,188,45,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]"
    >
      {/* Specular sweep — one pass per hover (transform-only) */}
      {!reduce ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-2xl"
          aria-hidden
        >
          <div className="absolute inset-y-0 -left-1/2 w-[80%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-500 ease-out group-hover/card:translate-x-[180%] group-hover/card:opacity-100" />
        </div>
      ) : null}

      <div
        style={{ transform: "translateZ(20px)" }}
        className="absolute inset-0 will-change-transform"
      >
        <Image
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
          fill
          sizes="(max-width: 768px) 42vw, 25vw"
          placeholder="blur"
          blurDataURL={POSTER_BLUR}
          className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.08]"
        />
      </div>
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black via-black/55 to-transparent opacity-95 transition-opacity duration-300 group-hover/card:opacity-100" />
      <div
        style={{ transform: "translateZ(36px)" }}
        className="relative z-[3] flex flex-col p-4 sm:p-5"
      >
        <h2 className="mb-1 line-clamp-2 text-[0.95rem] font-bold leading-snug tracking-tight text-white drop-shadow-md sm:text-lg">
          {movie.title}
        </h2>
        <div className="metadata-condensed flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/70 sm:text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 shadow-[0_0_20px_rgba(232,188,45,0.15)] backdrop-blur-sm">
            <Star className="h-3 w-3 shrink-0 fill-primary text-primary" />
            <span className="text-white">
              {movie.rating != null && Number.isFinite(movie.rating)
                ? movie.rating.toFixed(1)
                : "N/A"}
            </span>
          </span>
          <span className="opacity-35">·</span>
          <span>
            {(() => {
              const d = formatReleaseDate(movie.releaseDate);
              const parts = d.split(" ");
              return parts.length >= 3 ? parts[2] : d;
            })()}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="relative px-0.5 pt-0.5" style={{ perspective: "1200px" }}>
      {href && trailing ? (
        <>
          <Link href={href} className="block w-full">
            {CardInner}
          </Link>
          <div
            className="pointer-events-auto absolute right-2 top-2 z-30 sm:right-3 sm:top-3"
            onClick={(e) => e.stopPropagation()}
          >
            {trailing}
          </div>
        </>
      ) : href ? (
        <Link href={href} className="block w-full">
          {CardInner}
        </Link>
      ) : (
        <>
          {CardInner}
          {trailing ? (
            <div className="absolute right-2 top-2 z-30 sm:right-3 sm:top-3">
              {trailing}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
});

MovieCard.displayName = "MovieCard";
