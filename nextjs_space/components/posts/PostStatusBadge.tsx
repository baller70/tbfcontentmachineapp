'use client'

import { Badge } from '@/components/ui/badge'
import { PostStatus, STATUS_CONFIG } from './types'
import { 
  FileText, 
  Clock, 
  Loader2, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostStatusBadgeProps {
  status: PostStatus | string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const iconMap = {
  FileText,
  Clock,
  Loader: Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
}

export function PostStatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  className 
}: PostStatusBadgeProps) {
  const normalizedStatus = status.toUpperCase() as PostStatus
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.PENDING
  
  const IconComponent = iconMap[config.icon as keyof typeof iconMap] || AlertCircle
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }

  return (
    <Badge 
      variant="secondary"
      className={cn(
        config.color,
        sizeClasses[size],
        'font-medium inline-flex items-center gap-1',
        className
      )}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {config.label}
    </Badge>
  )
}

