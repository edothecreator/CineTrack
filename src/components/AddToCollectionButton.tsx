"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderPlus, Check, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { spring } from "@/lib/motionPresets";
import Link from "next/link";

type UserList = { id: string; name: string; itemCount: number };

type AddToCollectionButtonProps = {
  tmdbId: string;
  title: string;
  posterUrl: string;
};

export function AddToCollectionButton({ tmdbId, title, posterUrl }: AddToCollectionButtonProps) {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<UserList[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentUser) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/me/lists", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { lists: UserList[] }) => { if (!cancelled) setLists(d.lists); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, currentUser]);

  if (!currentUser) return null;

  async function toggle(listId: string) {
    const isAdded = added.has(listId);
    const action = isAdded ? "remove" : "add";
    const res = await fetch(`/api/me/lists/${listId}/items`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, tmdbId, title, posterUrl }),
    });
    if (res.ok) {
      setAdded((prev) => {
        const next = new Set(prev);
        if (isAdded) next.delete(listId); else next.add(listId);
        return next;
      });
    }
  }

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={spring.snappy}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.04] px-5 py-2.5 text-sm font-bold text-white/60 transition hover:border-primary/40 hover:bg-primary/8 hover:text-primary"
      >
        <FolderPlus className="h-4 w-4" />
        Add to Collection
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={spring.snappy}
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1020]"
              style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)" }}
            >
              <div className="border-b border-white/[0.06] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Your collections</p>
              </div>

              {loading ? (
                <div className="space-y-2 p-3">
                  {[1, 2].map((i) => <div key={i} className="skeleton-shimmer h-10 rounded-xl" />)}
                </div>
              ) : lists.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-xs text-white/35">No collections yet.</p>
                  <Link href="/collections" onClick={() => setOpen(false)}
                    className="mt-2 inline-flex text-xs font-bold text-primary hover:underline">
                    Create one →
                  </Link>
                </div>
              ) : (
                <ul className="max-h-52 overflow-y-auto p-2">
                  {lists.map((l) => {
                    const isAdded = added.has(l.id);
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => void toggle(l.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                            isAdded ? "bg-primary/10 text-primary" : "text-white/60 hover:bg-white/[0.05] hover:text-foreground"
                          }`}
                        >
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${isAdded ? "border-primary/50 bg-primary/20" : "border-white/[0.07]"}`}>
                            {isAdded && <Check className="h-3 w-3" />}
                          </div>
                          <span className="flex-1 truncate font-semibold">{l.name}</span>
                          <span className="text-[10px] text-white/25">{l.itemCount}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="border-t border-white/[0.06] px-4 py-3">
                <Link href="/collections" onClick={() => setOpen(false)}
                  className="text-[10px] font-bold text-primary hover:underline">
                  Manage collections →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
