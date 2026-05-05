import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { getFollowingFeed } from "@/lib/server/social/socialService";

export async function GET(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const result = await getFollowingFeed(userId, cursor);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
