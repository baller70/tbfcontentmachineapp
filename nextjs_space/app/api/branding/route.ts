
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch all workspace brandings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaceBrandings: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ brandings: user.workspaceBrandings || [] })
  } catch (error) {
    console.error('Failed to fetch brandings:', error)
    return NextResponse.json({ error: 'Failed to fetch brandings' }, { status: 500 })
  }
}

// POST - Create new workspace branding
export async function POST(request: Request) {
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
    const { name, logoUrl, brandColors, isDefault } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // If this is the first branding or isDefault is true, set as default
    const existingBrandings = await prisma.workspaceBranding.findMany({
      where: { userId: user.id }
    })

    const shouldBeDefault = isDefault || existingBrandings.length === 0

    // If setting as default, unset all other defaults
    if (shouldBeDefault) {
      await prisma.workspaceBranding.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      })
    }

    const branding = await prisma.workspaceBranding.create({
      data: {
        userId: user.id,
        name: name.trim(),
        logoUrl: logoUrl || null,
        brandColors: brandColors || ['#FF0000', '#808080', '#000000', '#FFFFFF'],
        isDefault: shouldBeDefault
      }
    })

    return NextResponse.json({ branding })
  } catch (error: any) {
    console.error('Failed to create branding:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A branding with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create branding' }, { status: 500 })
  }
}

// PUT - Update workspace branding
export async function PUT(request: Request) {
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
    const { id, name, logoUrl, brandColors, isDefault } = body

    if (!id) {
      return NextResponse.json({ error: 'Branding ID is required' }, { status: 400 })
    }

    // Verify the branding belongs to this user
    const existingBranding = await prisma.workspaceBranding.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingBranding) {
      return NextResponse.json({ error: 'Branding not found' }, { status: 404 })
    }

    // If setting as default, unset all other defaults
    if (isDefault && !existingBranding.isDefault) {
      await prisma.workspaceBranding.updateMany({
        where: { userId: user.id, id: { not: id } },
        data: { isDefault: false }
      })
    }

    const branding = await prisma.workspaceBranding.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        brandColors: brandColors || undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined
      }
    })

    return NextResponse.json({ branding })
  } catch (error: any) {
    console.error('Failed to update branding:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A branding with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
  }
}

// DELETE - Delete workspace branding
export async function DELETE(request: Request) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Branding ID is required' }, { status: 400 })
    }

    // Verify the branding belongs to this user
    const existingBranding = await prisma.workspaceBranding.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingBranding) {
      return NextResponse.json({ error: 'Branding not found' }, { status: 404 })
    }

    await prisma.workspaceBranding.delete({
      where: { id }
    })

    // If we deleted the default, set another as default
    if (existingBranding.isDefault) {
      const firstBranding = await prisma.workspaceBranding.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
      })

      if (firstBranding) {
        await prisma.workspaceBranding.update({
          where: { id: firstBranding.id },
          data: { isDefault: true }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete branding:', error)
    return NextResponse.json({ error: 'Failed to delete branding' }, { status: 500 })
  }
}
