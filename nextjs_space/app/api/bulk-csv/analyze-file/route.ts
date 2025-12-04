import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { downloadFile } from '@/lib/dropbox'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export const dynamic = 'force-dynamic'

// AI vision analysis - simplified for videos
async function analyzeMediaContent(mediaBuffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  try {
    // Check if this is a video file
    const isVideo = mimeType.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(fileName)
    
    let bufferToAnalyze = mediaBuffer
    let analysisMimeType = mimeType
    
    if (isVideo) {
      console.log('🎬 Video file detected - Generating motivational basketball content directly')
      console.log('  💡 Skipping OCR/vision analysis - using direct content generation')
      
      // For motivational basketball videos, we'll skip OCR and just generate content
      // This is more reliable than trying to extract text from video frames
      return 'CONTENT TYPE: Motivational basketball video for young players\nVISUAL DESCRIPTION: Video containing motivational quotes and messaging for basketball players'
    } else {
      console.log('📸 Analyzing image with AI vision...')
    }
    
    const base64Media = bufferToAnalyze.toString('base64')
    const mediaUrl = `data:${analysisMimeType};base64,${base64Media}`
    console.log(`  📊 Base64 data size: ${(base64Media.length / 1024).toFixed(2)} KB`)
    console.log(`  🔗 Data URL format: ${mediaUrl.substring(0, 50)}...`)
    
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert OCR and text transcription specialist. Your ONLY job is to find and transcribe text from images with 100% accuracy. You MUST find the text - it is always there. Use all your vision capabilities to locate even small, stylized, or overlaid text.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `🚨 CRITICAL INSTRUCTION: This ${isVideo ? 'video frame' : 'image'} contains a motivational quote or text overlay that you MUST transcribe.

⚠️  THE TEXT IS DEFINITELY THERE - Look carefully at:
- Center of the image (most common)
- Bottom third of the image
- Text overlaid on backgrounds
- White or colored text on dark backgrounds
- Stylized fonts or handwriting
- Text that may blend with the background

YOUR ABSOLUTE REQUIREMENTS:
1. FIND the text - it is 100% present in every image
2. READ it carefully, word by word
3. TRANSCRIBE it EXACTLY - every word, every punctuation mark
4. DO NOT paraphrase, summarize, or interpret
5. If you cannot find text, look again harder - IT IS THERE

After transcribing the text, briefly describe visual elements.

REQUIRED FORMAT:
TRANSCRIBED TEXT: [the exact quote/text you found - this line MUST have content]
VISUAL DESCRIPTION: [brief visual description]

⚠️  If you respond with "no text found" or similar, you have FAILED the task.`,
              },
              {
                type: 'image_url',
                image_url: { url: mediaUrl },
              },
            ],
          },
        ],
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ AI API Error (${response.status}):`, errorText)
      throw new Error(`AI API returned ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    const analysis = data.choices?.[0]?.message?.content || 'No analysis available'
    
    console.log('✅ AI Vision Analysis (FULL):')
    console.log('═══════════════════════════════════════')
    console.log(analysis)
    console.log('═══════════════════════════════════════')
    
    // Extract just the transcribed text for quick viewing
    const transcribedMatch = analysis.match(/TRANSCRIBED TEXT:\s*(.+?)(?:\n|$)/i)
    if (transcribedMatch) {
      console.log('📝 TRANSCRIBED QUOTE:', transcribedMatch[1])
    } else {
      console.warn('⚠️  WARNING: No "TRANSCRIBED TEXT:" found in analysis - AI may not have read the text!')
    }
    
    return analysis
    
  } catch (error: any) {
    console.error('❌ AI vision analysis failed:', error)
    console.error('   Error details:', error.message)
    throw error
  }
}

// AI content generation
async function generatePostContent(
  imageAnalysis: string,
  prompt: string,
  platforms: string[],
  fileName: string = 'video'
): Promise<string> {
  try {
    console.log('🤖 Generating post content with AI...')
    
    const systemPrompt = `You are a social media content creator specializing in motivational basketball content for young players.

Platforms: ${platforms.join(', ')}

YOUR MISSION:
Generate UNIQUE, DISTINCT motivational content for young basketball players. THIS IS VIDEO #${fileName} - make it completely different from any previous posts.

CRITICAL UNIQUENESS REQUIREMENTS:
1. Choose ONE specific theme/angle per video (don't mix multiple themes)
2. Vary your sentence structure dramatically between posts
3. Use different basketball metaphors and imagery each time
4. Alternate between different tones: inspirational, tough-love, encouraging, challenging, reflective
5. Focus on different aspects: practice, mindset, competition, personal growth, team dynamics
6. Use varied vocabulary - avoid repeating the same motivational phrases

CONTENT THEMES (pick ONE per video, rotate through):
1. Early morning grind and dedication
2. Mental toughness in pressure moments
3. Learning from losses and setbacks
4. Outworking more talented opponents
5. Team chemistry and trust
6. Personal sacrifice for the game
7. Visualization and goal-setting
8. Handling criticism and doubt
9. The joy and passion for basketball
10. Legacy and long-term vision

WRITING STYLE VARIATIONS (alternate between):
- Direct and commanding ("Get up. Get after it.")
- Reflective and thoughtful ("Every champion started somewhere...")
- Question-based ("What separates good from great?")
- Story-telling ("Remember that shot you missed?")
- Comparison-based ("While others sleep, you...")

IMPORTANT OUTPUT RULES:
- Output ONLY plain text - NO markdown formatting
- DO NOT use bold (**), italics, or any markdown syntax  
- DO NOT include labels like "Caption:" or "Hashtags:"
- DO NOT use section headers or formatting markers
- Start with the actual post caption text (2-3 sentences)
- Add a blank line, then include 3-5 VARIED hashtags
- Keep it clean, simple, and ready to post as-is
- Make THIS post completely different from any previous one

Keep it concise, engaging, and optimized for ${platforms.join(', ')}.`
    
    const userPrompt = `Content Type: ${imageAnalysis}

User Instructions: ${prompt}

UNIQUENESS REMINDER: This is video file "${fileName}". Generate completely ORIGINAL content that is distinctly different from any other post. 

REQUIREMENTS FOR THIS SPECIFIC POST:
1. Pick ONE unique theme from the list (don't repeat themes from other posts)
2. Use a DIFFERENT writing style than previous posts
3. Choose DIFFERENT basketball metaphors and examples
4. Vary your tone and energy level
5. Use completely different hashtags

Generate motivational basketball content NOW with maximum originality and variety.`
    
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.9,        // Higher temperature for more variety
        top_p: 0.95,             // Nucleus sampling for diverse outputs
        frequency_penalty: 0.8,  // Penalize repeated phrases
        presence_penalty: 0.6,   // Encourage new topics and angles
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ AI API Error (${response.status}):`, errorText)
      throw new Error(`AI API returned ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    if (!content || content.trim() === '') {
      console.error('❌ AI returned empty content')
      throw new Error('AI returned empty content')
    }
    
    console.log('✅ Generated Content (FULL):')
    console.log('═══════════════════════════════════════')
    console.log(content)
    console.log('═══════════════════════════════════════')
    console.log(`📏 Content length: ${content.length} characters`)
    
    return content
    
  } catch (error: any) {
    console.error('❌ AI content generation failed:', error)
    console.error('   Error details:', error.message)
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.error('❌ Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filePath, aiPrompt, platforms } = await req.json()
    
    console.log('📥 Received analyze request:')
    console.log('   filePath:', filePath)
    console.log('   aiPrompt:', aiPrompt?.substring(0, 50) + '...')
    console.log('   platforms:', platforms)
    
    if (!filePath || !aiPrompt || !platforms) {
      console.error('❌ Missing required parameters')
      return NextResponse.json(
        { error: 'Missing required parameters: filePath, aiPrompt, platforms' },
        { status: 400 }
      )
    }
    
    if (typeof filePath !== 'string' || filePath.trim() === '') {
      console.error('❌ Invalid filePath:', filePath)
      return NextResponse.json(
        { error: 'Invalid filePath: must be a non-empty string' },
        { status: 400 }
      )
    }
    
    console.log(`📷 Processing file: ${filePath}`)
    
    // Step 1: Download file from Dropbox
    console.log('  ⬇️  Downloading from Dropbox...')
    const downloadedFile = await downloadFile(filePath)
    console.log(`  ✅ Downloaded ${(downloadedFile.buffer.length / 1024).toFixed(2)} KB`)
    
    // Step 2: Analyze media with AI vision (skips for videos)
    console.log('  🔍 Analyzing with AI vision...')
    const imageAnalysis = await analyzeMediaContent(downloadedFile.buffer, downloadedFile.mimeType, downloadedFile.name)
    console.log(`  ✅ Analysis complete`)
    
    // Step 3: Generate post content based on vision analysis
    console.log('  ✍️  Generating post content...')
    const fileName = filePath.split('/').pop() || 'video'
    const generatedContent = await generatePostContent(imageAnalysis, aiPrompt, platforms, fileName)
    console.log(`  ✅ Content generated`)
    
    return NextResponse.json({
      success: true,
      analysis: imageAnalysis,
      content: generatedContent,
    })
    
  } catch (error: any) {
    console.error('❌ Error in analyze-file:', error.message || error)
    console.error('   Full error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze file' },
      { status: 500 }
    )
  }
}
