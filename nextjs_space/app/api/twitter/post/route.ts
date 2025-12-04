
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTwitterCredentials, postTweetToTwitter, uploadMediaToTwitter } from '@/lib/twitter-api'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { text, mediaUrls } = await request.json()

    if (!text) {
      return Response.json({ success: false, error: 'Tweet text is required' }, { status: 400 })
    }

    // Get Twitter credentials
    const credentials = await getTwitterCredentials()
    if (!credentials) {
      return Response.json({ 
        success: false, 
        error: 'Twitter API credentials not configured' 
      }, { status: 500 })
    }

    // Upload media if provided
    const mediaIds: string[] = []
    if (mediaUrls && mediaUrls.length > 0) {
      try {
        for (const mediaUrl of mediaUrls.slice(0, 4)) { // Twitter allows max 4 media items
          const mediaId = await uploadMediaToTwitter(mediaUrl, credentials)
          mediaIds.push(mediaId)
        }
      } catch (error) {
        console.error('Media upload error:', error)
        return Response.json({ 
          success: false, 
          error: 'Failed to upload media to Twitter: ' + (error instanceof Error ? error.message : 'Unknown error')
        }, { status: 500 })
      }
    }

    // Post tweet
    const result = await postTweetToTwitter(text, mediaIds, credentials)

    if (result.success) {
      return Response.json({
        success: true,
        tweetId: result.tweetId,
        message: 'Tweet posted successfully'
      })
    } else {
      return Response.json({
        success: false,
        error: result.error || 'Failed to post tweet'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Twitter post error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
