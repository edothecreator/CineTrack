-- Add SCENE_MENTION notification type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'SCENE_MENTION'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'SCENE_MENTION';
  END IF;
END $$;
