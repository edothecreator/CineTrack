"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Archive, Clapperboard, Crown, Search, Tv2 } from "lucide-react";
import { spring } from "@/lib/motionPresets";

const LINKS = [
  { href: "/feed",     label: "Stream",   Icon: Clapperboard },
  { href: "/search",   label: "Discover", Icon: Search       },
  { href: "/my-list",  label: "Archive",  Icon: Archive      },
  { href: "/pantheon", label: "Hall",     Icon: Crown        },
  { href: "/profile",  label: "Profile",  Icon: Tv2          },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Primary navigation"
    >
      <div className="pointer-events-auto mx-auto max-w-lg px-3">
        <div className="flex items-stretch rounded-2xl border border-white/[0.08] bg-[#0B0B0F]/85 backdrop-blur-2xl"
          style={{ boxShadow: "0 -1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)" }}>
          {LINKS.map(({ href, label, Icon }) => {
            const on = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-1 py-2 px-1"
                aria-current={on ? "page" : undefined}
              >
                {on && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-primary"
                    transition={spring.dock}
                  />
                )}
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    on ? "text-primary" : "text-white/30"
                  }`}
                  strokeWidth={on ? 2.5 : 1.75}
                />
                <span className={`text-[9px] font-semibold tracking-wide transition-colors ${
                  on ? "text-foreground/80" : "text-white/25"
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
