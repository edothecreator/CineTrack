-- Rename reaction types: peak→love, fire→fire(keep), deep→wow, mid→sad, dead→haha
-- PostgreSQL doesn't support using new enum values in the same transaction they were added.
-- We recreate the type to avoid this limitation.

-- 1. Create a temporary new enum type
CREATE TYPE "ReactionType_new" AS ENUM ('love', 'haha', 'wow', 'sad', 'fire');

-- 2. Update the Reaction table to use the new type, mapping old values to new ones
ALTER TABLE "Reaction" ALTER COLUMN "type" TYPE "ReactionType_new" USING (
  CASE "type"::text
    WHEN 'peak' THEN 'love'::"ReactionType_new"
    WHEN 'dead' THEN 'haha'::"ReactionType_new"
    WHEN 'deep' THEN 'wow'::"ReactionType_new"
    WHEN 'mid'  THEN 'sad'::"ReactionType_new"
    WHEN 'fire' THEN 'fire'::"ReactionType_new"
    ELSE 'love'::"ReactionType_new"
  END
);

-- 3. Drop the old type and rename the new one
DROP TYPE "ReactionType";
ALTER TYPE "ReactionType_new" RENAME TO "ReactionType";
