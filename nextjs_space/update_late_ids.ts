import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateLateIds() {
  try {
    // Rise As One profile - UPDATE with correct Late account IDs
    const riseAsOneProfile = await prisma.profile.findFirst({
      where: { name: 'Rise As One' }
    })

    if (!riseAsOneProfile) {
      console.error('Rise As One profile not found')
      return
    }

    // Correct Late account IDs from the API
    const correctIds = {
      facebook: '68f80c018bbca9c10cbfe63f',
      instagram: '68f6822f8bbca9c10cbfe2d4',
      threads: '68f6869c8bbca9c10cbfe2ec',
      youtube: '68f686338bbca9c10cbfe2ea'  // This one was already correct
    }

    console.log('\n🔄 Updating Rise As One platform IDs...\n')

    for (const [platform, correctId] of Object.entries(correctIds)) {
      const updated = await prisma.platformSetting.updateMany({
        where: {
          profileId: riseAsOneProfile.id,
          platform: platform
        },
        data: {
          platformId: correctId,
          isConnected: true,
          isActive: true
        }
      })

      console.log(`✅ ${platform}: Updated to ${correctId} (${updated.count} rows)`)
    }

    console.log('\n✅ All platform IDs updated successfully!\n')

    // Verify the updates
    const updatedSettings = await prisma.platformSetting.findMany({
      where: {
        profileId: riseAsOneProfile.id,
        platform: {
          in: ['facebook', 'instagram', 'threads', 'youtube']
        }
      },
      select: {
        platform: true,
        platformId: true,
        isConnected: true
      }
    })

    console.log('📋 Verified platform settings:')
    updatedSettings.forEach((setting: any) => {
      console.log(`   ${setting.platform}: ${setting.platformId} (Connected: ${setting.isConnected})`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateLateIds()
