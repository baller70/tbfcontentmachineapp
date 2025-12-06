'use client'

import { Post, PLATFORMS } from './types'
import { PostStatusBadge } from './PostStatusBadge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  MoreHorizontal, 
  Image as ImageIcon, 
  Video, 
  Eye, 
  Calendar, 
  Clock,
  RefreshCw,
  Pencil,
  Trash2,
  ExternalLink
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface PostCardProps {
  post: Post
  selected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onPreview?: (post: Post) => void
  onReschedule?: (post: Post) => void
  onRetry?: (post: Post) => void
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
  className?: string
}

export function PostCard({
  post,
  selected = false,
  onSelect,
  onPreview,
  onReschedule,
  onRetry,
  onEdit,
  onDelete,
  className
}: PostCardProps) {
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0
  const firstMedia = post.mediaItems?.[0] || (hasMedia ? { url: post.mediaUrls![0], type: 'image' } : null)
  const isVideo = firstMedia?.type === 'video'
  
  const displayDate = post.postedAt || post.publishedAt || post.scheduledAt || post.createdAt
  const dateLabel = post.postedAt || post.publishedAt 
    ? 'Published' 
    : post.scheduledAt 
      ? 'Scheduled' 
      : 'Created'

  return (
    <Card className={cn(
      'group relative overflow-hidden transition-all duration-200',
      'hover:shadow-md hover:border-gray-300',
      selected && 'ring-2 ring-blue-500 border-blue-500',
      className
    )}>
      <div className="flex gap-4 p-4">
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="flex-shrink-0 pt-1">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(post.id, !!checked)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        )}

        {/* Media Thumbnail */}
        {firstMedia && (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 relative">
            {isVideo ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Video className="w-8 h-8 text-gray-500" />
              </div>
            ) : (
              <img 
                src={firstMedia.url} 
                alt="" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.png'
                }}
              />
            )}
            {post.mediaUrls && post.mediaUrls.length > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                +{post.mediaUrls.length - 1}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <PostStatusBadge status={post.status} size="sm" />
            
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onPreview && (
                  <DropdownMenuItem onClick={() => onPreview(post)}>
                    <Eye className="w-4 h-4 mr-2" /> Preview
                  </DropdownMenuItem>
                )}
                {onEdit && post.status === 'DRAFT' && (
                  <DropdownMenuItem onClick={() => onEdit(post)}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit Draft
                  </DropdownMenuItem>
                )}
                {onReschedule && post.status === 'SCHEDULED' && (
                  <DropdownMenuItem onClick={() => onReschedule(post)}>
                    <Calendar className="w-4 h-4 mr-2" /> Reschedule
                  </DropdownMenuItem>
                )}
                {onRetry && post.status === 'FAILED' && (
                  <DropdownMenuItem onClick={() => onRetry(post)}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(post)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post Content Preview */}
          <p className="text-sm text-gray-700 line-clamp-2 mb-2">
            {post.content || post.caption || 'No content'}
          </p>

          {/* Platform Tags & Date */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              {post.platforms.slice(0, 3).map(platform => {
                const platformConfig = PLATFORMS.find(p => p.id === platform.toLowerCase())
                return (
                  <span 
                    key={platform} 
                    className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium"
                    style={{ color: platformConfig?.color }}
                  >
                    {platformConfig?.label || platform}
                  </span>
                )
              })}
              {post.platforms.length > 3 && (
                <span className="text-gray-400">+{post.platforms.length - 3}</span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{dateLabel} {format(new Date(displayDate), 'MMM d, h:mm a')}</span>
            </div>
          </div>

          {/* Error Message for Failed Posts */}
          {post.status === 'FAILED' && post.errorMessage && (
            <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-100">
              <p className="text-xs text-red-600 line-clamp-1">{post.errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

