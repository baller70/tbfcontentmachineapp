import { describe, it, expect, beforeEach } from 'vitest'
import { seriesCoordinator, getRateLimiterStatus } from '../multi-series-coordinator'

describe('SeriesCoordinator', () => {
  beforeEach(() => {
    seriesCoordinator.clearCompleted()
  })

  describe('queueSeries', () => {
    it('should queue a series for processing', () => {
      seriesCoordinator.queueSeries('series-1', 'Test Series', 10)
      
      const status = seriesCoordinator.getSeriesStatus('series-1')
      expect(status).not.toBeUndefined()
      expect(status?.seriesName).toBe('Test Series')
      expect(status?.status).toBe('queued')
      expect(status?.progress.total).toBe(10)
    })
  })

  describe('updateProgress', () => {
    it('should update series progress', () => {
      seriesCoordinator.queueSeries('series-1', 'Test Series', 10)
      
      seriesCoordinator.updateProgress('series-1', {
        processed: 5,
        successful: 4,
        failed: 1,
        currentFile: 'file5.jpg'
      })
      
      const status = seriesCoordinator.getSeriesStatus('series-1')
      expect(status?.progress.processed).toBe(5)
      expect(status?.progress.successful).toBe(4)
      expect(status?.progress.failed).toBe(1)
      expect(status?.currentFile).toBe('file5.jpg')
    })
  })

  describe('startProcessing', () => {
    it('should mark series as processing', () => {
      seriesCoordinator.queueSeries('series-1', 'Test Series', 10)
      seriesCoordinator.startProcessing('series-1')
      
      const status = seriesCoordinator.getSeriesStatus('series-1')
      expect(status?.status).toBe('processing')
      expect(status?.startedAt).toBeDefined()
    })
  })

  describe('completeProcessing', () => {
    it('should mark series as completed on success', () => {
      seriesCoordinator.queueSeries('series-1', 'Test Series', 10)
      seriesCoordinator.startProcessing('series-1')
      seriesCoordinator.completeProcessing('series-1', true)
      
      const status = seriesCoordinator.getSeriesStatus('series-1')
      expect(status?.status).toBe('completed')
      expect(status?.completedAt).toBeDefined()
    })

    it('should mark series as failed on error', () => {
      seriesCoordinator.queueSeries('series-1', 'Test Series', 10)
      seriesCoordinator.startProcessing('series-1')
      seriesCoordinator.completeProcessing('series-1', false, 'Something went wrong')
      
      const status = seriesCoordinator.getSeriesStatus('series-1')
      expect(status?.status).toBe('failed')
      expect(status?.error).toBe('Something went wrong')
    })
  })

  describe('getSummary', () => {
    it('should return correct summary statistics', () => {
      seriesCoordinator.queueSeries('series-1', 'Series 1', 10)
      seriesCoordinator.queueSeries('series-2', 'Series 2', 5)
      seriesCoordinator.queueSeries('series-3', 'Series 3', 8)
      
      seriesCoordinator.startProcessing('series-1')
      seriesCoordinator.completeProcessing('series-2', true)
      
      const summary = seriesCoordinator.getSummary()
      
      expect(summary.queued).toBe(1) // series-3
      expect(summary.processing).toBe(1) // series-1
      expect(summary.completed).toBe(1) // series-2
      expect(summary.totalFiles).toBe(23) // 10 + 5 + 8
    })
  })

  describe('canStartNewSeries', () => {
    it('should return true when under max concurrent limit', () => {
      expect(seriesCoordinator.canStartNewSeries()).toBe(true)
    })
  })

  describe('getAllStatus', () => {
    it('should return all series statuses', () => {
      seriesCoordinator.queueSeries('series-1', 'Series 1', 10)
      seriesCoordinator.queueSeries('series-2', 'Series 2', 5)
      
      const allStatus = seriesCoordinator.getAllStatus()
      expect(allStatus).toHaveLength(2)
    })
  })

  describe('clearCompleted', () => {
    it('should remove completed and failed series', () => {
      seriesCoordinator.queueSeries('series-1', 'Series 1', 10)
      seriesCoordinator.queueSeries('series-2', 'Series 2', 5)
      
      seriesCoordinator.completeProcessing('series-1', true)
      seriesCoordinator.completeProcessing('series-2', false)
      
      seriesCoordinator.clearCompleted()
      
      const allStatus = seriesCoordinator.getAllStatus()
      expect(allStatus).toHaveLength(0)
    })
  })
})

describe('getRateLimiterStatus', () => {
  it('should return rate limiter status', () => {
    const status = getRateLimiterStatus()
    
    expect(status).toHaveProperty('availableSlots')
    expect(status).toHaveProperty('limit')
    expect(typeof status.availableSlots).toBe('number')
    expect(typeof status.limit).toBe('number')
  })
})

