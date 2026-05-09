import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/me/lists/[id] — list with items
export async function GET(req: NextRequest, { params }: Ctx) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const list = await prisma.userList.findUnique({
    where: { id },
    include: { items: { orderBy: { addedAt: "desc" } } },
  });

  if (!list || list.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: list.id, name: list.name, description: list.description,
    isPublic: list.isPublic,
    items: list.items.map((i) => ({ id: i.id, tmdbId: i.tmdbId, title: i.title, posterUrl: i.posterUrl, addedAt: i.addedAt.toISOString() })),
  });
}

// PATCH /api/me/lists/[id] — rename / update
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const list = await prisma.userList.findUnique({ where: { id } });
  if (!list || list.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { name, description, isPublic } = body as { name?: string; description?: string; isPublic?: boolean };
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim().slice(0, 80);
  if (description !== undefined) data.description = description?.trim() ?? null;
  if (isPublic !== undefined) data.isPublic = isPublic;

  const updated = await prisma.userList.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id, name: updated.name, description: updated.description, isPublic: updated.isPublic });
}

// DELETE /api/me/lists/[id]
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const list = await prisma.userList.findUnique({ where: { id } });
  if (!list || list.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.userList.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
