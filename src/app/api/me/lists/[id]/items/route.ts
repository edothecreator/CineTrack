import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/me/lists/[id]/items — add or remove a title
export async function POST(req: NextRequest, { params }: Ctx) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: listId } = await params;
  const list = await prisma.userList.findUnique({ where: { id: listId } });
  if (!list || list.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { action, tmdbId, title, posterUrl } = body as {
    action: "add" | "remove";
    tmdbId?: string;
    title?: string;
    posterUrl?: string;
  };

  if (!tmdbId) return NextResponse.json({ error: "tmdbId required" }, { status: 400 });

  if (action === "add") {
    if (!title || !posterUrl) return NextResponse.json({ error: "title and posterUrl required" }, { status: 400 });
    // Max 500 items per list
    const count = await prisma.userListItem.count({ where: { listId } });
    if (count >= 500) return NextResponse.json({ error: "Max 500 items per list" }, { status: 400 });

    await prisma.userListItem.upsert({
      where: { listId_tmdbId: { listId, tmdbId } },
      create: { listId, tmdbId, title, posterUrl },
      update: { title, posterUrl },
    });
    // Touch updatedAt on list
    await prisma.userList.update({ where: { id: listId }, data: { updatedAt: new Date() } });
    return NextResponse.json({ ok: true, action: "added" });
  }

  if (action === "remove") {
    await prisma.userListItem.deleteMany({ where: { listId, tmdbId } });
    return NextResponse.json({ ok: true, action: "removed" });
  }

  return NextResponse.json({ error: "action must be add or remove" }, { status: 400 });
}
