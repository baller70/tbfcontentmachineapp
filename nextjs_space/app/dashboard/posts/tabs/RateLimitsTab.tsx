'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Gauge, RefreshCw, Clock, AlertTriangle, CheckCircle, XCircle, Loader2
} from 'lucide-react'
import { Profile, PLATFORMS, StatsSkeleton } from '@/components/posts'

interface RateLimitsTabProps {
  profiles: Profile[]
}

interface RateLimitData {
  profiles: {
    profileId: string
    profileName: string
    platforms: {
      platform: string
      count: number
      limit: number
      remaining: number
      resetTime?: string | null
    }[]
  }[]
}

export function RateLimitsTab({ profiles }: RateLimitsTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [rateLimits, setRateLimits] = useState<RateLimitData | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchRateLimits = useCallback(async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/late/rate-limits')
      if (response.ok) {
        const data = await response.json()
        setRateLimits(data)
        setLastRefreshed(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch rate limits:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchRateLimits()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRateLimits, 30000)
    return () => clearInterval(interval)
  }, [fetchRateLimits])

  const getStatusColor = (remaining: number, limit: number) => {
    const percentage = (remaining / limit) * 100
    if (percentage > 50) return 'text-green-600 bg-green-100'
    if (percentage > 20) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  const getProgressColor = (remaining: number, limit: number) => {
    const percentage = (remaining / limit) * 100
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 20) return 'bg-amber-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-orange-600" />
            Rate Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatsSkeleton />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-orange-600" />
              Rate Limits
            </CardTitle>
            <CardDescription>
              API usage and rate limits across all platforms
              {lastRefreshed && (
                <span className="ml-2 text-xs text-gray-400">
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRateLimits} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!rateLimits || !rateLimits.profiles?.length ? (
          <div className="text-center py-12 text-gray-500">
            <Gauge className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No rate limit data available</p>
            <p className="text-sm mt-1">Connect your social accounts to see rate limits</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rateLimits.profiles.map((profile) => (
              <div key={profile.profileId} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-lg">{profile.profileName}</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Platform</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Used</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Limit</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Remaining</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 w-40">Usage</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Resets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.platforms.map((platform) => {
                        const platformConfig = PLATFORMS.find(p => p.id === platform.platform.toLowerCase())
                        const used = platform.limit - platform.remaining
                        const percentage = platform.limit > 0 ? (used / platform.limit) * 100 : 0
                        
                        return (
                          <tr key={platform.platform} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-medium" 
                                  style={{ color: platformConfig?.color }}
                                >
                                  {platformConfig?.label || platform.platform}
                                </span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-3">
                              <span className="font-mono text-sm">{used}</span>
                            </td>
                            <td className="text-center py-3 px-3">
                              <span className="font-mono text-sm">{platform.limit}</span>
                            </td>
                            <td className="text-center py-3 px-3">
                              <Badge className={getStatusColor(platform.remaining, platform.limit)}>
                                {platform.remaining}
                              </Badge>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${getProgressColor(platform.remaining, platform.limit)}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-10 text-right">
                                  {Math.round(percentage)}%
                                </span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-3 text-xs text-gray-500">
                              {platform.resetTime 
                                ? new Date(platform.resetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '-'
                              }
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500 pt-4 border-t">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>&gt;50% available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>20-50% available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>&lt;20% available</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

