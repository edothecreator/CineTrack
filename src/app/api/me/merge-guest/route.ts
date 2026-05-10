import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/server/auth/session";
import {
  isHistoryEntryShape,
  isMovieSummaryShape,
} from "@/lib/movieGuards";
import type { SeriesEpisodeWatchMap } from "@/types/library";
import { getBootstrap, mergeGuestData } from "@/lib/server/me/libraryService";

function normalizeEpisodeMap(raw: unknown): SeriesEpisodeWatchMap {
  if (!raw || typeof raw !== "object") return {};
  const out: SeriesEpisodeWatchMap = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(v)) continue;
    const ids = v.filter((x): x is string => typeof x === "string" && x.length > 0);
    if (ids.length) out[k] = [...new Set(ids)];
  }
  return out;
}

export async function POST(req: NextRequest) {
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
  const wlRaw = rec.watchlist;
  const histRaw = rec.history;
  const epRaw = rec.episodes;

  const watchlist = Array.isArray(wlRaw)
    ? wlRaw.filter(isMovieSummaryShape)
    : [];
  const history = Array.isArray(histRaw)
    ? histRaw.filter(isHistoryEntryShape)
    : [];
  const episodes = normalizeEpisodeMap(epRaw);

  if (
    watchlist.length === 0 &&
    history.length === 0 &&
    Object.keys(episodes).length === 0
  ) {
    const snap = await getBootstrap(userId);
    if (!snap) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json(snap);
  }

  const next = await mergeGuestData(userId, {
    watchlist,
    history,
    episodes,
  });
  if (!next) {
    return NextResponse.json({ message: "Merge failed" }, { status: 500 });
  }
  return NextResponse.json(next);
}
