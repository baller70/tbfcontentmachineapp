
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getCurrentCompany } from '@/lib/company-utils'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const companyData = await getCurrentCompany()
    if (!companyData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, companyId } = companyData

    if (!companyId) {
      return NextResponse.json({ success: true, prompts: [] })
    }

    // Get filter parameters
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    
    // Build where clause
    const where: any = { userId, companyId }
    if (folderId) {
      where.folderId = folderId === 'null' ? null : folderId
    }

    const prompts = await prisma.savedPrompt.findMany({
      where,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      prompts: prompts.map((p: any) => ({
        id: p.id,
        title: p.title,
        prompt: p.prompt,
        category: p.category || '',
        folderId: p.folderId,
        folder: p.folder,
        createdAt: p.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Failed to fetch prompts:', error)
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyData = await getCurrentCompany()
    if (!companyData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, companyId } = companyData

    if (!companyId) {
      return NextResponse.json({ error: 'No company selected' }, { status: 400 })
    }

    const { title, prompt, category } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const savedPrompt = await prisma.savedPrompt.create({
      data: {
        userId,
        companyId,
        title: title.trim(),
        prompt: prompt.trim(),
        category: category?.trim() || null
      }
    })

    return NextResponse.json({
      success: true,
      prompt: {
        id: savedPrompt.id,
        title: savedPrompt.title,
        prompt: savedPrompt.prompt,
        category: savedPrompt.category || '',
        createdAt: savedPrompt.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to save prompt:', error)
    return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 })
  }
}
