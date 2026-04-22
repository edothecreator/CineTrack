/** Shared motion language — springs feel weighted & tactile (GPU-friendly). */
export const spring = {
  snappy: { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 },
  smooth: { type: "spring" as const, stiffness: 260, damping: 28, mass: 1 },
  float: { type: "spring" as const, stiffness: 180, damping: 22, mass: 1.1 },
  dock: { type: "spring" as const, stiffness: 380, damping: 28, mass: 0.9 },
};

export const sceneTransition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: spring.smooth,
  },
};
