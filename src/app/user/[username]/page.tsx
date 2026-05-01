import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Film, ListVideo, Lock, Users } from "lucide-react";
import { cookies } from "next/headers";
import { getAuthedUserIdFromCookies } from "@/lib/server/auth/sessionServer";
import { getPublicProfile } from "@/lib/server/social/socialService";
import { FollowButton } from "@/components/FollowButton";
import { MovieCard } from "@/components/MovieCard";
import { TasteMatchBadge } from "@/components/TasteMatchBadge";
import type { FollowState } from "@/types/social";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) return { title: `@${username} — CineTrack` };

  const displayName = profile.displayName ?? profile.username;
  const description = profile.profileBio
    ? `${profile.profileBio.slice(0, 120)} · ${profile.watchedCount ?? 0} titles watched`
    : `${profile.watchedCount ?? 0} titles watched · ${profile.followersCount} followers`;
  const image = profile.profileAvatarDataUrl ?? undefined;

  return {
    title: `${displayName} (@${profile.username}) — CineTrack`,
    description,
    openGraph: {
      title: `${displayName} on CineTrack`,
      description,
      ...(image ? { images: [{ url: image, width: 400, height: 400, alt: displayName }] } : {}),
      type: "profile",
    },
    twitter: {
      card: image ? "summary" : "summary",
      title: `${displayName} on CineTrack`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const cookieStore = await cookies();
  const viewerUserId = getAuthedUserIdFromCookies(cookieStore) ?? undefined;

  const profile = await getPublicProfile(username, viewerUserId);
  if (!profile) notFound();

  const followState: FollowState = profile.isFollowing
    ? profile.isMutual
      ? "mutual"
      : "following"
    : "not_following";

  const isOwnProfile = viewerUserId === profile.id;
  const canSeeLibrary = profile.isPublic || profile.isFollowing || isOwnProfile;

  return (
    <div className="min-h-screen pb-24">
      {/* Banner */}
      <div className="relative h-44 w-full overflow-hidden sm:h-56">
        {profile.bannerUrl ? (
          <Image src={profile.bannerUrl} alt="" fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(232,188,45,0.05),transparent)]" />
      </div>

      <div className="container relative -mt-16 max-w-4xl sm:-mt-20">
        {/* Identity */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-background bg-white/[0.04] shadow-xl ring-2 ring-primary/15 sm:h-28 sm:w-28">
              {profile.profileAvatarDataUrl ? (
                <Image src={profile.profileAvatarDataUrl} alt="" fill className="object-cover" sizes="112px" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
                  <Users className="h-10 w-10 text-white/20" />
                </div>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {profile.displayName ?? profile.username}
              </h1>
              <p className="text-sm text-white/40">@{profile.username}</p>
            </div>
          </div>

          {!isOwnProfile && viewerUserId && (
            <div className="flex flex-wrap items-center gap-3">
              <TasteMatchBadge username={profile.username} variant="inline" />
              <FollowButton username={profile.username} initialState={followState} />
            </div>
          )}
          {isOwnProfile && (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-xs font-bold text-foreground transition hover:border-primary/40"
            >
              Edit profile
            </Link>
          )}
        </div>

        {/* Bio + stats + taste match */}
        <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl sm:p-6"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
          >
            {profile.profileBio && (
              <p className="mb-4 text-sm leading-relaxed text-white/55">{profile.profileBio}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href={`/user/${profile.username}/followers`} className="flex items-center gap-1.5 text-foreground hover:text-primary transition">
                <span className="font-black">{profile.followersCount}</span>
                <span className="text-white/40">followers</span>
              </Link>
              <Link href={`/user/${profile.username}/following`} className="flex items-center gap-1.5 text-foreground hover:text-primary transition">
                <span className="font-black">{profile.followingCount}</span>
                <span className="text-white/40">following</span>
              </Link>
              {profile.watchedCount !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Film className="h-4 w-4 text-primary/70" />
                  <span className="font-black">{profile.watchedCount}</span>
                  <span className="text-white/40">watched</span>
                </span>
              )}
              {profile.watchlistCount !== undefined && (
                <span className="flex items-center gap-1.5">
                  <ListVideo className="h-4 w-4 text-primary/70" />
                  <span className="font-black">{profile.watchlistCount}</span>
                  <span className="text-white/40">in list</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 text-white/30">
                <Calendar className="h-4 w-4" />
                Joined {new Date(profile.memberSince).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Taste Match card — only for other users when logged in */}
          {!isOwnProfile && viewerUserId && (
            <div className="w-full lg:w-44">
              <TasteMatchBadge username={profile.username} variant="card" />
            </div>
          )}
        </div>

        {/* Library */}
        {!canSeeLibrary ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/[0.07] bg-white/[0.02] py-16 text-center">
            <Lock className="h-8 w-8 text-white/20" />
            <p className="font-semibold text-foreground">Private profile</p>
            <p className="text-sm text-white/40">Follow {profile.displayName ?? profile.username} to see their library.</p>
          </div>
        ) : profile.recentWatched && profile.recentWatched.length > 0 ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/35">Recently watched</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {profile.recentWatched.map((m) => (
                <MovieCard key={m.id} movie={m} href={`/movie/${encodeURIComponent(m.id)}`} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.07] bg-white/[0.02] py-12 text-center">
            <p className="text-sm text-white/40">No watched titles yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
