
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET all generated graphics for the user
export async function GET(request: NextRequest) {
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

    const graphics = await prisma.generatedGraphic.findMany({
      where: { userId: user.id },
      include: {
        template: {
          select: {
            name: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ graphics })
  } catch (error) {
    console.error('Error fetching graphics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch graphics' },
      { status: 500 }
    )
  }
}

// CREATE a new generated graphic
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

    const body = await request.json()
    const { templateId, name, imageUrl, formData, width, height } = body

    if (!templateId || !name || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const graphic = await prisma.generatedGraphic.create({
      data: {
        userId: user.id,
        templateId,
        name,
        imageUrl,
        formData,
        width: width || 1080,
        height: height || 1080
      }
    })

    return NextResponse.json({ graphic }, { status: 201 })
  } catch (error) {
    console.error('Error creating graphic:', error)
    return NextResponse.json(
      { error: 'Failed to create graphic' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
