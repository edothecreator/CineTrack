import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { deleteComment } from "@/lib/server/social/postService";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

// DELETE /api/posts/[id]/comments/[commentId]
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { commentId } = await ctx.params;
  const result = await deleteComment(commentId, userId);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.message === "Not authorized" ? 403 : 404 });
  return NextResponse.json({ ok: true });
}
