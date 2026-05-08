import { NextRequest, NextResponse } from "next/server";
import { fetchTotalBingeMinutesForIds } from "@/lib/server/tmdb";

export type BingeStatsResponse = {
  totalMinutes: number;
  error?: string;
};

export async function POST(req: NextRequest) {
  if (!process.env.TMDB_API_READ_TOKEN) {
    return NextResponse.json(
      { totalMinutes: 0, error: "TMDB_API_READ_TOKEN is not configured." } satisfies BingeStatsResponse,
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { totalMinutes: 0, error: "Invalid JSON." } satisfies BingeStatsResponse,
      { status: 400 },
    );
  }

  const ids =
    body &&
    typeof body === "object" &&
    Array.isArray((body as { ids?: unknown }).ids)
      ? (body as { ids: unknown[] }).ids.filter((x): x is string => typeof x === "string")
      : [];

  if (ids.length > 35) {
    return NextResponse.json(
      { totalMinutes: 0, error: "Too many ids (max 35)." } satisfies BingeStatsResponse,
      { status: 400 },
    );
  }

  try {
    const totalMinutes = await fetchTotalBingeMinutesForIds(ids);
    return NextResponse.json({ totalMinutes } satisfies BingeStatsResponse);
  } catch {
    return NextResponse.json(
      { totalMinutes: 0, error: "Failed to compute stats." } satisfies BingeStatsResponse,
      { status: 502 },
    );
  }
}
