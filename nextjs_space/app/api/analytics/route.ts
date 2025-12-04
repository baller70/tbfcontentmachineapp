
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch user's analytics overview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('range') || '7d' // 7d, 30d, 90d
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    // Calculate date range
    const now = new Date()
    const daysBack = dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 7
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Get post counts by status
    const postStats = await prisma.post.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate
        }
      },
      _count: true
    })

    // Get analytics summary
    const analyticsData = await prisma.postAnalytics.aggregate({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        views: true,
        likes: true,
        shares: true,
        comments: true,
        clicks: true,
        reach: true
      },
      _avg: {
        engagement: true
      }
    })

    // Get platform performance
    const platformStats = await prisma.postAnalytics.groupBy({
      by: ['platform'],
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        views: true,
        likes: true,
        shares: true,
        comments: true
      },
      _avg: {
        engagement: true
      }
    })

    // Get recent posts for timeline
    const recentPosts = await prisma.post.findMany({
      where: {
        userId: user.id,
        status: 'POSTED',
        postedAt: {
          gte: startDate
        }
      },
      orderBy: { postedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        content: true,
        platforms: true,
        postedAt: true,
        analytics: {
          select: {
            platform: true,
            views: true,
            likes: true,
            engagement: true
          }
        }
      }
    })

    // Get upcoming scheduled posts
    const scheduledPosts = await prisma.postSchedule.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        nextRun: {
          gte: now
        }
      },
      orderBy: { nextRun: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        platforms: true,
        nextRun: true,
        scheduleType: true
      }
    })

    return Response.json({
      summary: {
        totalPosts: postStats.reduce((sum: number, stat: any) => sum + stat._count, 0),
        totalViews: analyticsData._sum.views || 0,
        totalLikes: analyticsData._sum.likes || 0,
        totalShares: analyticsData._sum.shares || 0,
        totalComments: analyticsData._sum.comments || 0,
        averageEngagement: analyticsData._avg.engagement || 0,
        postsByStatus: postStats.reduce((acc: Record<string, number>, stat: any) => {
          acc[stat.status] = stat._count
          return acc
        }, {} as Record<string, number>)
      },
      platformPerformance: platformStats.map((stat: any) => ({
        platform: stat.platform,
        views: stat._sum.views || 0,
        likes: stat._sum.likes || 0,
        shares: stat._sum.shares || 0,
        comments: stat._sum.comments || 0,
        averageEngagement: stat._avg.engagement || 0
      })),
      recentPosts,
      upcomingScheduled: scheduledPosts,
      dateRange: {
        start: startDate,
        end: now,
        range: dateRange
      }
    })

  } catch (error) {
    console.error('Fetch analytics error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
