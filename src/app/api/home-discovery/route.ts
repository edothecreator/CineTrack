import { NextRequest, NextResponse } from "next/server";
import type { HomeDiscoveryApiResponse } from "@/lib/homeDiscoveryContract";
import { fetchTmdbHomeRows } from "@/lib/server/tmdb";

export async function GET(req: NextRequest) {
  if (!process.env.TMDB_API_READ_TOKEN) {
    return NextResponse.json(
      { trending: [], popular: [], error: "TMDB_API_READ_TOKEN is not configured." } satisfies HomeDiscoveryApiResponse,
      { status: 503 },
    );
  }

  const genreRaw = req.nextUrl.searchParams.get("genre");
  const genre =
    genreRaw != null && genreRaw.trim() !== ""
      ? Math.floor(Number(genreRaw))
      : undefined;

  if (genre != null && !Number.isFinite(genre)) {
    return NextResponse.json(
      { trending: [], popular: [], error: "Invalid genre parameter." } satisfies HomeDiscoveryApiResponse,
      { status: 400 },
    );
  }

  try {
    const { trending, popular } = await fetchTmdbHomeRows(genre);
    return NextResponse.json(
      { trending, popular } satisfies HomeDiscoveryApiResponse,
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch {
    return NextResponse.json(
      { trending: [], popular: [], error: "Could not load discovery feed." } satisfies HomeDiscoveryApiResponse,
      { status: 502 },
    );
  }
}
