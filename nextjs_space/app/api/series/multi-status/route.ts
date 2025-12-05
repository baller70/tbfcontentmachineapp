/**
 * Multi-Series Status API
 * 
 * GET /api/series/multi-status - Get status of all series being processed
 * POST /api/series/multi-status - Queue multiple series for concurrent processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  seriesCoordinator, 
  queueMultipleSeries,
  getRateLimiterStatus,
  MultiSeriesStatusResponse 
} from '@/lib/multi-series-coordinator'

/**
 * GET - Get status of all series being processed
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response: MultiSeriesStatusResponse = {
      success: true,
      summary: seriesCoordinator.getSummary(),
      series: seriesCoordinator.getAllStatus(),
      rateLimiter: getRateLimiterStatus()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting multi-series status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

/**
 * POST - Queue multiple series for concurrent processing
 * 
 * Body: { seriesIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { seriesIds } = body

    if (!Array.isArray(seriesIds) || seriesIds.length === 0) {
      return NextResponse.json(
        { error: 'seriesIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Limit to 15 series at once
    if (seriesIds.length > 15) {
      return NextResponse.json(
        { error: 'Maximum 15 series can be queued at once' },
        { status: 400 }
      )
    }

    const result = await queueMultipleSeries(seriesIds)

    return NextResponse.json({
      success: true,
      queued: result.queued.length,
      queuedIds: result.queued,
      errors: result.errors,
      summary: seriesCoordinator.getSummary()
    })
  } catch (error) {
    console.error('Error queueing series:', error)
    return NextResponse.json(
      { error: 'Failed to queue series' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Clear completed/failed series from tracking
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    seriesCoordinator.clearCompleted()

    return NextResponse.json({
      success: true,
      message: 'Completed series cleared',
      summary: seriesCoordinator.getSummary()
    })
  } catch (error) {
    console.error('Error clearing series:', error)
    return NextResponse.json(
      { error: 'Failed to clear series' },
      { status: 500 }
    )
  }
}

