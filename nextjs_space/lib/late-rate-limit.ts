
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Rate limit tracking for Late API
const RATE_LIMIT_FILE = path.join(os.tmpdir(), 'late-rate-limit.json')
const DAILY_LIMIT_PER_PLATFORM = 8

interface PlatformPost {
  platform: string
  profileId: string
  profileName: string
  timestamp: number // Unix timestamp
}

interface RateLimitData {
  posts: PlatformPost[]
  lastCleanup: number
}

interface PlatformStatus {
  platform: string
  profileId: string
  profileName: string
  count: number
  limit: number
  remaining: number
  statusLevel: 'good' | 'warning' | 'critical'
  percentageUsed: number
  resetTime: number | null // Unix timestamp when the oldest post expires (24 hours after first post)
  resetTimeFormatted: string | null // Human-readable reset time
}

interface ProfileRateLimits {
  profileId: string
  profileName: string
  platforms: PlatformStatus[]
  overallStatus: 'good' | 'warning' | 'critical'
}

/**
 * Load rate limit data from file
 */
function loadRateLimitData(): RateLimitData {
  try {
    if (fs.existsSync(RATE_LIMIT_FILE)) {
      const data = fs.readFileSync(RATE_LIMIT_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load rate limit data:', error)
  }
  return { posts: [], lastCleanup: Date.now() }
}

/**
 * Save rate limit data to file
 */
function saveRateLimitData(data: RateLimitData): void {
  try {
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Failed to save rate limit data:', error)
  }
}

/**
 * Clean up posts older than 24 hours
 */
function cleanupOldPosts(data: RateLimitData): RateLimitData {
  const now = Date.now()
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000)
  
  // Only cleanup if it's been more than 1 hour since last cleanup
  if (now - data.lastCleanup < (60 * 60 * 1000)) {
    return data
  }
  
  return {
    posts: data.posts.filter(post => post.timestamp > twentyFourHoursAgo),
    lastCleanup: now
  }
}

/**
 * Record a successful post to a platform
 */
export function recordLatePost(
  platform: string,
  profileId: string,
  profileName: string
): void {
  try {
    let data = loadRateLimitData()
    data = cleanupOldPosts(data)
    
    const post: PlatformPost = {
      platform: platform.toLowerCase(),
      profileId,
      profileName,
      timestamp: Date.now()
    }
    
    data.posts.push(post)
    saveRateLimitData(data)
    
    // Log the current status
    const status = getPlatformStatus(platform, profileId, profileName, data)
    if (status) {
      console.log(`\n📊 Late API Rate Limit Status (${profileName} - ${platform}):`)
      console.log(`   Posts today: ${status.count}/${status.limit}`)
      console.log(`   Remaining: ${status.remaining}`)
      if (status.resetTimeFormatted) {
        console.log(`   🕐 Resets in: ${status.resetTimeFormatted}`)
      }
      
      if (status.statusLevel === 'warning') {
        console.warn(`\n⚠️  WARNING: Only ${status.remaining} posts remaining for ${platform} (${profileName}) before rate limit!`)
        console.warn(`   Consider reducing posting frequency for this platform.`)
        if (status.resetTimeFormatted) {
          console.warn(`   Limit will reset in ${status.resetTimeFormatted}.`)
        }
      } else if (status.statusLevel === 'critical') {
        console.error(`\n🚫 RATE LIMIT REACHED: Cannot post more to ${platform} (${profileName}) until reset.`)
        if (status.resetTimeFormatted) {
          console.error(`   Limit will reset in ${status.resetTimeFormatted}.`)
        } else {
          console.error(`   Limit resets 24 hours after the first post of the day.`)
        }
      }
    }
  } catch (error) {
    console.error('Failed to record Late post:', error)
  }
}

/**
 * Get the status for a specific platform and profile
 */
function getPlatformStatus(
  platform: string,
  profileId: string,
  profileName: string,
  data?: RateLimitData
): PlatformStatus | null {
  try {
    if (!data) {
      data = loadRateLimitData()
      data = cleanupOldPosts(data)
    }
    
    const platformLower = platform.toLowerCase()
    const platformPosts = data.posts.filter(
      p => p.platform === platformLower && p.profileId === profileId
    )
    const count = platformPosts.length
    
    const remaining = Math.max(0, DAILY_LIMIT_PER_PLATFORM - count)
    let statusLevel: 'good' | 'warning' | 'critical' = 'good'
    
    if (remaining === 0) {
      statusLevel = 'critical'
    } else if (remaining <= 2) {
      statusLevel = 'warning'
    }
    
    // Calculate reset time (24 hours after oldest post)
    let resetTime: number | null = null
    let resetTimeFormatted: string | null = null
    
    if (platformPosts.length > 0) {
      // Find the oldest post
      const oldestPost = platformPosts.reduce((oldest, current) => 
        current.timestamp < oldest.timestamp ? current : oldest
      )
      
      // Reset time is 24 hours after the oldest post
      resetTime = oldestPost.timestamp + (24 * 60 * 60 * 1000)
      
      // Format as human-readable time in EST
      const resetDate = new Date(resetTime)
      const now = Date.now()
      const hoursUntilReset = Math.ceil((resetTime - now) / (60 * 60 * 1000))
      const minutesUntilReset = Math.ceil((resetTime - now) / (60 * 1000))
      
      // Format time in EST timezone
      const resetTimeEST = resetDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York'  // Always show EST
      })
      
      if (hoursUntilReset > 1) {
        resetTimeFormatted = `${hoursUntilReset} hours (${resetTimeEST} EST)`
      } else if (minutesUntilReset > 0) {
        resetTimeFormatted = `${minutesUntilReset} minutes (${resetTimeEST} EST)`
      } else {
        resetTimeFormatted = 'Less than 1 minute'
      }
    }
    
    return {
      platform: platformLower,
      profileId,
      profileName,
      count,
      limit: DAILY_LIMIT_PER_PLATFORM,
      remaining,
      statusLevel,
      percentageUsed: Math.round((count / DAILY_LIMIT_PER_PLATFORM) * 100),
      resetTime,
      resetTimeFormatted
    }
  } catch (error) {
    console.error('Failed to get platform status:', error)
    return null
  }
}

