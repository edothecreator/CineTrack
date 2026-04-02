"use client";

import type { ReactNode } from "react";

type AuthPageLayoutProps = {
  children: ReactNode;
};

/**
 * Full-viewport cinematic backdrop and centered column for sign-in / sign-up.
 */
export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-10 pt-24 sm:px-6 sm:pb-12 sm:pt-[5.5rem]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[#050508]" />
        <div className="absolute -left-[20%] -top-[10%] h-[min(90vw,640px)] w-[min(90vw,640px)] rounded-full bg-amber-500/25 blur-[100px]" />
        <div className="absolute -bottom-[15%] -right-[15%] h-[min(85vw,560px)] w-[min(85vw,560px)] rounded-full bg-violet-600/20 blur-[110px]" />
        <div className="absolute left-1/2 top-[35%] h-[min(70vw,420px)] w-[min(140vw,900px)] -translate-x-1/2 rounded-full bg-sky-900/35 blur-[95px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.35),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(180,100,40,0.12),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-[#050508]/80" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md space-y-8 text-foreground">
        {children}
      </div>
    </div>
  );
}
