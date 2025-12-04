import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Updating Basketball Factory profile with Late profile ID...')
    
    // Find the Basketball Factory profile
    const basketballProfile = await prisma.profile.findFirst({
      where: {
        name: {
          contains: 'Basketball Factory',
          mode: 'insensitive'
        }
      }
    })

    if (!basketballProfile) {
      console.log('⚠️  Basketball Factory profile not found')
      return
    }

    // Update it with the Late profile ID
    const updated = await prisma.profile.update({
      where: {
        id: basketballProfile.id
      },
      data: {
        lateProfileId: '68f68556d5654b446d61d7dc'
      }
    })

    console.log('✅ Successfully updated Basketball Factory profile:')
    console.log('   Profile ID:', updated.id)
    console.log('   Late Profile ID:', updated.lateProfileId)

  } catch (error) {
    console.error('❌ Error updating profile:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
