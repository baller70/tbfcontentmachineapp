
'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PlatformStatus {
  platform: string
  profileId: string
  profileName: string
  count: number
  limit: number
  remaining: number
  statusLevel: 'good' | 'warning' | 'critical'
  percentageUsed: number
  resetTime: number | null
  resetTimeFormatted: string | null
}

interface ProfileRateLimits {
  profileId: string
  profileName: string
  platforms: PlatformStatus[]
  overallStatus: 'good' | 'warning' | 'critical'
}

interface RateLimitStatus {
  hasData: boolean
  profiles?: ProfileRateLimits[]
  overallStatus?: 'good' | 'warning' | 'critical'
  platformsAtLimit?: number
  platformsWithWarning?: number
  totalPlatformsTracked?: number
}

export function LateRateLimitBanner() {
  const [status, setStatus] = useState<RateLimitStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  const fetchRateLimitStatus = async () => {
    try {
      const response = await fetch('/api/late/rate-limit')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch Late rate limit status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRateLimitStatus()
    // Refresh every 2 minutes
    const interval = setInterval(fetchRateLimitStatus, 120000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !status?.hasData) {
    return null
  }

  const { profiles, overallStatus, platformsAtLimit, platformsWithWarning } = status

  // Don't show banner if everything is good and we have plenty of posts left
  const hasIssues = overallStatus === 'warning' || overallStatus === 'critical'
  if (!hasIssues) {
    return null
  }

  const getIcon = () => {
    switch (overallStatus) {
      case 'critical':
        return <XCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <CheckCircle className="h-5 w-5" />
    }
  }

  const getVariant = (): 'default' | 'destructive' => {
    return overallStatus === 'critical' ? 'destructive' : 'default'
  }

  const getTitle = () => {
    if (overallStatus === 'critical') {
      return `🚫 Late API Rate Limit Reached (${platformsAtLimit} platform${platformsAtLimit !== 1 ? 's' : ''})`
    }
    if (overallStatus === 'warning') {
      return `⚠️  Late API Rate Limit Warning (${platformsWithWarning} platform${platformsWithWarning !== 1 ? 's' : ''})`
    }
    return '✅ Late API Status'
  }

  const getSummary = () => {
    if (overallStatus === 'critical') {
      return `You've reached the daily posting limit (8 posts/day) for ${platformsAtLimit} platform${platformsAtLimit !== 1 ? 's' : ''}. See exact reset times below for each platform.`
    }
    return `You're approaching the daily posting limit (8 posts/day) for ${platformsWithWarning} platform${platformsWithWarning !== 1 ? 's' : ''}. Check reset times below for each platform.`
  }

  const getPlatformBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive'
      case 'warning':
        return 'default'
      default:
        return 'secondary'
    }
  }

  return (
    <Alert variant={getVariant()} className="mb-6">
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle className="mb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            {getTitle()}
            <span className="ml-2 text-xs opacity-75">
              {isExpanded ? '(click to collapse)' : '(click to expand)'}
            </span>
          </AlertTitle>
          <AlertDescription className="text-sm">
            <p className="mb-3">{getSummary()}</p>
            
            {isExpanded && profiles && (
              <div className="space-y-4 mt-4">
                {profiles.map((profile) => (
                  <div key={profile.profileId} className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-semibold">{profile.profileName}</span>
                      <Badge variant={
                        profile.overallStatus === 'critical' ? 'destructive' :
                        profile.overallStatus === 'warning' ? 'default' : 'secondary'
                      }>
                        {profile.overallStatus}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                      {profile.platforms.map((platform) => (
                        <div 
                          key={`${profile.profileId}-${platform.platform}`}
                          className="flex flex-col p-2 rounded bg-background/50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium capitalize">
                              {platform.platform}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs">
                                {platform.count}/{platform.limit}
                              </span>
                              {platform.statusLevel !== 'good' && (
                                <Badge 
                                  variant={getPlatformBadgeColor(platform.statusLevel)}
                                  className="h-5 px-1 text-xs"
                                >
                                  {platform.remaining}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {platform.resetTimeFormatted && platform.statusLevel !== 'good' && (
                            <div className="text-xs opacity-70 mt-1">
                              🕐 Resets in {platform.resetTimeFormatted}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="text-xs opacity-75 mt-3 pt-3 border-t">
                  💡 <strong>Tip:</strong> Each platform allows 8 posts per day per profile using a rolling 24-hour window. 
                  The limit resets 24 hours after your oldest post to that platform. Use different profiles 
                  (Basketball Factory, Rise As One) to post more frequently, or wait for the reset time shown above.
                </div>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}
