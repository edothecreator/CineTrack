import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { setEpisodeWatched } from "@/lib/server/me/libraryService";

export async function POST(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const rec = body as Record<string, unknown>;
  const seriesId = rec.seriesId;
  const episodeId = rec.episodeId;
  const watched = rec.watched;

  if (typeof seriesId !== "string" || typeof episodeId !== "string") {
    return NextResponse.json(
      { message: "seriesId and episodeId required" },
      { status: 400 },
    );
  }
  if (typeof watched !== "boolean") {
    return NextResponse.json({ message: "watched boolean required" }, { status: 400 });
  }

  const next = await setEpisodeWatched(userId, seriesId, episodeId, watched);
  if (!next) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(next);
}
