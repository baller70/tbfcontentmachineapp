
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getFileUrl } from '@/lib/s3'
import { validateTemplateImageUrl, toCanvasSafeUrl } from '@/lib/image-url-validator'

const prisma = new PrismaClient()

// Helper function to extract S3 key from signed URL
function extractS3Key(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    // Remove leading slash
    return pathname.startsWith('/') ? pathname.substring(1) : pathname
  } catch {
    return null
  }
}

// GET single template
export async function GET(
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

    // First check if template exists and is either owned by user OR is public
    const template = await prisma.template.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: user.id },
          { isPublic: true }
        ]
      },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    
    // Check if user owns this template
    const isOwner = template.userId === user.id

    // Generate fresh signed URL for template image
    let freshImageUrl = template.imageUrl
    
    // Check if imageUrl is an S3 signed URL (contains amazonaws.com)
    if (template.imageUrl.includes('amazonaws.com')) {
      const s3Key = extractS3Key(template.imageUrl)
      if (s3Key) {
        try {
          // Generate a fresh signed URL (valid for 24 hours)
          freshImageUrl = await getFileUrl(s3Key, 86400)
        } catch (error) {
          console.error('Error generating fresh signed URL:', error)
          // If generation fails, keep the original URL
        }
      }
    }

    return NextResponse.json({ 
      template: {
        ...template,
        imageUrl: freshImageUrl,
        isOwner
      }
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// UPDATE template
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

    const body = await request.json()
    const { name, description, category, imageUrl, fields } = body

    // Verify ownership
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      name,
      description,
      category,
      fields: {
        deleteMany: {},
        create: fields || []
      }
    }

    // If imageUrl is being updated, validate and ensure it's canvas-safe
    if (imageUrl) {
      const validation = validateTemplateImageUrl(imageUrl)
      let safeImageUrl = imageUrl
      
      if (!validation.valid) {
        console.warn(`⚠️ Template image URL validation: ${validation.message}`)
        console.warn(`Original URL: ${imageUrl}`)
        
        // Auto-fix by using proxy URL
        if (validation.fixedUrl) {
          safeImageUrl = validation.fixedUrl
          console.warn(`Auto-fixed URL: ${safeImageUrl}`)
        }
      }
      
      updateData.imageUrl = safeImageUrl
    }

    // Update template and fields
    const template = await prisma.template.update({
      where: { id: params.id },
      data: updateData,
      include: {
        fields: true
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE template
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

    // Verify ownership
    const template = await prisma.template.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await prisma.template.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
