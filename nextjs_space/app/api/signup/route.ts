
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return Response.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return Response.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        role: 'USER'
      }
    })

    // Create default profile for new user
    const defaultProfile = await prisma.profile.create({
      data: {
        userId: user.id,
        name: 'Basketball Factory',
        description: 'Default profile',
        isDefault: true
      }
    })

    // Create default platform settings for the profile
    const defaultPlatforms = [
      { platform: 'instagram', platformId: 'instagram' },
      { platform: 'linkedin', platformId: 'linkedin' },
      { platform: 'tiktok', platformId: 'tiktok' },
      { platform: 'youtube', platformId: 'youtube' },
      { platform: 'twitter', platformId: 'twitter' }
    ]

    await Promise.all(
      defaultPlatforms.map(platformData =>
        prisma.platformSetting.create({
          data: {
            userId: user.id,
            profileId: defaultProfile.id,
            ...platformData,
            isConnected: false,
            isActive: true
          }
        })
      )
    )

    return Response.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
