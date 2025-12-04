
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function step2CreateDefaultProfiles() {
  try {
    console.log('Step 2: Creating default profiles for existing users...')
    
    // Get all users
    const users: any[] = await prisma.$queryRaw`SELECT id, email FROM "User"`
    console.log(`Found ${users.length} users`)
    
    for (const user of users) {
      console.log(`\nProcessing user ${user.email}...`)
      
      // Check if user has platform settings
      const platformSettings: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "PlatformSetting" WHERE "userId" = ${user.id}
      `
      
      const count = parseInt(platformSettings[0]?.count || '0')
      console.log(`  User has ${count} platform settings`)
      
      if (count > 0) {
        // Create default profile
        console.log('  Creating "Basketball Factory" profile...')
        const profileId = `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`
        
        await prisma.$executeRaw`
          INSERT INTO "Profile" (id, "userId", name, description, "isDefault", "createdAt", "updatedAt")
          VALUES (${profileId}, ${user.id}, 'Basketball Factory', 'Default profile', true, NOW(), NOW())
          ON CONFLICT ("userId", "name") DO NOTHING
        `
        
        console.log(`  ✓ Profile created for ${user.email}`)
      }
    }
    
    console.log('\n✓ Default profiles created successfully!')
    
  } catch (error) {
    console.error('Step 2 failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

step2CreateDefaultProfiles()
