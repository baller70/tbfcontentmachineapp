
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create test users
  const hashedPasswordJohn = await bcrypt.hash('johndoe123', 10)
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10)

  // Create default test user (john@doe.com)
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPasswordJohn,
      role: 'USER'
    }
  })

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User', 
      password: hashedPasswordAdmin,
      role: 'ADMIN'
    }
  })

  console.log('✅ Created users:', { testUser: testUser.email, adminUser: adminUser.email })

  // Create or get the default company for test user
  let testUserCompany = await prisma.company.findFirst({
    where: { ownerId: testUser.id }
  })

  if (!testUserCompany) {
    testUserCompany = await prisma.company.create({
      data: {
        name: `${testUser.name}'s Workspace`,
        ownerId: testUser.id,
        isActive: true
      }
    })

    // Add user as member
    await prisma.companyMember.create({
      data: {
        companyId: testUserCompany.id,
        userId: testUser.id,
        role: 'OWNER'
      }
    })

    // Set as selected company
    await prisma.user.update({
      where: { id: testUser.id },
      data: { selectedCompanyId: testUserCompany.id }
    })
  }

  // Create sample platform settings for the test user
  // Create default profile
  const existingProfile = await prisma.profile.findFirst({
    where: {
      userId: testUser.id,
      companyId: testUserCompany.id,
      name: 'Basketball Factory'
    }
  })

  const defaultProfile = existingProfile || await prisma.profile.create({
    data: {
      userId: testUser.id,
      companyId: testUserCompany.id,
      name: 'Basketball Factory',
      description: 'Default profile for test user',
      isDefault: true
    }
  })

  console.log('✅ Created default profile')

  const platforms = [
    { platform: 'instagram', platformId: 'instagram', isConnected: true },
    { platform: 'linkedin', platformId: 'linkedin', isConnected: true },
    { platform: 'tiktok', platformId: 'tiktok', isConnected: false },
    { platform: 'youtube', platformId: 'youtube', isConnected: false },
    { platform: 'twitter', platformId: 'twitter', isConnected: true }
  ]

  for (const platformData of platforms) {
    await prisma.platformSetting.upsert({
      where: {
        profileId_platform: {
          profileId: defaultProfile.id,
          platform: platformData.platform
        }
      },
      update: {},
      create: {
        userId: testUser.id,
        companyId: testUserCompany.id,
        profileId: defaultProfile.id,
        ...platformData,
        isActive: true
      }
    })
  }

  console.log('✅ Created platform settings for:', platforms.map(p => p.platform).join(', '))

  // Create sample content templates
  const contentTemplates = [
    {
      title: 'Tech Innovation Post',
      content: 'Exciting developments in AI technology are reshaping how we work and create. The future is here!',
      caption: 'Embracing the AI revolution 🚀 #TechTalk #Innovation',
      hashtags: '#AI #Technology #Innovation #Future #TechTalk',
      contentType: 'post',
      topic: 'Technology',
      platforms: ['linkedin', 'twitter']
    },
    {
      title: 'Motivational Monday',
      content: 'Start your week with intention and purpose. Every small step counts towards your bigger goals.',
      caption: 'Monday motivation incoming! 💪 What\'s your goal this week?',
      hashtags: '#MondayMotivation #Goals #Success #Inspiration #Mindset',
      contentType: 'post', 
      topic: 'Motivation',
      platforms: ['instagram', 'linkedin']
    },
    {
      title: 'Behind the Scenes',
      content: 'Take a peek behind the curtain of our creative process. Every great idea starts with a spark.',
      caption: 'The magic happens behind the scenes ✨ #BehindTheScenes',
      hashtags: '#BehindTheScenes #Creative #Process #Work #Team',
      contentType: 'story',
      topic: 'Business',
      platforms: ['instagram']
    }
  ]

  for (const template of contentTemplates) {
    await prisma.contentTemplate.create({
      data: {
        userId: testUser.id,
        ...template
      }
    })
  }

  console.log('✅ Created content templates:', contentTemplates.length)

  // Create sample posts
  const samplePosts = [
    {
      content: 'Just launched our new feature! Excited to see how it helps streamline social media management.',
      caption: 'New feature alert! 🎉 Making social media management easier than ever.',
      hashtags: '#ProductLaunch #SocialMedia #NewFeature #Announcement',
      platforms: ['linkedin', 'twitter'],
      status: 'POSTED',
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      content: 'Tips for creating engaging social media content: 1. Know your audience 2. Tell a story 3. Use visuals 4. Be consistent',
      caption: '4 essential tips for social media success 📱 Which one do you struggle with most?',
      hashtags: '#SocialMediaTips #ContentStrategy #Marketing #DigitalMarketing',
      platforms: ['instagram', 'linkedin'],
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    }
  ]

  for (const post of samplePosts) {
    await prisma.post.create({
      data: {
        userId: testUser.id,
        ...post,
        mediaUrls: []
      }
    })
  }

  console.log('✅ Created sample posts:', samplePosts.length)

  // Create sample schedule
  await prisma.postSchedule.create({
    data: {
      userId: testUser.id,
      title: 'Daily Motivation Posts',
      content: 'Daily dose of motivation to inspire and uplift your audience.',
      caption: 'Your daily motivation is here! 💪 #DailyMotivation',
      hashtags: '#DailyMotivation #Inspiration #Success #Mindset',
      platforms: ['instagram', 'linkedin'],
      scheduleType: 'daily',
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      isRecurring: true,
      interval: 1, // Daily
      status: 'ACTIVE'
    }
  })

  console.log('✅ Created sample recurring schedule')

  // Create sample generated content
  const generatedContentSamples = [
    {
      prompt: 'Create an engaging LinkedIn post about remote work benefits',
      generatedText: 'Remote work isn\'t just a trend—it\'s a transformation in how we approach productivity and work-life balance. Studies show remote workers are 13% more productive and report higher job satisfaction. The key? Trust, clear communication, and the right tools. What\'s been your biggest remote work game-changer?',
      contentType: 'post',
      platform: 'linkedin',
      topic: 'Remote Work',
      tone: 'professional'
    },
    {
      prompt: 'Generate Instagram captions for a coffee shop photo',
      generatedText: 'That perfect Monday morning brew ☕ When life gives you Monday, coffee makes everything possible. What\'s your go-to coffee order?',
      contentType: 'caption',
      platform: 'instagram',
      topic: 'Lifestyle',
      tone: 'casual'
    }
  ]

  for (const content of generatedContentSamples) {
    await prisma.generatedContent.create({
      data: {
        userId: testUser.id,
        ...content
      }
    })
  }

  console.log('✅ Created sample generated content:', generatedContentSamples.length)

  // Create sample workspace branding for the test user's company
  const existingBranding = await prisma.workspaceBranding.findFirst({
    where: {
      companyId: testUserCompany.id,
      isDefault: true
    }
  })

  if (!existingBranding) {
    await prisma.workspaceBranding.create({
      data: {
        userId: testUser.id,
        companyId: testUserCompany.id,
        name: 'Default Brand',
        brandColors: ['#3b82f6', '#6b7280', '#10b981'], // Blue, Gray, Green
        isDefault: true
      }
    })
    console.log('✅ Created default workspace branding')
  }

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
