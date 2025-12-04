
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lateApiKey = process.env.LATE_API_KEY
    if (!lateApiKey) {
      return Response.json({ error: 'Late API key not configured' }, { status: 500 })
    }

    // Return the API key to authenticated users for direct uploads
    return Response.json({ apiKey: lateApiKey })

  } catch (error) {
    console.error('Get API key error:', error)
    return Response.json({ 
      error: 'Failed to get API key' 
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
