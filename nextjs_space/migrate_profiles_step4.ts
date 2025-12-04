
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function step4UpdateConstraints() {
  try {
    console.log('Step 4: Updating unique constraints...')
    
    // Drop old unique constraint
    console.log('Dropping old unique constraint...')
    await prisma.$executeRaw`
      DROP INDEX IF EXISTS "PlatformSetting_userId_platform_key"
    `
    
    // Add new unique constraint on (profileId, platform)
    console.log('Adding new unique constraint...')
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "PlatformSetting_profileId_platform_key" 
      ON "PlatformSetting"("profileId", "platform")
    `
    
    console.log('✓ Constraints updated successfully!')
    console.log('\n🎉 Migration complete! You can now use multi-profile feature.')
    
  } catch (error) {
    console.error('Step 4 failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

step4UpdateConstraints()
