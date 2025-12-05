'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  RefreshCw,
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Trash2
} from 'lucide-react'

interface SeriesStatus {
  seriesId: string
  seriesName: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused'
  progress: {
    total: number
    processed: number
    successful: number
    failed: number
  }
  startedAt?: string
  completedAt?: string
  error?: string
  currentFile?: string
}

interface MultiSeriesStatusResponse {
  success: boolean
  summary: {
    queued: number
    processing: number
    completed: number
    failed: number
    totalFiles: number
    processedFiles: number
  }
  series: SeriesStatus[]
  rateLimiter: {
    availableSlots: number
    limit: number
  }
}

export function MultiSeriesStatus() {
  const [data, setData] = useState<MultiSeriesStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/series/multi-status')
      if (!response.ok) throw new Error('Failed to fetch status')
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const clearCompleted = async () => {
    try {
      await fetch('/api/series/multi-status', { method: 'DELETE' })
      fetchStatus()
    } catch (err) {
      console.error('Failed to clear completed:', err)
    }
  }

  useEffect(() => {
    fetchStatus()
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="w-4 h-4 text-gray-500" />
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-gray-100 text-gray-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2">Loading series status...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-500">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
          <p>Error: {error}</p>
          <Button onClick={fetchStatus} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.series.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5" />
            Multi-Series Status
          </CardTitle>
          <CardDescription>No active series processing</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          <p>No series are currently being processed.</p>
          <p className="text-sm mt-2">Start bulk scheduling from the Series tab.</p>
        </CardContent>
      </Card>
    )
  }

  const { summary, series, rateLimiter } = data

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Multi-Series Status
            </CardTitle>
            <CardDescription>
              {summary.processing} processing, {summary.queued} queued
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={clearCompleted} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-1" /> Clear Done
            </Button>
            <Button onClick={fetchStatus} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">{summary.queued}</div>
            <div className="text-xs text-gray-500">Queued</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{summary.processing}</div>
            <div className="text-xs text-blue-500">Processing</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{summary.completed}</div>
            <div className="text-xs text-green-500">Completed</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{summary.failed}</div>
            <div className="text-xs text-red-500">Failed</div>
          </div>
        </div>

        {/* Rate Limiter Status */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-yellow-800">
              API Rate Limit: {rateLimiter.availableSlots}/{rateLimiter.limit} slots available
            </span>
            <Progress
              value={(rateLimiter.availableSlots / rateLimiter.limit) * 100}
              className="w-32 h-2"
            />
          </div>
        </div>

        {/* Series List */}
        <div className="space-y-3">
          {series.map((s) => (
            <div
              key={s.seriesId}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(s.status)}
                  <span className="font-medium">{s.seriesName}</span>
                  <Badge className={getStatusColor(s.status)}>{s.status}</Badge>
                </div>
                <span className="text-sm text-gray-500">
                  {s.progress.processed}/{s.progress.total} files
                </span>
              </div>

              <Progress
                value={s.progress.total > 0 ? (s.progress.processed / s.progress.total) * 100 : 0}
                className="h-2 mb-2"
              />

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex gap-4">
                  <span className="text-green-600">✓ {s.progress.successful}</span>
                  <span className="text-red-600">✗ {s.progress.failed}</span>
                </div>
                {s.currentFile && (
                  <span className="truncate max-w-[200px]">
                    Current: {s.currentFile}
                  </span>
                )}
              </div>

              {s.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {s.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

