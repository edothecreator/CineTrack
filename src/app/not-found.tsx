import Link from "next/link";
import { Film } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-xl">
        <Film className="mx-auto h-12 w-12 text-primary" />
      </div>
      <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
        404
      </h1>
      <p className="mt-4 max-w-md text-white/45">
        This page doesn&apos;t exist, or that title isn&apos;t in our catalog right now.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/search"
          className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          Browse
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/[0.08] bg-white/[0.04] px-8 py-3 text-sm font-bold text-foreground transition hover:border-primary/30 hover:bg-white/[0.07]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
