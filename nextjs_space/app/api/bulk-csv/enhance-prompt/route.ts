import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, platforms } = await req.json()

    if (!prompt || prompt.trim() === '') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const abacusApiKey = process.env.ABACUSAI_API_KEY
    if (!abacusApiKey) {
      return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 })
    }

    console.log('🔮 Enhancing prompt:', prompt.substring(0, 100) + '...')

    const platformList = platforms?.length > 0 ? platforms.join(', ') : 'Instagram, Facebook, TikTok, YouTube'

    const systemPrompt = `You are an expert social media content strategist. Your task is to enhance and expand vague user prompts into detailed, specific instructions that will help AI generate high-quality social media content.

When enhancing a prompt, you should:
1. Clarify the user's intent and expand vague instructions into specific details
2. Add platform-specific best practices for: ${platformList}
3. Include guidance on tone, voice, and style
4. Suggest appropriate hashtag strategies
5. Consider character limits (Instagram: 2200, Twitter: 280, TikTok: 2200, Facebook: unlimited but 40-80 chars optimal)
6. Add emotional hooks and engagement triggers
7. Include call-to-action suggestions when appropriate

IMPORTANT: Return ONLY the enhanced prompt text. Do not include explanations, labels, or formatting. The output should be a single, improved version of the user's prompt that they can directly use.`

    const userPrompt = `Original user prompt to enhance:
"${prompt}"

Enhance this prompt to be more detailed and effective for generating social media content for ${platformList}. Make it specific, actionable, and optimized for engagement.`

    const response = await axios.post(
      'https://apps.abacus.ai/v1/chat/completions',
      {
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${abacusApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const enhancedPrompt = response.data.choices?.[0]?.message?.content || ''

    if (!enhancedPrompt || enhancedPrompt.trim() === '') {
      throw new Error('AI returned empty response')
    }

    console.log('✅ Enhanced prompt:', enhancedPrompt.substring(0, 100) + '...')

    return NextResponse.json({
      success: true,
      enhancedPrompt: enhancedPrompt.trim(),
    })
  } catch (error: any) {
    console.error('❌ Error enhancing prompt:', error.message || error)
    return NextResponse.json(
      { error: error.message || 'Failed to enhance prompt' },
      { status: 500 }
    )
  }
}

