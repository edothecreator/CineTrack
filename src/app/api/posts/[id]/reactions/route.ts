import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { toggleReaction } from "@/lib/server/social/postService";
import type { ReactionType } from "@/types/post";

type Ctx = { params: Promise<{ id: string }> };

const VALID_REACTIONS: ReactionType[] = ["love", "haha", "wow", "sad", "fire"];

// POST /api/posts/[id]/reactions — toggle a reaction
export async function POST(req: NextRequest, ctx: Ctx) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: postId } = await ctx.params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const type = (body as { type?: string }).type as ReactionType;
  if (!VALID_REACTIONS.includes(type)) {
    return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
  }

  try {
    const result = await toggleReaction(userId, postId, type);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 });
  }
}
