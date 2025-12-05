/**
 * Multi-Series Coordinator
 * 
 * Manages concurrent execution of 10-15 series simultaneously
 * while respecting Late API rate limits across all series.
 * 
 * Key Features:
 * 1. Global rate limiting shared across all series
 * 2. Series queue management
 * 3. Status tracking for all active series
 * 4. Automatic retry for failed series
 */

import { PrismaClient } from '@prisma/client'
import { globalRateLimiter, OPTIMIZATION_CONFIG } from './bulk-schedule-optimizer'

const prisma = new PrismaClient()

// Series status tracking
export interface SeriesStatus {
  seriesId: string
  seriesName: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused'
  progress: {
    total: number
    processed: number
    successful: number
    failed: number
  }
  startedAt?: Date
  completedAt?: Date
  error?: string
  currentFile?: string
}

// Global series coordinator state
class SeriesCoordinator {
  private activeSeriesMap = new Map<string, SeriesStatus>()
  private processingQueue: string[] = []
  private maxConcurrentSeries = 5 // Process up to 5 series at once
  private isRunning = false
  
  /**
   * Get status of all series
   */
  getAllStatus(): SeriesStatus[] {
    return Array.from(this.activeSeriesMap.values())
  }
  
  /**
   * Get status of a specific series
   */
  getSeriesStatus(seriesId: string): SeriesStatus | undefined {
    return this.activeSeriesMap.get(seriesId)
  }
  
  /**
   * Add series to processing queue
   */
  queueSeries(seriesId: string, seriesName: string, totalFiles: number): void {
    const status: SeriesStatus = {
      seriesId,
      seriesName,
      status: 'queued',
      progress: {
        total: totalFiles,
        processed: 0,
        successful: 0,
        failed: 0
      }
    }
    
    this.activeSeriesMap.set(seriesId, status)
    this.processingQueue.push(seriesId)
    
    console.log(`📋 Series "${seriesName}" queued for processing (${totalFiles} files)`)
  }
  
  /**
   * Update series progress
   */
  updateProgress(
    seriesId: string, 
    update: Partial<SeriesStatus['progress']> & { currentFile?: string }
  ): void {
    const status = this.activeSeriesMap.get(seriesId)
    if (status) {
      status.progress = { ...status.progress, ...update }
      if (update.currentFile) {
        status.currentFile = update.currentFile
      }
    }
  }
  
  /**
   * Mark series as processing
   */
  startProcessing(seriesId: string): void {
    const status = this.activeSeriesMap.get(seriesId)
    if (status) {
      status.status = 'processing'
      status.startedAt = new Date()
    }
  }
  
  /**
   * Mark series as completed
   */
  completeProcessing(seriesId: string, success: boolean, error?: string): void {
    const status = this.activeSeriesMap.get(seriesId)
    if (status) {
      status.status = success ? 'completed' : 'failed'
      status.completedAt = new Date()
      if (error) {
        status.error = error
      }
    }
  }
  
  /**
   * Get number of currently processing series
   */
  getActiveCount(): number {
    return Array.from(this.activeSeriesMap.values())
      .filter(s => s.status === 'processing').length
  }
  
  /**
   * Check if can start new series
   */
  canStartNewSeries(): boolean {
    return this.getActiveCount() < this.maxConcurrentSeries
  }
  
  /**
   * Get next series from queue
   */
  getNextFromQueue(): string | undefined {
    return this.processingQueue.shift()
  }
  
  /**
   * Clear completed series from tracking
   */
  clearCompleted(): void {
    for (const [id, status] of this.activeSeriesMap.entries()) {
      if (status.status === 'completed' || status.status === 'failed') {
        this.activeSeriesMap.delete(id)
      }
    }
  }
  
  /**
   * Get summary statistics
   */
  getSummary(): {
    queued: number
    processing: number
    completed: number
    failed: number
    totalFiles: number
    processedFiles: number
  } {
    const statuses = Array.from(this.activeSeriesMap.values())
    return {
      queued: statuses.filter(s => s.status === 'queued').length,
      processing: statuses.filter(s => s.status === 'processing').length,
      completed: statuses.filter(s => s.status === 'completed').length,
      failed: statuses.filter(s => s.status === 'failed').length,
      totalFiles: statuses.reduce((sum, s) => sum + s.progress.total, 0),
      processedFiles: statuses.reduce((sum, s) => sum + s.progress.processed, 0)
    }
  }
}

// Export singleton instance
export const seriesCoordinator = new SeriesCoordinator()

/**
 * API endpoint response types
 */
export interface MultiSeriesStatusResponse {
  success: boolean
  summary: ReturnType<typeof seriesCoordinator.getSummary>
  series: SeriesStatus[]
  rateLimiter: {
    availableSlots: number
    limit: number
  }
}

/**
 * Queue multiple series for concurrent processing
 */
export async function queueMultipleSeries(seriesIds: string[]): Promise<{
  queued: string[]
  errors: Array<{ seriesId: string, error: string }>
}> {
  const queued: string[] = []
  const errors: Array<{ seriesId: string, error: string }> = []

  for (const seriesId of seriesIds) {
    try {
      // Get series info from database
      const series = await prisma.postSeries.findUnique({
        where: { id: seriesId },
        select: {
          id: true,
          name: true,
          dropboxFolderPath: true,
          status: true
        }
      })

      if (!series) {
        errors.push({ seriesId, error: 'Series not found' })
        continue
      }

      if (series.status !== 'ACTIVE') {
        errors.push({ seriesId, error: 'Series is not active' })
        continue
      }

      if (!series.dropboxFolderPath) {
        errors.push({ seriesId, error: 'No Dropbox folder configured' })
        continue
      }

      // Queue the series (we'll get file count when processing starts)
      seriesCoordinator.queueSeries(seriesId, series.name, 0)
      queued.push(seriesId)

    } catch (error) {
      errors.push({
        seriesId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return { queued, errors }
}

/**
 * Get rate limiter status
 */
export function getRateLimiterStatus(): { availableSlots: number, limit: number } {
  return {
    availableSlots: globalRateLimiter.getAvailableSlots(),
    limit: OPTIMIZATION_CONFIG.RATE_LIMITS.BUILD // Default tier
  }
}

