import { NextRequest } from 'next/server'
import { getCurrentCompany } from '@/lib/company-utils'
import { prisma } from '@/lib/db'
import { listFilesInFolder, downloadFile } from '@/lib/dropbox'
import { uploadFile, getFileUrl } from '@/lib/s3'
import { compressImage, compressVideo, isImage, isVideo } from '@/lib/media-compression'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import axios from 'axios'
import FormData from 'form-data'

dayjs.extend(utc)
dayjs.extend(timezone)

interface DropboxFile {
  name: string
  id: string
  path: string
  mimeType?: string
}

// Helper function to calculate schedule dates
function calculateScheduleDates(
  startDateStr: string,
  daysOfWeek: string[],
  timeOfDay: string,
  tz: string,
  count: number
): Date[] {
  const dates: Date[] = []
  let currentDate = dayjs.tz(startDateStr, tz)
  
  // Parse time of day
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  currentDate = currentDate.hour(hours).minute(minutes).second(0).millisecond(0)
  
  // Map days to dayjs format (0=Sunday, 1=Monday, ...)
  const dayMap: { [key: string]: number } = {
    'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
    'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
  }
  
  const allowedDays = daysOfWeek.map(d => dayMap[d.toUpperCase()])
  
  while (dates.length < count) {
    const dayOfWeek = currentDate.day()
    
    if (allowedDays.includes(dayOfWeek)) {
      dates.push(currentDate.toDate())
    }
    
    // Move to next day
    currentDate = currentDate.add(1, 'day')
  }
  
  return dates
}

// Streaming encoder
function sendProgressUpdate(encoder: TextEncoder, controller: ReadableStreamDefaultController, data: any) {
  const json = JSON.stringify(data)
  controller.enqueue(encoder.encode(`data: ${json}\n\n`))
}

