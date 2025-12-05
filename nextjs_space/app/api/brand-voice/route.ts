import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch brand voice profile(s)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const companyId = user.selectedCompanyId

    // Fetch brand voice profiles for this user/company
    const profiles = await prisma.brandVoiceProfile.findMany({
      where: {
        userId: user.id,
        ...(companyId ? { companyId } : { companyId: null })
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // If no profile exists, return empty array (we'll create one on save)
    return NextResponse.json({ profiles })

  } catch (error) {
    console.error('Error fetching brand voice profiles:', error)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }
}

// POST - Create or update brand voice profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await request.json()
    const companyId = user.selectedCompanyId

    const profileData = {
      userId: user.id,
      companyId: companyId || null,
      name: data.name || 'Default Brand Voice',
      brandVoice: data.brandVoice || null,
      targetAudience: data.targetAudience || null,
      keyMessaging: data.keyMessaging || null,
      writingStyle: data.writingStyle || null,
      brandValues: data.brandValues || null,
      dosAndDonts: data.dosAndDonts || null,
      exampleContent: data.exampleContent || null,
      industryNiche: data.industryNiche || null,
      toneOfVoice: data.toneOfVoice || null,
      hashtagStyle: data.hashtagStyle || null,
      emojiUsage: data.emojiUsage || null,
      callToAction: data.callToAction || null,
      contentThemes: data.contentThemes || [],
      avoidTopics: data.avoidTopics || [],
      isDefault: data.isDefault ?? true,
      isActive: data.isActive ?? true
    }

    let profile
    if (data.id) {
      // Update existing profile
      profile = await prisma.brandVoiceProfile.update({
        where: { id: data.id },
        data: profileData
      })
    } else {
      // Create new profile - use upsert to handle unique constraint
      profile = await prisma.brandVoiceProfile.upsert({
        where: {
          userId_companyId_name: {
            userId: user.id,
            companyId: companyId || '',
            name: profileData.name
          }
        },
        update: profileData,
        create: profileData
      })
    }

    return NextResponse.json({ profile, message: 'Brand voice profile saved successfully' })

  } catch (error) {
    console.error('Error saving brand voice profile:', error)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}

// DELETE - Delete a brand voice profile
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('id')

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
    }

    await prisma.brandVoiceProfile.delete({
      where: { id: profileId }
    })

    return NextResponse.json({ message: 'Profile deleted successfully' })

  } catch (error) {
    console.error('Error deleting brand voice profile:', error)
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

