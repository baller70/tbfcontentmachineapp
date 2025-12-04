
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Increment usage count for a template
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

    // Increment usage count
    const template = await prisma.template.update({
      where: { id: params.id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ 
      usageCount: template.usageCount 
    })
  } catch (error) {
    console.error('Error updating usage count:', error)
    return NextResponse.json(
      { error: 'Failed to update usage count' },
      { status: 500 }
    )
  }
}

// Get usage statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.template.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        usageCount: true,
        _count: {
          select: {
            graphics: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching usage statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
