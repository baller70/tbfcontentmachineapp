
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

    // Verify the prompt belongs to this user before updating
    const existingPrompt = await prisma.savedPrompt.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const { title, prompt, category, folderId } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const updatedPrompt = await prisma.savedPrompt.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        prompt: prompt.trim(),
        category: category?.trim() || null,
        folderId: folderId || null
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      prompt: {
        id: updatedPrompt.id,
        title: updatedPrompt.title,
        prompt: updatedPrompt.prompt,
        category: updatedPrompt.category || '',
        folderId: updatedPrompt.folderId,
        folder: updatedPrompt.folder,
        createdAt: updatedPrompt.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to update prompt:', error)
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
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

    // Verify the prompt belongs to this user before deleting
    const prompt = await prisma.savedPrompt.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    await prisma.savedPrompt.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete prompt:', error)
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 })
  }
}
