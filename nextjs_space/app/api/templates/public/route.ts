
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

// GET all public templates (no authentication required)
export async function GET(request: NextRequest) {
  try {
    // Fetch all public templates
    const templates = await prisma.template.findMany({
      where: { 
        isPublic: true 
      },
      include: {
        _count: {
          select: {
            fields: true,
            graphics: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Generate fresh signed URLs for all templates
    const templatesWithFreshUrls = await Promise.all(
      templates.map(async (template) => {
        let freshImageUrl = template.imageUrl
        
        // Check if imageUrl is an S3 signed URL (contains amazonaws.com)
        if (template.imageUrl.includes('amazonaws.com')) {
          const s3Key = extractS3Key(template.imageUrl)
          if (s3Key) {
            try {
              // Generate a fresh signed URL (valid for 24 hours)
              freshImageUrl = await getFileUrl(s3Key, 86400)
            } catch (error) {
              console.error('Error generating fresh signed URL for template:', template.id, error)
              // If generation fails, keep the original URL
            }
          }
        }

        return {
          ...template,
          imageUrl: freshImageUrl,
          // Remove sensitive user data from public response
          user: {
            name: template.user.name || 'Anonymous'
          }
        }
      })
    )

    return NextResponse.json({ 
      templates: templatesWithFreshUrls,
      count: templatesWithFreshUrls.length
    })
  } catch (error) {
    console.error('Error fetching public templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
