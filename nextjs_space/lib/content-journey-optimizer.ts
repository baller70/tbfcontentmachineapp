/**
 * Content Journey Optimizer
 * 
 * Provides optimized API calls, caching, retry mechanisms, and error handling
 * for the Content Journey wizard functionality.
 */

// ============================================================================
// Configuration
// ============================================================================

export const CONTENT_JOURNEY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY: 1000,
  RETRY_MULTIPLIER: 2,
  TEMPLATE_CACHE_TTL: 5 * 60 * 1000,
  BRANDING_CACHE_TTL: 5 * 60 * 1000,
  PROFILE_CACHE_TTL: 2 * 60 * 1000,
  TEAM_CACHE_TTL: 5 * 60 * 1000,
  REQUEST_TIMEOUT: 30000,
  AI_GENERATION_TIMEOUT: 60000,
  POST_DELAY_BETWEEN_PLATFORMS: 500,
}

// ============================================================================
// Types
// ============================================================================

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  multiplier?: number
  onRetry?: (attempt: number, error: Error) => void
}

export interface ApiCallResult<T> {
  success: boolean
  data?: T
  error?: string
  retryCount?: number
}

export type ErrorType = 'network' | 'rate_limit' | 'auth' | 'validation' | 'server' | 'unknown'

// ============================================================================
// Cache Implementation
// ============================================================================

class ContentJourneyCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }
  
  invalidate(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  getStats(): { size: number; keys: string[] } {
    return { size: this.cache.size, keys: Array.from(this.cache.keys()) }
  }
}

export const contentJourneyCache = new ContentJourneyCache()

// ============================================================================
// Error Classification
// ============================================================================

export function classifyError(error: any): ErrorType {
  if (!error) return 'unknown'
  const message = error.message?.toLowerCase() || ''
  const status = error.status || error.statusCode
  
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return 'network'
  }
  if (status === 429 || message.includes('rate limit')) return 'rate_limit'
  if (status === 401 || status === 403) return 'auth'
  if (status === 400 || message.includes('validation')) return 'validation'
  if (status >= 500) return 'server'
  return 'unknown'
}

export function isRetryableError(errorType: ErrorType): boolean {
  return ['network', 'rate_limit', 'server'].includes(errorType)
}

// ============================================================================
// Retry with Exponential Backoff
// ============================================================================

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<ApiCallResult<T>> {
  const {
    maxRetries = CONTENT_JOURNEY_CONFIG.MAX_RETRIES,
    baseDelay = CONTENT_JOURNEY_CONFIG.RETRY_BASE_DELAY,
    multiplier = CONTENT_JOURNEY_CONFIG.RETRY_MULTIPLIER,
    onRetry
  } = options
  
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn()
      return { success: true, data, retryCount: attempt }
    } catch (error: any) {
      lastError = error
      const errorType = classifyError(error)
      
      if (!isRetryableError(errorType) || attempt === maxRetries) {
        return { success: false, error: error.message || 'Unknown error', retryCount: attempt }
      }
      
      const delay = baseDelay * Math.pow(multiplier, attempt)
      if (onRetry) onRetry(attempt + 1, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return { success: false, error: lastError?.message || 'Max retries exceeded', retryCount: maxRetries }
}

// ============================================================================
// Optimized API Calls with Caching
// ============================================================================

export async function fetchTemplatesOptimized(): Promise<ApiCallResult<any[]>> {
  const cacheKey = 'templates'
  const cached = contentJourneyCache.get<any[]>(cacheKey)
  
  if (cached) {
    return { success: true, data: cached }
  }
  
  const result = await retryWithBackoff(async () => {
    const response = await fetch('/api/templates/public', {
      signal: AbortSignal.timeout(CONTENT_JOURNEY_CONFIG.REQUEST_TIMEOUT)
    })
    if (!response.ok) throw new Error(`Failed to fetch templates: ${response.status}`)
    const data = await response.json()
    return data.templates || []
  })
  
  if (result.success && result.data) {
    contentJourneyCache.set(cacheKey, result.data, CONTENT_JOURNEY_CONFIG.TEMPLATE_CACHE_TTL)
  }
  
  return result
}

export async function fetchProfilesOptimized(): Promise<ApiCallResult<any[]>> {
  const cacheKey = 'profiles'
  const cached = contentJourneyCache.get<any[]>(cacheKey)
  
  if (cached) {
    return { success: true, data: cached }
  }
  
  const result = await retryWithBackoff(async () => {
    const response = await fetch('/api/profiles', {
      signal: AbortSignal.timeout(CONTENT_JOURNEY_CONFIG.REQUEST_TIMEOUT)
    })
    if (!response.ok) throw new Error(`Failed to fetch profiles: ${response.status}`)
    const data = await response.json()
    // FIX: API returns { profiles: [...] }, extract the array
    return data.profiles || []
  })
  
  if (result.success && result.data) {
    contentJourneyCache.set(cacheKey, result.data, CONTENT_JOURNEY_CONFIG.PROFILE_CACHE_TTL)
  }
  
  return result
}

export async function fetchTeamsOptimized(): Promise<ApiCallResult<any[]>> {
  const cacheKey = 'teams'
  const cached = contentJourneyCache.get<any[]>(cacheKey)
  
  if (cached) {
    return { success: true, data: cached }
  }
  
  const result = await retryWithBackoff(async () => {
    const response = await fetch('/api/teams', {
      signal: AbortSignal.timeout(CONTENT_JOURNEY_CONFIG.REQUEST_TIMEOUT)
    })
    if (!response.ok) throw new Error(`Failed to fetch teams: ${response.status}`)
    const data = await response.json()
    return data.teams || []
  })
  
  if (result.success && result.data) {
    contentJourneyCache.set(cacheKey, result.data, CONTENT_JOURNEY_CONFIG.TEAM_CACHE_TTL)
  }
  
  return result
}

export async function fetchInitialDataOptimized(): Promise<{
  templates: ApiCallResult<any[]>
  teams: ApiCallResult<any[]>
}> {
  const [templates, teams] = await Promise.all([
    fetchTemplatesOptimized(),
    fetchTeamsOptimized()
  ])
  return { templates, teams }
}

// ============================================================================
// Optimized Posting with Retry
// ============================================================================

export interface PostOptions {
  profileId: string
  content: string
  mediaUrls: string[]
  platforms: string[]
  scheduledAt?: string
}

export async function postToLateApiOptimized(options: PostOptions): Promise<ApiCallResult<any>> {
  return retryWithBackoff(async () => {
    const response = await fetch('/api/late/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
      signal: AbortSignal.timeout(CONTENT_JOURNEY_CONFIG.REQUEST_TIMEOUT)
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Late API error: ${response.status}`)
    }
    return response.json()
  }, {
    onRetry: (attempt, error) => {
      console.warn(`Late API retry attempt ${attempt}:`, error.message)
    }
  })
}

export async function postToTwitterOptimized(text: string, mediaUrls: string[]): Promise<ApiCallResult<any>> {
  return retryWithBackoff(async () => {
    const response = await fetch('/api/twitter/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mediaUrls }),
      signal: AbortSignal.timeout(CONTENT_JOURNEY_CONFIG.REQUEST_TIMEOUT)
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Twitter API error: ${response.status}`)
    }
    return response.json()
  }, {
    onRetry: (attempt, error) => {
      console.warn(`Twitter API retry attempt ${attempt}:`, error.message)
    }
  })
}

