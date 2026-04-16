import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { isMovieSummaryShape } from "@/lib/movieGuards";
import { getBootstrap, toggleWatchlistItem } from "@/lib/server/me/libraryService";

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
  const movie = rec.movie;
  const action = rec.action;
  if (!isMovieSummaryShape(movie)) {
    return NextResponse.json({ message: "Invalid movie payload" }, { status: 400 });
  }
  if (action !== "add" && action !== "remove") {
    return NextResponse.json(
      { message: "action must be add or remove" },
      { status: 400 },
    );
  }

  const snapshot = await getBootstrap(userId);
  if (!snapshot) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  const inList = snapshot.watchlist.some((m) => m.id === movie.id);

  if (action === "add" && inList) return NextResponse.json(snapshot);
  if (action === "remove" && !inList) return NextResponse.json(snapshot);

  const next = await toggleWatchlistItem(userId, movie, inList);
  if (!next) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(next);
}
