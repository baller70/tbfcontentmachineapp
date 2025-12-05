
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getTwitterCredentials, postTweetToTwitter, uploadMediaToTwitter } from '@/lib/twitter-api'
import { recordLatePost, canPostToLatePlatform } from '@/lib/late-rate-limit'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { profileId, content, caption, hashtags, platforms, mediaUrls, scheduledAt } = await request.json()

    if (!content || !platforms || platforms.length === 0) {
      return new Response('Missing required fields', { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    // Fetch the profile if profileId is provided
    let profile = null
    let platformSettings: any[] = []
    if (profileId) {
      profile = await prisma.profile.findFirst({
        where: {
          id: profileId,
          userId: user.id
        },
        include: {
          platformSettings: true
        }
      })

      if (!profile) {
        return new Response('Profile not found', { status: 404 })
      }
      
      platformSettings = profile.platformSettings || []
      
      console.log(`📋 Selected Profile: "${profile.name}" (ID: ${profile.id})`)
      console.log(`   Late Profile ID: ${profile.lateProfileId || 'Not set'}`)
      console.log(`   Platform Settings:`, platformSettings.map(ps => ({
        platform: ps.platform,
        platformId: ps.platformId,
        isConnected: ps.isConnected
      })))
    } else {
      console.log('⚠️  No profile selected')
    }

    // Create post in database first
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        content,
        caption: caption || null,
        hashtags: hashtags || null,
        platforms,
        mediaUrls: mediaUrls || [],
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null
      }
    })

    // Always post to Late API (whether scheduled or immediate)
    try {
      // Prepare scheduling information for Late API
      let scheduledFor: string | undefined = undefined;
      let timezone: string | undefined = undefined;
      
      if (scheduledAt) {
        // Convert scheduledAt to ISO 8601 format for Late API
        scheduledFor = new Date(scheduledAt).toISOString();
        // Default to Eastern Time if not specified
        timezone = 'America/New_York';
        console.log(`📅 Scheduling post for: ${scheduledFor} (${timezone})`);
      }
      
      const lateApiResponse = await postToLateApi({
        content,
        caption,
        hashtags,
        platforms,
        mediaUrls,
        profileLateId: profile?.lateProfileId || null,
        profileName: profile?.name || null,
        platformSettings,
        scheduledFor,
        timezone
      })

      if (lateApiResponse.success) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: scheduledAt ? 'SCHEDULED' : 'POSTED',
            postedAt: scheduledAt ? null : new Date(),
            latePostId: lateApiResponse.postId,
            metadata: lateApiResponse.metadata
          }
        })

        return Response.json({
          success: true,
          message: lateApiResponse.warning || (scheduledAt ? 'Post scheduled successfully' : 'Post published successfully'),
          postId: post.id,
          latePostId: lateApiResponse.postId,
          warning: lateApiResponse.warning,
          scheduledAt: scheduledAt || undefined
        })
      } else {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            errorMessage: lateApiResponse.error
          }
        })

        return Response.json({
          success: false,
          message: scheduledAt ? 'Failed to schedule post' : 'Failed to publish post',
          error: lateApiResponse.error
        }, { status: 400 })
      }
    } catch (error) {
      console.error('Late API error:', error)
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          errorMessage: 'API call failed'
        }
      })

      return Response.json({
        success: false,
        message: 'Failed to post to Late API',
        error: 'API call failed'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Post creation error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

async function postToLateApi(postData: {
  content: string
  caption?: string
  hashtags?: string
  platforms: string[]
  mediaUrls?: string[]
  profileLateId?: string | null
  profileName?: string | null
  platformSettings?: any[]
  scheduledFor?: string
  timezone?: string
}) {
  try {
    const { content, caption, hashtags, platforms, mediaUrls, profileLateId, profileName, platformSettings = [], scheduledFor, timezone } = postData

    // Combine content elements
    let fullContent = content
    if (caption) {
      fullContent += '\n\n' + caption
    }
    if (hashtags) {
      fullContent += '\n\n' + hashtags
    }

    // Check if Twitter is in platforms - handle it separately with direct API
    const hasTwitter = platforms.some(p => p.toLowerCase() === 'twitter' || p.toLowerCase() === 'x')
    const otherPlatforms = platforms.filter(p => p.toLowerCase() !== 'twitter' && p.toLowerCase() !== 'x')
    
    let twitterResult: any = null
    
    // Handle Twitter posting directly
    if (hasTwitter) {
      try {
        console.log(`📱 Posting to Twitter for profile: ${profileName || 'default'}`)
        const credentials = await getTwitterCredentials(profileName || undefined)
        if (!credentials) {
          twitterResult = {
            platform: 'twitter',
            status: 'failed',
            error: 'Twitter API credentials not configured'
          }
        } else {
          // Upload media if provided
          const mediaIds: string[] = []
          if (mediaUrls && mediaUrls.length > 0) {
            try {
              for (const mediaUrl of mediaUrls.slice(0, 4)) { // Twitter allows max 4 media items
                const mediaId = await uploadMediaToTwitter(mediaUrl, credentials)
                mediaIds.push(mediaId)
              }
            } catch (mediaError) {
              console.error('Twitter media upload error:', mediaError)
              twitterResult = {
                platform: 'twitter',
                status: 'failed',
                error: 'Failed to upload media: ' + (mediaError instanceof Error ? mediaError.message : 'Unknown error')
              }
            }
          }
          
          // Only post tweet if media upload succeeded (or no media)
          if (!twitterResult) {
            const result = await postTweetToTwitter(fullContent, mediaIds, credentials)
            
            if (result.success) {
              twitterResult = {
                platform: 'twitter',
                status: 'published',
                tweetId: result.tweetId
              }
              console.log('✅ Twitter post successful:', result.tweetId)
            } else {
              twitterResult = {
                platform: 'twitter',
                status: 'failed',
                error: result.error || 'Failed to post to Twitter'
              }
              console.error('❌ Twitter post failed:', result.error)
            }
          }
        }
      } catch (error) {
        twitterResult = {
          platform: 'twitter',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Twitter API error'
        }
        console.error('❌ Twitter API call error:', error)
      }
    }
    
    // If no other platforms, return Twitter result only
    if (otherPlatforms.length === 0 && twitterResult) {
      if (twitterResult.status === 'published') {
        return {
          success: true,
          postId: twitterResult.tweetId,
          metadata: { platformResults: [twitterResult] }
        }
      } else {
        return {
          success: false,
          error: `Twitter: ${twitterResult.error}`
        }
      }
    }

    // If there are other platforms besides Twitter, use Late API for them
    if (otherPlatforms.length > 0) {
      // Use profile-specific Late profile ID if provided, otherwise fall back to env var (for backward compatibility)
      const lateProfileIdToUse = profileLateId || process.env.LATE_PROFILE_ID

      if (!lateProfileIdToUse) {
        // If only Twitter failed and no Late platforms, return Twitter error
        if (twitterResult && twitterResult.status === 'failed') {
          return {
            success: false,
            error: `Twitter: ${twitterResult.error}`
          }
        }
        return {
          success: false,
          error: 'Late Profile ID not configured for this profile. Please add it in Settings.'
        }
      }

      // Check if Instagram or YouTube is in the platforms list - both require media
      const hasInstagram = otherPlatforms.some(p => p.toLowerCase() === 'instagram')
      const hasYouTube = otherPlatforms.some(p => p.toLowerCase() === 'youtube')
      
      if (hasInstagram && (!mediaUrls || mediaUrls.length === 0)) {
        return {
          success: false,
          error: 'Instagram posts require at least one image or video. Please upload media or remove Instagram from selected platforms.'
        }
      }
      
      if (hasYouTube && (!mediaUrls || mediaUrls.length === 0)) {
        return {
          success: false,
          error: 'YouTube posts require video content. Please upload a video or remove YouTube from selected platforms.'
        }
      }
      
      // Check if YouTube has video (not just images)
      if (hasYouTube && mediaUrls && mediaUrls.length > 0) {
        const hasVideo = mediaUrls.some(url => url.match(/\.(mp4|mov|avi|webm|mkv|flv)$/i))
        if (!hasVideo) {
          return {
            success: false,
            error: 'YouTube requires video content (MP4, MOV, AVI, WEBM, etc.). Please upload a video file or remove YouTube from selected platforms.'
          }
        }
      }

      // Use platformSettings to map platform names to Late account IDs
      const missingPlatforms: string[] = []
      const disconnectedPlatforms: string[] = []
      
      const platformAccounts = otherPlatforms.map(platform => {
        // Find the platform setting for this platform
        const setting = platformSettings.find((ps: any) => 
          ps.platform?.toLowerCase() === platform.toLowerCase()
        )
        
        if (!setting) {
          console.warn(`No platform setting found for: ${platform}`)
          missingPlatforms.push(platform)
          return null
        }

        // Check if platform is connected
        if (!setting.isConnected || !setting.platformId) {
          console.warn(`Platform ${platform} is not connected or has no platformId`)
          disconnectedPlatforms.push(platform)
          return null
        }

        // Skip platforms with generic IDs (not actual Late account IDs)
        if (setting.platformId === platform.toLowerCase() || 
            setting.platformId === 'bluesky' || 
            setting.platformId === 'twitter' ||
            setting.platformId === 'tiktok' ||
            setting.platformId === 'linkedin') {
          console.warn(`Platform ${platform} has placeholder ID, not a real Late account ID`)
          disconnectedPlatforms.push(platform)
          return null
        }

        console.log(`✅ ${platform}: Using Late account ID ${setting.platformId}`)

        return {
          platform: platform.toLowerCase(),
          accountId: setting.platformId  // This is the actual Late account ID from the database
        }
      }).filter(Boolean)

      if (platformAccounts.length === 0) {
        const allMissing = [...missingPlatforms, ...disconnectedPlatforms]
        // If Twitter succeeded but no Late platforms available
        if (twitterResult && twitterResult.status === 'published') {
          return {
            success: true,
            postId: twitterResult.tweetId,
            metadata: { platformResults: [twitterResult] },
            warning: `Posted to Twitter, but no accounts connected for: ${allMissing.join(', ')}. Please connect these platforms in Settings and sync with Late.`
          }
        }
        return {
          success: false,
          error: `No accounts connected for: ${allMissing.join(', ')}. Please connect these platforms in Settings and sync with Late.`
        }
      }

      // If some platforms are missing/disconnected, warn the user
      const allIssues = [...missingPlatforms, ...disconnectedPlatforms]
      if (allIssues.length > 0) {
        console.warn(`Some platforms not connected: ${allIssues.join(', ')}`)
        // Continue with available platforms
      }

      // Build the payload - Following Late API documentation format
      const payload: any = {
        content: fullContent,
        platforms: platformAccounts
      }

      // Add media if provided - must be "mediaItems" not "media"
      if (mediaUrls && mediaUrls.length > 0) {
        payload.mediaItems = mediaUrls.map(url => {
          // Determine if it's an image or video based on extension
          const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i)
          return {
            type: isVideo ? 'video' : 'image',
            url: url
          }
        })
      }

      // Add scheduling information if provided (using correct Late API field names per documentation)
      if (scheduledFor) {
        payload.scheduledFor = scheduledFor; // ISO 8601 format (e.g., "2023-10-15T14:00:00Z")
        console.log(`⏰ Scheduling post for: ${scheduledFor}`);
      } else {
        // For immediate posting, set publishNow: true (required by Late API)
        payload.publishNow = true;
        console.log(`🚀 Publishing immediately (publishNow: true)`);
      }
      if (timezone) {
        payload.timezone = timezone; // e.g., "America/New_York"
        console.log(`🌍 Timezone: ${timezone}`);
      }

      console.log('Posting to Late API with payload:', JSON.stringify(payload, null, 2))

      const response = await fetch('https://getlate.dev/api/v1/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LATE_API_KEY}`
        },
        body: JSON.stringify(payload)
      })

      // Handle non-JSON responses gracefully
      const contentType = response.headers.get('content-type')
      let data: any

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // Response is not JSON - likely an error message
        const textResponse = await response.text()
        console.error('Late API returned non-JSON response:', textResponse)
        return {
          success: false,
          error: `Late API error (${response.status}): ${textResponse.substring(0, 200)}`
        }
      }

      console.log('Late API response:', JSON.stringify(data, null, 2))

      if (response.ok) {
        // Combine Twitter result with Late API results
        let allPlatformResults = data.platformResults || []
        if (twitterResult) {
          allPlatformResults = [twitterResult, ...allPlatformResults]
        }

        // Check if any platforms failed
        const failedPlatforms = allPlatformResults.filter((p: any) => p.status === 'failed')
        const successPlatforms = allPlatformResults.filter((p: any) => p.status === 'published')
        
        // Record successful posts for rate limit tracking
        if (successPlatforms.length > 0 && profileLateId && profileName) {
          for (const platform of successPlatforms) {
            // Only track platforms that went through Late API (not Twitter)
            if (platform.platform && platform.platform.toLowerCase() !== 'twitter') {
              recordLatePost(platform.platform, profileLateId, profileName)
            }
          }
        }
        
        if (failedPlatforms.length > 0 && successPlatforms.length === 0) {
          // All platforms failed
          const errorMessages = failedPlatforms.map((p: any) => {
            // Check for common connection/authentication errors
            if (p.error?.includes('No account found') || p.error?.includes('not connected')) {
              return `${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}: Account not connected. Please connect at https://getlate.dev/accounts`
            }
            // Check for Facebook token errors
            if (p.platform === 'facebook' && (p.error?.includes('page access token') || p.error?.includes('token') || p.error?.includes('admin access'))) {
              return `Facebook: Connection expired or lost page access. Please reconnect your Facebook account at https://getlate.dev/accounts`
            }
            // Check for TikTok/YouTube specific errors
            if (p.platform === 'tiktok' && p.error?.includes('fetch failed')) {
              return `TikTok: Unable to post video. TikTok requires videos to be uploaded directly through their API, which is currently experiencing issues. Please try again later or post directly to TikTok.`
            }
            if (p.platform === 'youtube') {
              if (p.error?.includes('quota exceeded')) {
                return `YouTube: Daily upload quota exceeded. YouTube API limits uploads per day. Please try again tomorrow or contact YouTube support to increase your quota.`
              }
              if (p.error?.includes('fetch failed') || p.error?.includes('No account found')) {
                return `YouTube: Account not connected or unable to upload. Please connect your YouTube account at https://getlate.dev/accounts`
              }
              if (p.error?.includes('require video') || p.error?.includes('video content')) {
                return `YouTube: Requires video content. Upload a video file (MP4, MOV, etc.)`
              }
            }
            return `${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}: ${p.error || 'Unknown error'}`
          })
          
          return {
            success: false,
            error: errorMessages.join('\n\n'),
            platformResults: failedPlatforms
          }
        } else if (failedPlatforms.length > 0) {
          // Some platforms failed
          const errorMessages = failedPlatforms.map((p: any) => {
            if (p.error?.includes('No account found') || p.error?.includes('not connected')) {
              return `${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}: Not connected`
            }
            if (p.platform === 'facebook' && (p.error?.includes('token') || p.error?.includes('admin access'))) {
              return `Facebook: Connection expired - reconnect at getlate.dev`
            }
            if (p.platform === 'tiktok' && p.error?.includes('fetch failed')) {
              return `TikTok: API issue`
            }
            if (p.platform === 'youtube') {
              if (p.error?.includes('quota exceeded')) {
                return `YouTube: Quota exceeded`
              }
              if (p.error?.includes('fetch failed') || p.error?.includes('No account found')) {
                return `YouTube: Not connected`
              }
              if (p.error?.includes('require video') || p.error?.includes('video content')) {
                return `YouTube: Needs video file`
              }
            }
            return `${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}: ${p.error || 'Unknown error'}`
          })
          
          return {
            success: true,
            postId: twitterResult?.tweetId || data.post?._id || data.id || data.postId,
            metadata: { ...data, platformResults: allPlatformResults },
            warning: `Posted to ${successPlatforms.length} platform(s), but failed for: ${errorMessages.join(', ')}. Connect missing platforms at https://getlate.dev/accounts`
          }
        }
        
        return {
          success: true,
          postId: twitterResult?.tweetId || data.post?._id || data.id || data.postId,
          metadata: { ...data, platformResults: allPlatformResults }
        }
      } else {
        // Late API returned error, but Twitter might have succeeded
        if (twitterResult && twitterResult.status === 'published') {
          return {
            success: true,
            postId: twitterResult.tweetId,
            metadata: { platformResults: [twitterResult] },
            warning: `Posted to Twitter, but Late API failed for other platforms: ${data.message || data.error || 'Unknown error'}`
          }
        }
        
        // Check for account connection errors in the main error response
        if (data.message?.includes('No account found') || data.error?.includes('No account found')) {
          return {
            success: false,
            error: `${data.message || data.error}\n\nPlease connect your accounts at https://getlate.dev/accounts`
          }
        }
        
        return {
          success: false,
          error: data.message || data.error || JSON.stringify(data)
        }
      }
    } else {
      // No other platforms to post to, and we already handled Twitter-only case above
      // This shouldn't happen, but just in case
      return {
        success: false,
        error: 'No platforms to post to'
      }
    }
  } catch (error) {
    console.error('API call error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to call API'
    }
  }
}

export const dynamic = 'force-dynamic'
