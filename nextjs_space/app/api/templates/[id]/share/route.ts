
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// Generate a shareable link for a template
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

    // Verify template ownership
    const template = await prisma.template.findUnique({
      where: { id: params.id }
    })

    if (!template || template.userId !== user.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Generate unique shareable link
    const shareToken = randomBytes(16).toString('hex')
    const shareableLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/template/${shareToken}`

    // Update template with shareable link
    const updatedTemplate = await prisma.template.update({
      where: { id: params.id },
      data: { shareableLink: shareToken }
    })

    return NextResponse.json({ 
      shareableLink,
      shareToken: updatedTemplate.shareableLink
    })
  } catch (error) {
    console.error('Error generating shareable link:', error)
    return NextResponse.json(
      { error: 'Failed to generate shareable link' },
      { status: 500 }
    )
  }
}

// Get template by share token
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const template = await prisma.template.findUnique({
      where: { shareableLink: token },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching shared template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
