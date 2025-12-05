/**
 * Bulk Schedule Optimizer
 * 
 * Optimizations implemented:
 * 1. Parallel processing (2-3 concurrent posts)
 * 2. Reduced verification time (5 seconds instead of 10)
 * 3. Retry mechanism with exponential backoff
 * 4. Media caching to avoid redundant processing
 * 5. Global rate limiting across all series
 * 6. Error handling improvements
 */

import axios, { AxiosError } from 'axios'
import FormData from 'form-data'

// Configuration
export const OPTIMIZATION_CONFIG = {
  // Parallel processing
  MAX_CONCURRENT_POSTS: 3,
  
  // Timing
  DELAY_BETWEEN_POSTS: 2000, // Reduced from 5000ms
  DELAY_BETWEEN_BATCHES: 5000, // Reduced from 10000ms
  VERIFICATION_DELAY: 5000, // Reduced from 10000ms
  VERIFICATION_ATTEMPTS: 2, // Reduced from 3
  
  // Retry mechanism
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY: 1000, // 1 second base delay
  RETRY_MULTIPLIER: 2, // Exponential backoff multiplier
  
  // Rate limits (Late API)
  RATE_LIMITS: {
    FREE: 60,      // 60 requests/minute
    BUILD: 120,    // 120 requests/minute
    ACCELERATE: 600, // 600 requests/minute
    UNLIMITED: 1200  // 1200 requests/minute
  },
  
  // Batch size
  BATCH_SIZE: 10,
  
  // Request timeout
  REQUEST_TIMEOUT: 30000, // 30 seconds
}

// Media cache to avoid redundant processing
const mediaCache = new Map<string, { 
  buffer: Buffer, 
  url: string, 
  timestamp: number 
}>()

const CACHE_TTL = 3600000 // 1 hour

/**
 * Get cached media or return null
 */
export function getCachedMedia(fileId: string): { buffer: Buffer, url: string } | null {
  const cached = mediaCache.get(fileId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { buffer: cached.buffer, url: cached.url }
  }
  mediaCache.delete(fileId)
  return null
}

/**
 * Cache processed media
 */
export function cacheMedia(fileId: string, buffer: Buffer, url: string): void {
  // Limit cache size to 100 items
  if (mediaCache.size >= 100) {
    const oldestKey = mediaCache.keys().next().value
    if (oldestKey) mediaCache.delete(oldestKey)
  }
  mediaCache.set(fileId, { buffer, url, timestamp: Date.now() })
}

/**
 * Clear media cache
 */
export function clearMediaCache(): void {
  mediaCache.clear()
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    multiplier?: number
    onRetry?: (attempt: number, error: Error) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = OPTIMIZATION_CONFIG.MAX_RETRIES,
    baseDelay = OPTIMIZATION_CONFIG.RETRY_BASE_DELAY,
    multiplier = OPTIMIZATION_CONFIG.RETRY_MULTIPLIER,
    onRetry
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(multiplier, attempt - 1)
        onRetry?.(attempt, lastError)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

// Rate limiter for global API request tracking
class GlobalRateLimiter {
  private requestTimestamps: number[] = []
  private limit: number = OPTIMIZATION_CONFIG.RATE_LIMITS.BUILD // Default to BUILD tier
  
  setLimit(limit: number) {
    this.limit = limit
  }
  
  async waitForSlot(): Promise<void> {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    
    // Clean old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo)
    
    // If at limit, wait
    while (this.requestTimestamps.length >= this.limit) {
      const oldestRequest = this.requestTimestamps[0]
      const waitTime = oldestRequest + 60000 - Date.now()
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime + 100))
      }
      this.requestTimestamps = this.requestTimestamps.filter(t => t > Date.now() - 60000)
    }
    
    this.requestTimestamps.push(Date.now())
  }
  
  getAvailableSlots(): number {
    const oneMinuteAgo = Date.now() - 60000
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo)
    return this.limit - this.requestTimestamps.length
  }
}

