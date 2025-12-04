
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { rawText, platforms, hasMedia, mediaTypes, isInstructions } = await request.json()

    if (!rawText || !rawText.trim()) {
      return new Response('Raw text is required', { status: 400 })
    }

    // Build context-aware system prompt based on whether we're polishing instructions or post content
    let systemPrompt = ''
    let userPrompt = ''
    
    if (isInstructions) {
      // Polish the instructions/prompt - make them clearer and more detailed
      systemPrompt = `You are an expert prompt engineer for social media content. Transform the user's rough instructions into clear, detailed, actionable instructions that will help generate great social media content.

Guidelines:
- Make the instructions specific and actionable
- Add relevant context about tone, style, and content elements
- Clarify any vague points
- Suggest specific angles or hooks
- Keep it concise but comprehensive
- Format as clear instructions, not as a post`

      if (platforms && platforms.length > 0) {
        const platformNames = platforms.join(', ')
        systemPrompt += `\n- Target platforms: ${platformNames}`
      }

      if (hasMedia) {
        const videoCount = mediaTypes?.filter((t: string) => t === 'video').length || 0
        const imageCount = mediaTypes?.filter((t: string) => t === 'image').length || 0
        
        if (videoCount > 0) {
          systemPrompt += `\n- Note: This will include ${videoCount} video(s)`
        }
        if (imageCount > 0) {
          systemPrompt += `\n- Note: This will include ${imageCount} image(s)`
        }
      }

      systemPrompt += `\n\nIMPORTANT: Return ONLY polished INSTRUCTIONS. Do not generate the actual post content.`
      userPrompt = `Polish these instructions into clear, actionable guidance:\n\n${rawText}`
      
    } else {
      // Polish raw text into a post
      systemPrompt = `You are an expert social media content creator. Transform the user's raw text into a polished, engaging social media post that will maximize engagement.

Guidelines:
- Keep the authentic voice and message from the raw text
- Add relevant emojis naturally (but don't overdo it)
- Include strategic hashtags at the end (3-8 hashtags)
- Make it conversational and engaging
- Focus on storytelling and connection with the audience
- Use line breaks for better readability
- Match the tone to the platform(s)`

      if (platforms && platforms.length > 0) {
        if (platforms.includes('twitter')) {
          systemPrompt += `\n- Keep it concise for Twitter (under 280 characters if possible)`
        }
        if (platforms.includes('linkedin')) {
          systemPrompt += `\n- Use a professional tone suitable for LinkedIn`
        }
        if (platforms.includes('instagram')) {
          systemPrompt += `\n- Make it visual-friendly for Instagram`
        }
        if (platforms.includes('tiktok')) {
          systemPrompt += `\n- Use energetic, youth-friendly language for TikTok`
        }
      }

      if (hasMedia) {
        const videoCount = mediaTypes?.filter((t: string) => t === 'video').length || 0
        const imageCount = mediaTypes?.filter((t: string) => t === 'image').length || 0
        
        if (videoCount > 0) {
          systemPrompt += `\n- This post includes ${videoCount} video(s), so reference the visual content appropriately`
        }
        if (imageCount > 0) {
          systemPrompt += `\n- This post includes ${imageCount} image(s), complement the visual with your copy`
        }
      }

      systemPrompt += `\n\nIMPORTANT: Return ONLY the polished post content. No explanations, no meta-commentary.`
      userPrompt = `Polish this into a great social media post:\n\n${rawText}`
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    // Try primary model first, fallback to RouteLLM if it fails
    let response: Response
    
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
    console.error('Polish prompt error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
