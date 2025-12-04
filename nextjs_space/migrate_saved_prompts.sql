-- Add new columns with default values to avoid data loss
ALTER TABLE "SavedPrompt" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Untitled Prompt';
ALTER TABLE "SavedPrompt" ADD COLUMN "prompt" TEXT;
ALTER TABLE "SavedPrompt" ADD COLUMN "category" TEXT;

-- Migrate existing text data to prompt column
UPDATE "SavedPrompt" SET "prompt" = "text" WHERE "text" IS NOT NULL;

-- Set title based on first 50 characters of text
UPDATE "SavedPrompt" SET "title" = 
  CASE 
    WHEN LENGTH("text") > 50 THEN SUBSTRING("text", 1, 47) || '...'
    ELSE "text"
  END
WHERE "text" IS NOT NULL;

-- Make prompt column required
ALTER TABLE "SavedPrompt" ALTER COLUMN "prompt" SET NOT NULL;

-- Drop the old text column
ALTER TABLE "SavedPrompt" DROP COLUMN "text";

-- Remove default from title column (we want it required going forward)
ALTER TABLE "SavedPrompt" ALTER COLUMN "title" DROP DEFAULT;
