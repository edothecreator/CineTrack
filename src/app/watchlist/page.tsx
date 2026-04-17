"use client";

export const dynamic = "force-dynamic";

import { WatchlistGrid } from "@/components/WatchedList";
import { PrivateRouteGate } from "@/components/PrivateRouteGate";

export default function WatchlistPage() {
  return (
    <PrivateRouteGate>
      <div className="min-h-screen">
        <div className="page-header">
          <div className="container max-w-5xl">
            <p className="label-overline mb-3">Watchlist</p>
            <h1 className="text-hero text-foreground">My list</h1>
            <p className="text-body mt-3 max-w-md">
              Titles you want to watch. Mark one as done on its page to move it to history.
            </p>
          </div>
        </div>
        <div className="container max-w-5xl py-8 sm:py-10">
          <WatchlistGrid />
        </div>
      </div>
    </PrivateRouteGate>
  );
}
