
import { NextRequest, NextResponse } from 'next/server'
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
      return NextResponse.json({ success: true, folders: [] })
    }

    const folders = await prisma.promptFolder.findMany({
      where: { userId, companyId },
      include: {
        _count: {
          select: { prompts: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      folders: folders.map((f: any) => ({
        id: f.id,
        name: f.name,
        color: f.color,
        promptCount: f._count.prompts,
        createdAt: f.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Failed to fetch folders:', error)
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
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

    const { name, color } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Check for duplicate folder name
    const existing = await prisma.promptFolder.findFirst({
      where: {
        userId,
        companyId,
        name: name.trim()
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'A folder with this name already exists' }, { status: 400 })
    }

    const folder = await prisma.promptFolder.create({
      data: {
        userId,
        companyId,
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
        id: folder.id,
        name: folder.name,
        color: folder.color,
        promptCount: folder._count.prompts,
        createdAt: folder.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to create folder:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}
