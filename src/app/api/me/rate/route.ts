import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { rateTitle } from "@/lib/server/me/libraryService";

export async function POST(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }

  const rec = body as Record<string, unknown>;
  const tvdbId = rec.tvdbId;
  const userRating = rec.userRating;

  if (typeof tvdbId !== "string" || !tvdbId) {
    return NextResponse.json({ message: "tvdbId required" }, { status: 400 });
  }
  if (userRating !== null && (typeof userRating !== "number" || userRating < 0 || userRating > 10)) {
    return NextResponse.json({ message: "userRating must be 0–10 or null" }, { status: 400 });
  }

  const next = await rateTitle(userId, tvdbId, userRating as number | null);
  if (!next) return NextResponse.json({ message: "Title not in history" }, { status: 404 });
  return NextResponse.json(next);
}
