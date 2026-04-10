import { NextRequest, NextResponse } from "next/server";
import type { SearchMovieApiResponse } from "@/lib/searchMovieContract";
import { getTmdbBrowseDefaults, searchTmdb } from "@/lib/server/tmdb";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!process.env.TMDB_API_READ_TOKEN) {
    const body: SearchMovieApiResponse = {
      movies: [],
      error: "TMDB_API_READ_TOKEN is not configured.",
    };
    return NextResponse.json(body, { status: 503 });
  }

  try {
    if (!q) {
      const movies = await getTmdbBrowseDefaults();
      return NextResponse.json({ movies } satisfies SearchMovieApiResponse, {
        headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
      });
    }

    const movies = await searchTmdb(q);
    return NextResponse.json({ movies } satisfies SearchMovieApiResponse, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json(
      { movies: [], error: "Search failed. Try again later." } satisfies SearchMovieApiResponse,
      { status: 502 },
    );
  }
}
