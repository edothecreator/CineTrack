import { NextRequest, NextResponse } from "next/server";
import { fetchTmdbPantheonPage } from "@/lib/server/tmdb";

export async function GET(req: NextRequest) {
  if (!process.env.TMDB_API_READ_TOKEN) {
    return NextResponse.json(
      { items: [], nextPage: null, error: "TMDB_API_READ_TOKEN is not configured." },
      { status: 503 },
    );
  }

  const raw = req.nextUrl.searchParams.get("page") ?? "0";
  const page = Math.max(0, Math.floor(Number(raw)) || 0);

  try {
    const { items, nextPage } = await fetchTmdbPantheonPage(page);
    return NextResponse.json({ items, nextPage, page }, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
    });
  } catch {
    return NextResponse.json(
      { items: [], nextPage: null, error: "Failed to load Pantheon." },
      { status: 502 },
    );
  }
}
