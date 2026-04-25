export function MovieCardSkeleton() {
  return (
    <div className="skeleton-shimmer relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/[0.06]">
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded-lg bg-foreground/10" />
        <div className="h-3 w-1/2 rounded-lg bg-foreground/10" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Matches the 12-column bento layout used by DiscoveryBento */
export function SkeletonBento() {
  const PLACEMENT = [
    "col-span-2 sm:col-span-6 sm:row-span-2 sm:col-start-1 sm:row-start-1",
    "col-span-1 sm:col-span-3 sm:col-start-7 sm:row-start-1",
    "col-span-1 sm:col-span-3 sm:col-start-10 sm:row-start-1",
    "col-span-1 sm:col-span-3 sm:col-start-7 sm:row-start-2",
    "col-span-1 sm:col-span-3 sm:col-start-10 sm:row-start-2",
    "col-span-2 sm:col-span-4 sm:col-start-1 sm:row-start-3",
    "col-span-1 sm:col-span-4 sm:col-start-5 sm:row-start-3",
    "col-span-1 sm:col-span-4 sm:col-start-9 sm:row-start-3",
    "col-span-2 sm:col-span-6 sm:col-start-1 sm:row-start-4",
    "col-span-2 sm:col-span-6 sm:col-start-7 sm:row-start-4",
  ];
  return (
    <div className="grid grid-cols-2 grid-flow-dense gap-3 sm:grid-cols-12 sm:gap-4 lg:gap-5">
      {PLACEMENT.map((cls, i) => (
        <div key={i} className={`min-w-0 ${cls}`}>
          <MovieCardSkeleton />
        </div>
      ))}
    </div>
  );
}

/** Hero section skeleton — matches HomeHeroCarousel dimensions */
export function SkeletonHero() {
  return (
    <div className="relative min-h-[min(90vh,900px)] w-full overflow-hidden bg-background">
      <div className="skeleton-shimmer absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      <div className="container relative z-10 flex h-full min-h-[inherit] items-center pt-20">
        <div className="max-w-3xl space-y-8">
          <div className="h-6 w-32 rounded-full bg-white/10" />
          <div className="space-y-3">
            <div className="h-16 w-3/4 rounded-2xl bg-white/10 sm:h-20" />
            <div className="h-16 w-1/2 rounded-2xl bg-white/8 sm:h-20" />
          </div>
          <div className="h-6 w-2/3 rounded-lg bg-white/8" />
          <div className="flex gap-4 pt-2">
            <div className="h-14 w-40 rounded-full bg-white/10" />
            <div className="h-14 w-36 rounded-full bg-white/8" />
          </div>
        </div>
      </div>
    </div>
  );
}
