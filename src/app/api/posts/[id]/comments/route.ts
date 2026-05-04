import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { addComment } from "@/lib/server/social/postService";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/posts/[id]/comments — add a comment
export async function POST(req: NextRequest, ctx: Ctx) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: postId } = await ctx.params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { content, parentId } = body as { content?: string; parentId?: string };
  if (!content?.trim()) {
    return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
  }
  if (content.length > 1000) {
    return NextResponse.json({ error: "Comment too long (max 1000 chars)" }, { status: 400 });
  }

  try {
    const comment = await addComment(userId, postId, content.trim(), parentId);
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add comment";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
