

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getFileUrl } from '@/lib/s3'

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

// GET single public template with fields (no authentication required)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.template.findFirst({
      where: {
        id: params.id,
        isPublic: true
      },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            fields: true,
            graphics: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

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
        imageUrl: freshImageUrl
      }
    })
  } catch (error) {
    console.error('Error fetching public template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

