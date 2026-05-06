import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { getNotifications, markNotificationsRead } from "@/lib/server/social/socialService";

export async function GET(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const result = await getNotifications(userId);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  let body: { ids?: string[] } = {};
  try { body = (await req.json()) as { ids?: string[] }; } catch { /* ok */ }
  await markNotificationsRead(userId, body.ids);
  return NextResponse.json({ ok: true });
}