export async function postToAllPlatformsOptimized(
  wizardState: any,
  graphicUrl: string,
  content: { content: string; caption: string; hashtags: string }
): Promise<{
  successCount: number
  failedPlatforms: string[]
  errors: Record<string, string>
}> {
  const postContent = `${content.content}\n\n${content.hashtags || ''}`
  
  const isVideo = graphicUrl.match(/\.(mp4|mov|avi|wmv|flv|webm)$/i)
  const latePlatforms = wizardState.selectedPlatforms.filter((p: string) => {
    const platform = p.toLowerCase()
    if (platform === 'twitter') return false
    if (platform === 'youtube' && !isVideo) return false
    return true
  })
  const includesTwitter = wizardState.selectedPlatforms.some(
    (p: string) => p.toLowerCase() === 'twitter'
  )
  
  let successCount = 0
  const failedPlatforms: string[] = []
  const errors: Record<string, string> = {}
  
  if (latePlatforms.length > 0) {
    const result = await postToLateApiOptimized({
      profileId: wizardState.selectedProfileId,
      content: postContent,
      mediaUrls: [graphicUrl],
      platforms: latePlatforms,
      scheduledAt: wizardState.scheduleType === 'scheduled'
        ? new Date(`${wizardState.scheduledDate}T${wizardState.scheduledTime}`).toISOString()
        : undefined
    })
    
    if (result.success) {
      successCount += latePlatforms.length
    } else {
      failedPlatforms.push(...latePlatforms)
      latePlatforms.forEach((p: string) => {
        errors[p] = result.error || 'Unknown error'
      })
    }
  }
  
  if (includesTwitter) {
    if (latePlatforms.length > 0) {
      await new Promise(resolve => 
        setTimeout(resolve, CONTENT_JOURNEY_CONFIG.POST_DELAY_BETWEEN_PLATFORMS)
      )
    }
    
    const result = await postToTwitterOptimized(postContent, [graphicUrl])
    
    if (result.success) {
      successCount++
    } else {
      failedPlatforms.push('twitter')
      errors['twitter'] = result.error || 'Unknown error'
    }
  }
  
  return { successCount, failedPlatforms, errors }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function invalidateAllCaches(): void {
  contentJourneyCache.clear()
}

export function getCacheStats(): { size: number; keys: string[] } {
  return contentJourneyCache.getStats()
}

export function createTimeout(ms: number, message: string = 'Operation timed out'): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms)
  })
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message?: string
): Promise<T> {
  return Promise.race([
    promise,
    createTimeout(ms, message)
  ])
}
