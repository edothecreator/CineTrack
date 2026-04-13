import { NextResponse } from "next/server";
import { fetchTmdbPerson } from "@/lib/server/tmdb";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  if (!process.env.TMDB_API_READ_TOKEN) {
    return NextResponse.json({ error: "TMDB_API_READ_TOKEN is not configured." }, { status: 503 });
  }

  const { id: raw } = await ctx.params;
  const id = Math.floor(Number(decodeURIComponent(raw)));
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const person = await fetchTmdbPerson(id);
  if (!person) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(person);
}
