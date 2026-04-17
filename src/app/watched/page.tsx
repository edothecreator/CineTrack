"use client";

export const dynamic = "force-dynamic";

import { HistoryList } from "@/components/HistoryList";
import { PrivateRouteGate } from "@/components/PrivateRouteGate";

export default function WatchedPage() {
  return (
    <PrivateRouteGate>
      <div className="min-h-screen">
        <div className="page-header">
          <div className="container max-w-5xl">
            <p className="label-overline mb-3">History</p>
            <h1 className="text-hero text-foreground">Watched</h1>
            <p className="text-body mt-3 max-w-md">
              Everything you have marked as done.
            </p>
          </div>
        </div>
        <div className="container max-w-5xl py-8 sm:py-10">
          <HistoryList />
        </div>
      </div>
    </PrivateRouteGate>
  );
}
