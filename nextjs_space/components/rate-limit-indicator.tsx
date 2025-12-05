'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Clock, TrendingUp } from 'lucide-react'

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

interface RateLimitIndicatorProps {
  selectedProfileId?: string
  selectedPlatforms?: string[]
  variant?: 'compact' | 'full' | 'mini'
  showRefresh?: boolean
  className?: string
  onStatusChange?: (canPost: boolean, details: { blockedPlatforms: string[] }) => void
}

export function RateLimitIndicator({
  selectedProfileId,
  selectedPlatforms,
  variant = 'compact',
  showRefresh = true,
  className = '',
  onStatusChange
}: RateLimitIndicatorProps) {
  const [status, setStatus] = useState<{ profiles?: ProfileRateLimits[]; hasData: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/late/rate-limit')
      const data = await response.json()
      setStatus(data)
      setLastRefreshed(new Date())
      
      // Check if any selected platforms are blocked
      if (onStatusChange && selectedProfileId && selectedPlatforms) {
        const profileData = data.profiles?.find((p: ProfileRateLimits) => p.profileId === selectedProfileId)
        const blockedPlatforms = selectedPlatforms.filter(platform => {
          const platformData = profileData?.platforms?.find(
            (p: PlatformStatus) => p.platform.toLowerCase() === platform.toLowerCase()
          )
          return platformData?.remaining === 0
        })
        onStatusChange(blockedPlatforms.length === 0, { blockedPlatforms })
      }
    } catch (error) {
      console.error('Failed to fetch rate limit status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [selectedProfileId])

  // Get relevant data based on selected profile and platforms
  const getRelevantData = () => {
    if (!status?.profiles) return null
    
    if (selectedProfileId) {
      const profile = status.profiles.find(p => p.profileId === selectedProfileId)
      if (!profile) return null
      
      if (selectedPlatforms && selectedPlatforms.length > 0) {
        const filteredPlatforms = profile.platforms.filter(p => 
          selectedPlatforms.some(sp => sp.toLowerCase() === p.platform.toLowerCase())
        )
        return { ...profile, platforms: filteredPlatforms }
      }
      return profile
    }
    
    return status.profiles[0] // Return first profile if none selected
  }

  const profileData = getRelevantData()

  const getStatusIcon = (level: 'good' | 'warning' | 'critical') => {
    switch (level) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default: return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  const getStatusColor = (level: 'good' | 'warning' | 'critical') => {
    switch (level) {
      case 'critical': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  if (variant === 'mini') {
    if (isLoading) return <Badge variant="outline" className="animate-pulse">Loading...</Badge>
    if (!profileData || profileData.platforms.length === 0) {
      return <Badge variant="secondary" className="text-xs">No rate data</Badge>
    }
    
    const totalRemaining = profileData.platforms.reduce((sum, p) => sum + p.remaining, 0)
    const totalLimit = profileData.platforms.length * 8
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={profileData.overallStatus === 'critical' ? 'destructive' : 
                       profileData.overallStatus === 'warning' ? 'default' : 'secondary'}
              className="cursor-help"
            >
              {getStatusIcon(profileData.overallStatus)}
              <span className="ml-1">{totalRemaining}/{totalLimit} posts</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              {profileData.platforms.map(p => (
                <div key={p.platform} className="flex justify-between gap-4">
                  <span className="capitalize">{p.platform}:</span>
                  <span>{p.remaining}/{p.limit} remaining</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={`border ${profileData?.overallStatus === 'critical' ? 'border-red-300 bg-red-50' :
                                  profileData?.overallStatus === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                                  'border-green-200 bg-green-50'} ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Rate Limits</span>
              {profileData && getStatusIcon(profileData.overallStatus)}
            </div>
            {showRefresh && (
              <Button variant="ghost" size="sm" onClick={fetchStatus} disabled={isLoading} className="h-6 px-2">
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>

          {isLoading && !profileData ? (
            <div className="text-xs text-gray-500">Loading...</div>
          ) : !profileData || profileData.platforms.length === 0 ? (
            <div className="text-xs text-gray-500">No rate limit data yet</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {profileData.platforms.map(p => (
                <div key={p.platform} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-medium">{p.platform}</span>
                    <Badge variant={p.statusLevel === 'critical' ? 'destructive' :
                                   p.statusLevel === 'warning' ? 'default' : 'secondary'}
                           className="h-5 text-xs px-1">
                      {p.remaining}
                    </Badge>
                  </div>
                  <Progress value={(p.count / p.limit) * 100}
                            className={`h-1 mt-1 ${p.statusLevel === 'critical' ? '[&>div]:bg-red-500' :
                                                   p.statusLevel === 'warning' ? '[&>div]:bg-yellow-500' :
                                                   '[&>div]:bg-green-500'}`} />
                  {p.resetTimeFormatted && p.statusLevel !== 'good' && (
                    <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {p.resetTimeFormatted.split(' (')[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {profileData?.overallStatus === 'critical' && (
            <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
              ⚠️ Some platforms have hit their daily limit. Posts to those platforms will fail until reset.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Full variant
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">API Rate Limits</span>
            {profileData && (
              <Badge variant={profileData.overallStatus === 'critical' ? 'destructive' :
                             profileData.overallStatus === 'warning' ? 'default' : 'secondary'}>
                {profileData.overallStatus === 'good' ? 'All Good' :
                 profileData.overallStatus === 'warning' ? 'Warning' : 'Limit Reached'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastRefreshed && (
              <span className="text-xs text-gray-500">
                Updated {lastRefreshed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            {showRefresh && (
              <Button variant="outline" size="sm" onClick={fetchStatus} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {isLoading && !profileData ? (
          <div className="flex justify-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !profileData || profileData.platforms.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No rate limit data available. Data will appear after you start posting.
          </div>
        ) : (
          <div className="space-y-3">
            {profileData.platforms.map(p => (
              <div key={p.platform} className="flex items-center gap-3">
                <div className="w-20 text-sm font-medium capitalize">{p.platform}</div>
                <div className="flex-1">
                  <Progress value={(p.count / p.limit) * 100}
                            className={`h-2 ${p.statusLevel === 'critical' ? '[&>div]:bg-red-500' :
                                             p.statusLevel === 'warning' ? '[&>div]:bg-yellow-500' :
                                             '[&>div]:bg-green-500'}`} />
                </div>
                <div className="w-16 text-right text-sm">
                  <span className={p.statusLevel === 'critical' ? 'text-red-600 font-bold' :
                                  p.statusLevel === 'warning' ? 'text-yellow-600' : ''}>
                    {p.count}/{p.limit}
                  </span>
                </div>
                {p.resetTimeFormatted && p.statusLevel !== 'good' && (
                  <div className="w-32 text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {p.resetTimeFormatted.split(' (')[0]}
                  </div>
                )}
              </div>
            ))}

            <div className="text-xs text-gray-500 pt-2 border-t">
              💡 Each platform allows 8 posts/day per profile. Limits reset 24 hours after each post.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

