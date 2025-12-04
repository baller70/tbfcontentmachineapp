
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/companies - List user's companies
export async function GET(request: NextRequest) {
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

    // Get all companies where user is a member
    const companyMemberships = await prisma.companyMember.findMany({
      where: { userId: user.id },
      include: {
        company: {
          include: {
            owner: {
              select: { name: true, email: true }
            },
            _count: {
              select: {
                members: true,
                posts: true,
                templates: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const companies = companyMemberships
      .filter(membership => membership.company !== null)
      .map(membership => ({
        id: membership.company!.id,
        name: membership.company!.name,
        description: membership.company!.description,
        logoUrl: membership.company!.logoUrl,
        isActive: membership.company!.isActive,
        role: membership.role,
        owner: membership.company!.owner,
        memberCount: membership.company!._count.members,
        postCount: membership.company!._count.posts,
        templateCount: membership.company!._count.templates,
        createdAt: membership.company!.createdAt
      }))

    return NextResponse.json({ 
      companies,
      selectedCompanyId: user.selectedCompanyId 
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, description, logoUrl } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Create the company
    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        logoUrl: logoUrl || null,
        ownerId: user.id,
        isActive: true
      }
    })

    // Add user as owner member
    await prisma.companyMember.create({
      data: {
        companyId: company.id,
        userId: user.id,
        role: 'OWNER'
      }
    })

    // Update user's selected company if they don't have one
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { selectedCompanyId: true }
    })

    if (!currentUser?.selectedCompanyId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { selectedCompanyId: company.id }
      })
    }

    return NextResponse.json({ 
      company,
      message: 'Company created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
