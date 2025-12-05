import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const LATE_API_KEY = process.env.LATE_API_KEY

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profiles: {
          include: {
            platformSettings: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'scheduled' // scheduled, published, failed
    const profileId = searchParams.get('profileId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch posts from Late API
    let lateApiPosts: any[] = []
    
    if (LATE_API_KEY) {
      try {
        // Build query string for Late API
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        
        const lateResponse = await fetch(`https://getlate.dev/api/v1/posts?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${LATE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })

        if (lateResponse.ok) {
          const data = await lateResponse.json()
          lateApiPosts = data.posts || data || []
          console.log(`📅 Fetched ${lateApiPosts.length} posts from Late API`)
        } else {
          console.error('Late API fetch failed:', await lateResponse.text())
        }
      } catch (error) {
        console.error('Error fetching from Late API:', error)
      }
    }

    // Also fetch posts from local database
    const dbPosts = await prisma.post.findMany({
      where: {
        userId: user.id,
        ...(profileId ? {} : {}), // We don't have profileId on posts directly yet
        ...(status === 'scheduled' ? { status: 'SCHEDULED' } : {}),
        ...(status === 'published' ? { status: 'POSTED' } : {}),
        ...(status === 'failed' ? { status: 'FAILED' } : {}),
        ...(startDate ? { scheduledAt: { gte: new Date(startDate) } } : {}),
        ...(endDate ? { scheduledAt: { lte: new Date(endDate) } } : {})
      },
      orderBy: { scheduledAt: 'asc' },
      take: 100
    })

    // Map profile IDs to names for UI display
    const profileMap = new Map(user.profiles.map(p => [p.lateProfileId, p.name]))

    // Combine and normalize posts from both sources
    const combinedPosts = [
      // Late API posts
      ...lateApiPosts.map((post: any) => ({
        id: post._id || post.id,
        source: 'late',
        content: post.content || '',
        caption: post.caption || '',
        platforms: post.platforms?.map((p: any) => p.platform || p) || [],
        platformDetails: post.platforms || [],
        mediaUrls: post.mediaItems?.map((m: any) => m.url) || [],
        mediaItems: post.mediaItems || [],
        status: post.status || 'scheduled',
        scheduledFor: post.scheduledFor,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        profileId: post.profileId,
        profileName: profileMap.get(post.profileId) || 'Unknown Profile',
        latePostId: post._id || post.id
      })),
      // Local DB posts (that may not be in Late API)
      ...dbPosts
        .filter(p => !lateApiPosts.some((lp: any) => lp._id === p.latePostId || lp.id === p.latePostId))
        .map(post => ({
          id: post.id,
          source: 'local',
          content: post.content,
          caption: post.caption || '',
          platforms: post.platforms,
          platformDetails: [],
          mediaUrls: post.mediaUrls,
          mediaItems: post.mediaUrls.map(url => ({ url, type: url.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image' })),
          status: post.status.toLowerCase(),
          scheduledFor: post.scheduledAt?.toISOString(),
          publishedAt: post.postedAt?.toISOString(),
          createdAt: post.createdAt.toISOString(),
          profileId: null,
          profileName: 'Local',
          latePostId: post.latePostId
        }))
    ]

    // Sort by scheduled date
    combinedPosts.sort((a, b) => {
      const dateA = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0
      const dateB = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0
      return dateA - dateB
    })

    return NextResponse.json({
      posts: combinedPosts,
      total: combinedPosts.length,
      profiles: user.profiles.map(p => ({ id: p.id, name: p.name, lateProfileId: p.lateProfileId }))
    })

  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

