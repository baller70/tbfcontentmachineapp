'use client'

import { Post, PLATFORMS } from './types'
import { PostStatusBadge } from './PostStatusBadge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Calendar, 
  Clock, 
  ExternalLink, 
  Image as ImageIcon, 
  Video,
  Hash,
  AlertCircle,
  Copy,
  RefreshCw,
  Pencil,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface PostPreviewModalProps {
  post: Post | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRetry?: (post: Post) => void
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
  onReschedule?: (post: Post) => void
}

export function PostPreviewModal({
  post,
  open,
  onOpenChange,
  onRetry,
  onEdit,
  onDelete,
  onReschedule
}: PostPreviewModalProps) {
  if (!post) return null

  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0
  
  const copyContent = () => {
    const text = [post.content, post.caption, post.hashtags].filter(Boolean).join('\n\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Post Preview</DialogTitle>
            <PostStatusBadge status={post.status} />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-200px)]">
          <div className="px-6 py-4 space-y-6">
            {/* Media Gallery */}
            {hasMedia && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ImageIcon className="w-4 h-4" />
                  <span>Media ({post.mediaUrls!.length})</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {post.mediaUrls!.slice(0, 6).map((url, i) => {
                    const isVideo = post.mediaItems?.[i]?.type === 'video'
                    return (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                        {isVideo ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Video className="w-8 h-8 text-gray-500" />
                          </div>
                        ) : (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Content</span>
                <Button variant="ghost" size="sm" onClick={copyContent} className="h-7">
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{post.content || 'No content'}</p>
                {post.caption && (
                  <p className="text-sm text-gray-600 mt-2 pt-2 border-t">{post.caption}</p>
                )}
                {post.hashtags && (
                  <p className="text-sm text-blue-600 mt-2">{post.hashtags}</p>
                )}
              </div>
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <span className="text-sm text-gray-500">Platforms</span>
              <div className="flex flex-wrap gap-2">
                {post.platforms.map(platform => {
                  const config = PLATFORMS.find(p => p.id === platform.toLowerCase())
                  return (
                    <Badge key={platform} variant="outline" style={{ borderColor: config?.color }}>
                      <span style={{ color: config?.color }}>{config?.label || platform}</span>
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Created</span>
                <p className="text-sm">{format(new Date(post.createdAt), 'PPp')}</p>
              </div>
              {post.scheduledAt && (
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Scheduled</span>
                  <p className="text-sm">{format(new Date(post.scheduledAt), 'PPp')}</p>
                </div>
              )}
              {(post.postedAt || post.publishedAt) && (
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Published</span>
                  <p className="text-sm">{format(new Date(post.postedAt || post.publishedAt!), 'PPp')}</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {post.status === 'FAILED' && post.errorMessage && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Post Failed</p>
                    <p className="text-sm text-red-600 mt-1">{post.errorMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
          {post.status === 'FAILED' && onRetry && (
            <Button variant="outline" size="sm" onClick={() => onRetry(post)}>
              <RefreshCw className="w-4 h-4 mr-1" /> Retry
            </Button>
          )}
          {post.status === 'DRAFT' && onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(post)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
          )}
          {post.status === 'SCHEDULED' && onReschedule && (
            <Button variant="outline" size="sm" onClick={() => onReschedule(post)}>
              <Calendar className="w-4 h-4 mr-1" /> Reschedule
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" className="text-red-600" onClick={() => onDelete(post)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

