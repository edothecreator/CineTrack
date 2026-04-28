import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { patchProfile } from "@/lib/server/me/libraryService";

export async function PATCH(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const rec = body as Record<string, unknown>;
  const patch: Parameters<typeof patchProfile>[1] = {};
  if (typeof rec.bio === "string") patch.profileBio = rec.bio.slice(0, 500);
  if (rec.avatarDataUrl === null) patch.profileAvatar = null;
  else if (typeof rec.avatarDataUrl === "string") patch.profileAvatar = rec.avatarDataUrl;
  if (typeof rec.displayName === "string") patch.displayName = rec.displayName.slice(0, 64) || null;
  else if (rec.displayName === null) patch.displayName = null;
  if (typeof rec.bannerUrl === "string") patch.bannerUrl = rec.bannerUrl || null;
  else if (rec.bannerUrl === null) patch.bannerUrl = null;
  if (typeof rec.isPublic === "boolean") patch.isPublic = rec.isPublic;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { message: "No valid profile fields" },
      { status: 400 },
    );
  }

  const next = await patchProfile(userId, patch);
  if (!next) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(next);
}
