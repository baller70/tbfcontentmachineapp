
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFile, getFileUrl } from '@/lib/s3'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
    if (!validTypes.includes(file.type)) {
      return Response.json({ error: 'Invalid file type. Supported: images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV, WebM)' }, { status: 400 })
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return Response.json({ error: 'File too large. Maximum size is 50MB' }, { status: 400 })
    }

    // Convert to buffer
    let buffer = Buffer.from(await file.arrayBuffer())
    const originalSize = buffer.length
    let wasCompressed = false
    let finalContentType = file.type
    let finalExtension = file.name.split('.').pop()
    
    // Auto-compress images if they're over 4.5 MB (Twitter limit is 5 MB)
    const isImage = file.type.startsWith('image/')
    const twitterImageLimit = 4.5 * 1024 * 1024 // 4.5 MB (buffer for Twitter's 5 MB limit)
    
    if (isImage && buffer.length > twitterImageLimit) {
      console.log(`🔄 Image size ${(buffer.length / 1024 / 1024).toFixed(2)} MB exceeds Twitter limit. Auto-compressing...`)
      
      try {
        let quality = 85
        let compressedBuffer = buffer
        
        // Progressive compression until we get under the limit
        while (compressedBuffer.length > twitterImageLimit && quality > 30) {
          compressedBuffer = await sharp(buffer)
            .resize(2048, 2048, { // Max dimensions for Twitter
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality, mozjpeg: true }) // Convert to JPEG for better compression
            .toBuffer()
          
          console.log(`  Tried quality ${quality}: ${(compressedBuffer.length / 1024 / 1024).toFixed(2)} MB`)
          
          if (compressedBuffer.length <= twitterImageLimit) {
            break
          }
          
          quality -= 10
        }
        
        if (compressedBuffer.length > twitterImageLimit) {
          return Response.json({ 
            error: `Unable to compress image below 4.5 MB. Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB. Please use a smaller image.`,
            originalSize,
            twitterLimit: twitterImageLimit
          }, { status: 400 })
        }
        
        buffer = compressedBuffer
        wasCompressed = true
        finalContentType = 'image/jpeg'
        finalExtension = 'jpg'
        
        console.log(`✅ Image auto-compressed: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(buffer.length / 1024 / 1024).toFixed(2)} MB (quality: ${quality})`)
        
      } catch (compressionError) {
        console.error('Image compression failed:', compressionError)
        return Response.json({ 
          error: 'Failed to compress image. Please try a smaller file.',
          details: compressionError instanceof Error ? compressionError.message : 'Unknown error'
        }, { status: 400 })
      }
    }
    
    // Warn about large videos (Twitter has different limits for videos)
    const isVideo = file.type.startsWith('video/')
    const twitterVideoLimit = 512 * 1024 * 1024 // 512 MB for Twitter
    
    if (isVideo && buffer.length > twitterVideoLimit) {
      return Response.json({ 
        error: `Video file is too large (${(buffer.length / 1024 / 1024).toFixed(2)} MB). Twitter supports videos up to 512 MB. Please compress your video before uploading.`,
        originalSize: buffer.length,
        twitterLimit: twitterVideoLimit
      }, { status: 400 })
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const fileName = `uploads/${timestamp}-${randomString}.${finalExtension}`

    // Upload to S3
    const cloud_storage_path = await uploadFile(buffer, fileName, finalContentType)
    
    // Get signed URL for immediate use
    const url = await getFileUrl(cloud_storage_path)

    // Return cloud_storage_path in the url field so the frontend can use it with the proxy
    return Response.json({
      success: true,
      url: cloud_storage_path, // Store the S3 key instead of signed URL
      signedUrl: url, // Include signed URL for backwards compatibility
      cloud_storage_path,
      fileName: file.name,
      fileSize: buffer.length,
      originalSize,
      wasCompressed,
      compressionRatio: wasCompressed ? ((1 - buffer.length / originalSize) * 100).toFixed(1) : null,
      contentType: finalContentType,
      message: wasCompressed 
        ? `Image automatically compressed from ${(originalSize / 1024 / 1024).toFixed(2)} MB to ${(buffer.length / 1024 / 1024).toFixed(2)} MB for Twitter compatibility` 
        : undefined
    })

  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
