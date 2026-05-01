import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { computeTasteMatch } from "@/lib/server/social/tasteMatch";

type Ctx = { params: Promise<{ username: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const viewerUserId = getAuthedUserId(req);
  if (!viewerUserId) {
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

  const score = await computeTasteMatch(viewerUserId, target.id);

  return NextResponse.json({ score }, {
    headers: { "Cache-Control": "private, s-maxage=300, stale-while-revalidate=600" },
  });
}
