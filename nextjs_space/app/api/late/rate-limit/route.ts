import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

interface LateAPIPost {
  _id: string
  createdAt: string
  platforms: Array<{
    platform: string
    accountId: {
      _id: string
    }
    status: string
  }>
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's profiles with platform settings
    const profiles = await prisma.profile.findMany({
      where: { userId: user.id },
      include: {
        platformSettings: {
          where: {
            isConnected: true,
            platform: { notIn: ['twitter'] }
          }
        }
      }
    })

    if (profiles.length === 0) {
      return NextResponse.json({
        hasData: false,
        message: 'No profiles found'
      })
    }

    // Calculate 24 hours ago in EST (rolling window)
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000))
    
    // Format times for logging in EST
    const nowEST = now.toLocaleString('en-US', { timeZone: 'America/New_York' })
    const twentyFourHoursAgoEST = twentyFourHoursAgo.toLocaleString('en-US', { timeZone: 'America/New_York' })
    
    console.log(`🕐 Current time (EST): ${nowEST}`)
    console.log(`🕐 24 hours ago (EST): ${twentyFourHoursAgoEST}`)
    console.log(`📊 Rolling 24-hour window: Posts from ${twentyFourHoursAgoEST} to ${nowEST}`)

    // Get Late API key from auth secrets or env
    let LATE_API_KEY = process.env.LATE_API_KEY
    
    if (!LATE_API_KEY) {
      try {
        const fs = require('fs')
        const authSecrets = JSON.parse(fs.readFileSync('/home/ubuntu/.config/abacusai_auth_secrets.json', 'utf-8'))
        LATE_API_KEY = authSecrets.late?.secrets?.api_key?.value
      } catch (error) {
        console.error('Failed to read Late API key from auth secrets:', error)
      }
    }
    
    if (!LATE_API_KEY) {
      console.error('LATE_API_KEY not found in env or auth secrets')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const postsResponse = await axios.get(
      `https://getlate.dev/api/v1/posts`,
      {
        headers: {
          'Authorization': `Bearer ${LATE_API_KEY}`
        }
      }
    )

    const allPosts: LateAPIPost[] = postsResponse.data.posts || []
    
    // Filter to posts from the last 24 hours (rolling window)
    const recentPosts = allPosts.filter(post => {
      const postDate = new Date(post.createdAt)
      return postDate >= twentyFourHoursAgo
    })
    
    console.log(`📊 Rate Limit Check - Found ${allPosts.length} total posts, ${recentPosts.length} in the last 24 hours`)

    // Count posts by account ID and track oldest post per platform (for reset time calculation)
    const rateLimitData: Record<string, Record<string, number>> = {}
    const oldestPostTime: Record<string, Record<string, number>> = {}

    for (const post of recentPosts) {
      for (const platformData of post.platforms || []) {
        if (platformData.status === 'published' || platformData.status === 'scheduled') {
          const accountId = platformData.accountId?._id
          const platform = platformData.platform

          if (accountId && platform) {
            const postTime = new Date(post.createdAt).getTime()
            
            // Initialize tracking objects
            if (!rateLimitData[accountId]) {
              rateLimitData[accountId] = {}
              oldestPostTime[accountId] = {}
            }
            
            // Count the post
            rateLimitData[accountId][platform] = (rateLimitData[accountId][platform] || 0) + 1
            
            // Track oldest post time for this account+platform (for reset time)
            if (!oldestPostTime[accountId][platform] || postTime < oldestPostTime[accountId][platform]) {
              oldestPostTime[accountId][platform] = postTime
            }
          }
        }
      }
    }

    // Build response with all platforms
    const ALL_PLATFORMS = ['instagram', 'facebook', 'linkedin', 'threads', 'tiktok', 'bluesky', 'youtube']
    
    const profilesWithStatus = profiles.map(profile => {
      const platforms = ALL_PLATFORMS.map(platform => {
        const setting = profile.platformSettings.find(ps => ps.platform === platform)
        const accountId = setting?.platformId
        const count = accountId ? (rateLimitData[accountId]?.[platform] || 0) : 0
        const remaining = 8 - count
        
        let statusLevel: 'good' | 'warning' | 'critical' = 'good'
        if (remaining === 0) {
          statusLevel = 'critical'
        } else if (remaining <= 2) {
          statusLevel = 'warning'
        }

        // Calculate reset time (24 hours after oldest post in the rolling window)
        let resetTime: number | null = null
        let resetTimeFormatted: string | null = null
        
        if (accountId && oldestPostTime[accountId]?.[platform]) {
          const oldestTime = oldestPostTime[accountId][platform]
          resetTime = oldestTime + (24 * 60 * 60 * 1000) // 24 hours after oldest post
          
          const resetDate = new Date(resetTime)
          const hoursUntilReset = Math.max(0, Math.ceil((resetTime - now.getTime()) / (1000 * 60 * 60)))
          
          resetTimeFormatted = `${hoursUntilReset} hours (${resetDate.toLocaleString('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            month: 'numeric',
            day: 'numeric'
          })})`
        }

        return {
          platform,
          count,
          limit: 8,
          remaining,
          statusLevel,
          percentageUsed: Math.round((count / 8) * 100),
          resetTime,
          resetTimeFormatted
        }
      })

      // Calculate overall status for profile
      let overallStatus: 'good' | 'warning' | 'critical' = 'good'
      if (platforms.some(p => p.statusLevel === 'critical')) {
        overallStatus = 'critical'
      } else if (platforms.some(p => p.statusLevel === 'warning')) {
        overallStatus = 'warning'
      }

      return {
        profileId: profile.id,
        profileName: profile.name,
        platforms,
        overallStatus
      }
    })

    // Calculate overall status across all profiles
    let overallStatus: 'good' | 'warning' | 'critical' = 'good'
    if (profilesWithStatus.some(p => p.overallStatus === 'critical')) {
      overallStatus = 'critical'
    } else if (profilesWithStatus.some(p => p.overallStatus === 'warning')) {
      overallStatus = 'warning'
    }

    // Count platforms at limit
    let platformsAtLimit = 0
    let platformsWithWarning = 0
    
    for (const profile of profilesWithStatus) {
      for (const platform of profile.platforms) {
        if (platform.statusLevel === 'critical') {
          platformsAtLimit++
        } else if (platform.statusLevel === 'warning') {
          platformsWithWarning++
        }
      }
    }

    return NextResponse.json({
      hasData: true,
      profiles: profilesWithStatus,
      overallStatus,
      platformsAtLimit,
      platformsWithWarning,
      totalPlatformsTracked: profilesWithStatus.reduce((sum, p) => sum + p.platforms.length, 0)
    })
  } catch (error: any) {
    console.error('Error fetching Late rate limit status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rate limit status', details: error.message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
