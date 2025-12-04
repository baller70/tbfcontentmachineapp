import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateToProfiles() {
  try {
    console.log('Starting migration to profiles...')
    
    // Get all users
    const users = await prisma.$queryRaw`SELECT id, email FROM "User"`
    console.log(`Found ${(users as any[]).length} users`)
    
    for (const user of users as any[]) {
      console.log(`\nMigrating user ${user.email}...`)
      
      // Get platform settings for this user
      const platformSettings = await prisma.$queryRaw`
        SELECT * FROM "PlatformSetting" WHERE "userId" = ${user.id}
      `
      
      console.log(`  Found ${(platformSettings as any[]).length} platform settings`)
      
      if ((platformSettings as any[]).length > 0) {
        // Create default profile for this user
        console.log('  Creating default "Basketball Factory" profile...')
        const [profile] = await prisma.$queryRaw`
          INSERT INTO "Profile" (id, "userId", name, description, "isDefault", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${user.id}, 'Basketball Factory', 'Default profile', true, NOW(), NOW())
          RETURNING id
        ` as any[]
        
        console.log(`  Profile created with ID: ${profile.id}`)
        
        // Update all platform settings to use this profile
        console.log('  Updating platform settings...')
        await prisma.$executeRaw`
          UPDATE "PlatformSetting" 
          SET "profileId" = ${profile.id}
          WHERE "userId" = ${user.id}
        `
        
        console.log(`  ✓ Migration complete for ${user.email}`)
      }
    }
    
    console.log('\n✓ All users migrated successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateToProfiles()
