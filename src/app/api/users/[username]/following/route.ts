import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { getFollowing } from "@/lib/server/social/socialService";
import { prisma } from "@/lib/server/prisma";

type Params = { params: Promise<{ username: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { username } = await params;
  const target = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const viewerUserId = getAuthedUserId(req) ?? undefined;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const result = await getFollowing(target.id, viewerUserId, cursor);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
