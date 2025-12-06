
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient, Prisma } from '@prisma/client'
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

// Base fields that are guaranteed to exist in the database
const BASE_FIELD_SELECT = {
  id: true,
  templateId: true,
  fieldName: true,
  fieldLabel: true,
  fieldType: true,
  x: true,
  y: true,
  width: true,
  height: true,
  fontSize: true,
  fontFamily: true,
  fontColor: true,
  fontWeight: true,
  textAlign: true,
  defaultValue: true,
  isRequired: true,
  order: true,
  createdAt: true,
  opacity: true,
  imagePreview: true,
  visible: true,
  videoPreview: true,
}

// Helper to safely fetch template fields with fallback for missing columns
async function fetchTemplateFields(templateId: string) {
  try {
    // Try to fetch with all fields including new styling fields
    const fields = await prisma.templateField.findMany({
      where: { templateId },
      orderBy: { order: 'asc' }
    })
    return fields
  } catch (error: any) {
    // If column doesn't exist error, fall back to base fields only
    if (error?.code === 'P2022' || error?.message?.includes('column') || error?.message?.includes('Unknown column')) {
      console.warn('Some TemplateField columns missing, using base fields only')
      const fields = await prisma.templateField.findMany({
        where: { templateId },
        select: BASE_FIELD_SELECT,
        orderBy: { order: 'asc' }
      })
      // Add default values for new fields
      return fields.map(f => ({
        ...f,
        rotation: 0,
        zIndex: 0,
        blendMode: 'normal',
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 4,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        letterSpacing: 0,
        lineHeight: 1.2,
        textTransform: 'none',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#000000',
        effectType: null,
        effectIntensity: 50,
      }))
    }
    throw error
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

    // Fetch template without fields first
    const template = await prisma.template.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: user.id },
          { isPublic: true }
        ]
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Fetch fields separately with fallback handling
    const fields = await fetchTemplateFields(params.id)

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
        fields,
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

    // If imageUrl is being updated, validate and ensure it's canvas-safe
    let safeImageUrl = imageUrl
    if (imageUrl) {
      const validation = validateTemplateImageUrl(imageUrl)

      if (!validation.valid) {
        console.warn(`⚠️ Template image URL validation: ${validation.message}`)
        console.warn(`Original URL: ${imageUrl}`)

        // Auto-fix by using proxy URL
        if (validation.fixedUrl) {
          safeImageUrl = validation.fixedUrl
          console.warn(`Auto-fixed URL: ${safeImageUrl}`)
        }
      }
    }

    // Try to update with all fields first, fall back to base fields if needed
    try {
      // Update template and fields
      const template = await prisma.template.update({
        where: { id: params.id },
        data: {
          name,
          description,
          category,
          ...(imageUrl && { imageUrl: safeImageUrl }),
          fields: {
            deleteMany: {},
            create: fields || []
          }
        }
      })

      // Fetch fields with fallback handling
      const updatedFields = await fetchTemplateFields(params.id)

      return NextResponse.json({ template: { ...template, fields: updatedFields } })
    } catch (error: any) {
      // If column doesn't exist, try with stripped fields
      if (error?.code === 'P2022' || error?.message?.includes('column') || error?.message?.includes('Unknown column')) {
        console.warn('Some TemplateField columns missing, using base fields only for update')

        const template = await prisma.template.update({
          where: { id: params.id },
          data: {
            name,
            description,
            category,
            ...(imageUrl && { imageUrl: safeImageUrl }),
            fields: {
              deleteMany: {},
              create: stripNewFields(fields || [])
            }
          }
        })

        // Fetch fields with fallback handling
        const updatedFields = await fetchTemplateFields(params.id)

        return NextResponse.json({ template: { ...template, fields: updatedFields } })
      }
      throw error
    }
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
