
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get specific schedule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const schedule = await prisma.postSchedule.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        post: true
      }
    })

    if (!schedule) {
      return new Response('Schedule not found', { status: 404 })
    }

    return Response.json({ schedule })

  } catch (error) {
    console.error('Fetch schedule error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

// PUT - Update schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const updateData = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    const schedule = await prisma.postSchedule.updateMany({
      where: {
        id: params.id,
        userId: user.id
      },
      data: {
        ...updateData,
        scheduledAt: updateData.scheduledAt ? new Date(updateData.scheduledAt) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        updatedAt: new Date()
      }
    })

    if (schedule.count === 0) {
      return new Response('Schedule not found', { status: 404 })
    }

    return Response.json({
      success: true,
      message: 'Schedule updated successfully'
    })

  } catch (error) {
    console.error('Update schedule error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

// DELETE - Cancel/Delete schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const schedule = await prisma.postSchedule.updateMany({
      where: {
        id: params.id,
        userId: user.id
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    if (schedule.count === 0) {
      return new Response('Schedule not found', { status: 404 })
    }

    return Response.json({
      success: true,
      message: 'Schedule cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel schedule error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