// Batching constants
const BATCH_SIZE = 10 // Maximum posts per batch
const DELAY_BETWEEN_POSTS = 5000 // 5 seconds between individual posts
const DELAY_BETWEEN_BATCHES = 10000 // 10 seconds between batches

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Use getCurrentCompany which handles session properly
    const companyData = await getCurrentCompany()
    if (!companyData) {
      console.error('❌ No company data - unauthorized')
      return new Response('Unauthorized', { status: 401 })
    }
    
    const { userId } = companyData

    const seriesId = params.id
    const series = await prisma.postSeries.findFirst({
      where: { id: seriesId, userId },
      include: {
        profile: {
          include: {
            platformSettings: true
          }
        }
      }
    })

    if (!series) {
      return new Response('Series not found', { status: 404 })
    }

    if (!series.dropboxFolderPath) {
      return new Response('Series has no Dropbox folder configured', { status: 400 })
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          // Get all files from Dropbox folder
          console.log(`📁 Listing files from Dropbox folder: ${series.dropboxFolderPath}`)
          const allFiles = await listFilesInFolder(series.dropboxFolderPath || '')
          
          // Filter for image and video files
          const mediaFiles = allFiles.filter((file: DropboxFile) => {
            const ext = file.name.toLowerCase().split('.').pop()
            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm'].includes(ext || '')
          })
          
          // Sort files numerically by filename
          mediaFiles.sort((a: DropboxFile, b: DropboxFile) => {
            const aNum = parseInt(a.name.match(/\d+/)?.[0] || '0')
            const bNum = parseInt(b.name.match(/\d+/)?.[0] || '0')
            return aNum - bNum
          })
          
          const totalFiles = mediaFiles.length
          console.log(`📊 Found ${totalFiles} media files to schedule`)
          
          if (totalFiles === 0) {
            sendProgressUpdate(encoder, controller, {
              error: 'No media files found in the folder'
            })
            controller.close()
            return
          }
          
          // Calculate all schedule dates
          const scheduleDates = calculateScheduleDates(
            dayjs(series.startDate).format('YYYY-MM-DD'),
            series.daysOfWeek,
            series.timeOfDay || '09:00',
            series.timezone || 'America/New_York',
            totalFiles
          )
          
          console.log(`📅 Generated ${scheduleDates.length} schedule dates`)
          
          // Calculate number of batches
          const totalBatches = Math.ceil(totalFiles / BATCH_SIZE)
          console.log(`🎯 Processing in ${totalBatches} batches (max ${BATCH_SIZE} posts per batch)`)
          
          let successful = 0
          let failed = 0
          
          // Process in batches
          for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
            const batchStart = batchNum * BATCH_SIZE
            const batchEnd = Math.min(batchStart + BATCH_SIZE, totalFiles)
            const batchFiles = mediaFiles.slice(batchStart, batchEnd)
            
            console.log(`\n${'='.repeat(80)}`)
            console.log(`🎯 BATCH ${batchNum + 1}/${totalBatches} - Processing files ${batchStart + 1} to ${batchEnd}`)
            console.log(`${'='.repeat(80)}\n`)
            
            // Send batch start update
            sendProgressUpdate(encoder, controller, {
              batch: batchNum + 1,
              totalBatches,
              batchStart: batchStart + 1,
              batchEnd
            })
            
            for (let i = 0; i < batchFiles.length; i++) {
              const fileIndex = batchStart + i
              const file = batchFiles[i]
              const scheduledFor = scheduleDates[fileIndex]
              
              sendProgressUpdate(encoder, controller, {
                progress: true,
                current: fileIndex + 1,
                total: totalFiles,
                fileName: file.name,
                batch: batchNum + 1,
                batchItem: i + 1,
                batchSize: batchFiles.length
              })
            
              try {
                console.log(`\n[${fileIndex + 1}/${totalFiles}] [Batch ${batchNum + 1}/${totalBatches}, Item ${i + 1}/${batchFiles.length}] Processing: ${file.name}`)
                console.log(`   Scheduled for: ${dayjs(scheduledFor).tz(series.timezone).format('YYYY-MM-DD HH:mm z')}`)
              
              // Download file from Dropbox
              console.log('   📥 Downloading from Dropbox...')
              const fileData = await downloadFile(file.path)
              const fileBuffer = fileData.buffer
              
              // Determine media type
              const isVideoFile = isVideo(fileBuffer)
              const isImageFile = isImage(fileBuffer)
              
              if (!isVideoFile && !isImageFile) {
                console.error(`   ❌ Not a valid media file: ${file.name}`)
                failed++
                continue
              }
              
              // Compress media
              console.log(`   🗜️  Compressing ${isVideoFile ? 'video' : 'image'}...`)
              let processedBuffer: Buffer
              
              if (isVideoFile) {
                processedBuffer = await compressVideo(fileBuffer, { targetPlatform: 'late' })
              } else {
                processedBuffer = await compressImage(fileBuffer, { targetPlatform: 'late' })
              }
              
              console.log(`   ✅ Compressed: ${fileBuffer.length} → ${processedBuffer.length} bytes`)
              
              // Generate AI content (vision analysis + content generation)
              console.log('   🤖 Generating AI content...')
              
              // First, analyze the image
              let mediaAnalysis = ''
              if (isImageFile) {
                try {
                  // Upload to S3 temporarily for AI analysis
                  const s3Key = `temp/${Date.now()}-${file.name}`
                  await uploadFile(processedBuffer, s3Key, 'image/jpeg')
                  const mediaUrl = await getFileUrl(s3Key)
                  
                  const visionResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
                    },
                    body: JSON.stringify({
                      model: 'gpt-4o-mini',
                      messages: [
                        {
                          role: 'system',
                          content: 'You are an AI that describes images in detail for content generation purposes.'
                        },
                        {
                          role: 'user',
                          content: [
                            {
                              type: 'text',
                              text: 'Describe this image in detail.'
                            },
                            {
                              type: 'image_url',
                              image_url: { url: mediaUrl }
                            }
                          ]
                        }
                      ]
                    })
                  })
                  
                  if (visionResponse.ok) {
                    const visionData = await visionResponse.json()
                    mediaAnalysis = visionData.choices?.[0]?.message?.content || ''
                    console.log('   👁️  Vision analysis complete')
                  }
                } catch (visionError) {
                  console.error('   ⚠️  Vision analysis failed:', visionError)
                }
              }
              
              // Generate post content
              const contentResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
                },
                body: JSON.stringify({
                  model: 'gpt-4o-mini',
                  messages: [
                    {
                      role: 'system',
                      content: `You are a social media content creator. Generate engaging post content.\n\nCRITICAL FORMATTING RULES:\n1. Output ONLY plain text - no markdown, no bold (**), no italics (_), no formatting\n2. Do NOT use labels like \"Caption:\", \"Text:\", \"Hashtags:\" - start directly with content\n3. Write the post text first\n4. Add a blank line\n5. Then add hashtags (if requested)\n6. Keep it natural and ready to copy-paste\n\n${mediaAnalysis ? `Media context: ${mediaAnalysis}` : ''}`
                    },
                    {
                      role: 'user',
                      content: series.prompt || 'Create an engaging social media post for this content'
                    }
                  ]
                })
              })
              
              if (!contentResponse.ok) {
                throw new Error('AI content generation failed')
              }
              
              const contentData = await contentResponse.json()
              const generatedContent = contentData.choices?.[0]?.message?.content || ''
              
              if (!generatedContent || generatedContent.trim() === '') {
                throw new Error('AI returned empty content')
              }
              
              console.log('   ✅ AI content generated')
              
              // Upload media to Late API
              console.log('   📤 Uploading to Late API...')
              const mediaForm = new FormData()
              const mimeType = isVideoFile ? 'video/mp4' : 'image/jpeg'
              mediaForm.append('files', processedBuffer, {
                filename: isVideoFile ? 'video.mp4' : 'image.jpg',
                contentType: mimeType,
                knownLength: processedBuffer.length,
              })
              
              const mediaResponse = await axios.post('https://getlate.dev/api/v1/media', mediaForm, {
                headers: {
                  'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
                  ...mediaForm.getHeaders(),
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
              })
              
              const mediaUrl = mediaResponse.data.files?.[0]?.url || mediaResponse.data.url
              if (!mediaUrl) {
                throw new Error('Failed to get media URL from Late API')
              }
              
              console.log('   ✅ Media uploaded to Late API')
              
              // Create scheduled post in Late API
              console.log('   📅 Creating scheduled post in Late API...')
              
              const platforms: any[] = []
              for (const platformId of series.platforms) {
                const platformSetting = series.profile?.platformSettings?.find(
                  (ps: any) => ps.platform === platformId && ps.isConnected && ps.platformId
                )
                
                if (platformSetting) {
                  platforms.push({
                    id: platformId,
                    accountId: platformSetting.platformId
                  })
                }
              }
              
              const latePayload = {
                platforms,
                content: generatedContent,
                mediaItems: [{
                  type: isVideoFile ? 'video' : 'image',
                  url: mediaUrl
                }],
                scheduledFor: scheduledFor.toISOString(),
                timezone: series.timezone
              }
              
              // Post to Late API as an individual post
              console.log(`\n   ===== POSTING FILE ${i + 1}/${totalFiles}: ${file.name} =====`)
              console.log(`   📤 Sending to Late API...`)
              console.log(`   📦 FULL PAYLOAD:`)
              console.log(JSON.stringify(latePayload, null, 2))
              
              let lateResponse
              try {
                lateResponse = await axios.post('https://getlate.dev/api/v1/posts', latePayload, {
                  headers: {
                    'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
                    'Content-Type': 'application/json'
                  }
                })
              } catch (postError: any) {
                console.error(`   ❌ LATE API POST FAILED:`)
                console.error(`      Status: ${postError.response?.status}`)
                console.error(`      Error:`, JSON.stringify(postError.response?.data, null, 2))
                throw postError
              }
              
              console.log(`   📊 LATE API RESPONSE:`)
              console.log(JSON.stringify(lateResponse.data, null, 2))
              
              const postId = lateResponse.data.id
              if (!postId) {
                console.error(`   ❌ NO POST ID IN RESPONSE!`)
                console.error(`      Full response:`, JSON.stringify(lateResponse.data, null, 2))
                throw new Error(`Late API did not return a post ID`)
              }
              
              console.log(`   ✅ Got Post ID: ${postId}`)
              
              // IMMEDIATELY VERIFY the post is in Late API's scheduled section
              console.log(`\n   🔍 VERIFICATION PHASE: Checking if post ${postId} is in Late API...`)
              
              let verified = false
              let verifyAttempts = 0
              const maxVerifyAttempts = 3
              
              while (!verified && verifyAttempts < maxVerifyAttempts) {
                verifyAttempts++
                
                // Wait 10 seconds before each check
                console.log(`   ⏳ Waiting 10 seconds for Late API to process...`)
                await new Promise(resolve => setTimeout(resolve, 10000))
                
                console.log(`   🔍 Verification attempt ${verifyAttempts}/${maxVerifyAttempts}...`)
                
                try {
                  // Query Late API for ALL scheduled posts
                  const allScheduledResponse = await axios.get('https://getlate.dev/api/v1/posts', {
                    headers: {
                      'Authorization': `Bearer ${process.env.LATE_API_KEY}`
                    },
                    params: {
                      status: 'scheduled',
                      limit: 100
                    }
                  })
                  
                  const scheduledPosts = allScheduledResponse.data.data || allScheduledResponse.data.posts || []
                  console.log(`   📊 Late API currently has ${scheduledPosts.length} scheduled posts`)
                  
                  // Show all post IDs for debugging
                  if (scheduledPosts.length > 0) {
                    console.log(`   📋 Scheduled post IDs:`, scheduledPosts.map((p: any) => p.id).join(', '))
                  }
                  
                  // Check if our post is there
                  const foundPost = scheduledPosts.find((p: any) => p.id === postId)
                  
                  if (foundPost) {
                    verified = true
                    console.log(`   ✅ VERIFIED: Post ${postId} IS in Late API!`)
                    console.log(`      Status: ${foundPost.status}`)
                    console.log(`      Scheduled for: ${foundPost.scheduledFor}`)
                    console.log(`      Content: ${(foundPost.content || '').substring(0, 60)}...`)
                    successful++
                    break
                  } else {
                    console.warn(`   ⚠️  Post ${postId} NOT FOUND in Late API (attempt ${verifyAttempts}/${maxVerifyAttempts})`)
                    console.warn(`      Looking for: ${postId}`)
                    console.warn(`      Found IDs: ${scheduledPosts.map((p: any) => p.id).join(', ') || 'NONE'}`)
                  }
                } catch (verifyError: any) {
                  console.error(`   ❌ VERIFICATION ERROR (attempt ${verifyAttempts}):`)
                  console.error(`      Error: ${verifyError.message}`)
                  if (verifyError.response) {
                    console.error(`      HTTP Status: ${verifyError.response.status}`)
                    console.error(`      Response:`, JSON.stringify(verifyError.response.data, null, 2))
                  }
                }
              }
              
              // STOP if post was not verified
              if (!verified) {
                console.error(`\n   🛑 CRITICAL FAILURE: Post ${postId} NEVER APPEARED in Late API!`)
                console.error(`      Created post ID: ${postId}`)
                console.error(`      Checked ${verifyAttempts} times over ${verifyAttempts * 10} seconds`)
                console.error(`      Late API returned the post ID but it's not in the scheduled section`)
                console.error(`\n      STOPPING BULK SCHEDULE TO INVESTIGATE`)
                failed++
                throw new Error(`Post ${postId} was not found in Late API scheduled section - API may have rejected it`)
              }
              
                // Wait 5 seconds before processing next file within batch (not after last file in batch)
                if (i < batchFiles.length - 1) {
                  console.log(`   ⏳ Waiting ${DELAY_BETWEEN_POSTS / 1000} seconds before next file...`)
                  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_POSTS))
                }
                
              } catch (error: any) {
                console.error(`   ❌ FAILED to process ${file.name}:`)
                console.error(`      Error: ${error.message}`)
                if (error.response) {
                  console.error(`      HTTP Status: ${error.response.status}`)
                  console.error(`      Response:`, JSON.stringify(error.response.data, null, 2))
                }
                failed++
                
                // Wait 5 seconds even after errors (to prevent overwhelming the API)
                if (i < batchFiles.length - 1) {
                  console.log(`   ⏳ Waiting ${DELAY_BETWEEN_POSTS / 1000} seconds before next file...`)
                  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_POSTS))
                }
              }
            }
            
            // Batch complete - log summary
            console.log(`\n${'='.repeat(80)}`)
            console.log(`✅ BATCH ${batchNum + 1}/${totalBatches} COMPLETE`)
            console.log(`   Files processed: ${batchFiles.length}`)
            console.log(`   Current progress: ${batchEnd}/${totalFiles} files`)
            console.log(`${'='.repeat(80)}\n`)
            
            // Send batch complete update
            sendProgressUpdate(encoder, controller, {
              batchComplete: true,
              batch: batchNum + 1,
              totalBatches
            })
            
            // Wait 10 seconds between batches (not after last batch)
            if (batchNum < totalBatches - 1) {
              console.log(`⏸️  BATCH RESET - Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...\n`)
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
            }
          }
          
          // Update series currentFileIndex
          await prisma.postSeries.update({
            where: { id: seriesId },
            data: {
              currentFileIndex: totalFiles + 1  // Set to after last file
            }
          })
          
          console.log(`\n${'═'.repeat(80)}`)
          console.log(`🎉 ALL BATCHES COMPLETE`)
          console.log(`${'═'.repeat(80)}`)
          console.log(`📊 OVERALL SUMMARY:`)
          console.log(`   Total batches: ${totalBatches}`)
          console.log(`   Total files: ${totalFiles}`)
          console.log(`   Successful: ${successful}`)
          console.log(`   Failed: ${failed}`)
          console.log(`${'═'.repeat(80)}\n`)
          
          // Send completion message
          sendProgressUpdate(encoder, controller, {
            complete: true,
            total: totalFiles,
            totalBatches,
            successful,
            failed
          })
          
          controller.close()
          
        } catch (error) {
          console.error('❌ Bulk scheduling error:', error)
          sendProgressUpdate(encoder, controller, {
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          })
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
    
  } catch (error) {
    console.error('Error in bulk schedule endpoint:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
