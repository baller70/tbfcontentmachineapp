import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getFileUrl } from '@/lib/s3'
import { readFile } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

// Helper function to extract S3 key from signed URL
function extractS3Key(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    return pathname.startsWith('/') ? pathname.substring(1) : pathname
  } catch {
    return null
  }
}

// GET template image with proper CORS headers
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to get session but don't require it for public templates
    const session = await getServerSession(authOptions)
    
    let userId: string | null = null
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      userId = user?.id || null
    }

    // Find template - allow public templates or user's own templates
    const template = await prisma.template.findFirst({
      where: {
        id: params.id,
        OR: [
          { isPublic: true },
          ...(userId ? [{ userId }] : [])
        ]
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    let imageBuffer: ArrayBuffer
    let contentType = 'image/png'

    // Handle different image URL types
    if (template.imageUrl.startsWith('/')) {
      // Relative path (local file) - read directly from filesystem
      try {
        const publicDir = join(process.cwd(), 'public')
        const filePath = join(publicDir, template.imageUrl)
        const fileBuffer = await readFile(filePath)
        imageBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
        
        // Determine content type from file extension
        if (template.imageUrl.endsWith('.jpg') || template.imageUrl.endsWith('.jpeg')) {
          contentType = 'image/jpeg'
        } else if (template.imageUrl.endsWith('.png')) {
          contentType = 'image/png'
        } else if (template.imageUrl.endsWith('.gif')) {
          contentType = 'image/gif'
        } else if (template.imageUrl.endsWith('.webp')) {
          contentType = 'image/webp'
        }
      } catch (error) {
        console.error(`Failed to read local file ${template.imageUrl}:`, error)
        return NextResponse.json({ 
          error: 'Failed to read image file',
          details: error instanceof Error ? error.message : 'Unknown error',
          path: template.imageUrl 
        }, { status: 500 })
      }
    } else {
      // Remote URL (S3 or external) - fetch over HTTP
      let imageUrl = template.imageUrl
      
      if (template.imageUrl.includes('amazonaws.com')) {
        // S3 hosted image - generate fresh signed URL
        const s3Key = extractS3Key(template.imageUrl)
        if (s3Key) {
          imageUrl = await getFileUrl(s3Key, 86400)
        }
      }
      // else: already an absolute URL (e.g., placehold.co)

      // Fetch the image
      try {
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image from ${imageUrl}: ${imageResponse.status} ${imageResponse.statusText}`)
          return NextResponse.json({ 
            error: 'Failed to fetch image',
            details: `Status: ${imageResponse.status}`,
            url: imageUrl 
          }, { status: 500 })
        }

        imageBuffer = await imageResponse.arrayBuffer()
        contentType = imageResponse.headers.get('content-type') || 'image/png'
      } catch (error) {
        console.error(`Failed to fetch image from ${imageUrl}:`, error)
        return NextResponse.json({ 
          error: 'Failed to fetch image',
          details: error instanceof Error ? error.message : 'Unknown error',
          url: imageUrl 
        }, { status: 500 })
      }
    }

    // Return image with CORS headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (error) {
    console.error('Error fetching template image:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
