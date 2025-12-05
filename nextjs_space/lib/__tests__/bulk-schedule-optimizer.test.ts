import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  OPTIMIZATION_CONFIG,
  getCachedMedia,
  cacheMedia,
  clearMediaCache,
  retryWithBackoff,
  globalRateLimiter,
  isRateLimitError,
  isNetworkError,
  processInParallel,
} from '../bulk-schedule-optimizer'

describe('OPTIMIZATION_CONFIG', () => {
  it('should have correct timing values', () => {
    expect(OPTIMIZATION_CONFIG.MAX_CONCURRENT_POSTS).toBe(3)
    expect(OPTIMIZATION_CONFIG.DELAY_BETWEEN_POSTS).toBe(2000)
    expect(OPTIMIZATION_CONFIG.DELAY_BETWEEN_BATCHES).toBe(5000)
    expect(OPTIMIZATION_CONFIG.VERIFICATION_DELAY).toBe(5000)
    expect(OPTIMIZATION_CONFIG.VERIFICATION_ATTEMPTS).toBe(2)
  })

  it('should have correct retry configuration', () => {
    expect(OPTIMIZATION_CONFIG.MAX_RETRIES).toBe(3)
    expect(OPTIMIZATION_CONFIG.RETRY_BASE_DELAY).toBe(1000)
    expect(OPTIMIZATION_CONFIG.RETRY_MULTIPLIER).toBe(2)
  })

  it('should have rate limits for all tiers', () => {
    expect(OPTIMIZATION_CONFIG.RATE_LIMITS.FREE).toBe(60)
    expect(OPTIMIZATION_CONFIG.RATE_LIMITS.BUILD).toBe(120)
    expect(OPTIMIZATION_CONFIG.RATE_LIMITS.ACCELERATE).toBe(600)
    expect(OPTIMIZATION_CONFIG.RATE_LIMITS.UNLIMITED).toBe(1200)
  })
})

describe('Media Cache', () => {
  beforeEach(() => {
    clearMediaCache()
  })

  it('should cache and retrieve media', () => {
    const buffer = Buffer.from('test data')
    const url = 'https://example.com/media.jpg'
    
    cacheMedia('file1', buffer, url)
    
    const cached = getCachedMedia('file1')
    expect(cached).not.toBeNull()
    expect(cached?.buffer.toString()).toBe('test data')
    expect(cached?.url).toBe(url)
  })

  it('should return null for non-existent cache entry', () => {
    const cached = getCachedMedia('non-existent')
    expect(cached).toBeNull()
  })

  it('should clear cache', () => {
    cacheMedia('file1', Buffer.from('test'), 'url1')
    cacheMedia('file2', Buffer.from('test'), 'url2')
    
    clearMediaCache()
    
    expect(getCachedMedia('file1')).toBeNull()
    expect(getCachedMedia('file2')).toBeNull()
  })
})

describe('retryWithBackoff', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    
    const result = await retryWithBackoff(fn)
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success')
    
    const result = await retryWithBackoff(fn, { 
      maxRetries: 3, 
      baseDelay: 10 // Fast for testing
    })
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'))
    
    await expect(retryWithBackoff(fn, { 
      maxRetries: 2, 
      baseDelay: 10 
    })).rejects.toThrow('always fails')
    
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should call onRetry callback', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success')
    
    const onRetry = vi.fn()
    
    await retryWithBackoff(fn, { 
      maxRetries: 3, 
      baseDelay: 10,
      onRetry 
    })
    
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
  })
})

describe('Error Detection', () => {
  it('should detect rate limit error from message', () => {
    const error = new Error('Rate limit 429 exceeded')
    expect(isRateLimitError(error)).toBe(true)
  })

  it('should not flag non-rate-limit errors', () => {
    const error = new Error('Server error')
    expect(isRateLimitError(error)).toBe(false)
  })

  it('should return false for non-network errors', () => {
    const error = new Error('Some other error')
    expect(isNetworkError(error)).toBe(false)
  })
})

describe('processInParallel', () => {
  it('should process items in parallel', async () => {
    const items = [1, 2, 3, 4, 5]
    const processor = vi.fn(async (item: number) => item * 2)
    
    const { results, errors } = await processInParallel(items, processor, 3)
    
    expect(errors).toHaveLength(0)
    expect(results).toEqual([2, 4, 6, 8, 10])
  })

  it('should handle errors gracefully', async () => {
    const items = [1, 2, 3]
    const processor = vi.fn(async (item: number) => {
      if (item === 2) throw new Error('Failed')
      return item * 2
    })
    
    const { results, errors } = await processInParallel(items, processor, 3)
    
    expect(errors).toHaveLength(1)
    expect(errors[0].index).toBe(1)
    expect(results[0]).toBe(2)
    expect(results[2]).toBe(6)
  })
})

