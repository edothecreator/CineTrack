"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { sceneTransition } from "@/lib/motionPresets";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, y: 20, scale: 1.012, filter: "blur(10px)" }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: reduce ? "none" : "blur(0px)",
        }}
        exit={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, y: -18, scale: 0.992, filter: "blur(8px)" }
        }
        transition={reduce ? { duration: 0.2 } : { ...sceneTransition }}
        style={{ transformOrigin: "50% 12%" }}
        className="min-h-0 flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
