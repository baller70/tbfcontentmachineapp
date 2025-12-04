
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET all teams for current user
export async function GET() {
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

    const teams = await prisma.team.findMany({
      where: { userId: user.id },
      include: {
        members: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Failed to fetch teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

// POST create new team
export async function POST(request: NextRequest) {
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

    const { name, description } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }

    // Get the highest order value
    const lastTeam = await prisma.team.findFirst({
      where: { userId: user.id },
      orderBy: { order: 'desc' }
    })

    const team = await prisma.team.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        order: (lastTeam?.order || 0) + 1
      },
      include: {
        members: true
      }
    })

    return NextResponse.json({ team })
  } catch (error: any) {
    console.error('Failed to create team:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A team with this name already exists' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
