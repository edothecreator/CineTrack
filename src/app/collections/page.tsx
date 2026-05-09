"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, FolderOpen, Lock, Globe2, X, Check } from "lucide-react";
import Link from "next/link";
import { PrivateRouteGate } from "@/components/PrivateRouteGate";
import { spring, staggerContainer, staggerItem } from "@/lib/motionPresets";

type UserList = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
  updatedAt: string;
};

function CreateListModal({ onClose, onCreate }: { onClose: () => void; onCreate: (list: UserList) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/me/lists", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, isPublic }),
      });
      const data = (await res.json()) as UserList & { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      onCreate({ ...data, itemCount: 0, updatedAt: new Date().toISOString() });
      onClose();
    } catch { setError("Network error"); }
    finally { setSubmitting(false); }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={spring.smooth}
        className="fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[81] mx-auto max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1020]"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <p className="font-black text-foreground">New Collection</p>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white/70"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-5">
          <input
            autoFocus value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Collection name…" maxLength={80}
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-white/25 focus:border-primary/40 focus:outline-none"
          />
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)" rows={2} maxLength={200}
            className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-white/25 focus:border-primary/40 focus:outline-none"
          />
          <button type="button" onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${isPublic ? "border-primary/30 bg-primary/8 text-primary" : "border-white/[0.07] bg-white/[0.04] text-white/40"}`}>
            {isPublic ? <Globe2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {isPublic ? "Public" : "Private"}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.07] py-2.5 text-sm font-bold text-white/40 hover:text-white/70">Cancel</button>
            <button type="button" onClick={() => void handleCreate()} disabled={!name.trim() || submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-black text-primary-foreground disabled:opacity-30">
              <Check className="h-4 w-4" />
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function ListCard({ list, onDelete }: { list: UserList; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Delete "${list.name}"?`)) return;
    setDeleting(true);
    await fetch(`/api/me/lists/${list.id}`, { method: "DELETE", credentials: "include" });
    onDelete(list.id);
  }

  return (
    <motion.div variants={staggerItem} className="group relative">
      <Link href={`/collections/${list.id}`}
        className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-primary/30 hover:bg-white/[0.04]"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 shrink-0 text-primary/60" />
            <p className="font-bold text-foreground line-clamp-1">{list.name}</p>
          </div>
          {list.isPublic
            ? <Globe2 className="h-3.5 w-3.5 shrink-0 text-white/20" />
            : <Lock className="h-3.5 w-3.5 shrink-0 text-white/20" />}
        </div>
        {list.description && <p className="text-xs text-white/40 line-clamp-2">{list.description}</p>}
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
          {list.itemCount} title{list.itemCount !== 1 ? "s" : ""}
        </p>
      </Link>
      <button type="button" onClick={(e) => void handleDelete(e)} disabled={deleting}
        className="absolute right-3 top-3 hidden h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] bg-black/60 text-white/30 transition hover:border-red-500/30 hover:text-red-400 group-hover:flex disabled:opacity-30">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

function CollectionsContent() {
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me/lists", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { lists: UserList[] };
        setLists(data.lists);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-white/[0.06] pb-10 pt-16 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(245,197,66,0.07),transparent)]" />
        <div className="container relative max-w-4xl flex items-end justify-between gap-4">
          <div>
            <p className="label-overline mb-3">Library</p>
            <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">Collections</h1>
            <p className="mt-3 text-base text-white/45">Your named lists — curate, share, obsess.</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground shadow-[0_0_16px_rgba(245,197,66,0.3)] transition hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </div>

      <div className="container max-w-4xl py-10">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map((i) => <div key={i} className="skeleton-shimmer h-32 rounded-2xl" />)}
          </div>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
            <FolderOpen className="h-12 w-12 text-white/15" />
            <p className="font-bold text-foreground">No collections yet</p>
            <p className="text-sm text-white/40">Create your first named list.</p>
            <button type="button" onClick={() => setShowCreate(true)}
              className="mt-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">
              Create collection
            </button>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((l) => (
              <ListCard key={l.id} list={l} onDelete={(id) => setLists((prev) => prev.filter((x) => x.id !== id))} />
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateListModal
            onClose={() => setShowCreate(false)}
            onCreate={(l) => setLists((prev) => [l, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CollectionsPage() {
  return <PrivateRouteGate><CollectionsContent /></PrivateRouteGate>;
}
