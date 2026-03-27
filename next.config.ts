import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output is required for the Docker image (Dockerfile copies .next/standalone)
  // Vercel ignores this setting and uses its own build output format
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co",        pathname: "/**" },
      { protocol: "https", hostname: "image.tmdb.org",      pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
