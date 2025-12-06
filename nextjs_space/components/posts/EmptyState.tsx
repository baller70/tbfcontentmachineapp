'use client'

import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Inbox,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  type: 'all' | 'scheduled' | 'published' | 'failed' | 'drafts' | 'series' | 'search'
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const emptyStateConfig = {
  all: {
    icon: Inbox,
    title: 'No posts yet',
    description: 'Start creating content to see your posts here. Use the Content Journey or create a draft to get started.',
    gradient: 'from-blue-500/10 to-purple-500/10'
  },
  scheduled: {
    icon: Calendar,
    title: 'No scheduled posts',
    description: 'Schedule posts to publish them at the perfect time. Your upcoming posts will appear here.',
    gradient: 'from-blue-500/10 to-cyan-500/10'
  },
  published: {
    icon: CheckCircle,
    title: 'No published posts',
    description: 'Once you publish content, it will show up here with engagement metrics.',
    gradient: 'from-green-500/10 to-emerald-500/10'
  },
  failed: {
    icon: XCircle,
    title: 'No failed posts',
    description: "Great news! All your posts have been published successfully. There's nothing to retry.",
    gradient: 'from-gray-500/10 to-slate-500/10'
  },
  drafts: {
    icon: FileText,
    title: 'No drafts saved',
    description: 'Create a draft to save your work in progress. You can edit and schedule it later.',
    gradient: 'from-amber-500/10 to-orange-500/10'
  },
  series: {
    icon: Calendar,
    title: 'No series created',
    description: 'Create a series to automate your content posting on a schedule.',
    gradient: 'from-violet-500/10 to-purple-500/10'
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
    gradient: 'from-gray-500/10 to-slate-500/10'
  }
}

export function EmptyState({ 
  type, 
  title, 
  description, 
  action, 
  secondaryAction,
  className 
}: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-4 text-center',
      className
    )}>
      <div className={cn(
        'w-20 h-20 rounded-full flex items-center justify-center mb-6',
        `bg-gradient-to-br ${config.gradient}`
      )}>
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || config.title}
      </h3>
      
      <p className="text-sm text-gray-500 max-w-md mb-6">
        {description || config.description}
      </p>
      
      <div className="flex items-center gap-3">
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            <Plus className="w-4 h-4" />
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}

