
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch all profiles for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profiles: {
          include: {
            platformSettings: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      profiles: user.profiles
    })

  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}

// POST - Create a new profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, lateProfileId, isDefault } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Profile name is required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.profile.updateMany({
        where: {
          userId: user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // Create the new profile
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        lateProfileId: lateProfileId?.trim() || null,
        isDefault: isDefault ?? false
      },
      include: {
        platformSettings: true
      }
    })

    return NextResponse.json({ 
      profile,
      message: 'Profile created successfully'
    })

  } catch (error: any) {
    console.error('Error creating profile:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A profile with this name already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}

// PUT - Update a profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { profileId, name, description, lateProfileId, isDefault } = body

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    // Verify the profile belongs to the user
    const existingProfile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: user.id
      }
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingProfile.isDefault) {
      await prisma.profile.updateMany({
        where: {
          userId: user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // Update the profile
    const updatedProfile = await prisma.profile.update({
      where: {
        id: profileId
      },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(lateProfileId !== undefined && { lateProfileId: lateProfileId?.trim() || null }),
        ...(isDefault !== undefined && { isDefault })
      },
      include: {
        platformSettings: true
      }
    })

    return NextResponse.json({ 
      profile: updatedProfile,
      message: 'Profile updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating profile:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A profile with this name already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a profile
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    // Verify the profile belongs to the user
    const existingProfile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: user.id
      }
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Delete the profile (cascade will delete platform settings)
    await prisma.profile.delete({
      where: {
        id: profileId
      }
    })

    return NextResponse.json({ 
      message: 'Profile deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    )
  }
}
