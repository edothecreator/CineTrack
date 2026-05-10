-- Migration: add Post, Reaction, Comment models for social feed

-- ── PostType enum ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostType') THEN
    CREATE TYPE "PostType" AS ENUM ('MEDIA', 'TEXT', 'IMAGE');
  END IF;
END $$;

-- ── MediaType enum ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MediaType') THEN
    CREATE TYPE "MediaType" AS ENUM ('movie', 'tv', 'anime');
  END IF;
END $$;

-- ── TakeType enum ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TakeType') THEN
    CREATE TYPE "TakeType" AS ENUM ('hot', 'fact', 'question');
  END IF;
END $$;

-- ── ReactionType enum ─────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReactionType') THEN
    CREATE TYPE "ReactionType" AS ENUM ('peak', 'fire', 'deep', 'mid', 'dead');
  END IF;
END $$;

-- ── Post ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Post" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "type"        "PostType" NOT NULL DEFAULT 'TEXT',
  "text"        TEXT,
  "imageUrl"    TEXT,
  "mediaType"   "MediaType",
  "tmdbId"      TEXT,
  "episodeId"   TEXT,
  "rating"      DOUBLE PRECISION,
  "isSpoiler"   BOOLEAN NOT NULL DEFAULT false,
  "takeType"    "TakeType",
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Post_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Post_userId_createdAt_idx" ON "Post"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX IF NOT EXISTS "Post_tmdbId_idx" ON "Post"("tmdbId");

-- ── Reaction ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Reaction" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "type"      "ReactionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Reaction_userId_postId_key" UNIQUE ("userId", "postId"),
  CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Reaction_postId_idx" ON "Reaction"("postId");
CREATE INDEX IF NOT EXISTS "Reaction_userId_idx" ON "Reaction"("userId");

-- ── Comment ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Comment" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "parentId"  TEXT,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Comment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE,
  CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_userId_idx" ON "Comment"("userId");
CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment"("parentId");
