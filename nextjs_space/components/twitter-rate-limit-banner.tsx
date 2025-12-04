
'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

interface RateLimitStatus {
  hasData: boolean
  remaining?: number
  limit?: number
  resetTime?: string
  minutesUntilReset?: number
  statusLevel?: 'good' | 'warning' | 'critical'
  percentageUsed?: number
}

export function TwitterRateLimitBanner() {
  const [status, setStatus] = useState<RateLimitStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchRateLimitStatus = async () => {
    try {
      const response = await fetch('/api/twitter/rate-limit')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch Twitter rate limit status:', error)
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

  const { remaining, limit, minutesUntilReset, statusLevel, percentageUsed } = status

  // Don't show banner if we have plenty of tweets left
  if (statusLevel === 'good' && remaining && remaining > 10) {
    return null
  }

  const getIcon = () => {
    switch (statusLevel) {
      case 'critical':
        return <XCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <CheckCircle className="h-5 w-5" />
    }
  }

  const getVariant = (): 'default' | 'destructive' => {
    return statusLevel === 'critical' ? 'destructive' : 'default'
  }

  const getTitle = () => {
    if (statusLevel === 'critical') {
      return '🚫 Twitter Rate Limit Reached'
    }
    if (statusLevel === 'warning') {
      return '⚠️  Twitter Rate Limit Warning'
    }
    return '✅ Twitter Status'
  }

  const getDescription = () => {
    if (statusLevel === 'critical') {
      return `You've used all ${limit} tweets for today. No more tweets can be posted until the rate limit resets in ${minutesUntilReset} minutes.`
    }
    return `You have ${remaining} of ${limit} tweets remaining (${percentageUsed}% used). The rate limit resets in ${minutesUntilReset} minutes. Consider reducing your posting frequency.`
  }

  return (
    <Alert variant={getVariant()} className="mb-6">
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle className="mb-1">{getTitle()}</AlertTitle>
          <AlertDescription className="text-sm">
            {getDescription()}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              <span>Resets at: {status.resetTime ? new Date(status.resetTime).toLocaleString('en-US', {
                timeZone: 'America/New_York',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                month: 'short',
                day: 'numeric'
              }) + ' EST' : 'Unknown'}</span>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}
