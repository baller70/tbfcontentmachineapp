import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listFilesInFolder } from '@/lib/dropbox'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.error('❌ Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path') || ''
    console.log('📂 Listing files from Dropbox path:', path)

    const files = await listFilesInFolder(path)
    console.log(`   Found ${files.length} total files in Dropbox`)
    
    // Filter to only media files
    const mediaFiles = files.filter(f => 
      /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)$/i.test(f.name)
    )
    console.log(`   Filtered to ${mediaFiles.length} media files`)

    return NextResponse.json(mediaFiles)
  } catch (error: any) {
    console.error('❌ Error listing Dropbox files:', error.message || error)
    console.error('   Full error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list files' },
      { status: 500 }
    )
  }
}
