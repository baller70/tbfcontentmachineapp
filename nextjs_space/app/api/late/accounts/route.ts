
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return Response.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Get profileId from query params
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    if (!profileId) {
      return Response.json({
        success: false,
        error: 'Profile ID is required'
      }, { status: 400 })
    }

    // Fetch the profile to get its Late profile ID
    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: user.id
      }
    })

    if (!profile) {
      return Response.json({
        success: false,
        error: 'Profile not found'
      }, { status: 404 })
    }

    if (!profile.lateProfileId) {
      return Response.json({
        success: false,
        error: 'Late Profile ID not configured for this profile. Please add it in Settings.'
      }, { status: 400 })
    }

    // Fetch accounts from Late API
    const response = await fetch('https://getlate.dev/api/v1/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return Response.json({
        success: false,
        error: errorData.message || 'Failed to fetch accounts'
      }, { status: response.status })
    }

    const data = await response.json()
    const allAccounts = data.accounts || data || []

    // Filter accounts for this specific Late profile ID
    const filteredAccounts = allAccounts.filter((acc: any) => {
      const accProfileId = acc.profileId?._id || acc.profileId
      return accProfileId === profile.lateProfileId && acc.isActive !== false
    })

    return Response.json({
      success: true,
      accounts: filteredAccounts,
      lateProfileId: profile.lateProfileId
    })

  } catch (error) {
    console.error('Error fetching Late accounts:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch accounts'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
