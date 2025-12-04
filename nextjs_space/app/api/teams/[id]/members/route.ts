
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST create new team member
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

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Member name is required' }, { status: 400 })
    }

    // Get the highest order value for this team
    const lastMember = await prisma.teamMember.findFirst({
      where: { teamId: params.id },
      orderBy: { order: 'desc' }
    })

    const member = await prisma.teamMember.create({
      data: {
        teamId: params.id,
        name: name.trim(),
        handle: handle?.trim() || null,
        platform: platform || null,
        order: (lastMember?.order || 0) + 1
      }
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Failed to create member:', error)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
