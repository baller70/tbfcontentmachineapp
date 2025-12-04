import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { downloadFile } from '@/lib/dropbox'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.error('❌ Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    
    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }
    
    console.log('📥 Downloading file from Dropbox:', path)

    const downloadedFile = await downloadFile(path)
    console.log(`✅ Downloaded ${downloadedFile.name} (${(downloadedFile.buffer.length / 1024).toFixed(2)} KB)`)
    
    // Return the file as a binary response
    return new NextResponse(downloadedFile.buffer, {
      headers: {
        'Content-Type': downloadedFile.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${downloadedFile.name}"`,
        'Content-Length': downloadedFile.buffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('❌ Error downloading Dropbox file:', error.message || error)
    console.error('   Full error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to download file' },
      { status: 500 }
    )
  }
}
