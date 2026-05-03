import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { getPost, deletePost } from "@/lib/server/social/postService";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/posts/[id] — single post with comments
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const userId = getAuthedUserId(req) ?? undefined;
  const post = await getPost(id, userId);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

// DELETE /api/posts/[id]
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await ctx.params;
  const result = await deletePost(id, userId);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.message === "Not authorized" ? 403 : 404 });
  return NextResponse.json({ ok: true });
}
