
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
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

    const { isPublic } = await request.json()

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublic must be a boolean' },
        { status: 400 }
      )
    }

    // Check if template exists and belongs to user
    const template = await prisma.template.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (template.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this template' },
        { status: 403 }
      )
    }

    // Update visibility
    const updatedTemplate = await prisma.template.update({
      where: { id: params.id },
      data: { isPublic }
    })

    return NextResponse.json({
      success: true,
      isPublic: updatedTemplate.isPublic
    })
  } catch (error) {
    console.error('Error updating template visibility:', error)
    return NextResponse.json(
      { error: 'Failed to update visibility' },
      { status: 500 }
    )
  }
}
