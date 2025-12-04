
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    const existingFolder = await prisma.promptFolder.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    const { name, color } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Check for duplicate folder name (excluding current folder)
    const duplicate = await prisma.promptFolder.findFirst({
      where: {
        userId: user.id,
        companyId: existingFolder.companyId,
        name: name.trim(),
        id: { not: params.id }
      }
    })

    if (duplicate) {
      return NextResponse.json({ error: 'A folder with this name already exists' }, { status: 400 })
    }

    const updatedFolder = await prisma.promptFolder.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        color: color?.trim() || null
      },
      include: {
        _count: {
          select: { prompts: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.name,
        color: updatedFolder.color,
        promptCount: updatedFolder._count.prompts,
        createdAt: updatedFolder.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to update folder:', error)
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 })
  }
}

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

    const folder = await prisma.promptFolder.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Delete the folder (prompts will have their folderId set to null due to onDelete: SetNull)
    await prisma.promptFolder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete folder:', error)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}
