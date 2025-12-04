
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getCurrentCompany } from '@/lib/company-utils'

const prisma = new PrismaClient()

// GET - Fetch user's posts for current company
export async function GET(request: NextRequest) {
  try {
    const companyData = await getCurrentCompany()
    if (!companyData) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { userId, companyId } = companyData

    if (!companyId) {
      return Response.json({ posts: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: any = { userId, companyId }
    if (status) {
      whereClause.status = status
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        contentTemplate: {
          select: {
            id: true,
            title: true,
            topic: true
          }
        },
        analytics: true
      }
    })

    const totalCount = await prisma.post.count({
      where: whereClause
    })

    return Response.json({
      posts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    })

  } catch (error) {
    console.error('Fetch posts error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
