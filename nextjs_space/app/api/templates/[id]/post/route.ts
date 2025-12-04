
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

// Read Late API key from secrets file
function getLateApiKey(): string | null {
  try {
    const secretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json'
    if (fs.existsSync(secretsPath)) {
      const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'))
      return secrets?.late?.secrets?.api_key?.value || null
    }
  } catch (error) {
    console.error('Error reading Late API key:', error)
  }
  return null
}

// Post content to social media platforms using Late API
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { content, caption, hashtags, platforms, mediaUrl, profileId } = body

    if (!content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Content and platforms are required' },
        { status: 400 }
      )
    }

    // Get Late API key
    const lateApiKey = getLateApiKey()
    if (!lateApiKey) {
      return NextResponse.json(
        { error: 'Late API key not configured' },
        { status: 500 }
      )
    }

    // Get profile with platform settings
    const profile = await prisma.profile.findFirst({
      where: {
        userId: user.id,
        ...(profileId ? { id: profileId } : { isDefault: true })
      },
      include: {
        platformSettings: {
          where: {
            isActive: true,
            isConnected: true
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'No active profile found' },
        { status: 404 }
      )
    }

    // Prepare post content
    const fullContent = `${content}\n\n${caption || ''}\n\n${hashtags || ''}`.trim()

    // Create post in database
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        content: fullContent,
        caption,
        hashtags,
        platforms,
        mediaUrls: mediaUrl ? [mediaUrl] : [],
        status: 'PENDING'
      }
    })

    // Post to Late API
    try {
      const lateResponse = await fetch('https://api.late.so/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lateApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: fullContent,
          platforms: platforms.map((p: string) => p.toLowerCase()),
          media: mediaUrl ? [mediaUrl] : [],
          profile_id: profile.lateProfileId,
          publish_now: true
        })
      })

      if (!lateResponse.ok) {
        const errorData = await lateResponse.json()
        throw new Error(errorData.message || 'Failed to post to Late API')
      }

      const lateData = await lateResponse.json()

      // Update post with Late post ID
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'POSTED',
          latePostId: lateData.id,
          postedAt: new Date()
        }
      })

      // Increment template usage
      await prisma.template.update({
        where: { id: params.id },
        data: {
          usageCount: {
            increment: 1
          }
        }
      })

      return NextResponse.json({
        success: true,
        postId: post.id,
        latePostId: lateData.id,
        message: 'Post published successfully'
      })
    } catch (lateError: any) {
      // Update post with error
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          errorMessage: lateError.message
        }
      })

      return NextResponse.json(
        { error: `Failed to post: ${lateError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error posting content:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to post content' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
