"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav";
import { NotificationBell } from "./NotificationBell";
import { UserSearch } from "./UserSearch";
import { spring } from "@/lib/motionPresets";

const NAV_LINKS = [
  { href: "/search",      label: "Discover"     },
  { href: "/feed",        label: "Stream"       },
  { href: "/my-list",     label: "Archive"      },
  { href: "/collections", label: "Collections"  },
  { href: "/pantheon",    label: "Hall of Fame" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const lastY = useRef(0);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const pathname = usePathname() ?? "";

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 32);
    if (reduce) return;
    const delta = y - lastY.current;
    lastY.current = y;
    if (y < 80) { setHidden(false); return; }
    if (delta > 14) setHidden(true);
    else if (delta < -14) setHidden(false);
  });

  return (
    <motion.header
      initial={false}
      animate={{ y: reduce ? 0 : hidden ? -80 : 0 }}
      transition={spring.dock}
      className={`sticky top-0 z-50 w-full transition-[background,border,box-shadow] duration-500 ${
        scrolled
          ? "border-b border-white/[0.06] bg-[#0B0B0F]/80 shadow-[0_1px_0_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="container flex h-[3.75rem] items-center justify-between gap-6">

        {/* ── Logo ── */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -6 }}
            whileTap={{ scale: 0.94 }}
            transition={spring.snappy}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary shadow-[0_0_16px_rgba(245,197,66,0.35),0_2px_8px_rgba(0,0,0,0.3)]"
          >
            <Clapperboard className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </motion.div>
          <span className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground">
            CineTrack
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center lg:flex" aria-label="Main">
          <div className="flex items-center gap-0.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-1.5 py-1">
            {NAV_LINKS.map(({ href, label }) => {
              const on = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide transition-colors duration-200 whitespace-nowrap ${
                    on ? "text-foreground" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.08]"
                      transition={spring.dock}
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Right actions ── */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden lg:block">
            <UserSearch />
          </div>
          <ThemeToggle />
          <NotificationBell />
          <UserNav />
        </div>
      </div>
    </motion.header>
  );
}
