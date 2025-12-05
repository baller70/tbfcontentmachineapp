import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const LATE_API_KEY = process.env.LATE_API_KEY

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId, newScheduledTime, timezone } = await request.json()

    if (!postId || !newScheduledTime) {
      return NextResponse.json({ error: 'Missing postId or newScheduledTime' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Try to reschedule via Late API first
    if (LATE_API_KEY) {
      try {
        const lateResponse = await fetch(`https://getlate.dev/api/v1/posts/${postId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${LATE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scheduledFor: new Date(newScheduledTime).toISOString(),
            timezone: timezone || 'America/New_York'
          })
        })

        if (lateResponse.ok) {
          const data = await lateResponse.json()
          console.log(`✅ Post ${postId} rescheduled via Late API to ${newScheduledTime}`)
          
          // Also update local database if we have a matching post
          await prisma.post.updateMany({
            where: {
              userId: user.id,
              latePostId: postId
            },
            data: {
              scheduledAt: new Date(newScheduledTime)
            }
          })

          return NextResponse.json({
            success: true,
            message: 'Post rescheduled successfully',
            post: data.post || data
          })
        } else {
          const errorText = await lateResponse.text()
          console.error('Late API reschedule failed:', errorText)
          
          // If Late API fails, try to update local database
          const localUpdate = await prisma.post.updateMany({
            where: {
              userId: user.id,
              OR: [
                { id: postId },
                { latePostId: postId }
              ]
            },
            data: {
              scheduledAt: new Date(newScheduledTime)
            }
          })

          if (localUpdate.count > 0) {
            return NextResponse.json({
              success: true,
              message: 'Post rescheduled locally (Late API unavailable)',
              warning: 'Late API update failed - post may not be rescheduled on Late'
            })
          }

          return NextResponse.json({ 
            error: `Failed to reschedule: ${errorText}` 
          }, { status: 400 })
        }
      } catch (error) {
        console.error('Error calling Late API:', error)
      }
    }

    // Fallback: Update local database only
    const localUpdate = await prisma.post.updateMany({
      where: {
        userId: user.id,
        OR: [
          { id: postId },
          { latePostId: postId }
        ]
      },
      data: {
        scheduledAt: new Date(newScheduledTime)
      }
    })

    if (localUpdate.count > 0) {
      return NextResponse.json({
        success: true,
        message: 'Post rescheduled locally',
        warning: 'Late API not configured - post only updated locally'
      })
    }

    return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  } catch (error) {
    console.error('Error rescheduling post:', error)
    return NextResponse.json({ error: 'Failed to reschedule post' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

