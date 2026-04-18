import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { isMovieSummaryShape } from "@/lib/movieGuards";
import {
  markCompleted,
  removeFromHistory,
} from "@/lib/server/me/libraryService";

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
  const action = rec.action;
  if (action === "complete") {
    const movie = rec.movie;
    if (!isMovieSummaryShape(movie)) {
      return NextResponse.json({ message: "Invalid movie" }, { status: 400 });
    }
    const userRating = typeof rec.userRating === "number" ? rec.userRating : null;
    const next = await markCompleted(userId, movie, userRating);
    if (!next) {
      return NextResponse.json({ message: "Update failed" }, { status: 500 });
    }
    return NextResponse.json(next);
  }
  if (action === "remove") {
    const movieId = rec.movieId;
    if (typeof movieId !== "string" || !movieId) {
      return NextResponse.json({ message: "movieId required" }, { status: 400 });
    }
    const next = await removeFromHistory(userId, movieId);
    if (!next) {
      return NextResponse.json({ message: "Update failed" }, { status: 500 });
    }
    return NextResponse.json(next);
  }

  return NextResponse.json(
    { message: "action must be complete or remove" },
    { status: 400 },
  );
}
