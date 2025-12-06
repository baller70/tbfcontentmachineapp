'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  BaseTabProps,
  Post,
  PostCard,
  PostFilters,
  BulkActions,
  PostPreviewModal,
  PostSkeleton,
  EmptyState,
  usePostSelection,
  usePreviewModal,
  usePostFilters,
  useFilteredPosts
} from '@/components/posts'

export function AllPostsTab({ posts, profiles, loading, onRefresh }: BaseTabProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  // Use shared hooks for common functionality
  const { selectedIds, selectedCount, toggleSelect, selectAll, deselectAll } = usePostSelection()
  const { previewItem: previewPost, showPreview, openPreview, setShowPreview } = usePreviewModal<Post>()
  const { filters, setFilters } = usePostFilters()

  // Filter posts using shared hook
  const filteredPosts = useFilteredPosts(posts, filters)

  // Delete handler
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    
    setDeleting(true)
    try {
      // Delete each selected post
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/posts/${id}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
      
      toast({ title: 'Deleted', description: `${selectedIds.size} posts deleted` })
      deselectAll()
      onRefresh()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete posts', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
          <CardDescription>View and manage all your posts</CardDescription>
        </CardHeader>
        <CardContent>
          <PostSkeleton count={5} />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>All Posts</CardTitle>
          <CardDescription>
            View and manage all your posts across all platforms ({filteredPosts.length} posts)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <PostFilters
            filters={filters}
            onFiltersChange={setFilters}
            profiles={profiles}
          />

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <EmptyState 
              type={filters.search ? 'search' : 'all'} 
              action={{
                label: 'Create Post',
                onClick: () => window.location.href = '/dashboard'
              }}
            />
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  selected={selectedIds.has(post.id)}
                  onSelect={toggleSelect}
                  onPreview={openPreview}
                  onDelete={(p) => {
                    selectAll([p.id])
                    handleBulkDelete()
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedCount}
        totalCount={filteredPosts.length}
        onSelectAll={() => selectAll(filteredPosts.map(p => p.id))}
        onDeselectAll={deselectAll}
        onDelete={handleBulkDelete}
        isDeleting={deleting}
      />

      {/* Preview Modal */}
      <PostPreviewModal
        post={previewPost}
        open={showPreview}
        onOpenChange={setShowPreview}
        onDelete={(p) => {
          selectAll([p.id])
          handleBulkDelete()
          setShowPreview(false)
        }}
      />
    </>
  )
}

