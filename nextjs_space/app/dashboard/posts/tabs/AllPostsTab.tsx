'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  Post,
  Profile,
  PostFilters as PostFiltersType,
  PostCard,
  PostFilters,
  BulkActions,
  PostPreviewModal,
  PostSkeleton,
  EmptyState
} from '@/components/posts'

interface AllPostsTabProps {
  posts: Post[]
  profiles: Profile[]
  loading: boolean
  onRefresh: () => void
}

export function AllPostsTab({ posts, profiles, loading, onRefresh }: AllPostsTabProps) {
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
      // Status filter
      if (filters.status !== 'all' && post.status !== filters.status) return false
      
      // Platform filter
      if (filters.platform !== 'all' && !post.platforms.includes(filters.platform)) return false
      
      // Profile filter
      if (filters.profile !== 'all' && post.profileId !== filters.profile) return false
      
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase()
        const content = (post.content || '').toLowerCase()
        const caption = (post.caption || '').toLowerCase()
        if (!content.includes(search) && !caption.includes(search)) return false
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const date = new Date(post.createdAt)
        const now = new Date()
        const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 90
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        if (date < cutoff) return false
      }
      
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [posts, filters])

  // Selection handlers
  const toggleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredPosts.map(p => p.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

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
      setSelectedIds(new Set())
      onRefresh()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete posts', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  // Preview handler
  const handlePreview = (post: Post) => {
    setPreviewPost(post)
    setShowPreview(true)
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
                  onPreview={handlePreview}
                  onDelete={(p) => {
                    setSelectedIds(new Set([p.id]))
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
        selectedCount={selectedIds.size}
        totalCount={filteredPosts.length}
        onSelectAll={selectAll}
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
          setSelectedIds(new Set([p.id]))
          handleBulkDelete()
          setShowPreview(false)
        }}
      />
    </>
  )
}

