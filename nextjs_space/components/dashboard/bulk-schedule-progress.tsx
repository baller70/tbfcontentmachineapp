'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  FileImage,
  Upload,
  Sparkles,
  Send
} from 'lucide-react'

interface BulkScheduleProgressProps {
  seriesId: string
  seriesName: string
  onComplete?: (result: { successful: number; failed: number }) => void
  onError?: (error: string) => void
}

interface ProgressUpdate {
  type: 'progress' | 'file_start' | 'file_complete' | 'file_error' | 'batch_complete' | 'complete' | 'error'
  message?: string
  file?: string
  fileIndex?: number
  totalFiles?: number
  batchNumber?: number
  totalBatches?: number
  successful?: number
  failed?: number
  stage?: 'download' | 'compress' | 'analyze' | 'generate' | 'upload' | 'schedule' | 'verify'
  error?: string
}

export function BulkScheduleProgress({ 
  seriesId, 
  seriesName, 
  onComplete, 
  onError 
}: BulkScheduleProgressProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<ProgressUpdate | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState({ successful: 0, failed: 0, total: 0 })
  const logsEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  const startBulkSchedule = async () => {
    setIsRunning(true)
    setLogs([])
    setStats({ successful: 0, failed: 0, total: 0 })
    
    try {
      const response = await fetch(`/api/series/${seriesId}/bulk-schedule`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          try {
            const data: ProgressUpdate = JSON.parse(line.slice(6))
            setProgress(data)
            
            // Add to logs
            if (data.message) {
              setLogs(prev => [...prev, data.message!])
            }

            // Update stats
            if (data.successful !== undefined) {
              setStats(prev => ({ ...prev, successful: data.successful! }))
            }
            if (data.failed !== undefined) {
              setStats(prev => ({ ...prev, failed: data.failed! }))
            }
            if (data.totalFiles !== undefined) {
              setStats(prev => ({ ...prev, total: data.totalFiles! }))
            }

            // Handle completion
            if (data.type === 'complete') {
              onComplete?.({ successful: data.successful || 0, failed: data.failed || 0 })
            }
            if (data.type === 'error') {
              onError?.(data.error || 'Unknown error')
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLogs(prev => [...prev, `❌ Error: ${message}`])
      onError?.(message)
    } finally {
      setIsRunning(false)
    }
  }

  const getStageIcon = (stage?: string) => {
    switch (stage) {
      case 'download': return <FileImage className="w-4 h-4" />
      case 'compress': return <FileImage className="w-4 h-4" />
      case 'analyze': return <Sparkles className="w-4 h-4" />
      case 'generate': return <Sparkles className="w-4 h-4" />
      case 'upload': return <Upload className="w-4 h-4" />
      case 'schedule': return <Send className="w-4 h-4" />
      case 'verify': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const progressPercent = stats.total > 0
    ? ((stats.successful + stats.failed) / stats.total) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isRunning ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              ) : (
                <PlayCircle className="w-5 h-5" />
              )}
              Bulk Schedule: {seriesName}
            </CardTitle>
            <CardDescription>
              {isRunning ? 'Processing files...' : 'Ready to start bulk scheduling'}
            </CardDescription>
          </div>
          {!isRunning && (
            <Button onClick={startBulkSchedule} className="bg-blue-600 hover:bg-blue-700">
              <PlayCircle className="w-4 h-4 mr-2" /> Start Bulk Schedule
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Progress: {stats.successful + stats.failed}/{stats.total} files
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-xs text-blue-500">Total Files</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-700">{stats.successful}</div>
            <div className="text-xs text-green-500">Successful</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-xl font-bold text-red-700">{stats.failed}</div>
            <div className="text-xs text-red-500">Failed</div>
          </div>
        </div>

        {/* Current Stage */}
        {progress && isRunning && (
          <div className="mb-4 p-3 bg-gray-50 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStageIcon(progress.stage)}
              <span className="text-sm font-medium capitalize">
                {progress.stage || 'Processing'}
              </span>
              {progress.file && (
                <span className="text-xs text-gray-500 truncate">
                  - {progress.file}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="border rounded-lg">
          <div className="px-3 py-2 bg-gray-100 border-b font-medium text-sm">
            Activity Log
          </div>
          <ScrollArea className="h-48 p-3">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No activity yet. Click "Start Bulk Schedule" to begin.
              </p>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-700">
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Completion Message */}
        {!isRunning && stats.total > 0 && (stats.successful + stats.failed) === stats.total && (
          <div className={`mt-4 p-4 rounded-lg ${
            stats.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          } border`}>
            <div className="flex items-center gap-2">
              {stats.failed === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              <span className={`font-medium ${
                stats.failed === 0 ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {stats.failed === 0
                  ? `All ${stats.successful} posts scheduled successfully!`
                  : `Completed with ${stats.failed} errors. ${stats.successful} posts scheduled.`
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

