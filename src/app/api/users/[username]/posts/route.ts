import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { getUserPosts } from "@/lib/server/social/postService";
import { prisma } from "@/lib/server/prisma";

type Ctx = { params: Promise<{ username: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { username } = await ctx.params;
  const viewerUserId = getAuthedUserId(req) ?? undefined;

  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const result = await getUserPosts(user.id, viewerUserId, cursor);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
