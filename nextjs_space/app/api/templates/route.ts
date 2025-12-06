
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getFileUrl } from '@/lib/s3'
import { validateTemplateImageUrl, toCanvasSafeUrl } from '@/lib/image-url-validator'
import { getCurrentCompany } from '@/lib/company-utils'

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

// GET all templates for the user's current company
export async function GET(request: NextRequest) {
  try {
    const companyData = await getCurrentCompany()
    if (!companyData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, companyId } = companyData

    if (!companyId) {
      return NextResponse.json({ templates: [] })
    }

    const templates = await prisma.template.findMany({
      where: { userId, companyId },
      include: {
        _count: {
          select: {
            fields: true,
            graphics: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Generate fresh signed URLs for all templates
    const templatesWithFreshUrls = await Promise.all(
      templates.map(async (template: any) => {
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
          imageUrl: freshImageUrl
        }
      })
    )

    return NextResponse.json({ templates: templatesWithFreshUrls })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// Helper to strip new styling fields that may not exist in DB yet
function stripNewFields(fields: any[]) {
  const newFieldNames = [
    'rotation', 'zIndex', 'blendMode',
    'shadowEnabled', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY',
    'letterSpacing', 'lineHeight', 'textTransform',
    'borderRadius', 'borderWidth', 'borderColor',
    'effectType', 'effectIntensity'
  ]
  return fields.map(field => {
    const stripped = { ...field }
    // Remove fields that might not exist in DB
    newFieldNames.forEach(name => delete stripped[name])
    // Also remove id and templateId as they're auto-generated
    delete stripped.id
    delete stripped.templateId
    delete stripped.createdAt
    return stripped
  })
}

// CREATE a new template
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

    const body = await request.json()
    const { name, description, category, imageUrl, width, height, fields } = body

    if (!name || !category || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate and ensure image URL is canvas-safe
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

    // Try with all fields first, fall back to stripped fields if columns missing
    try {
      const template = await prisma.template.create({
        data: {
          userId,
          companyId,
          name,
          description,
          category,
          imageUrl: safeImageUrl,
          width: width || 1080,
          height: height || 1080,
          fields: {
            create: fields || []
          }
        }
      })

      return NextResponse.json({ template }, { status: 201 })
    } catch (error: any) {
      // If column doesn't exist, try with stripped fields
      if (error?.code === 'P2022' || error?.message?.includes('column') || error?.message?.includes('Unknown column')) {
        console.warn('Some TemplateField columns missing, using base fields only for create')

        const template = await prisma.template.create({
          data: {
            userId,
            companyId,
            name,
            description,
            category,
            imageUrl: safeImageUrl,
            width: width || 1080,
            height: height || 1080,
            fields: {
              create: stripNewFields(fields || [])
            }
          }
        })

        return NextResponse.json({ template }, { status: 201 })
      }
      throw error
    }
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
