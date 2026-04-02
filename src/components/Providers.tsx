"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { HoverProvider } from "@/context/HoverContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <HoverProvider>
        <AuthProvider>{children}</AuthProvider>
      </HoverProvider>
    </ThemeProvider>
  );
}
