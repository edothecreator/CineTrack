"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type HoverContextType = {
  hoveredBackdrop: string | null;
  setHoveredBackdrop: (backdrop: string | null) => void;
};

const HoverContext = createContext<HoverContextType | undefined>(undefined);

export function HoverProvider({ children }: { children: React.ReactNode }) {
  const [hoveredBackdrop, setHoveredBackdrop] = useState<string | null>(null);

  // Memoize so setHoveredBackdrop (stable ref) doesn't cause all consumers to re-render
  const value = useMemo(
    () => ({ hoveredBackdrop, setHoveredBackdrop }),
    [hoveredBackdrop],
  );

  return (
    <HoverContext.Provider value={value}>{children}</HoverContext.Provider>
  );
}

export function useHover() {
  const context = useContext(HoverContext);
  if (context === undefined) {
    throw new Error("useHover must be used within a HoverProvider");
  }
  return context;
}
