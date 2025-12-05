import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// POST - Test brand voice by generating sample content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { brandVoice, targetAudience, keyMessaging, writingStyle, brandValues, 
            dosAndDonts, toneOfVoice, hashtagStyle, emojiUsage, industryNiche,
            testTopic } = data

    // Build the brand voice context
    let brandContext = 'Generate a sample social media post using the following brand voice profile:\n\n'
    
    if (brandVoice) brandContext += `**Brand Voice:** ${brandVoice}\n\n`
    if (targetAudience) brandContext += `**Target Audience:** ${targetAudience}\n\n`
    if (keyMessaging) brandContext += `**Key Messaging:** ${keyMessaging}\n\n`
    if (writingStyle) brandContext += `**Writing Style:** ${writingStyle}\n\n`
    if (brandValues) brandContext += `**Brand Values:** ${brandValues}\n\n`
    if (toneOfVoice) brandContext += `**Tone of Voice:** ${toneOfVoice}\n\n`
    if (industryNiche) brandContext += `**Industry/Niche:** ${industryNiche}\n\n`
    if (dosAndDonts) brandContext += `**Do's and Don'ts:** ${dosAndDonts}\n\n`
    
    // Emoji and hashtag preferences
    if (emojiUsage) brandContext += `**Emoji Usage:** ${emojiUsage}\n`
    if (hashtagStyle) brandContext += `**Hashtag Style:** ${hashtagStyle}\n\n`

    const topic = testTopic || 'a general brand update or motivational message'
    brandContext += `\n**Topic for this test post:** ${topic}\n\n`
    brandContext += `Generate a social media post that perfectly captures this brand voice. 
Include appropriate hashtags based on the hashtag style preference.
The post should feel authentic to the brand and resonate with the target audience.
Keep it concise but impactful (suitable for Instagram/LinkedIn).`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media copywriter who specializes in capturing unique brand voices. Generate engaging, authentic content that matches the provided brand profile exactly.'
        },
        {
          role: 'user',
          content: brandContext
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    })

    const generatedContent = completion.choices[0]?.message?.content || 'Unable to generate content'

    return NextResponse.json({ 
      success: true,
      generatedContent,
      message: 'Test content generated successfully'
    })

  } catch (error) {
    console.error('Error testing brand voice:', error)
    return NextResponse.json({ error: 'Failed to generate test content' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

