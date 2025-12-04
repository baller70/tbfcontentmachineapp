
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sharp from 'sharp'

// Increase body size limit for video uploads
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for upload

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    let file = formData.get('file') as File
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const lateApiKey = process.env.LATE_API_KEY
    if (!lateApiKey) {
      return Response.json({ error: 'Late API key not configured' }, { status: 500 })
    }

    // Validate file type
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/avi', 'video/webm', 'video/mpeg'
    ]
    
    if (!validTypes.includes(file.type)) {
      return Response.json({ 
        error: 'Invalid file type. Supported: JPG, PNG, GIF, WebP, MP4, MOV, AVI, WebM, MPEG' 
      }, { status: 400 })
    }

    // Check file size - Late supports up to 5GB but we'll limit to 500MB for reasonable upload times
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return Response.json({ 
        error: 'File too large. Maximum size is 500MB' 
      }, { status: 400 })
    }

    const originalSize = file.size
    let wasCompressed = false
    
    // Auto-compress images if they're over 4.5 MB (Twitter limit)
    const isImage = file.type.startsWith('image/')
    const twitterImageLimit = 4.5 * 1024 * 1024 // 4.5 MB
    
    if (isImage && file.size > twitterImageLimit) {
      console.log(`🔄 Image size ${(file.size / 1024 / 1024).toFixed(2)} MB exceeds Twitter limit. Auto-compressing...`)
      
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        let quality = 85
        let compressedBuffer = buffer
        
        // Progressive compression until we get under the limit
        while (compressedBuffer.length > twitterImageLimit && quality > 30) {
          compressedBuffer = await sharp(buffer)
            .resize(2048, 2048, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer()
          
          console.log(`  Tried quality ${quality}: ${(compressedBuffer.length / 1024 / 1024).toFixed(2)} MB`)
          
          if (compressedBuffer.length <= twitterImageLimit) {
            break
          }
          
          quality -= 10
        }
        
        if (compressedBuffer.length > twitterImageLimit) {
          return Response.json({ 
            error: `Unable to compress image below 4.5 MB. Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB. Please use a smaller image.`
          }, { status: 400 })
        }
        
        // Create a new File object with compressed data
        const compressedBlob = new Blob([compressedBuffer], { type: 'image/jpeg' })
        file = new File([compressedBlob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
        wasCompressed = true
        
        console.log(`✅ Image auto-compressed: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(file.size / 1024 / 1024).toFixed(2)} MB (quality: ${quality})`)
        
      } catch (compressionError) {
        console.error('Image compression failed:', compressionError)
        return Response.json({ 
          error: 'Failed to compress image. Please try a smaller file.'
        }, { status: 400 })
      }
    }

    console.log(`Uploading file to Late API: ${file.name}, size: ${file.size}, type: ${file.type}`)

    // Late API only supports direct multipart upload for all file sizes
    const result = await uploadToLateAPI(file, lateApiKey)
    
    // Add compression info to response if applicable
    if (wasCompressed && result.status === 200) {
      const responseData = await result.json()
      return Response.json({
        ...responseData,
        wasCompressed,
        originalSize,
        compressionRatio: ((1 - file.size / originalSize) * 100).toFixed(1),
        message: `Image automatically compressed from ${(originalSize / 1024 / 1024).toFixed(2)} MB to ${(file.size / 1024 / 1024).toFixed(2)} MB for Twitter compatibility`
      })
    }
    
    return result

  } catch (error) {
    console.error('Late media upload error:', error)
    return Response.json({ 
      error: 'Failed to upload media to Late API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function uploadToLateAPI(file: File, apiKey: string) {
  try {
    console.log('=== Starting Late API Upload ===')
    console.log('File name:', file.name)
    console.log('File size:', file.size, 'bytes', '(' + (file.size / 1024 / 1024).toFixed(2) + ' MB)')
    console.log('File type:', file.type)
    console.log('API Key present:', !!apiKey)
    
    // Late API requires multipart/form-data upload for all files
    // IMPORTANT: Late API expects 'files' (plural) not 'file' (singular)
    const formData = new FormData()
    formData.append('files', file)

    console.log('Making request to Late API...')

    const response = await fetch('https://getlate.dev/api/v1/media', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    console.log('Late API response status:', response.status)
    console.log('Late API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('=== Late API Upload Failed ===')
      console.error('Status:', response.status)
      console.error('Error body:', errorText)
      
      let errorMessage = 'Failed to upload to Late API'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error || errorJson.message || errorMessage
      } catch (e) {
        // errorText is not JSON, use as-is
        errorMessage = errorText || errorMessage
      }
      
      return Response.json({ 
        error: errorMessage,
        details: errorText,
        status: response.status
      }, { status: response.status })
    }

    const responseText = await response.text()
    console.log('Late API response body:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse Late API response as JSON:', e)
      return Response.json({ 
        error: 'Invalid response from Late API',
        details: responseText
      }, { status: 500 })
    }

    console.log('=== Late API Upload Success ===')
    console.log('Response data:', JSON.stringify(data, null, 2))

    // Late API returns an array of files, get the first one
    const fileData = data.files && data.files[0] ? data.files[0] : data
    
    // Extract the media URL and ID from the response
    const mediaUrl = fileData.url || fileData.mediaUrl || fileData.file?.url || fileData.downloadUrl
    const mediaId = fileData.id || fileData._id || fileData.mediaId
    const contentType = fileData.mimeType || fileData.type || file.type

    if (!mediaUrl) {
      console.error('No media URL in Late API response:', data)
      return Response.json({ 
        error: 'Late API did not return media URL',
        details: JSON.stringify(data)
      }, { status: 500 })
    }

    console.log('Media URL:', mediaUrl)
    console.log('Media ID:', mediaId)
    console.log('Content Type:', contentType)

    return Response.json({
      success: true,
      url: mediaUrl,
      mediaId: mediaId,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type
    })

  } catch (error) {
    console.error('=== Late API Upload Exception ===')
    console.error('Error:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    throw error
  }
}

export const dynamic = 'force-dynamic'
