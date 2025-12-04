
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/companies/[id] - Get specific company
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is a member of this company
    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: params.id,
          userId: user.id
        }
      },
      include: {
        company: {
          include: {
            owner: {
              select: { name: true, email: true }
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true }
                }
              }
            }
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Company not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ 
      company: membership.company,
      role: membership.role
    })
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/companies/[id] - Update company
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is owner or admin
    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: params.id,
          userId: user.id
        }
      }
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, logoUrl, isActive } = body

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({ 
      company,
      message: 'Company updated successfully' 
    })
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/companies/[id] - Delete company
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, selectedCompanyId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is owner
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      select: { ownerId: true }
    })

    if (!company || company.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the owner can delete the company' }, { status: 403 })
    }

    // Delete company (cascade will handle related records)
    await prisma.company.delete({
      where: { id: params.id }
    })

    // If this was the user's selected company, update to another company
    if (user.selectedCompanyId === params.id) {
      const otherCompany = await prisma.companyMember.findFirst({
        where: { userId: user.id },
        select: { companyId: true }
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { selectedCompanyId: otherCompany?.companyId || null }
      })
    }

    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
