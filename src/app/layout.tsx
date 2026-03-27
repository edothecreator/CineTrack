import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CineTrack",
    template: "%s · CineTrack",
  },
  description: "A cinematic identity system for modern taste-driven users.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full dark antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {/* Subtle film grain */}
        <div className="cinema-noise" aria-hidden />
        <Providers>
          <SiteHeader />
          {/* Main content — extra bottom padding on mobile for bottom nav */}
          <main className="flex-1 pb-24 md:pb-0">
            {children}
          </main>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
