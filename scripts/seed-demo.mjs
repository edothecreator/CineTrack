/**
 * CineTrack Demo Seed Script
 * Run: node scripts/seed-demo.mjs
 *
 * Creates 10 realistic users with full profiles, watch history,
 * watchlists, collections, posts, reactions, comments, and follows.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hash(pw) {
  return bcrypt.hashSync(pw, 10);
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─── Static data ──────────────────────────────────────────────────────────────

const TMDB_MOVIES = [
  { id: "movie-550",   title: "Fight Club",              posterUrl: "https://image.tmdb.org/t/p/w342/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", rating: 8.4, releaseDate: "1999-10-15", runtimeMinutes: 139, genres: ["Drama","Thriller"] },
  { id: "movie-238",   title: "The Godfather",            posterUrl: "https://image.tmdb.org/t/p/w342/3bhkrj58Vtu7enYsLLeHCcAqKEo.jpg", rating: 8.7, releaseDate: "1972-03-14", runtimeMinutes: 175, genres: ["Drama","Crime"] },
  { id: "movie-278",   title: "The Shawshank Redemption", posterUrl: "https://image.tmdb.org/t/p/w342/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", rating: 8.7, releaseDate: "1994-09-23", runtimeMinutes: 142, genres: ["Drama"] },
  { id: "movie-680",   title: "Pulp Fiction",             posterUrl: "https://image.tmdb.org/t/p/w342/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", rating: 8.5, releaseDate: "1994-09-10", runtimeMinutes: 154, genres: ["Thriller","Crime"] },
  { id: "movie-13",    title: "Forrest Gump",             posterUrl: "https://image.tmdb.org/t/p/w342/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", rating: 8.5, releaseDate: "1994-07-06", runtimeMinutes: 142, genres: ["Drama","Romance"] },
  { id: "movie-155",   title: "The Dark Knight",          posterUrl: "https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg", rating: 8.5, releaseDate: "2008-07-18", runtimeMinutes: 152, genres: ["Action","Crime","Drama"] },
  { id: "movie-19404", title: "Dilwale Dulhania Le Jayenge", posterUrl: "https://image.tmdb.org/t/p/w342/2CAL2433ZeIihfX1Hb2139CX0pW.jpg", rating: 8.1, releaseDate: "1995-10-20", runtimeMinutes: 189, genres: ["Drama","Romance"] },
  { id: "movie-424",   title: "Schindler's List",         posterUrl: "https://image.tmdb.org/t/p/w342/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg", rating: 8.6, releaseDate: "1993-12-15", runtimeMinutes: 195, genres: ["Drama","History","War"] },
  { id: "movie-389",   title: "12 Angry Men",             posterUrl: "https://image.tmdb.org/t/p/w342/ppd84D2i9W8jXmsyInGyihiSyqz.jpg", rating: 8.5, releaseDate: "1957-04-10", runtimeMinutes: 96,  genres: ["Drama"] },
  { id: "movie-129",   title: "Spirited Away",            posterUrl: "https://image.tmdb.org/t/p/w342/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", rating: 8.5, releaseDate: "2001-07-20", runtimeMinutes: 125, genres: ["Animation","Family","Fantasy"] },
  { id: "movie-372058","title": "Your Name",              posterUrl: "https://image.tmdb.org/t/p/w342/q719jXXEzOoYaps6babgKnONONX.jpg", rating: 8.4, releaseDate: "2016-08-26", runtimeMinutes: 106, genres: ["Animation","Drama","Romance"] },
  { id: "movie-496243","title": "Parasite",               posterUrl: "https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", rating: 8.5, releaseDate: "2019-05-30", runtimeMinutes: 132, genres: ["Comedy","Thriller","Drama"] },
  { id: "movie-27205", title: "Inception",                posterUrl: "https://image.tmdb.org/t/p/w342/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", rating: 8.4, releaseDate: "2010-07-16", runtimeMinutes: 148, genres: ["Action","Sci-Fi","Adventure"] },
  { id: "movie-11",    title: "Star Wars",                posterUrl: "https://image.tmdb.org/t/p/w342/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", rating: 8.2, releaseDate: "1977-05-25", runtimeMinutes: 121, genres: ["Action","Adventure","Sci-Fi"] },
  { id: "movie-637",   title: "Life Is Beautiful",        posterUrl: "https://image.tmdb.org/t/p/w342/74hLDKjD5aGYOotO6esUVaeISa2.jpg", rating: 8.5, releaseDate: "1997-12-20", runtimeMinutes: 116, genres: ["Comedy","Drama","Romance"] },
];

const TMDB_TV = [
  { id: "tv-1396",  title: "Breaking Bad",       posterUrl: "https://image.tmdb.org/t/p/w342/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",  rating: 9.5, releaseDate: "2008-01-20", runtimeMinutes: 47, genres: ["Drama","Crime"] },
  { id: "tv-1399",  title: "Game of Thrones",    posterUrl: "https://image.tmdb.org/t/p/w342/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",  rating: 9.3, releaseDate: "2011-04-17", runtimeMinutes: 57, genres: ["Drama","Fantasy","Action"] },
  { id: "tv-66732", title: "Stranger Things",    posterUrl: "https://image.tmdb.org/t/p/w342/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",  rating: 8.7, releaseDate: "2016-07-15", runtimeMinutes: 51, genres: ["Drama","Fantasy","Horror"] },
  { id: "tv-1668",  title: "Friends",            posterUrl: "https://image.tmdb.org/t/p/w342/f496cm9enuEsZkSPzCwnTESEK5s.jpg",  rating: 8.9, releaseDate: "1994-09-22", runtimeMinutes: 22, genres: ["Comedy","Romance"] },
  { id: "tv-94997", title: "House of the Dragon",posterUrl: "https://image.tmdb.org/t/p/w342/z2yahl2uefxDCl0nogcRBstwruJ.jpg",  rating: 8.4, releaseDate: "2022-08-21", runtimeMinutes: 60, genres: ["Drama","Fantasy","Action"] },
  { id: "tv-1402",  title: "The Walking Dead",   posterUrl: "https://image.tmdb.org/t/p/w342/xf9wuDcqlUPWABZNeDKPbZUjWx0.jpg",  rating: 8.2, releaseDate: "2010-10-31", runtimeMinutes: 44, genres: ["Drama","Horror"] },
  { id: "tv-60625", title: "Rick and Morty",     posterUrl: "https://image.tmdb.org/t/p/w342/gdIrmf2DdY5mgN6ycVP0XlzKzbE.jpg",  rating: 9.2, releaseDate: "2013-12-02", runtimeMinutes: 22, genres: ["Animation","Comedy","Sci-Fi"] },
  { id: "tv-37854", title: "One Piece",          posterUrl: "https://image.tmdb.org/t/p/w342/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg",  rating: 8.9, releaseDate: "1999-10-20", runtimeMinutes: 24, genres: ["Animation","Action","Adventure"] },
  { id: "tv-46261", title: "Attack on Titan",    posterUrl: "https://image.tmdb.org/t/p/w342/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",  rating: 9.0, releaseDate: "2013-04-07", runtimeMinutes: 24, genres: ["Animation","Action","Drama"] },
  { id: "tv-1418",  title: "The Big Bang Theory",posterUrl: "https://image.tmdb.org/t/p/w342/ooBGRQBdbGzBxAVfExiO8r7kloA.jpg",  rating: 8.1, releaseDate: "2007-09-24", runtimeMinutes: 22, genres: ["Comedy","Romance"] },
];

const ALL_TITLES = [...TMDB_MOVIES, ...TMDB_TV];

const USERS = [
  { username: "alex_cinema",   email: "alex@demo.ct",    displayName: "Alex Chen",       bio: "Obsessed with Nolan films and anything Kubrick. 🎬 Cinema is life.", avatar: null },
  { username: "sofia_watches", email: "sofia@demo.ct",   displayName: "Sofia Martínez",  bio: "Anime enthusiast & K-drama addict. Currently rewatching Attack on Titan for the 4th time.", avatar: null },
  { username: "marcus_film",   email: "marcus@demo.ct",  displayName: "Marcus Johnson",  bio: "Film student at NYU. I rate everything and I have opinions about everything.", avatar: null },
  { username: "yuki_reviews",  email: "yuki@demo.ct",    displayName: "Yuki Tanaka",     bio: "Studio Ghibli collector. If it's animated, I've seen it. 🌸", avatar: null },
  { username: "priya_binge",   email: "priya@demo.ct",   displayName: "Priya Sharma",    bio: "Binge-watcher extraordinaire. My watchlist has 200+ titles and I'm not sorry.", avatar: null },
  { username: "leo_critique",  email: "leo@demo.ct",     displayName: "Leo Dubois",      bio: "French cinema lover. Godard > everyone. Fight me.", avatar: null },
  { username: "emma_streams",  email: "emma@demo.ct",    displayName: "Emma Wilson",     bio: "Horror & thriller specialist. The scarier the better. 👻", avatar: null },
  { username: "carlos_tv",     email: "carlos@demo.ct",  displayName: "Carlos Rivera",   bio: "TV series only. Movies are too short. Currently on season 6 of something.", avatar: null },
  { username: "nina_popcorn",  email: "nina@demo.ct",    displayName: "Nina Kowalski",   bio: "Comfort movies and cozy series. Life's too short for bad vibes.", avatar: null },
  { username: "demo_user",     email: "demo@demo.ct",    displayName: "Demo User",       bio: "This is the demo account. Feel free to explore!", avatar: null },
];

const POST_TEXTS = [
  "Just finished this and I'm not okay. The ending hit different.",
  "Rewatched this for the 3rd time. Still a masterpiece.",
  "Okay hear me out — this is actually underrated. People sleep on it.",
  "The cinematography alone deserves an award. Every frame is a painting.",
  "I cried. I laughed. I cried again. 10/10 emotional damage.",
  "This changed how I think about storytelling. Genuinely.",
  "Hot take: this is better than the original. I said what I said.",
  "The character development in this is insane. Watched it in one sitting.",
  "Can we talk about the soundtrack? Absolute banger from start to finish.",
  "First 20 minutes were slow but then it completely took over my life.",
  "This is the kind of film that makes you call your parents after.",
  "Watched this on a plane and cried in front of strangers. No regrets.",
  "The plot twist at the end had me rewinding 3 times. Didn't see it coming.",
  "Comfort watch #47. Some things never get old.",
  "My professor recommended this and for once they were right.",
  "Started this as background noise and ended up pausing everything to focus.",
  "The villain in this is genuinely terrifying. Couldn't sleep after.",
  "This is what cinema is supposed to feel like. Immersive, emotional, real.",
  "Overrated? Maybe. But I still watched it twice this week.",
  "The dialogue is so sharp. Every line means something.",
];

const COLLECTION_NAMES = [
  ["All-Time Favorites", "The ones I'd watch on a desert island."],
  ["Anime Essentials", "Must-watch anime for any serious fan."],
  ["Friday Night Picks", "Perfect for a chill Friday evening."],
  ["Mind-Bending Films", "Movies that make you question reality."],
  ["Comfort Rewatch", "When you need something familiar and warm."],
  ["Horror Marathon", "For when you want to not sleep tonight."],
  ["Award Winners", "Oscar, Palme d'Or, and beyond."],
  ["Sci-Fi Universe", "The best science fiction ever made."],
  ["Crime & Thriller", "Edge-of-your-seat tension."],
  ["Studio Ghibli", "Every Ghibli film ranked and loved."],
];

const REACTION_TYPES = ["love", "haha", "wow", "sad", "fire"];

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding CineTrack demo data...\n");

  // 1. Create users
  console.log("👤 Creating users...");
  const createdUsers = [];
  for (const u of USERS) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) {
      console.log(`  ↳ ${u.username} already exists, skipping`);
      createdUsers.push(existing);
      continue;
    }
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: u.email,
        username: u.username,
        displayName: u.displayName,
        passwordHash: hash("Demo1234!"),
        profileBio: u.bio,
        memberSince: daysAgo(Math.floor(Math.random() * 365 + 30)),
        isPublic: true,
      },
    });
    createdUsers.push(user);
    console.log(`  ✓ @${u.username}`);
  }

  // 2. Create follows (everyone follows 4-7 others)
  console.log("\n🤝 Creating follows...");
  for (const user of createdUsers) {
    const others = shuffle(createdUsers.filter((u) => u.id !== user.id)).slice(0, Math.floor(Math.random() * 4) + 4);
    for (const target of others) {
      await prisma.userFollow.upsert({
        where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
        create: { followerId: user.id, followingId: target.id, createdAt: daysAgo(Math.floor(Math.random() * 60)) },
        update: {},
      });
    }
  }
  console.log("  ✓ Follow graph created");

  // 3. Add watched titles (8-14 per user)
  console.log("\n🎬 Adding watched history...");
  for (const user of createdUsers) {
    const titles = shuffle(ALL_TITLES).slice(0, Math.floor(Math.random() * 7) + 8);
    for (const title of titles) {
      await prisma.watchedTitle.upsert({
        where: { userId_tvdbId: { userId: user.id, tvdbId: title.id } },
        create: {
          userId: user.id,
          tvdbId: title.id,
          title: title.title,
          posterUrl: title.posterUrl,
          rating: title.rating,
          userRating: Math.round((Math.random() * 4 + 6) * 2) / 2, // 6.0–10.0
          releaseDate: title.releaseDate,
          runtimeMinutes: title.runtimeMinutes,
          genres: title.genres,
          completedAt: daysAgo(Math.floor(Math.random() * 180)),
        },
        update: {},
      });
    }
    console.log(`  ✓ @${user.username} — ${titles.length} titles watched`);
  }

  // 4. Add watchlist items (4-8 per user)
  console.log("\n📋 Adding watchlists...");
  for (const user of createdUsers) {
    const watched = await prisma.watchedTitle.findMany({ where: { userId: user.id }, select: { tvdbId: true } });
    const watchedIds = new Set(watched.map((w) => w.tvdbId));
    const available = ALL_TITLES.filter((t) => !watchedIds.has(t.id));
    const titles = shuffle(available).slice(0, Math.floor(Math.random() * 5) + 4);
    for (const title of titles) {
      await prisma.watchlistItem.upsert({
        where: { userId_tvdbId: { userId: user.id, tvdbId: title.id } },
        create: {
          userId: user.id,
          tvdbId: title.id,
          title: title.title,
          posterUrl: title.posterUrl,
          rating: title.rating,
          releaseDate: title.releaseDate,
          runtimeMinutes: title.runtimeMinutes,
          genres: title.genres,
        },
        update: {},
      });
    }
    console.log(`  ✓ @${user.username} — ${titles.length} in watchlist`);
  }

  // 5. Create collections (2-3 per user)
  console.log("\n📁 Creating collections...");
  const allLists = [];
  for (const user of createdUsers) {
    const numLists = Math.floor(Math.random() * 2) + 2;
    const listNames = shuffle(COLLECTION_NAMES).slice(0, numLists);
    for (const [name, description] of listNames) {
      const existing = await prisma.userList.findFirst({ where: { userId: user.id, name } });
      if (existing) { allLists.push(existing); continue; }
      const list = await prisma.userList.create({
        data: {
          userId: user.id,
          name,
          description,
          isPublic: true,
        },
      });
      // Add 4-8 titles to each list
      const titles = shuffle(ALL_TITLES).slice(0, Math.floor(Math.random() * 5) + 4);
      for (const title of titles) {
        await prisma.userListItem.upsert({
          where: { listId_tmdbId: { listId: list.id, tmdbId: title.id } },
          create: { listId: list.id, tmdbId: title.id, title: title.title, posterUrl: title.posterUrl },
          update: {},
        });
      }
      allLists.push(list);
    }
    console.log(`  ✓ @${user.username} — ${numLists} collections`);
  }

  // 6. Create posts (3-6 per user)
  console.log("\n✍️  Creating posts...");
  const allPosts = [];
  for (const user of createdUsers) {
    const numPosts = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < numPosts; i++) {
      const title = pick(ALL_TITLES);
      const isMedia = Math.random() > 0.3;
      const post = await prisma.post.create({
        data: {
          userId: user.id,
          type: isMedia ? "MEDIA" : "TEXT",
          text: pick(POST_TEXTS),
          mediaType: isMedia ? (title.id.startsWith("tv-") ? "tv" : "movie") : null,
          tmdbId: isMedia ? title.id : null,
          rating: Math.random() > 0.4 ? Math.round((Math.random() * 3 + 7) * 2) / 2 : null,
          isSpoiler: Math.random() > 0.85,
          createdAt: daysAgo(Math.floor(Math.random() * 30)),
        },
      });
      allPosts.push(post);
    }
    console.log(`  ✓ @${user.username} — ${numPosts} posts`);
  }

  // 7. Add reactions to posts
  console.log("\n⚡ Adding reactions...");
  let reactionCount = 0;
  for (const post of allPosts) {
    const reactors = shuffle(createdUsers.filter((u) => u.id !== post.userId)).slice(0, Math.floor(Math.random() * 6) + 2);
    for (const reactor of reactors) {
      await prisma.reaction.upsert({
        where: { userId_postId: { userId: reactor.id, postId: post.id } },
        create: { userId: reactor.id, postId: post.id, type: pick(REACTION_TYPES), createdAt: daysAgo(Math.floor(Math.random() * 20)) },
        update: {},
      });
      reactionCount++;
    }
  }
  console.log(`  ✓ ${reactionCount} reactions added`);

  // 8. Add comments to posts
  console.log("\n💬 Adding comments...");
  const COMMENT_TEXTS = [
    "Totally agree, this one hit hard.",
    "I had the exact same reaction watching this!",
    "The ending is what got me. Didn't expect that at all.",
    "Underrated take. More people need to see this.",
    "I've been saying this for years. Finally someone gets it.",
    "Okay but the soundtrack though... 🔥",
    "Adding this to my list right now.",
    "The director's cut is even better if you haven't seen it.",
    "This is my comfort watch. I've seen it like 8 times.",
    "The character development is what makes it special.",
    "Watched this with my family and we all cried lol",
    "Hot take but I think the sequel is better.",
    "The cinematography is insane. Every shot is intentional.",
    "I need to rewatch this now. Thanks for the reminder.",
    "This is exactly why I love cinema.",
  ];

  let commentCount = 0;
  for (const post of allPosts) {
    const numComments = Math.floor(Math.random() * 4);
    const commenters = shuffle(createdUsers.filter((u) => u.id !== post.userId)).slice(0, numComments);
    for (const commenter of commenters) {
      const comment = await prisma.comment.create({
        data: {
          userId: commenter.id,
          postId: post.id,
          content: pick(COMMENT_TEXTS),
          createdAt: daysAgo(Math.floor(Math.random() * 15)),
        },
      });
      commentCount++;

      // 30% chance of a reply
      if (Math.random() > 0.7) {
        const replier = pick(createdUsers.filter((u) => u.id !== commenter.id));
        await prisma.comment.create({
          data: {
            userId: replier.id,
            postId: post.id,
            parentId: comment.id,
            content: pick(["Exactly my thoughts!", "Couldn't agree more.", "Interesting take!", "I see your point but...", "This! 100% this."]),
            createdAt: daysAgo(Math.floor(Math.random() * 10)),
          },
        });
        commentCount++;
      }
    }
  }
  console.log(`  ✓ ${commentCount} comments added`);

  // 9. Create activity records
  console.log("\n📊 Creating activity records...");
  for (const user of createdUsers) {
    const watched = await prisma.watchedTitle.findMany({ where: { userId: user.id }, take: 5 });
    for (const w of watched) {
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "WATCHED",
          tvdbId: w.tvdbId,
          title: w.title,
          posterUrl: w.posterUrl,
          createdAt: w.completedAt,
        },
      }).catch(() => {}); // ignore duplicates
    }
  }
  console.log("  ✓ Activity records created");

  // 10. Summary
  const userCount = await prisma.user.count();
  const postCount = await prisma.post.count();
  const watchedCount = await prisma.watchedTitle.count();
  const listCount = await prisma.userList.count();
  const followCount = await prisma.userFollow.count();

  console.log("\n✅ Seed complete!\n");
  console.log("─────────────────────────────");
  console.log(`👤 Users:       ${userCount}`);
  console.log(`🎬 Watched:     ${watchedCount}`);
  console.log(`✍️  Posts:       ${postCount}`);
  console.log(`📁 Collections: ${listCount}`);
  console.log(`🤝 Follows:     ${followCount}`);
  console.log("─────────────────────────────");
  console.log("\n🔑 All demo accounts use password: Demo1234!");
  console.log("   e.g. login with demo@demo.ct / Demo1234!");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
