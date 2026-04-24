"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { spring } from "@/lib/motionPresets";

export function UserNav() {
  const router = useRouter();
  const { hydrated, currentUser, logout } = useAuth();

  if (!hydrated) {
    return <div className="skeleton-shimmer h-8 w-20 rounded-full" />;
  }

  if (currentUser) {
    const avatar = currentUser.profileAvatarDataUrl;
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          className="relative h-8 w-8 overflow-hidden rounded-full border border-white/15 bg-white/5 transition hover:border-primary/40 hover:shadow-[0_0_12px_rgba(245,197,66,0.2)]"
          aria-label="Profile"
        >
          {avatar ? (
            <Image
              src={avatar}
              alt={currentUser.username}
              width={32}
              height={32}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-3.5 w-3.5 text-white/40" />
            </div>
          )}
        </Link>
        <motion.button
          type="button"
          onClick={() => void (async () => { await logout(); router.refresh(); })()}
          whileTap={{ scale: 0.94 }}
          transition={spring.snappy}
          className="hidden items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40 transition hover:border-white/15 hover:text-white/70 sm:flex"
        >
          <LogOut className="h-3 w-3" />
          <span>Out</span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/login"
        className="btn btn-ghost hidden sm:inline-flex"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="btn btn-primary"
      >
        Join
      </Link>
    </div>
  );
}
