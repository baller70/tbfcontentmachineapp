
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function step3AddProfileIdColumn() {
  try {
    console.log('Step 3: Adding profileId column to PlatformSetting...')
    
    // Add the column as nullable first
    await prisma.$executeRaw`
      ALTER TABLE "PlatformSetting" 
      ADD COLUMN IF NOT EXISTS "profileId" TEXT
    `
    
    console.log('✓ profileId column added!')
    
    // Now populate it with the default profile for each user
    console.log('Populating profileId values...')
    
    const users: any[] = await prisma.$queryRaw`SELECT id FROM "User"`
    
    for (const user of users) {
      // Get the default profile for this user
      const profiles: any[] = await prisma.$queryRaw`
        SELECT id FROM "Profile" WHERE "userId" = ${user.id} AND "isDefault" = true LIMIT 1
      `
      
      if (profiles.length > 0) {
        const profileId = profiles[0].id
        console.log(`  Updating platform settings for user ${user.id} with profile ${profileId}`)
        
        // Update all platform settings for this user
        await prisma.$executeRaw`
          UPDATE "PlatformSetting" 
          SET "profileId" = ${profileId}
          WHERE "userId" = ${user.id} AND "profileId" IS NULL
        `
      }
    }
    
    console.log('✓ profileId values populated!')
    
    // Now make it NOT NULL
    console.log('Making profileId NOT NULL...')
    await prisma.$executeRaw`
      ALTER TABLE "PlatformSetting" 
      ALTER COLUMN "profileId" SET NOT NULL
    `
    
    // Add foreign key constraint
    console.log('Adding foreign key constraint...')
    await prisma.$executeRaw`
      ALTER TABLE "PlatformSetting"
      ADD CONSTRAINT "PlatformSetting_profileId_fkey" 
      FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `
    
    console.log('✓ profileId column configured successfully!')
    
  } catch (error) {
    console.error('Step 3 failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

step3AddProfileIdColumn()
