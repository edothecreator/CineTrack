"use client";

import { useHover } from "@/context/HoverContext";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

/** Far-field ambient orbs — slow parallax from scroll */
function AmbientField() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y1 = useSpring(useTransform(scrollY, [0, 900], [0, reduce ? 0 : 120]), {
    stiffness: 100,
    damping: 35,
  });
  const y2 = useSpring(useTransform(scrollY, [0, 900], [0, reduce ? 0 : -80]), {
    stiffness: 90,
    damping: 38,
  });

  return (
    <>
      <motion.div
        style={{ y: y1 }}
        className="pointer-events-none absolute -left-[20%] top-[15%] h-[55vmin] w-[55vmin] rounded-full bg-primary/10 blur-[100px]"
        aria-hidden
      />
      <motion.div
        style={{ y: y2 }}
        className="pointer-events-none absolute -right-[15%] top-[40%] h-[45vmin] w-[45vmin] rounded-full bg-indigo-500/10 blur-[90px]"
        aria-hidden
      />
      <motion.div
        style={{ y: y1 }}
        className="pointer-events-none absolute bottom-[5%] left-[30%] h-[35vmin] w-[35vmin] rounded-full bg-fuchsia-500/8 blur-[80px] dark:bg-fuchsia-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
        aria-hidden
      />
    </>
  );
}

export function DynamicBackground() {
  const { hoveredBackdrop } = useHover();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-background" />
      {mounted ? <AmbientField /> : null}
      <AnimatePresence>
        {hoveredBackdrop && (
          <motion.div
            key={hoveredBackdrop}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 0.42, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={hoveredBackdrop}
              alt=""
              fill
              className="object-cover blur-[88px] saturate-[1.2] scale-110"
              priority={false}
            />
            <div className="absolute inset-0 bg-background/55 dark:bg-background/65" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
