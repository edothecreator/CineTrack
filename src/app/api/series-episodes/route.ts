import { NextRequest, NextResponse } from "next/server";
import { fetchTmdbEpisodes } from "@/lib/server/tmdb";

export async function GET(req: NextRequest) {
  if (!process.env.TMDB_API_READ_TOKEN) {
    return NextResponse.json(
      { episodes: [], error: "TMDB_API_READ_TOKEN is not configured." },
      { status: 503 },
    );
  }

  const raw = req.nextUrl.searchParams.get("seriesId")?.trim() ?? "";
  const num = Math.floor(Number(raw));
  if (!Number.isFinite(num) || num <= 0) {
    return NextResponse.json(
      { episodes: [], error: "seriesId must be a positive integer." },
      { status: 400 },
    );
  }

  try {
    const episodes = await fetchTmdbEpisodes(num);
    return NextResponse.json({ episodes });
  } catch {
    return NextResponse.json(
      { episodes: [], error: "Failed to load episodes." },
      { status: 502 },
    );
  }
}
