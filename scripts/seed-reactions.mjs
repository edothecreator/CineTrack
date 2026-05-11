/**
 * Seed reactions and comments only (fast version)
 * Run: node scripts/seed-reactions.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function daysAgo(n) { return new Date(Date.now() - n * 24 * 60 * 60 * 1000); }

const REACTION_TYPES = ["love", "haha", "wow", "sad", "fire"];
const COMMENT_TEXTS = [
  "Totally agree, this one hit hard.",
  "I had the exact same reaction!",
  "The ending is what got me.",
  "Underrated take. More people need to see this.",
  "I've been saying this for years.",
  "Adding this to my list right now.",
  "The director's cut is even better.",
  "This is my comfort watch.",
  "The cinematography is insane.",
  "I need to rewatch this now.",
  "This is exactly why I love cinema.",
  "Watched this with my family and we all cried.",
  "The plot twist had me rewinding 3 times.",
  "Couldn't sleep after watching this.",
  "The dialogue is so sharp.",
];

async function main() {
  console.log("⚡ Seeding reactions and comments...\n");

  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  const posts = await prisma.post.findMany({ select: { id: true, userId: true } });

  console.log(`Found ${users.length} users and ${posts.length} posts`);

  // Batch create reactions using createMany
  console.log("\n⚡ Adding reactions...");
  const reactionData = [];
  for (const post of posts) {
    const reactors = shuffle(users.filter((u) => u.id !== post.userId)).slice(0, Math.floor(Math.random() * 5) + 2);
    for (const reactor of reactors) {
      reactionData.push({
        userId: reactor.id,
        postId: post.id,
        type: pick(REACTION_TYPES),
        createdAt: daysAgo(Math.floor(Math.random() * 20)),
      });
    }
  }

  await prisma.reaction.createMany({ data: reactionData, skipDuplicates: true });
  console.log(`  ✓ ${reactionData.length} reactions created`);

  // Batch create comments
  console.log("\n💬 Adding comments...");
  const commentData = [];
  for (const post of posts) {
    const numComments = Math.floor(Math.random() * 3) + 1;
    const commenters = shuffle(users.filter((u) => u.id !== post.userId)).slice(0, numComments);
    for (const commenter of commenters) {
      commentData.push({
        userId: commenter.id,
        postId: post.id,
        content: pick(COMMENT_TEXTS),
        createdAt: daysAgo(Math.floor(Math.random() * 15)),
      });
    }
  }

  await prisma.comment.createMany({ data: commentData, skipDuplicates: true });
  console.log(`  ✓ ${commentData.length} comments created`);

  // Final counts
  const [u, po, w, l, f, r, c] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.watchedTitle.count(),
    prisma.userList.count(),
    prisma.userFollow.count(),
    prisma.reaction.count(),
    prisma.comment.count(),
  ]);

  console.log("\n✅ Done!\n");
  console.log("─────────────────────────────");
  console.log(`👤 Users:       ${u}`);
  console.log(`🎬 Watched:     ${w}`);
  console.log(`✍️  Posts:       ${po}`);
  console.log(`📁 Collections: ${l}`);
  console.log(`🤝 Follows:     ${f}`);
  console.log(`⚡ Reactions:   ${r}`);
  console.log(`💬 Comments:    ${c}`);
  console.log("─────────────────────────────");
  console.log("\n🔑 Login: demo@demo.ct / Demo1234!");
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
