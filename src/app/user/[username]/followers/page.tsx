import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { cookies } from "next/headers";
import { getAuthedUserIdFromCookies } from "@/lib/server/auth/sessionServer";
import { getFollowers } from "@/lib/server/social/socialService";
import { FollowButton } from "@/components/FollowButton";
import { prisma } from "@/lib/server/prisma";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return { title: `@${username} followers — CineTrack` };
}

export default async function FollowersPage({ params }: PageProps) {
  const { username } = await params;
  const target = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true, username: true },
  });
  if (!target) notFound();

  const cookieStore = await cookies();
  const viewerUserId = getAuthedUserIdFromCookies(cookieStore) ?? undefined;
  const { users } = await getFollowers(target.id, viewerUserId);

  return (
    <div className="container max-w-2xl py-10">
      <Link href={`/user/${target.username}`} className="mb-6 inline-flex text-xs font-bold uppercase tracking-widest text-primary hover:underline">
        ← @{target.username}
      </Link>
      <h1 className="mb-6 text-2xl font-black tracking-tight">Followers</h1>
      {users.length === 0 ? (
        <p className="text-white/40">No followers yet.</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u: (typeof users)[number]) => (
            <li key={u.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 backdrop-blur-sm">
              <Link href={`/user/${u.username}`} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/[0.07] bg-white/[0.04]">
                {u.profileAvatarDataUrl ? (
                  <Image src={u.profileAvatarDataUrl} alt="" fill className="object-cover" sizes="40px" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Users className="h-5 w-5 text-white/25" />
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/user/${u.username}`} className="font-semibold text-foreground hover:text-primary transition">
                  {u.displayName ?? u.username}
                </Link>
                <p className="text-xs text-white/35">@{u.username} · {u.followersCount} followers</p>
              </div>
              {viewerUserId && viewerUserId !== u.id && (
                <FollowButton username={u.username} initialState={u.isFollowing ? "following" : "not_following"} size="sm" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
