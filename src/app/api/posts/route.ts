import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { getFeed, createPost } from "@/lib/server/social/postService";
import type { CreatePostInput } from "@/types/post";

// GET /api/posts — feed for authenticated user
export async function GET(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const result = await getFeed(userId, cursor);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

// POST /api/posts — create a post
export async function POST(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const input = body as CreatePostInput;

  // Validate
  if (!input.type || !["MEDIA", "TEXT", "IMAGE"].includes(input.type)) {
    return NextResponse.json({ error: "Invalid post type" }, { status: 400 });
  }
  if (input.type === "TEXT" && !input.text?.trim() && !input.imageUrl) {
    return NextResponse.json({ error: "Post requires text or an image" }, { status: 400 });
  }
  if (input.type === "IMAGE" && !input.imageUrl && !input.text?.trim()) {
    return NextResponse.json({ error: "Post requires text or an image" }, { status: 400 });
  }
  if (input.type === "MEDIA" && !input.tmdbId) {
    return NextResponse.json({ error: "Media posts require a tmdbId" }, { status: 400 });
  }
  if (input.rating != null && (input.rating < 0 || input.rating > 10)) {
    return NextResponse.json({ error: "Rating must be 0–10" }, { status: 400 });
  }

  try {
    const post = await createPost(userId, input);
    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
