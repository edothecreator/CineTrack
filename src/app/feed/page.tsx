"use client";

export const dynamic = "force-dynamic";

import { motion, AnimatePresence } from "framer-motion";
import { Users, Flame, Globe2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PrivateRouteGate } from "@/components/PrivateRouteGate";
import { PostComposer } from "@/components/PostComposer";
import { PostCard } from "@/components/PostCard";
import type { PostItem } from "@/types/post";
import { staggerContainer, staggerItem, spring } from "@/lib/motionPresets";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

type StreamTab = "following" | "trending" | "recent";

const TABS: { id: StreamTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "following", label: "Following", icon: Users,  desc: "Scenes from people you follow" },
  { id: "trending",  label: "Trending",  icon: Flame,  desc: "Most signalled scenes this week" },
  { id: "recent",    label: "Global",    icon: Globe2, desc: "Latest scenes from everyone" },
];

function SceneSkeletons() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="skeleton-shimmer h-40 rounded-2xl" />)}
    </div>
  );
}

function EmptyState({ tab }: { tab: StreamTab }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
      {tab === "following" ? (
        <>
          <Users className="h-12 w-12 text-white/15" />
          <p className="font-bold text-foreground">Your stream is empty</p>
          <p className="text-sm text-white/40">Follow people or drop your first scene above.</p>
          <Link href="/search" className="mt-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90">Browse titles</Link>
        </>
      ) : (
        <>
          <Globe2 className="h-12 w-12 text-white/15" />
          <p className="font-bold text-foreground">No scenes yet</p>
          <p className="text-sm text-white/40">Be the first to drop one.</p>
        </>
      )}
    </div>
  );
}

function FeedContent() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<StreamTab>("following");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = useCallback(async (activeTab: StreamTab) => {
    setLoading(true);
    setPosts([]);
    setCursor(null);
    setHasMore(false);
    try {
      const url =
        activeTab === "trending" ? "/api/posts/global?sort=trending" :
        activeTab === "recent"   ? "/api/posts/global?sort=recent" :
        "/api/posts";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: PostItem[]; nextCursor: string | null };
      setPosts(data.items);
      setCursor(data.nextCursor);
      setHasMore(Boolean(data.nextCursor));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "following" && !currentUser) { setTab("recent"); return; }
    void loadPosts(tab);
  }, [tab, currentUser, loadPosts]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const url =
        tab === "recent" ? `/api/posts/global?sort=recent&cursor=${cursor}` :
        `/api/posts?cursor=${cursor}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: PostItem[]; nextCursor: string | null };
      setPosts((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(Boolean(data.nextCursor));
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, tab]);

  // Infinite scroll
  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loadingMore && !loading);

  return (
    <div className="space-y-5">
      {currentUser && (
        <PostComposer
          onPost={(post) => setPosts((prev) => [post, ...prev])}
          avatarUrl={currentUser.profileAvatarDataUrl}
        />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          if (id === "following" && !currentUser) return null;
          const active = tab === id;
          return (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${active ? "text-foreground" : "text-white/35 hover:text-white/60"}`}>
              {active && (
                <motion.span layoutId="stream-tab"
                  className="absolute inset-0 rounded-full bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  transition={spring.dock} />
              )}
              <Icon className="relative h-3.5 w-3.5" />
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-white/25">{TABS.find((t) => t.id === tab)?.desc}</p>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SceneSkeletons />
          </motion.div>
        ) : posts.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState tab={tab} />
          </motion.div>
        ) : (
          <motion.div key={tab} variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-5 sm:space-y-6">
            {posts.map((post) => (
              <motion.div key={post.id} variants={staggerItem}>
                <PostCard post={post} viewerUserId={currentUser?.id}
                  onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <PrivateRouteGate>
      <div className="min-h-screen">
        <div className="page-header">
          <div className="container max-w-2xl">
            <p className="label-overline mb-3">Social</p>
            <h1 className="text-hero text-foreground">Stream</h1>
            <p className="text-body mt-3">Scenes, signals, and resonance.</p>
          </div>
        </div>
        <div className="container max-w-2xl py-8 sm:py-10">
          <FeedContent />
        </div>
      </div>
    </PrivateRouteGate>
  );
}
