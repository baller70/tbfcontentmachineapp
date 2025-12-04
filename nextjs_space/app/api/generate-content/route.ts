
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { prompt: rawPrompt, promptInstructions, platforms, platform, hasMedia, mediaTypes, mediaUrls, contentType, topic, tone, templateData, templateName } = await request.json()

    // Accept either 'prompt' or 'promptInstructions' parameter
    const prompt = rawPrompt || promptInstructions
    
    if (!prompt) {
      return new Response('Missing prompt instructions', { status: 400 })
    }

    // Normalize platforms: handle both 'platforms' (array) and 'platform' (single)
    let targetPlatforms: string[] = []
    if (platforms && Array.isArray(platforms)) {
      targetPlatforms = platforms
    } else if (platform) {
      targetPlatforms = [platform]
    }

    // Build system prompt for generating a social media post from instructions
    let systemPrompt = `You are an expert social media content creator. The user will provide instructions on what they want to post about. Your job is to create the actual social media post content based on those instructions.

Key guidelines:
- Generate the ACTUAL POST CONTENT, not instructions or suggestions
- Make the content engaging, authentic, and ready to publish
- Include emojis where appropriate to enhance engagement
- Keep the tone natural and conversational
- Make sure the content is optimized for the target platform(s)
- Generate ONLY the post text - do not add explanations or meta-commentary

CRITICAL FORMATTING RULES:
- Output ONLY plain text - NO markdown formatting
- DO NOT use bold (**), italics (_), or any markdown syntax
- DO NOT include labels like "Caption:", "Hashtags:", "Text:", etc.
- DO NOT use section headers or formatting markers
- Start directly with the actual post text
- If hashtags are requested, add them at the end after a blank line
- Keep output clean, simple, and ready to copy-paste as-is`

    // Add content type specific guidance
    if (contentType) {
      if (contentType === 'caption') {
        systemPrompt += `\n\nContent Type: Caption only - Generate a brief, engaging caption for an image or video.`
      } else if (contentType === 'hashtags') {
        systemPrompt += `\n\nContent Type: Hashtags only - Generate relevant, trending hashtags for the content.`
      } else if (contentType === 'post') {
        systemPrompt += `\n\nContent Type: Complete social media post with full text content.`
      }
    }

    // Add topic if provided
    if (topic && topic !== 'no-topic') {
      systemPrompt += `\n\nTopic: ${topic}`
    }

    // Add tone if provided
    if (tone && tone !== 'no-tone') {
      systemPrompt += `\n\nTone: ${tone}`
    }

    // Add platform-specific guidance
    if (targetPlatforms && targetPlatforms.length > 0) {
      const platformNames = targetPlatforms.map((p: string) => {
        switch(p) {
          case 'facebook': return 'Facebook'
          case 'instagram': return 'Instagram'
          case 'linkedin': return 'LinkedIn'
          case 'twitter': return 'X/Twitter'
          case 'threads': return 'Threads'
          case 'tiktok': return 'TikTok'
          case 'youtube': return 'YouTube'
          case 'bluesky': return 'Bluesky'
          default: return p
        }
      }).join(', ')
      
      systemPrompt += `\n\nTarget Platform(s): ${platformNames}`
      
      if (targetPlatforms.includes('twitter')) {
        systemPrompt += `\n- For Twitter: Keep it concise (under 280 characters if possible), punchy, and attention-grabbing`
      }
      if (targetPlatforms.includes('linkedin')) {
        systemPrompt += `\n- For LinkedIn: Use a professional yet personable tone, focus on value and insights`
      }
      if (targetPlatforms.includes('instagram')) {
        systemPrompt += `\n- For Instagram: Be visual-friendly, use emojis, and create content that complements images`
      }
      if (targetPlatforms.includes('tiktok')) {
        systemPrompt += `\n- For TikTok: Be energetic, youth-friendly, and trend-aware`
      }
      if (targetPlatforms.includes('youtube')) {
        systemPrompt += `\n- For YouTube: Create compelling descriptions or video titles that drive views`
      }
    }

    // Add media context
    if (hasMedia && mediaTypes && mediaTypes.length > 0) {
      const hasVideo = mediaTypes.includes('video')
      const hasImage = mediaTypes.includes('image')
      
      if (hasVideo) {
        systemPrompt += `\n\nThis post will include a VIDEO. Write content that complements and promotes the video content.`
      } else if (hasImage) {
        systemPrompt += `\n\nThis post will include IMAGE(S). Write content that enhances and describes the visual content.`
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate a social media post based on these instructions:\n\n${prompt}` }
    ]

    // Try primary model first, fallback to RouteLLM if it fails
    let response: Response
    let modelUsed = 'gpt-4.1-mini'
    
    try {
      response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: messages,
          stream: true,
          max_tokens: 500,
          temperature: 0.8
        }),
      })

      if (!response.ok) {
        throw new Error(`Primary model error: ${response.status}`)
      }
    } catch (primaryError) {
      console.log('Primary model failed, falling back to RouteLLM:', primaryError)
      
      // Fallback to RouteLLM
      modelUsed = 'gpt-4o-mini'
      response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          stream: true,
          max_tokens: 500,
          temperature: 0.8
        }),
      })

      if (!response.ok) {
        throw new Error(`RouteLLM fallback error: ${response.status}`)
      }
    }

    let generatedContent = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()

        try {
          let partialRead = ''
          
          while (true) {
            const { done, value } = await reader?.read() ?? { done: true, value: undefined }
            if (done) break

            partialRead += decoder.decode(value, { stream: true })
            let lines = partialRead.split('\n')
            partialRead = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  // Save to database when complete
                  try {
                    const user = await prisma.user.findUnique({
                      where: { email: session.user?.email! }
                    })
                    
                    if (user && generatedContent.trim()) {
                      await prisma.generatedContent.create({
                        data: {
                          userId: user.id,
                          prompt,
                          generatedText: generatedContent.trim(),
                          contentType: contentType || 'post',
                          platform: targetPlatforms && targetPlatforms.length > 0 ? targetPlatforms[0] : null,
                          topic: topic || null,
                          tone: tone || null,
                          model: modelUsed
                        }
                      })
                    }
                  } catch (dbError) {
                    console.error('Database save error:', dbError)
                  }
                  
                  const finalData = JSON.stringify({
                    status: 'completed',
                    content: generatedContent.trim()
                  })
                  controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
                  return
                }
                
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  if (content) {
                    generatedContent += content
                    const progressData = JSON.stringify({
                      status: 'streaming',
                      content: content
                    })
                    controller.enqueue(encoder.encode(`data: ${progressData}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          const errorData = JSON.stringify({
            status: 'error',
            message: 'Content generation failed'
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Content generation error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
