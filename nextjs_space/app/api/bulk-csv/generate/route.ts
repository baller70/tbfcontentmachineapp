import { NextRequest, NextResponse } from 'next/server'
import { getCurrentCompany } from '@/lib/company-utils'
import { PrismaClient } from '@prisma/client'
import { listFilesInFolder, downloadFile } from '@/lib/dropbox'
import { compressImage, compressVideo, isImage, isVideo } from '@/lib/media-compression'
import FormData from 'form-data'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const auth = await getCurrentCompany()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      dropboxFolderPath,
      profileId,
      platforms,
      contentMode,
      promptId,
      customContent,
      aiPrompt,
      schedulingMode,
      startDate,
      startTime,
      timezone: tz,
      frequency,
      daysOfWeek,
      generatedContent, // NEW: Pre-generated content from frontend
    } = body

    console.log('📋 Bulk CSV Generation Started')
    console.log('Dropbox Folder:', dropboxFolderPath)
    console.log('Profile ID:', profileId)
    console.log('Platforms:', platforms)
    console.log('Content Mode:', contentMode)
    console.log('Scheduling Mode:', schedulingMode)

    // 1. Get profile and platform settings
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        platformSettings: {
          where: {
            isConnected: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 2. Get prompt if using prompt mode
    let promptText = ''
    if (contentMode === 'prompt' && promptId) {
      const prompt = await prisma.savedPrompt.findUnique({
        where: { id: promptId },
      })
      if (prompt) {
        promptText = prompt.prompt
      }
    }

    // 3. List files from Dropbox
    console.log('📂 Listing files from Dropbox...')
    const files = await listFilesInFolder(dropboxFolderPath)
    const mediaFiles = files.filter((f) =>
      /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)$/i.test(f.name)
    )
    console.log(`Found ${mediaFiles.length} media files`)

    if (mediaFiles.length === 0) {
      return NextResponse.json({ error: 'No media files found in folder' }, { status: 400 })
    }

    // 4. Process each file and build CSV rows
    const csvRows: any[] = []
    const results: any[] = []
    let validCount = 0
    let invalidCount = 0

    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i]
      const rowIndex = i + 1
      console.log(`\n📷 Processing file ${rowIndex}/${mediaFiles.length}: ${file.name}`)

      try {
        // Download file from Dropbox
        console.log('  ⬇️  Downloading from Dropbox...')
        const fileData = await downloadFile(file.path)
        const fileBuffer = fileData.buffer

        // Compress media
        console.log('  🗜️  Compressing media...')
        let processedBuffer: Buffer = fileBuffer
        const isImg = isImage(fileBuffer)
        const isVid = isVideo(fileBuffer)

        if (isImg) {
          processedBuffer = await compressImage(fileBuffer, {
            maxSizeMB: 5,
            maxWidth: 1920,
            maxHeight: 1920,
          })
        } else if (isVid) {
          processedBuffer = await compressVideo(fileBuffer, {
            maxSizeMB: 10,
            videoBitrate: '800k',
          })
        }

        // Upload to Late API to get media URL
        console.log('  ☁️  Uploading to Late API...')
        const mediaForm = new FormData()
        const mimeType = isImg
          ? 'image/jpeg'
          : isVid
          ? 'video/mp4'
          : 'application/octet-stream'
        const fileName = isVid ? 'video.mp4' : 'image.jpg'

        mediaForm.append('files', processedBuffer, {
          filename: fileName,
          contentType: mimeType,
          knownLength: processedBuffer.length,
        })

        const mediaResponse = await axios.post('https://getlate.dev/api/v1/media', mediaForm, {
          headers: {
            Authorization: `Bearer ${process.env.LATE_API_KEY}`,
            ...mediaForm.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        })

        const mediaUrl =
          mediaResponse.data.files?.[0]?.url || mediaResponse.data.url || mediaResponse.data[0]?.url

        if (!mediaUrl) {
          throw new Error('Failed to get media URL from Late API')
        }

        console.log('  ✅ Media URL:', mediaUrl)

        // Generate content
        let postContent = ''
        
        // Check if we have pre-generated content from frontend
        if (generatedContent && Array.isArray(generatedContent)) {
          const preGenerated = generatedContent.find((gc: any) => gc.fileName === file.name)
          if (preGenerated && preGenerated.content) {
            console.log('  ✅ Using pre-generated content from frontend')
            postContent = preGenerated.content
          }
        }
        
        // Fallback to old content generation logic if no pre-generated content
        if (!postContent) {
          if (contentMode === 'custom') {
            postContent = customContent
          } else if (contentMode === 'ai') {
            console.log('  🤖 Generating AI content with vision analysis...')
            // For AI mode, we'll analyze the image and generate content using aiPrompt
            postContent = await generateAIContent(fileBuffer, isImg, aiPrompt || '', platforms)
          } else if (contentMode === 'prompt') {
            // For prompt mode, apply the prompt template
            postContent = promptText.replace('{filename}', file.name)
          }
        }

        // Calculate schedule time
        let scheduleTime = ''
        if (schedulingMode === 'custom' && startDate) {
          const baseDate = dayjs.tz(`${startDate} ${startTime}`, tz)
          
          // If daysOfWeek is provided, calculate schedule based on those days
          if (daysOfWeek && daysOfWeek.length > 0) {
            // Convert days to dayjs day numbers (0 = Sunday, 1 = Monday, etc.)
            const dayMap: { [key: string]: number } = {
              SUNDAY: 0,
              MONDAY: 1,
              TUESDAY: 2,
              WEDNESDAY: 3,
              THURSDAY: 4,
              FRIDAY: 5,
              SATURDAY: 6,
            }
            const scheduleDays = daysOfWeek.map((day: string) => dayMap[day.toUpperCase()]).sort()
            
            // Find the next occurrence of a scheduled day
            let currentDate = baseDate
            let occurrenceCount = 0
            while (occurrenceCount <= i) {
              const dayOfWeek = currentDate.day()
              if (scheduleDays.includes(dayOfWeek)) {
                if (occurrenceCount === i) {
                  break
                }
                occurrenceCount++
              }
              currentDate = currentDate.add(1, 'day')
            }
            scheduleTime = currentDate.format('YYYY-MM-DD HH:mm')
          } else {
            // Fallback to simple daily/every-other-day logic
            const daysToAdd = frequency === 'DAILY' ? i : i * 2
            const scheduledDate = baseDate.add(daysToAdd, 'day')
            scheduleTime = scheduledDate.format('YYYY-MM-DD HH:mm')
          }
        }

        // Build platform-specific account IDs
        // For each platform, find its account ID from platform settings
        const platformAccountIds: { [key: string]: string } = {}
        for (const platformName of platforms) {
          const platformSetting = profile.platformSettings.find(
            (ps: any) => ps.platform === platformName.toLowerCase() && ps.isConnected && ps.platformId
          )
          
          if (platformSetting && platformSetting.platformId) {
            // Skip placeholder IDs (when platformId equals the platform name itself)
            const isPlaceholder = [
              'instagram',
              'facebook',
              'linkedin',
              'threads',
              'tiktok',
              'bluesky',
              'youtube',
              'twitter',
            ].includes(platformSetting.platformId.toLowerCase())
            
            if (!isPlaceholder) {
              platformAccountIds[platformName.toLowerCase()] = platformSetting.platformId
              console.log(`  ✅ ${platformName}: Account ID ${platformSetting.platformId}`)
            } else {
              console.warn(`  ⚠️  ${platformName}: Has placeholder ID "${platformSetting.platformId}", needs real Late account ID`)
            }
          } else {
            console.warn(`  ⚠️  ${platformName}: Not connected or no account ID`)
          }
        }

        // Check if we have at least one valid account ID
        if (Object.keys(platformAccountIds).length === 0) {
          throw new Error(
            `No valid Late API account IDs found for selected platforms. ` +
            `Please connect your platforms in Settings and ensure they have proper Late account IDs.`
          )
        }

        // Build CSV row with platform-specific account IDs
        // The Late API CSV format expects account IDs in platform-specific columns
        const csvRow: any = {
          post_content: postContent,
          schedule_time: scheduleTime || '',
          tz: tz || 'America/New_York',
          media_urls: mediaUrl,
          publish_now: schedulingMode === 'now' ? 'true' : 'false',
          use_queue: schedulingMode === 'queue' ? 'true' : 'false',
        }
        
        // Add platform-specific account ID columns
        for (const [platform, accountId] of Object.entries(platformAccountIds)) {
          csvRow[`${platform}_account_id`] = accountId
        }

        csvRows.push(csvRow)
        results.push({
          rowIndex,
          ok: true,
          file: file.name,
        })
        validCount++
        console.log(`  ✅ Row ${rowIndex} processed successfully`)
      } catch (error: any) {
        console.error(`  ❌ Error processing file ${file.name}:`, error.message)
        results.push({
          rowIndex,
          ok: false,
          errors: [error.message],
        })
        invalidCount++
      }
    }

    // 5. Convert rows to CSV format and send to Late API
    console.log('\n📤 Sending CSV to Late API...')
    const csvContent = convertToCSV(csvRows)
    const csvBuffer = Buffer.from(csvContent, 'utf-8')

    const csvForm = new FormData()
    csvForm.append('file', csvBuffer, {
      filename: 'bulk_schedule.csv',
      contentType: 'text/csv',
      knownLength: csvBuffer.length,
    })

    const bulkResponse = await axios.post('https://getlate.dev/api/v1/posts/bulk-upload', csvForm, {
      headers: {
        Authorization: `Bearer ${process.env.LATE_API_KEY}`,
        ...csvForm.getHeaders(),
      },
    })

    console.log('✅ Bulk CSV upload complete')
    console.log('Response:', bulkResponse.data)

    return NextResponse.json({
      success: true,
      total: mediaFiles.length,
      valid: validCount,
      invalid: invalidCount,
      results: bulkResponse.data.results || results,
      lateApiResponse: bulkResponse.data,
    })
  } catch (error: any) {
    console.error('❌ Bulk CSV generation error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate bulk CSV',
        details: error.response?.data || error,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function generateAIContent(fileBuffer: Buffer, isImage: boolean, promptText: string, platforms: string[] = []): Promise<string> {
  try {
    // For AI content generation, we'll use Abacus AI
    const abacusApiKey = process.env.ABACUSAI_API_KEY
    if (!abacusApiKey) {
      throw new Error('ABACUSAI_API_KEY not configured')
    }

    // Step 1: Analyze the image with AI vision
    let imageAnalysis = ''
    if (isImage) {
      const base64Image = fileBuffer.toString('base64')
      const dataUrl = `data:image/jpeg;base64,${base64Image}`

      console.log('    📸 Analyzing image with AI vision...')
      const visionResponse = await axios.post(
        'https://apps.abacus.ai/v1/chat/completions',
        {
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this image and describe what you see in detail. Focus on the main subjects, colors, mood, and any text visible.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl,
                  },
                },
              ],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${abacusApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      imageAnalysis = visionResponse.data.choices?.[0]?.message?.content || ''
      console.log('    ✅ Analysis:', imageAnalysis.substring(0, 150) + '...')
    }

    // Step 2: Generate post content based on vision analysis
    console.log('    🤖 Generating post content...')
    const platformList = platforms.length > 0 ? platforms.join(', ') : 'social media'
    const systemPrompt = `You are a social media content creator. Generate engaging post content based on the image analysis and user prompt. 

Platforms: ${platformList}
Consider platform-specific best practices (character limits, hashtags, tone).

IMPORTANT OUTPUT RULES:
- Output ONLY plain text - NO markdown formatting
- DO NOT use bold (**), italics, or any markdown syntax
- DO NOT include labels like "Caption:" or "Hashtags:"
- DO NOT use section headers or formatting markers
- Start with the actual post caption text
- Add a blank line, then include hashtags
- Keep it clean, simple, and ready to post as-is

Keep it concise, engaging, and optimized for ${platformList}.`

    const userPrompt = `Image Analysis: ${imageAnalysis || 'No image analysis available'}

User Instructions: ${promptText || 'Create engaging social media content'}

Create compelling social media content based on the above.`

    const contentResponse = await axios.post(
      'https://apps.abacus.ai/v1/chat/completions',
      {
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${abacusApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const generatedContent = contentResponse.data.choices?.[0]?.message?.content || ''
    
    if (!generatedContent || generatedContent.trim() === '') {
      console.error('    ❌ AI returned empty content')
      throw new Error('AI returned empty content')
    }
    
    console.log('    ✅ Generated:', generatedContent.substring(0, 100) + '...')
    return generatedContent
  } catch (error: any) {
    console.error('    ❌ AI generation error:', error.message)
    throw new Error(`AI content generation failed: ${error.message}`)
  }
}

function convertToCSV(rows: any[]): string {
  if (rows.length === 0) return ''

  // Get all unique keys from all rows
  const headers = Array.from(
    new Set(
      rows.reduce((acc: string[], row) => {
        return [...acc, ...Object.keys(row)]
      }, [])
    )
  ) as string[]

  // Create header row
  const csvHeaders = headers.join(',')

  // Create data rows
  const csvData = rows
    .map((row) => {
      return headers
        .map((header) => {
          const value = (row as any)[header] || ''
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(',')
    })
    .join('\n')

  return `${csvHeaders}\n${csvData}`
}
