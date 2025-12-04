
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT update team member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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

    // Verify team belongs to user
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const { name, handle, platform } = await request.json()

    const member = await prisma.teamMember.update({
      where: { id: params.memberId },
      data: {
        name: name?.trim(),
        handle: handle?.trim() || null,
        platform: platform || null
      }
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Failed to update member:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

// DELETE team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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

    // Verify team belongs to user
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    await prisma.teamMember.delete({
      where: { id: params.memberId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete member:', error)
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
