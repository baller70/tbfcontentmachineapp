import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  try {
    console.log('Starting migration of SavedPrompt table...')
    
    // Add new columns with default values
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SavedPrompt" ADD COLUMN IF NOT EXISTS "title" TEXT DEFAULT 'Untitled Prompt';
    `)
    console.log('✓ Added title column')
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SavedPrompt" ADD COLUMN IF NOT EXISTS "prompt" TEXT;
    `)
    console.log('✓ Added prompt column')
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SavedPrompt" ADD COLUMN IF NOT EXISTS "category" TEXT;
    `)
    console.log('✓ Added category column')
    
    // Migrate existing text data to prompt column
    await prisma.$executeRawUnsafe(`
      UPDATE "SavedPrompt" SET "prompt" = "text" WHERE "text" IS NOT NULL AND "prompt" IS NULL;
    `)
    console.log('✓ Migrated text to prompt')
    
    // Set title based on first 50 characters of text
    await prisma.$executeRawUnsafe(`
      UPDATE "SavedPrompt" SET "title" = 
        CASE 
          WHEN LENGTH("text") > 50 THEN SUBSTRING("text", 1, 47) || '...'
          ELSE "text"
        END
      WHERE "text" IS NOT NULL AND "title" = 'Untitled Prompt';
    `)
    console.log('✓ Generated titles from text')
    
    // Make prompt column required
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SavedPrompt" ALTER COLUMN "prompt" SET NOT NULL;
    `)
    console.log('✓ Made prompt column required')
    
    // Make title column required
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SavedPrompt" ALTER COLUMN "title" SET NOT NULL;
    `)
    console.log('✓ Made title column required')
    
    // Drop the old text column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SavedPrompt" DROP COLUMN IF EXISTS "text";
    `)
    console.log('✓ Dropped old text column')
    
    // Remove default from title column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SavedPrompt" ALTER COLUMN "title" DROP DEFAULT;
    `)
    console.log('✓ Removed default from title')
    
    console.log('\n✅ Migration completed successfully!')
    
    // Verify the migration
    const count = await prisma.savedPrompt.count()
    console.log(`\nTotal SavedPrompt records: ${count}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate()