export const globalRateLimiter = new GlobalRateLimiter()

/**
 * Check if error is a rate limit error (429)
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 429
  }
  if (error instanceof Error && error.message.includes('429')) {
    return true
  }
  return false
}

/**
 * Check if error is a network/timeout error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
  }
  return false
}

/**
 * Process multiple items in parallel with concurrency limit
 */
export async function processInParallel<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency: number = OPTIMIZATION_CONFIG.MAX_CONCURRENT_POSTS
): Promise<{ results: R[], errors: Array<{ index: number, error: Error }> }> {
  const results: R[] = []
  const errors: Array<{ index: number, error: Error }> = []

  // Process in chunks of concurrency size
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency)
    const chunkPromises = chunk.map((item, chunkIndex) => {
      const globalIndex = i + chunkIndex
      return processor(item, globalIndex)
        .then(result => ({ success: true as const, result, index: globalIndex }))
        .catch(error => ({ success: false as const, error: error instanceof Error ? error : new Error(String(error)), index: globalIndex }))
    })

    const chunkResults = await Promise.all(chunkPromises)

    for (const result of chunkResults) {
      if (result.success) {
        results[result.index] = result.result
      } else {
        errors.push({ index: result.index, error: result.error })
      }
    }

    // Small delay between parallel chunks
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, OPTIMIZATION_CONFIG.DELAY_BETWEEN_POSTS))
    }
  }

  return { results, errors }
}

/**
 * Upload media to Late API with retry
 */
export async function uploadMediaWithRetry(
  mediaBuffer: Buffer,
  filename: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  return retryWithBackoff(async () => {
    await globalRateLimiter.waitForSlot()

    const formData = new FormData()
    formData.append('file', mediaBuffer, {
      filename,
      contentType: mimeType
    })

    const response = await axios.post(
      'https://getlate.dev/api/v1/media',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: OPTIMIZATION_CONFIG.REQUEST_TIMEOUT
      }
    )

    return response.data.url
  }, {
    onRetry: (attempt, error) => {
      console.log(`⚠️ Media upload retry ${attempt}: ${error.message}`)
    }
  })
}

/**
 * Create post on Late API with retry
 */
export async function createPostWithRetry(
  payload: {
    text: string
    mediaUrls?: string[]
    platforms: Array<{ platform: string, accountId: string }>
    scheduledFor?: string
    timezone?: string
  },
  apiKey: string
): Promise<{ postId: string, success: boolean }> {
  return retryWithBackoff(async () => {
    await globalRateLimiter.waitForSlot()

    const response = await axios.post(
      'https://getlate.dev/api/v1/posts',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: OPTIMIZATION_CONFIG.REQUEST_TIMEOUT
      }
    )

    return {
      postId: response.data._id || response.data.id,
      success: true
    }
  }, {
    onRetry: (attempt, error) => {
      console.log(`⚠️ Post creation retry ${attempt}: ${error.message}`)
      if (isRateLimitError(error)) {
        console.log('   Rate limit detected, waiting longer...')
      }
    }
  })
}

/**
 * Verify post was created successfully
 */
export async function verifyPostWithRetry(
  postId: string,
  apiKey: string
): Promise<boolean> {
  const maxAttempts = OPTIMIZATION_CONFIG.VERIFICATION_ATTEMPTS

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, OPTIMIZATION_CONFIG.VERIFICATION_DELAY))

    try {
      await globalRateLimiter.waitForSlot()

      const response = await axios.get(
        `https://getlate.dev/api/v1/posts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: OPTIMIZATION_CONFIG.REQUEST_TIMEOUT
        }
      )

      if (response.data && (response.data._id || response.data.id)) {
        return true
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        console.log(`⚠️ Post verification failed after ${maxAttempts} attempts`)
        return false
      }
    }
  }

  return false
}

// Export types
export interface BulkScheduleResult {
  success: boolean
  totalProcessed: number
  successful: number
  failed: number
  errors: Array<{ file: string, error: string }>
  duration: number
}

