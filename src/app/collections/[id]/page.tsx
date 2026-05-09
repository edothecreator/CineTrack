"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Globe2, Lock, Edit3, Check, X } from "lucide-react";
import { PrivateRouteGate } from "@/components/PrivateRouteGate";
import { staggerContainer, staggerItem } from "@/lib/motionPresets";

type ListDetail = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  items: { id: string; tmdbId: string; title: string; posterUrl: string; addedAt: string }[];
};

function CollectionDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/me/lists/${id}`, { credentials: "include" });
      if (!res.ok) { router.replace("/collections"); return; }
      const data = (await res.json()) as ListDetail;
      setList(data);
      setNameDraft(data.name);
      setDescDraft(data.description ?? "");
      setLoading(false);
    })();
  }, [id, router]);

  async function saveEdit() {
    if (!list) return;
    const res = await fetch(`/api/me/lists/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameDraft.trim(), description: descDraft.trim() || null }),
    });
    if (res.ok) {
      setList((prev) => prev ? { ...prev, name: nameDraft.trim(), description: descDraft.trim() || null } : prev);
      setEditing(false);
    }
  }

  async function removeItem(tmdbId: string) {
    await fetch(`/api/me/lists/${id}/items`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", tmdbId }),
    });
    setList((prev) => prev ? { ...prev, items: prev.items.filter((i) => i.tmdbId !== tmdbId) } : prev);
  }

  if (loading) return (
    <div className="container max-w-4xl py-16 space-y-4">
      <div className="skeleton-shimmer h-10 w-48 rounded-xl" />
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
        {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton-shimmer aspect-[2/3] rounded-xl" />)}
      </div>
    </div>
  );

  if (!list) return null;

  return (
    <div className="min-h-screen pb-24">
      <div className="relative overflow-hidden border-b border-white/[0.06] pb-10 pt-16 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(245,197,66,0.06),transparent)]" />
        <div className="container relative max-w-4xl">
          <Link href="/collections" className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/30 transition hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Collections
          </Link>

          {editing ? (
            <div className="space-y-3">
              <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={80}
                className="w-full rounded-xl border border-primary/40 bg-white/[0.04] px-4 py-3 text-2xl font-black text-foreground focus:outline-none" />
              <textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)} rows={2} maxLength={200}
                className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm text-foreground placeholder:text-white/25 focus:outline-none" />
              <div className="flex gap-2">
                <button type="button" onClick={() => void saveEdit()}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground">
                  <Check className="h-3.5 w-3.5" /> Save
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="rounded-full border border-white/[0.07] px-4 py-2 text-xs font-bold text-white/40 hover:text-white/70">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {list.isPublic ? <Globe2 className="h-4 w-4 text-white/25" /> : <Lock className="h-4 w-4 text-white/25" />}
                  <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">{list.name}</h1>
                </div>
                {list.description && <p className="mt-2 text-base text-white/45">{list.description}</p>}
                <p className="mt-2 text-xs text-white/25">{list.items.length} title{list.items.length !== 1 ? "s" : ""}</p>
              </div>
              <button type="button" onClick={() => setEditing(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/40 transition hover:border-primary/30 hover:text-primary">
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container max-w-4xl py-10">
        {list.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
            <p className="font-bold text-foreground">Empty collection</p>
            <p className="text-sm text-white/40">Add titles from their detail pages.</p>
            <Link href="/search" className="mt-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">Browse</Link>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show"
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            <AnimatePresence mode="popLayout">
              {list.items.map((item) => (
                <motion.div key={item.id} variants={staggerItem} layout
                  exit={{ opacity: 0, scale: 0.9 }} className="group relative">
                  <Link href={`/movie/${encodeURIComponent(item.tmdbId)}`}>
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/[0.07]">
                      <Image src={item.posterUrl} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="160px" />
                    </div>
                    <p className="mt-1.5 truncate px-0.5 text-xs font-bold text-white/60">{item.title}</p>
                  </Link>
                  <button type="button" onClick={() => void removeItem(item.tmdbId)}
                    className="absolute right-1 top-1 hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/50 transition hover:border-red-500/30 hover:text-red-400 group-hover:flex">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function CollectionDetailPage() {
  return <PrivateRouteGate><CollectionDetailContent /></PrivateRouteGate>;
}
