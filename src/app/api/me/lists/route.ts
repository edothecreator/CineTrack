import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";

// GET /api/me/lists — get all user's lists
export async function GET(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const lists = await prisma.userList.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({ lists: lists.map((l) => ({
    id: l.id,
    name: l.name,
    description: l.description,
    isPublic: l.isPublic,
    itemCount: l._count.items,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  })) });
}

// POST /api/me/lists — create a list
export async function POST(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { name, description, isPublic } = body as { name?: string; description?: string; isPublic?: boolean };
  if (!name?.trim() || name.trim().length > 80) {
    return NextResponse.json({ error: "Name required (max 80 chars)" }, { status: 400 });
  }

  // Max 20 lists per user
  const count = await prisma.userList.count({ where: { userId } });
  if (count >= 20) return NextResponse.json({ error: "Max 20 lists" }, { status: 400 });

  const list = await prisma.userList.create({
    data: { userId, name: name.trim(), description: description?.trim() ?? null, isPublic: isPublic ?? true },
  });

  return NextResponse.json({ id: list.id, name: list.name, description: list.description, isPublic: list.isPublic, itemCount: 0 }, { status: 201 });
}
