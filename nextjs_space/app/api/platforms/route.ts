
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch user's platform settings for a specific profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    if (!profileId) {
      return new Response('Profile ID is required', { status: 400 })
    }

    const platforms = await prisma.platformSetting.findMany({
      where: { 
        userId: user.id,
        profileId: profileId
      },
      orderBy: { platform: 'asc' }
    })

    return Response.json({ platforms })

  } catch (error) {
    console.error('Fetch platforms error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

// PUT - Update platform settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { profileId, platform, isConnected, isActive, settings, platformId } = await request.json()

    if (!platform) {
      return new Response('Platform is required', { status: 400 })
    }

    if (!profileId) {
      return new Response('Profile ID is required', { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    const updatedPlatform = await prisma.platformSetting.upsert({
      where: {
        profileId_platform: {
          profileId: profileId,
          platform: platform
        }
      },
      update: {
        isConnected: isConnected ?? undefined,
        isActive: isActive ?? undefined,
        settings: settings ?? undefined,
        platformId: platformId ?? undefined,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        profileId: profileId,
        platform: platform,
        platformId: platformId || platform,
        isConnected: isConnected ?? false,
        isActive: isActive ?? true,
        settings: settings ?? null
      }
    })

    return Response.json({
      success: true,
      message: 'Platform settings updated',
      platform: updatedPlatform
    })

  } catch (error) {
    console.error('Update platform error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
