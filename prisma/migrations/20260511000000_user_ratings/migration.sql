-- Add userRating to WatchedTitle (personal star rating, separate from TMDB rating)
ALTER TABLE "WatchedTitle" ADD COLUMN IF NOT EXISTS "userRating" DOUBLE PRECISION;
CREATE INDEX IF NOT EXISTS "WatchedTitle_userRating_idx" ON "WatchedTitle"("userRating");

-- Add scene notification types
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'SCENE_REACTION'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'SCENE_REACTION';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'SCENE_COMMENT'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'SCENE_COMMENT';
  END IF;
END $$;
