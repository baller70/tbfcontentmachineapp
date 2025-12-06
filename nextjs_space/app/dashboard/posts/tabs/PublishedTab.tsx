'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle2, Eye, Heart, MessageSquare, Share2 } from 'lucide-react'
import {
  BaseTabProps,
  Post,
  PostCard,
  PostFilters,
  PostPreviewModal,
  PostSkeleton,
  EmptyState,
  usePreviewModal,
  usePostFilters,
  useFilteredPosts
} from '@/components/posts'

export function PublishedTab({ posts, profiles, loading }: BaseTabProps) {
  // Use shared hooks
  const { previewItem: previewPost, showPreview, openPreview, setShowPreview } = usePreviewModal<Post>()
  const { filters, setFilters } = usePostFilters()

  // Filter posts - sorted by posted date (most recent first)
  const filteredPosts = useFilteredPosts(posts, filters, { sortBy: 'postedAt', sortOrder: 'desc' })

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
                  onPreview={openPreview}
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

