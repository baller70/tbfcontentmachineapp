/**
 * Content Journey Optimizer Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CONTENT_JOURNEY_CONFIG,
  contentJourneyCache,
  classifyError,
  isRetryableError,
  retryWithBackoff,
  invalidateAllCaches,
  getCacheStats,
  createTimeout,
  withTimeout
} from '../content-journey-optimizer'

describe('CONTENT_JOURNEY_CONFIG', () => {
  it('should have correct retry settings', () => {
    expect(CONTENT_JOURNEY_CONFIG.MAX_RETRIES).toBe(3)
    expect(CONTENT_JOURNEY_CONFIG.RETRY_BASE_DELAY).toBe(1000)
    expect(CONTENT_JOURNEY_CONFIG.RETRY_MULTIPLIER).toBe(2)
  })

  it('should have correct cache TTL settings', () => {
    expect(CONTENT_JOURNEY_CONFIG.TEMPLATE_CACHE_TTL).toBe(5 * 60 * 1000)
    expect(CONTENT_JOURNEY_CONFIG.PROFILE_CACHE_TTL).toBe(2 * 60 * 1000)
    expect(CONTENT_JOURNEY_CONFIG.TEAM_CACHE_TTL).toBe(5 * 60 * 1000)
  })

  it('should have correct timeout settings', () => {
    expect(CONTENT_JOURNEY_CONFIG.REQUEST_TIMEOUT).toBe(30000)
    expect(CONTENT_JOURNEY_CONFIG.AI_GENERATION_TIMEOUT).toBe(60000)
  })
})

describe('ContentJourneyCache', () => {
  beforeEach(() => {
    contentJourneyCache.clear()
  })

  it('should set and get cached values', () => {
    contentJourneyCache.set('test-key', { value: 'test' }, 60000)
    const result = contentJourneyCache.get('test-key')
    expect(result).toEqual({ value: 'test' })
  })

  it('should return null for non-existent keys', () => {
    const result = contentJourneyCache.get('non-existent')
    expect(result).toBeNull()
  })

  it('should invalidate specific keys', () => {
    contentJourneyCache.set('key1', 'value1', 60000)
    contentJourneyCache.set('key2', 'value2', 60000)
    
    contentJourneyCache.invalidate('key1')
    
    expect(contentJourneyCache.get('key1')).toBeNull()
    expect(contentJourneyCache.get('key2')).toBe('value2')
  })

  it('should clear all cached values', () => {
    contentJourneyCache.set('key1', 'value1', 60000)
    contentJourneyCache.set('key2', 'value2', 60000)
    
    contentJourneyCache.clear()
    
    expect(contentJourneyCache.get('key1')).toBeNull()
    expect(contentJourneyCache.get('key2')).toBeNull()
  })

  it('should return correct stats', () => {
    contentJourneyCache.set('key1', 'value1', 60000)
    contentJourneyCache.set('key2', 'value2', 60000)
    
    const stats = contentJourneyCache.getStats()
    
    expect(stats.size).toBe(2)
    expect(stats.keys).toContain('key1')
    expect(stats.keys).toContain('key2')
  })
})

describe('classifyError', () => {
  it('should classify network errors', () => {
    expect(classifyError({ message: 'Network error' })).toBe('network')
    expect(classifyError({ message: 'fetch failed' })).toBe('network')
    expect(classifyError({ message: 'Request timeout' })).toBe('network')
  })

  it('should classify rate limit errors', () => {
    expect(classifyError({ status: 429 })).toBe('rate_limit')
    expect(classifyError({ message: 'Rate limit exceeded' })).toBe('rate_limit')
  })

  it('should classify auth errors', () => {
    expect(classifyError({ status: 401 })).toBe('auth')
    expect(classifyError({ status: 403 })).toBe('auth')
  })

  it('should classify validation errors', () => {
    expect(classifyError({ status: 400 })).toBe('validation')
    expect(classifyError({ message: 'Validation failed' })).toBe('validation')
  })

  it('should classify server errors', () => {
    expect(classifyError({ status: 500 })).toBe('server')
    expect(classifyError({ status: 503 })).toBe('server')
  })

  it('should return unknown for unclassified errors', () => {
    expect(classifyError({})).toBe('unknown')
    expect(classifyError(null)).toBe('unknown')
  })
})

describe('isRetryableError', () => {
  it('should return true for retryable errors', () => {
    expect(isRetryableError('network')).toBe(true)
    expect(isRetryableError('rate_limit')).toBe(true)
    expect(isRetryableError('server')).toBe(true)
  })

  it('should return false for non-retryable errors', () => {
    expect(isRetryableError('auth')).toBe(false)
    expect(isRetryableError('validation')).toBe(false)
    expect(isRetryableError('unknown')).toBe(false)
  })
})

describe('retryWithBackoff', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    
    const result = await retryWithBackoff(fn)
    
    expect(result.success).toBe(true)
    expect(result.data).toBe('success')
    expect(result.retryCount).toBe(0)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ message: 'Network error' })
      .mockResolvedValue('success')
    
    const result = await retryWithBackoff(fn, { baseDelay: 10 })
    
    expect(result.success).toBe(true)
    expect(result.data).toBe('success')
    expect(result.retryCount).toBe(1)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should not retry on non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 401, message: 'Unauthorized' })
    
    const result = await retryWithBackoff(fn)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should call onRetry callback', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ message: 'Network error' })
      .mockResolvedValue('success')
    const onRetry = vi.fn()
    
    await retryWithBackoff(fn, { baseDelay: 10, onRetry })
    
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Object))
  })

  it('should fail after max retries', async () => {
    const fn = vi.fn().mockRejectedValue({ message: 'Network error' })
    
    const result = await retryWithBackoff(fn, { maxRetries: 2, baseDelay: 10 })
    
    expect(result.success).toBe(false)
    expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })
})

describe('Utility Functions', () => {
  beforeEach(() => {
    contentJourneyCache.clear()
  })

  it('invalidateAllCaches should clear all caches', () => {
    contentJourneyCache.set('key1', 'value1', 60000)
    contentJourneyCache.set('key2', 'value2', 60000)
    
    invalidateAllCaches()
    
    expect(getCacheStats().size).toBe(0)
  })

  it('getCacheStats should return cache statistics', () => {
    contentJourneyCache.set('test', 'value', 60000)
    
    const stats = getCacheStats()
    
    expect(stats.size).toBe(1)
    expect(stats.keys).toContain('test')
  })

  it('createTimeout should reject after specified time', async () => {
    const promise = createTimeout(50, 'Test timeout')
    
    await expect(promise).rejects.toThrow('Test timeout')
  })

  it('withTimeout should resolve if promise completes in time', async () => {
    const fastPromise = Promise.resolve('fast')
    
    const result = await withTimeout(fastPromise, 1000)
    
    expect(result).toBe('fast')
  })

  it('withTimeout should reject if promise takes too long', async () => {
    const slowPromise = new Promise(resolve => setTimeout(() => resolve('slow'), 200))
    
    await expect(withTimeout(slowPromise, 50, 'Too slow')).rejects.toThrow('Too slow')
  })
})

