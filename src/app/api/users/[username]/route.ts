import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { getPublicProfile } from "@/lib/server/social/socialService";

type Params = { params: Promise<{ username: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { username } = await params;
  if (!username?.trim()) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }
  const viewerUserId = getAuthedUserId(req) ?? undefined;
  const profile = await getPublicProfile(username.trim(), viewerUserId);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(profile, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
