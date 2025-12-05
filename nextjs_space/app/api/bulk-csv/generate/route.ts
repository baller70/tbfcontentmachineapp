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
      generatedContent, // Pre-generated content from frontend
    } = body

    console.log('📋 Bulk Post Generation Started')
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

    // 2. Build platform accounts array for Late API
    // Late API expects: platforms: [{ platform: "instagram", accountId: "abc123" }]
    const platformAccounts: { platform: string; accountId: string }[] = []
    const missingPlatforms: string[] = []

    for (const platformName of platforms) {
      const platformSetting = profile.platformSettings.find(
        (ps: any) => ps.platform?.toLowerCase() === platformName.toLowerCase()
      )

      if (!platformSetting) {
        console.warn(`⚠️ No platform setting found for: ${platformName}`)
        missingPlatforms.push(platformName)
        continue
      }

      if (!platformSetting.isConnected || !platformSetting.platformId) {
        console.warn(`⚠️ Platform ${platformName} is not connected or has no platformId`)
        missingPlatforms.push(platformName)
        continue
      }

      // Check for placeholder IDs (when platformId equals the platform name itself)
      const isPlaceholder = [
        'instagram', 'facebook', 'linkedin', 'threads',
        'tiktok', 'bluesky', 'youtube', 'twitter'
      ].includes(platformSetting.platformId.toLowerCase())

      if (isPlaceholder) {
        console.warn(`⚠️ Platform ${platformName} has placeholder ID "${platformSetting.platformId}", needs real Late account ID`)
        missingPlatforms.push(platformName)
        continue
      }

      console.log(`✅ ${platformName}: Using Late account ID ${platformSetting.platformId}`)
      platformAccounts.push({
        platform: platformName.toLowerCase(),
        accountId: platformSetting.platformId,
      })
    }

    // Check if we have at least one valid platform
    if (platformAccounts.length === 0) {
      return NextResponse.json(
        {
          error: `No valid Late API account IDs found for platforms: ${platforms.join(', ')}. ` +
            `Please go to Settings > Platform Connections and sync with your Late account. ` +
            `Each platform needs a real Late account ID (not placeholder values).`,
        },
        { status: 400 }
      )
    }

    if (missingPlatforms.length > 0) {
      console.warn(`⚠️ Some platforms will be skipped: ${missingPlatforms.join(', ')}`)
    }

    // 3. Get prompt if using prompt mode
    let promptText = ''
    if (contentMode === 'prompt' && promptId) {
      const prompt = await prisma.savedPrompt.findUnique({
        where: { id: promptId },
      })
      if (prompt) {
        promptText = prompt.prompt
      }
    }

    // 3.5. Get brand voice profile for AI content generation
    let brandVoice = null
    if (contentMode === 'ai') {
      try {
        const brandVoiceProfile = await prisma.brandVoiceProfile.findFirst({
          where: {
            userId: auth.userId,
            companyId: auth.companyId || undefined,
            isActive: true,
            isDefault: true,
          },
        })
        if (brandVoiceProfile) {
          brandVoice = brandVoiceProfile
          console.log('📝 Using brand voice profile:', brandVoiceProfile.name)
        }
      } catch (e) {
        console.log('📝 No brand voice profile found, using default AI generation')
      }
    }

    // 4. List files from Dropbox
    console.log('📂 Listing files from Dropbox...')
    const files = await listFilesInFolder(dropboxFolderPath)
    const mediaFiles = files.filter((f) =>
      /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)$/i.test(f.name)
    )
    console.log(`Found ${mediaFiles.length} media files`)

    if (mediaFiles.length === 0) {
      return NextResponse.json({ error: 'No media files found in folder' }, { status: 400 })
    }

    // 5. Process each file and create posts via Late API
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
            postContent = await generateAIContent(fileBuffer, isImg, aiPrompt || '', platforms, brandVoice)
          } else if (contentMode === 'prompt') {
            postContent = promptText.replace('{filename}', file.name)
          }
        }

        // Calculate schedule time
        let scheduledFor: string | undefined = undefined
        if (schedulingMode === 'custom' && startDate) {
          const baseDate = dayjs.tz(`${startDate} ${startTime}`, tz)

          if (daysOfWeek && daysOfWeek.length > 0) {
            // Convert days to dayjs day numbers (0 = Sunday, 1 = Monday, etc.)
            const dayMap: { [key: string]: number } = {
              SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
              THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
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
            scheduledFor = currentDate.toISOString()
          } else {
            // Fallback to simple daily/every-other-day logic
            const daysToAdd = frequency === 'DAILY' ? i : i * 2
            const scheduledDate = baseDate.add(daysToAdd, 'day')
            scheduledFor = scheduledDate.toISOString()
          }
        }

        // Build the Late API payload - using individual /posts endpoint
        const latePayload: any = {
          content: postContent,
          platforms: platformAccounts,
          mediaItems: [{
            type: isVid ? 'video' : 'image',
            url: mediaUrl,
          }],
        }

        // Add scheduling or publish immediately
        if (schedulingMode === 'now') {
          latePayload.publishNow = true
          console.log('  🚀 Publishing immediately')
        } else if (schedulingMode === 'queue') {
          latePayload.useQueue = true
          console.log('  📥 Adding to queue')
        } else if (scheduledFor) {
          latePayload.scheduledFor = scheduledFor
          latePayload.timezone = tz || 'America/New_York'
          console.log(`  ⏰ Scheduling for: ${scheduledFor}`)
        }

        console.log('  📤 Posting to Late API...')
        console.log('  Payload:', JSON.stringify(latePayload, null, 2))

        // Send to Late API individual post endpoint
        const postResponse = await axios.post('https://getlate.dev/api/v1/posts', latePayload, {
          headers: {
            Authorization: `Bearer ${process.env.LATE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const postId = postResponse.data.post?._id || postResponse.data._id || postResponse.data.id
        console.log(`  ✅ Post created successfully! ID: ${postId}`)

        results.push({
          rowIndex,
          ok: true,
          file: file.name,
          createdPostId: postId,
          platforms: platformAccounts.map(p => p.platform),
        })
        validCount++

      } catch (error: any) {
        console.error(`  ❌ Error processing file ${file.name}:`, error.message)

        // Extract more detailed error from axios response
        let errorMessage = error.message
        if (error.response?.data) {
          const errorData = error.response.data
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData)
        }

        results.push({
          rowIndex,
          ok: false,
          file: file.name,
          errors: [errorMessage],
        })
        invalidCount++
      }
    }

    console.log('\n✅ Bulk post generation complete')
    console.log(`   Total: ${mediaFiles.length}, Success: ${validCount}, Failed: ${invalidCount}`)

    return NextResponse.json({
      success: invalidCount === 0,
      total: mediaFiles.length,
      valid: validCount,
      invalid: invalidCount,
      results,
      skippedPlatforms: missingPlatforms.length > 0 ? missingPlatforms : undefined,
    })
  } catch (error: any) {
    console.error('❌ Bulk post generation error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate bulk posts',
        details: error.response?.data || error,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function generateAIContent(fileBuffer: Buffer, isImage: boolean, promptText: string, platforms: string[] = [], brandVoice?: any): Promise<string> {
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

    // Build brand voice context
    let brandVoiceContext = ''
    if (brandVoice) {
      brandVoiceContext = '\n\n--- BRAND VOICE PROFILE ---\n'
      if (brandVoice.brandVoice) brandVoiceContext += `Brand Voice & Personality: ${brandVoice.brandVoice}\n`
      if (brandVoice.targetAudience) brandVoiceContext += `Target Audience: ${brandVoice.targetAudience}\n`
      if (brandVoice.keyMessaging) brandVoiceContext += `Key Messaging: ${brandVoice.keyMessaging}\n`
      if (brandVoice.writingStyle) brandVoiceContext += `Writing Style: ${brandVoice.writingStyle}\n`
      if (brandVoice.toneOfVoice) brandVoiceContext += `Tone of Voice: ${brandVoice.toneOfVoice}\n`
      if (brandVoice.brandValues) brandVoiceContext += `Brand Values: ${brandVoice.brandValues}\n`
      if (brandVoice.dosAndDonts) brandVoiceContext += `Do's and Don'ts: ${brandVoice.dosAndDonts}\n`
      if (brandVoice.industryNiche) brandVoiceContext += `Industry/Niche: ${brandVoice.industryNiche}\n`
      if (brandVoice.emojiUsage) brandVoiceContext += `Emoji Usage: ${brandVoice.emojiUsage}\n`
      if (brandVoice.hashtagStyle) brandVoiceContext += `Hashtag Style: ${brandVoice.hashtagStyle}\n`
      if (brandVoice.callToAction) brandVoiceContext += `Preferred CTAs: ${brandVoice.callToAction}\n`
      if (brandVoice.exampleContent) brandVoiceContext += `Example Content (match this style): ${brandVoice.exampleContent}\n`
      brandVoiceContext += '--- END BRAND VOICE ---\n\n'
      brandVoiceContext += 'IMPORTANT: Generate content that matches this brand voice exactly. Use the specified tone, style, and messaging guidelines.\n'
    }

    const systemPrompt = `You are a social media content creator. Generate engaging post content based on the image analysis and user prompt.${brandVoiceContext}

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

// Note: CSV bulk upload was replaced with individual post creation
// for better error handling and Late API compatibility
