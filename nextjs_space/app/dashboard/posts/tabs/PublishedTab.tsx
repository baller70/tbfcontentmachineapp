'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, TrendingUp, Eye, Heart, MessageSquare, Share2 } from 'lucide-react'
import {
  Post,
  Profile,
  PostCard,
  PostFilters,
  PostFilters as PostFiltersType,
  PostPreviewModal,
  PostSkeleton,
  EmptyState
} from '@/components/posts'

interface PublishedTabProps {
  posts: Post[]
  profiles: Profile[]
  loading: boolean
  onRefresh: () => void
}

export function PublishedTab({ posts, profiles, loading, onRefresh }: PublishedTabProps) {
  const { toast } = useToast()
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const [filters, setFilters] = useState<PostFiltersType>({
    status: 'all',
    platform: 'all',
    profile: 'all',
    dateRange: 'all',
    search: ''
  })

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (filters.platform !== 'all' && !post.platforms.includes(filters.platform)) return false
      if (filters.profile !== 'all' && post.profileId !== filters.profile) return false
      if (filters.search) {
        const search = filters.search.toLowerCase()
        const content = (post.content || '').toLowerCase()
        if (!content.includes(search)) return false
      }
      if (filters.dateRange !== 'all') {
        const date = new Date(post.postedAt || post.publishedAt || post.createdAt)
        const now = new Date()
        const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 90
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        if (date < cutoff) return false
      }
      return true
    }).sort((a, b) => {
      const dateA = new Date(a.postedAt || a.publishedAt || a.createdAt).getTime()
      const dateB = new Date(b.postedAt || b.publishedAt || b.createdAt).getTime()
      return dateB - dateA // Most recent first
    })
  }, [posts, filters])

  // Calculate aggregated stats
  const aggregatedStats = useMemo(() => {
    let views = 0, likes = 0, comments = 0, shares = 0
    filteredPosts.forEach(post => {
      post.analytics?.forEach(a => {
        views += a.views || 0
        likes += a.likes || 0
        comments += a.comments || 0
        shares += a.shares || 0
      })
    })
    return { views, likes, comments, shares }
  }, [filteredPosts])

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Published Posts
          </CardTitle>
        </CardHeader>
        <CardContent><PostSkeleton count={5} /></CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Published Posts
          </CardTitle>
          <CardDescription>
            Successfully published content ({filteredPosts.length} posts)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          {filteredPosts.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <Eye className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                <p className="text-lg font-semibold text-blue-700">{aggregatedStats.views.toLocaleString()}</p>
                <p className="text-xs text-blue-600">Views</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <Heart className="w-4 h-4 mx-auto text-red-600 mb-1" />
                <p className="text-lg font-semibold text-red-700">{aggregatedStats.likes.toLocaleString()}</p>
                <p className="text-xs text-red-600">Likes</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <MessageSquare className="w-4 h-4 mx-auto text-green-600 mb-1" />
                <p className="text-lg font-semibold text-green-700">{aggregatedStats.comments.toLocaleString()}</p>
                <p className="text-xs text-green-600">Comments</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <Share2 className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                <p className="text-lg font-semibold text-purple-700">{aggregatedStats.shares.toLocaleString()}</p>
                <p className="text-xs text-purple-600">Shares</p>
              </div>
            </div>
          )}

          <PostFilters filters={filters} onFiltersChange={setFilters} profiles={profiles} showStatusFilter={false} />

          {filteredPosts.length === 0 ? (
            <EmptyState type="published" action={{ label: 'Create Your First Post', onClick: () => window.location.href = '/dashboard' }} />
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPreview={(p) => { setPreviewPost(p); setShowPreview(true) }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <PostPreviewModal post={previewPost} open={showPreview} onOpenChange={setShowPreview} />
    </>
  )
}

