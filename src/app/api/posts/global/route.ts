import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { getGlobalFeed } from "@/lib/server/social/postService";

// GET /api/posts/global — trending scenes from all users
export async function GET(req: NextRequest) {
  const viewerUserId = getAuthedUserId(req) ?? undefined;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const sort = (req.nextUrl.searchParams.get("sort") ?? "recent") as "recent" | "trending";

  const result = await getGlobalFeed(viewerUserId, cursor, sort);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
