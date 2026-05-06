"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, UserPlus, Users, Film, ListVideo, Clapperboard, MessageCircle, AtSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import type { NotificationItem } from "@/types/social";
import { spring } from "@/lib/motionPresets";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function NotifIcon({ type }: { type: NotificationItem["type"] }) {
  const cls = "h-3.5 w-3.5";
  switch (type) {
    case "NEW_FOLLOWER":
    case "FOLLOW_BACK":      return <UserPlus className={cls} />;
    case "FRIEND_WATCHED":   return <Film className={cls} />;
    case "FRIEND_ADDED_LIST":return <ListVideo className={cls} />;
    case "SCENE_REACTION":   return <Clapperboard className={cls} />;
    case "SCENE_COMMENT":    return <MessageCircle className={cls} />;
    case "SCENE_MENTION":    return <AtSign className={cls} />;
    default:                 return <Bell className={cls} />;
  }
}

function notifText(n: NotificationItem): string {
  const name = n.actorDisplayName ?? `@${n.actorUsername}`;
  switch (n.type) {
    case "NEW_FOLLOWER":      return `${name} started following you`;
    case "FOLLOW_BACK":       return `${name} followed you back`;
    case "FRIEND_WATCHED":    return `${name} watched ${n.title ?? "something"}`;
    case "FRIEND_ADDED_LIST": return `${name} added ${n.title ?? "something"} to their list`;
    case "SCENE_REACTION":    return `${name} signalled your scene`;
    case "SCENE_COMMENT":     return `${name} resonated on your scene`;
    case "SCENE_MENTION":     return `${name} mentioned you in a scene`;
    default:                  return "New notification";
  }
}

function notifHref(n: NotificationItem): string {
  if (n.type === "SCENE_REACTION" || n.type === "SCENE_COMMENT") return "/feed";
  if (n.tvdbId) return `/movie/${encodeURIComponent(n.tvdbId)}`;
  return `/user/${n.actorUsername}`;
}

function notifAccentColor(type: NotificationItem["type"]): string {
  switch (type) {
    case "SCENE_REACTION": return "bg-primary/15 text-primary";
    case "SCENE_COMMENT":  return "bg-violet-500/15 text-violet-400";
    case "SCENE_MENTION":  return "bg-blue-500/15 text-blue-400";
    case "NEW_FOLLOWER":
    case "FOLLOW_BACK":    return "bg-blue-500/15 text-blue-400";
    default:               return "bg-white/10 text-white/50";
  }
}

export function NotificationBell() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    async function fetchCount() {
      const res = await fetch("/api/me/notifications", { credentials: "include" });
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as { unreadCount: number; items: NotificationItem[] };
      if (!cancelled) { setUnread(data.unreadCount); setItems(data.items); }
    }
    void fetchCount();
    const interval = setInterval(() => void fetchCount(), 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [currentUser]);

  async function handleOpen() {
    if (!currentUser) return;
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      const res = await fetch("/api/me/notifications", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { unreadCount: number; items: NotificationItem[] };
        setItems(data.items);
        setUnread(data.unreadCount);
      }
      setLoading(false);
      if (unread > 0) {
        await fetch("/api/me/notifications", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    }
  }

  if (!currentUser) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => void handleOpen()}
        className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-white/40 transition hover:border-white/15 hover:text-white/70"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={spring.snappy}
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground shadow-[0_0_8px_rgba(245,197,66,0.5)]"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={spring.snappy}
            className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1020]"
            style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <span className="text-xs font-black uppercase tracking-widest text-foreground">Notifications</span>
              <Link
                href="/feed"
                onClick={() => setOpen(false)}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Stream →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-shimmer h-14 rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <CheckCheck className="h-8 w-8 text-white/15" />
                <p className="text-sm text-white/35">All caught up</p>
              </div>
            ) : (
              <ul className="max-h-[360px] overflow-y-auto">
                {items.slice(0, 12).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={notifHref(n)}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 transition hover:bg-white/[0.04] ${!n.read ? "bg-primary/[0.04]" : ""}`}
                    >
                      {/* Avatar + icon badge */}
                      <div className="relative mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                        {n.actorAvatarUrl ? (
                          <Image src={n.actorAvatarUrl} alt="" fill className="object-cover" sizes="32px" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Users className="h-4 w-4 text-white/20" />
                          </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ${notifAccentColor(n.type)}`}>
                          <NotifIcon type={n.type} />
                        </span>
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-snug text-foreground/80">{notifText(n)}</p>
                        <p className="mt-0.5 text-[10px] text-white/30">{timeAgo(n.createdAt)}</p>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
