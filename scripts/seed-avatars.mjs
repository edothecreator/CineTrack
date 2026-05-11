/**
 * Update demo users with profile avatars and banner images
 * Run: node scripts/seed-avatars.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Using Unsplash source URLs — reliable, no API key needed
// Each user gets a curated avatar + banner that matches their vibe

const USER_PHOTOS = {
  alex_cinema: {
    // Cinephile — dark, moody, film noir aesthetic
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=400&fit=crop",
    // Film projector / cinema hall
  },
  sofia_watches: {
    // Anime & K-drama — colorful, East Asian aesthetic
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&h=400&fit=crop",
    // Cherry blossoms / Japanese aesthetic
  },
  marcus_film: {
    // Film student — artsy, intellectual
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=1200&h=400&fit=crop",
    // Camera / filmmaking equipment
  },
  yuki_reviews: {
    // Studio Ghibli fan — soft, dreamy, nature
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=400&fit=crop",
    // Soft forest / dreamy landscape
  },
  priya_binge: {
    // Binge-watcher — cozy, warm, living room vibes
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=400&fit=crop",
    // Cozy couch / warm living room
  },
  leo_critique: {
    // French cinema lover — sophisticated, Parisian
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=400&fit=crop",
    // Paris / Eiffel Tower at night
  },
  emma_streams: {
    // Horror specialist — dark, mysterious
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=1200&h=400&fit=crop",
    // Dark forest / spooky atmosphere
  },
  carlos_tv: {
    // TV series addict — modern, tech-savvy
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1200&h=400&fit=crop",
    // Multiple screens / TV setup
  },
  nina_popcorn: {
    // Comfort movies — warm, cheerful, popcorn vibes
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=1200&h=400&fit=crop",
    // Popcorn / movie night
  },
  demo_user: {
    // Generic demo — clean, professional
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&h=400&fit=crop",
    // Cinema seats / movie theater
  },
};

async function main() {
  console.log("🖼️  Updating user photos...\n");

  for (const [username, photos] of Object.entries(USER_PHOTOS)) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.log(`  ⚠️  @${username} not found, skipping`);
      continue;
    }

    await prisma.user.update({
      where: { username },
      data: {
        profileAvatar: photos.avatar,
        bannerUrl: photos.banner,
      },
    });

    console.log(`  ✓ @${username}`);
  }

  console.log("\n✅ All photos updated!");
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
