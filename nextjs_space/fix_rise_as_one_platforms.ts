import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function fixRiseAsOnePlatforms() {
  try {
    console.log('\n=== CHECKING RISE AS ONE PROFILES ===\n')
    
    // Find all Rise As One profiles
    const riseProfiles = await prisma.profile.findMany({
      where: {
        name: {
          contains: 'Rise',
          mode: 'insensitive'
        }
      },
      include: {
        platformSettings: true
      }
    })
    
    console.log(`Found ${riseProfiles.length} Rise As One profile(s)\n`)
    
    for (const profile of riseProfiles) {
      console.log(`Profile: ${profile.name} (ID: ${profile.id})`)
      console.log(`Late Profile ID: ${profile.lateProfileId || 'NOT SET'}`)
      console.log(`Platform Settings:`)
      
      for (const ps of profile.platformSettings) {
        console.log(`  - ${ps.platform}: Connected=${ps.isConnected}, Active=${ps.isActive}`)
      }
      
      // Check if this profile has the Rise As One Late Profile ID
      if (profile.lateProfileId === '68f68213a24dabbd5b9da3fe') {
        console.log(`\n✅ This is the MAIN Rise As One profile\n`)
        
        // Ensure Facebook and YouTube are active
        const platformsToActivate = ['facebook', 'youtube']
        
        for (const platform of platformsToActivate) {
          const setting = profile.platformSettings.find((ps: any) => ps.platform === platform)
          
          if (setting) {
            if (!setting.isActive || !setting.isConnected) {
              console.log(`Activating ${platform}...`)
              await prisma.platformSetting.update({
                where: { id: setting.id },
                data: {
                  isActive: true,
                  isConnected: true
                }
              })
              console.log(`  ✅ ${platform} is now active and connected`)
            } else {
              console.log(`  ✓ ${platform} is already active and connected`)
            }
          } else {
            // Create the platform setting if it doesn't exist
            console.log(`Creating ${platform} setting...`)
            await prisma.platformSetting.create({
              data: {
                userId: profile.userId,
                profileId: profile.id,
                platform: platform,
                platformId: platform,
                isConnected: true,
                isActive: true
              }
            })
            console.log(`  ✅ ${platform} setting created`)
          }
        }
      }
      console.log('')
    }
    
    console.log('\n=== VERIFICATION ===\n')
    
    // Verify the changes
    const updatedProfiles = await prisma.profile.findMany({
      where: {
        lateProfileId: '68f68213a24dabbd5b9da3fe'
      },
      include: {
        platformSettings: true
      }
    })
    
    for (const profile of updatedProfiles) {
      console.log(`Profile: ${profile.name}`)
      const fbSetting = profile.platformSettings.find((ps: any) => ps.platform === 'facebook')
      const ytSetting = profile.platformSettings.find((ps: any) => ps.platform === 'youtube')
      
      console.log(`  Facebook: ${fbSetting ? `Connected=${fbSetting.isConnected}, Active=${fbSetting.isActive}` : 'NOT FOUND'}`)
      console.log(`  YouTube: ${ytSetting ? `Connected=${ytSetting.isConnected}, Active=${ytSetting.isActive}` : 'NOT FOUND'}`)
      console.log('')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixRiseAsOnePlatforms()
