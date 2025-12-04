
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image_file') as File
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Read the Remove.bg API key from the auth secrets file
    const authSecretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json'
    let removeBgApiKey = ''
    
    try {
      const authSecretsContent = await fs.readFile(authSecretsPath, 'utf-8')
      const authSecrets = JSON.parse(authSecretsContent)
      removeBgApiKey = authSecrets['remove.bg']?.secrets?.api_key?.value || ''
    } catch (error) {
      console.error('Error reading Remove.bg API key:', error)
      return NextResponse.json({ error: 'Remove.bg API key not configured' }, { status: 500 })
    }

    if (!removeBgApiKey) {
      return NextResponse.json({ error: 'Remove.bg API key not found' }, { status: 500 })
    }

    // Convert the image file to a buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Call the Remove.bg API
    const formDataToSend = new FormData()
    formDataToSend.append('image_file', new Blob([buffer]), imageFile.name)
    formDataToSend.append('size', 'auto')

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': removeBgApiKey,
      },
      body: formDataToSend,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Remove.bg API error:', errorText)
      return NextResponse.json({ error: 'Failed to remove background' }, { status: response.status })
    }

    // Get the processed image as a buffer
    const resultBuffer = await response.arrayBuffer()
    
    // Convert to base64 data URL
    const base64Image = Buffer.from(resultBuffer).toString('base64')
    const dataUrl = `data:image/png;base64,${base64Image}`

    return NextResponse.json({ 
      success: true, 
      imageUrl: dataUrl 
    })

  } catch (error) {
    console.error('Remove background error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
