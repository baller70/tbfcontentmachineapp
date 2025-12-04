
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch user's schedules
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

    const schedules = await prisma.postSchedule.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          select: {
            id: true,
            status: true,
            postedAt: true
          }
        }
      }
    })

    return Response.json({ schedules })

  } catch (error) {
    console.error('Fetch schedules error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

// POST - Create new schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const {
      title,
      content,
      caption,
      hashtags,
      platforms,
      mediaUrls,
      scheduleType,
      scheduledAt,
      timezone,
      isRecurring,
      interval,
      endDate,
      maxRuns,
      seriesId
    } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    // If associated with a series, create a Post instead of PostSchedule
    if (seriesId) {
      if (!content || !platforms) {
        return new Response('Missing required fields for series post', { status: 400 })
      }

      // Verify series exists and belongs to user
      const series = await prisma.postSeries.findUnique({
        where: { id: seriesId }
      })

      if (!series || series.userId !== user.id) {
        return new Response('Series not found or unauthorized', { status: 404 })
      }

      const post = await prisma.post.create({
        data: {
          userId: user.id,
          seriesId,
          content,
          caption: caption || null,
          hashtags: hashtags || null,
          platforms: series.platforms, // Use series platforms
          mediaUrls: mediaUrls || [],
          status: 'DRAFT' // Series posts start as drafts
        }
      })

      return Response.json({
        success: true,
        message: 'Post added to series successfully. It will be posted according to the series schedule.',
        post
      })
    }

    // Otherwise, create a traditional PostSchedule
    if (!title || !content || !platforms || !scheduledAt || !scheduleType) {
      return new Response('Missing required fields', { status: 400 })
    }

    const schedule = await prisma.postSchedule.create({
      data: {
        userId: user.id,
        title,
        content,
        caption: caption || null,
        hashtags: hashtags || null,
        platforms,
        scheduleType,
        scheduledAt: new Date(scheduledAt),
        timezone: timezone || 'UTC',
        isRecurring: isRecurring || false,
        interval: interval || null,
        endDate: endDate ? new Date(endDate) : null,
        maxRuns: maxRuns || null,
        nextRun: new Date(scheduledAt),
        status: 'ACTIVE'
      }
    })

    return Response.json({
      success: true,
      message: 'Schedule created successfully',
      schedule
    })

  } catch (error) {
    console.error('Create schedule error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
