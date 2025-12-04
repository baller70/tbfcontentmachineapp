
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mediaUrls, currentPrompt } = await request.json()

    if (!mediaUrls || mediaUrls.length === 0) {
      return NextResponse.json({ error: 'No media URLs provided' }, { status: 400 })
    }

    // Build the vision analysis prompt
    const systemPrompt = `You are an expert at analyzing images for social media content creation. Analyze the provided image(s) and provide insights that will help create better post content.

Focus on:
- What's happening in the image(s)
- Key subjects, people, objects, or themes
- Mood and atmosphere
- Colors and visual elements
- Suggested hashtags based on the content
- Content ideas that would complement these images

Keep your analysis concise and actionable. Format as bullet points for easy reading.`

    // Create messages with images for vision model
    const userMessage: any = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: currentPrompt 
            ? `Here are the images for my post. My current draft: "${currentPrompt}"\n\nAnalyze these images and suggest how I can improve or expand my post:`
            : 'Analyze these images and provide insights for creating engaging social media content:'
        }
      ]
    }

    // Add all images to the message
    mediaUrls.forEach((url: string) => {
      userMessage.content.push({
        type: 'image_url',
        image_url: { url }
      })
    })

    const messages = [
      { role: 'system', content: systemPrompt },
      userMessage
    ]

    // Use GPT-4o-mini for vision analysis
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vision API error:', errorText)
      throw new Error(`Vision API error: ${response.status}`)
    }

    const data = await response.json()
    const suggestions = data.choices?.[0]?.message?.content || 'Unable to analyze images'

    return NextResponse.json({
      success: true,
      suggestions
    })

  } catch (error) {
    console.error('Image analysis error:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
