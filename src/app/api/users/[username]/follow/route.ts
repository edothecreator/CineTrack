import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { followUser, unfollowUser, getFollowState } from "@/lib/server/social/socialService";
import { prisma } from "@/lib/server/prisma";

type Params = { params: Promise<{ username: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const viewerId = getAuthedUserId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { username } = await params;
  const target = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let body: { action?: string } = {};
  try { body = (await req.json()) as { action?: string }; } catch { /* ok */ }
  const action = body.action ?? "follow";

  if (action === "unfollow") {
    await unfollowUser(viewerId, target.id);
  } else {
    const result = await followUser(viewerId, target.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  }

  const state = await getFollowState(viewerId, target.id);
  return NextResponse.json({ followState: state });
}
