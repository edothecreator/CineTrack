import { NextRequest, NextResponse } from "next/server";
import { searchUsers } from "@/lib/server/social/socialService";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 1) {
    return NextResponse.json({ users: [] });
  }
  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20),
  );
  const users = await searchUsers(q, limit);
  return NextResponse.json({ users }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
