import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export type TitleStatsResponse = {
  tmdbId: string;
  watchedCount: number;
  inListCount: number;
  avgUserRating: number | null;
  ratingCount: number;
  recentSceneCount: number;
};

export async function GET(req: NextRequest) {
  const tmdbId = req.nextUrl.searchParams.get("id")?.trim();
  if (!tmdbId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const [watchedAgg, inListCount, ratingAgg, recentSceneCount] = await Promise.all([
    // How many users have watched this title
    prisma.watchedTitle.count({ where: { tvdbId: tmdbId } }),
    // How many have it in their list
    prisma.watchlistItem.count({ where: { tvdbId: tmdbId } }),
    // Average user rating (only non-null ratings)
    prisma.watchedTitle.aggregate({
      where: { tvdbId: tmdbId, userRating: { not: null } },
      _avg: { userRating: true },
      _count: { userRating: true },
    }),
    // Scenes (posts) about this title in last 30 days
    prisma.post.count({
      where: {
        tmdbId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const stats: TitleStatsResponse = {
    tmdbId,
    watchedCount: watchedAgg,
    inListCount,
    avgUserRating: ratingAgg._avg.userRating != null
      ? Math.round(ratingAgg._avg.userRating * 10) / 10
      : null,
    ratingCount: ratingAgg._count.userRating,
    recentSceneCount,
  };

  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