/**
 * Get rate limit status grouped by profile
 */
export function getLateRateLimitStatus(profileIds?: string[]): ProfileRateLimits[] {
  try {
    let data = loadRateLimitData()
    data = cleanupOldPosts(data)
    
    // Get unique profile IDs from posts (or use provided list)
    const uniqueProfiles = profileIds 
      ? profileIds.map(id => {
          const post = data.posts.find(p => p.profileId === id)
          return { id, name: post?.profileName || 'Unknown' }
        })
      : Array.from(new Map(
          data.posts.map(p => [p.profileId, p.profileName])
        ).entries()).map(([id, name]) => ({ id, name }))
    
    const profileLimits: ProfileRateLimits[] = []
    
    for (const { id, name } of uniqueProfiles) {
      // Get posts for this profile
      const profilePosts = data.posts.filter(p => p.profileId === id)
      
      // Get unique platforms for this profile
      const platforms = Array.from(new Set(profilePosts.map(p => p.platform)))
      
      const platformStatuses: PlatformStatus[] = platforms.map(platform => {
        const status = getPlatformStatus(platform, id, name, data)
        return status!
      }).filter(Boolean)
      
      // Determine overall status
      let overallStatus: 'good' | 'warning' | 'critical' = 'good'
      if (platformStatuses.some(p => p.statusLevel === 'critical')) {
        overallStatus = 'critical'
      } else if (platformStatuses.some(p => p.statusLevel === 'warning')) {
        overallStatus = 'warning'
      }
      
      profileLimits.push({
        profileId: id,
        profileName: name,
        platforms: platformStatuses,
        overallStatus
      })
    }
    
    return profileLimits
  } catch (error) {
    console.error('Failed to get Late rate limit status:', error)
    return []
  }
}

/**
 * Check if a platform can accept more posts for a profile
 */
export function canPostToLatePlatform(
  platform: string,
  profileId: string,
  profileName: string
): { canPost: boolean; remaining: number; message?: string } {
  try {
    let data = loadRateLimitData()
    data = cleanupOldPosts(data)
    
    const status = getPlatformStatus(platform, profileId, profileName, data)
    
    if (!status) {
      return { canPost: true, remaining: DAILY_LIMIT_PER_PLATFORM }
    }
    
    if (status.remaining === 0) {
      return {
        canPost: false,
        remaining: 0,
        message: `Rate limit reached for ${platform} (${profileName}). You've posted ${status.count}/${status.limit} times today. Please wait 24 hours or use a different profile.`
      }
    }
    
    return {
      canPost: true,
      remaining: status.remaining,
      message: status.statusLevel === 'warning' 
        ? `Warning: Only ${status.remaining} posts remaining for ${platform} (${profileName}) today.`
        : undefined
    }
  } catch (error) {
    console.error('Failed to check platform availability:', error)
    return { canPost: true, remaining: DAILY_LIMIT_PER_PLATFORM }
  }
}

/**
 * Get all profiles with their platforms from recent posts
 */
export function getProfilesWithPlatforms(): Array<{ profileId: string; profileName: string; platforms: string[] }> {
  try {
    let data = loadRateLimitData()
    data = cleanupOldPosts(data)
    
    const profileMap = new Map<string, { name: string; platforms: Set<string> }>()
    
    for (const post of data.posts) {
      if (!profileMap.has(post.profileId)) {
        profileMap.set(post.profileId, {
          name: post.profileName,
          platforms: new Set()
        })
      }
      profileMap.get(post.profileId)!.platforms.add(post.platform)
    }
    
    return Array.from(profileMap.entries()).map(([profileId, data]) => ({
      profileId,
      profileName: data.name,
      platforms: Array.from(data.platforms)
    }))
  } catch (error) {
    console.error('Failed to get profiles with platforms:', error)
    return []
  }
}
