
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/companies/switch - Switch active company
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
    const { companyId } = body

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Verify user is a member of this company
    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: user.id
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this company' }, { status: 403 })
    }

    // Update user's selected company
    await prisma.user.update({
      where: { id: user.id },
      data: { selectedCompanyId: companyId }
    })

    return NextResponse.json({ 
      message: 'Company switched successfully',
      companyId 
    })
  } catch (error) {
    console.error('Error switching company:', error)
    return NextResponse.json({ error: 'Failed to switch company' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
