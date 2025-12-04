
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT update team
export async function PUT(
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

    const { name, description } = await request.json()

    // Verify team belongs to user
    const existingTeam = await prisma.team.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const team = await prisma.team.update({
      where: { id: params.id },
      data: {
        name: name?.trim() || existingTeam.name,
        description: description?.trim() || null
      },
      include: {
        members: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json({ team })
  } catch (error: any) {
    console.error('Failed to update team:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A team with this name already exists' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

// DELETE team
export async function DELETE(
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

    await prisma.team.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
