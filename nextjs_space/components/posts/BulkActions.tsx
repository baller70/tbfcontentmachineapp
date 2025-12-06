'use client'

import { Button } from '@/components/ui/button'
import { 
  Trash2, 
  Calendar, 
  RefreshCw, 
  X,
  CheckSquare,
  Square
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulkActionsProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onDelete?: () => void
  onReschedule?: () => void
  onRetry?: () => void
  isDeleting?: boolean
  isRescheduling?: boolean
  isRetrying?: boolean
  className?: string
}

export function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onReschedule,
  onRetry,
  isDeleting,
  isRescheduling,
  isRetrying,
  className
}: BulkActionsProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0

  if (selectedCount === 0) return null

  return (
    <div className={cn(
      'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
      'bg-white border border-gray-200 shadow-lg rounded-full',
      'px-4 py-2 flex items-center gap-3',
      className
    )}>
      {/* Selection Info */}
      <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </Button>
        <span className="text-sm font-medium">
          {selectedCount} of {totalCount} selected
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onReschedule && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReschedule}
            disabled={isRescheduling}
            className="h-8"
          >
            <Calendar className={cn('w-4 h-4 mr-1', isRescheduling && 'animate-pulse')} />
            Reschedule
          </Button>
        )}

        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="h-8"
          >
            <RefreshCw className={cn('w-4 h-4 mr-1', isRetrying && 'animate-spin')} />
            Retry
          </Button>
        )}

        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className={cn('w-4 h-4 mr-1', isDeleting && 'animate-pulse')} />
            Delete
          </Button>
        )}
      </div>

      {/* Close */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDeselectAll}
        className="h-8 w-8 p-0 ml-2"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

