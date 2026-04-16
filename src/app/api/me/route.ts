import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { getBootstrap } from "@/lib/server/me/libraryService";

/** Full session + library for authenticated users. */
export async function GET(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const data = await getBootstrap(userId);
  if (!data) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
