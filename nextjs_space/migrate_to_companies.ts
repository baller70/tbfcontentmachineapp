import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function migrateToCompanies() {
  console.log('🚀 Starting migration to company-based organization...')

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    })

    console.log(`📊 Found ${users.length} users to migrate`)

    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.email}`)

      // Create a default company for this user
      const company = await prisma.company.create({
        data: {
          name: `${user.name || user.email}'s Workspace`,
          description: 'Default workspace',
          ownerId: user.id,
          isActive: true
        }
      })

      console.log(`   ✅ Created company: ${company.name}`)

      // Add user as a member of their own company
      await prisma.companyMember.create({
        data: {
          companyId: company.id,
          userId: user.id,
          role: 'OWNER'
        }
      })

      // Update user's selectedCompanyId
      await prisma.user.update({
        where: { id: user.id },
        data: { selectedCompanyId: company.id }
      })

      console.log(`   ✅ Set as company owner and selected company`)

      // Migrate all user data to this company
      await migrateUserData(user.id, company.id)
    }

    console.log('\n✨ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function migrateUserData(userId: string, companyId: string) {
  // Migrate ContentTemplates
  const contentTemplates = await prisma.contentTemplate.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   📄 Migrated ${contentTemplates.count} content templates`)

  // Migrate Profiles
  const profiles = await prisma.profile.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   👤 Migrated ${profiles.count} profiles`)

  // Migrate PlatformSettings
  const platformSettings = await prisma.platformSetting.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   🔗 Migrated ${platformSettings.count} platform settings`)

  // Migrate Posts
  const posts = await prisma.post.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   📝 Migrated ${posts.count} posts`)

  // Migrate PostSchedules
  const postSchedules = await prisma.postSchedule.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   📅 Migrated ${postSchedules.count} post schedules`)

  // Migrate PostAnalytics
  const postAnalytics = await prisma.postAnalytics.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   📊 Migrated ${postAnalytics.count} analytics records`)

  // Migrate SavedPrompts
  const savedPrompts = await prisma.savedPrompt.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   💬 Migrated ${savedPrompts.count} saved prompts`)

  // Migrate Templates
  const templates = await prisma.template.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   🎨 Migrated ${templates.count} templates`)

  // Migrate GeneratedGraphics
  const generatedGraphics = await prisma.generatedGraphic.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   🖼️  Migrated ${generatedGraphics.count} generated graphics`)

  // Migrate WorkspaceBrandings
  const workspaceBrandings = await prisma.workspaceBranding.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   🎨 Migrated ${workspaceBrandings.count} workspace brandings`)

  // Migrate Teams
  const teams = await prisma.team.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   👥 Migrated ${teams.count} teams`)

  // Migrate PostSeries
  const postSeries = await prisma.postSeries.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   📆 Migrated ${postSeries.count} post series`)

  // Migrate GoogleDriveFolderMappings
  const driveMappings = await prisma.googleDriveFolderMapping.updateMany({
    where: { userId, companyId: undefined },
    data: { companyId }
  })
  console.log(`   📁 Migrated ${driveMappings.count} Google Drive mappings`)
}

// Run the migration
migrateToCompanies()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
