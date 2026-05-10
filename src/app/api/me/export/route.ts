import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: NextRequest) {
  const userId = getAuthedUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const format = (req.nextUrl.searchParams.get("format") ?? "json") as "json" | "csv";

  const [user, watched, watchlist, lists] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { username: true, email: true, memberSince: true } }),
    prisma.watchedTitle.findMany({ where: { userId }, orderBy: { completedAt: "desc" }, select: { tvdbId: true, title: true, userRating: true, completedAt: true, genres: true } }),
    prisma.watchlistItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { tvdbId: true, title: true, createdAt: true } }),
    prisma.userList.findMany({ where: { userId }, include: { items: { select: { tmdbId: true, title: true, addedAt: true } } } }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (format === "csv") {
    const rows = [
      ["type", "id", "title", "userRating", "date", "genres"],
      ...watched.map((w) => [
        "watched", w.tvdbId, `"${w.title.replace(/"/g, '""')}"`,
        w.userRating ?? "", w.completedAt.toISOString().slice(0, 10),
        `"${(w.genres as string[] | null)?.join(", ") ?? ""}"`,
      ]),
      ...watchlist.map((w) => ["watchlist", w.tvdbId, `"${w.title.replace(/"/g, '""')}"`, "", w.createdAt.toISOString().slice(0, 10), ""]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="cinetrack-${user.username}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // JSON export
  const data = {
    exportedAt: new Date().toISOString(),
    user: { username: user.username, email: user.email, memberSince: user.memberSince },
    watched: watched.map((w) => ({
      id: w.tvdbId, title: w.title, userRating: w.userRating,
      watchedAt: w.completedAt.toISOString(), genres: w.genres,
    })),
    watchlist: watchlist.map((w) => ({ id: w.tvdbId, title: w.title, addedAt: w.createdAt.toISOString() })),
    collections: lists.map((l) => ({
      name: l.name, description: l.description, isPublic: l.isPublic,
      items: l.items.map((i) => ({ id: i.tmdbId, title: i.title, addedAt: i.addedAt.toISOString() })),
    })),
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cinetrack-${user.username}-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
