"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type PrivateRouteGateProps = {
  children: React.ReactNode;
};

export function PrivateRouteGate({ children }: PrivateRouteGateProps) {
  const { hydrated, currentUser } = useAuth();

  if (!hydrated) {
    return (
      <div className="container py-12 sm:py-16">
        <div className="skeleton-shimmer h-[420px] rounded-3xl border border-white/10 bg-white/5" />
      </div>
    );
  }

  if (currentUser) return <>{children}</>;

  return (
    <section className="container py-10 sm:py-14">
      <div className="relative overflow-hidden rounded-3xl border border-white/10">
        <div className="absolute inset-0 grid grid-cols-3 gap-2 p-2 opacity-45 blur-sm">
          {[
            "https://placehold.co/300x450/1a1a2e/eee?text=Heist",
            "https://placehold.co/300x450/16213e/eee?text=Copenhagen",
            "https://placehold.co/300x450/0f3460/eee?text=Rust+Valley",
            "https://placehold.co/300x450/533483/eee?text=Paper+Moons",
            "https://placehold.co/300x450/e94560/fff?text=Echo",
            "https://placehold.co/300x450/0f172a/e2e8f0?text=Cinema",
          ].map((src, idx) => (
            <div
              key={src}
              className="h-36 rounded-2xl bg-cover bg-center sm:h-48 md:h-56"
              style={{ backgroundImage: `url(${src})`, transform: `rotate(${idx % 2 ? -2 : 2}deg)` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

        <div className="relative flex min-h-[420px] items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.08] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
              Access Restricted
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Private cinema vault
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/70 sm:text-lg">
              This is your private cinema vault. Sign in to start your collection.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex min-w-[160px] items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-lg transition hover:bg-primary/90"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-w-[160px] items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white/15"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
