-- Migration: add social features (follows, activity, notifications)
-- Also adds unique constraint on username and new profile fields

-- Add new profile columns to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- Make username unique (was already unique in practice via app logic)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_username_key'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
  END IF;
END $$;

-- Add username index
CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");

-- ── UserFollow ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UserFollow" (
  "id"          TEXT NOT NULL,
  "followerId"  TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserFollow_followerId_followingId_key" UNIQUE ("followerId", "followingId"),
  CONSTRAINT "UserFollow_follower_fkey"  FOREIGN KEY ("followerId")  REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserFollow_following_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserFollow_followerId_idx"  ON "UserFollow"("followerId");
CREATE INDEX IF NOT EXISTS "UserFollow_followingId_idx" ON "UserFollow"("followingId");

-- ── ActivityType enum ─────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityType') THEN
    CREATE TYPE "ActivityType" AS ENUM (
      'WATCHED', 'ADDED_TO_LIST', 'FOLLOWED_USER', 'RATED_TITLE'
    );
  END IF;
END $$;

-- ── Activity ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Activity" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "type"         "ActivityType" NOT NULL,
  "tvdbId"       TEXT,
  "title"        TEXT,
  "posterUrl"    TEXT,
  "targetUserId" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx"        ON "Activity"("createdAt");

-- ── NotificationType enum ─────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'NEW_FOLLOWER', 'FOLLOW_BACK', 'FRIEND_WATCHED', 'FRIEND_ADDED_LIST'
    );
  END IF;
END $$;

-- ── Notification ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "actorId"   TEXT NOT NULL,
  "type"      "NotificationType" NOT NULL,
  "read"      BOOLEAN NOT NULL DEFAULT false,
  "tvdbId"    TEXT,
  "title"     TEXT,
  "posterUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_userId_fkey"  FOREIGN KEY ("userId")  REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx"      ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
