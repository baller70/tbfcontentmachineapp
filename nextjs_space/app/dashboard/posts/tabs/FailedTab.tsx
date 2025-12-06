'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { XCircle, RefreshCw, AlertTriangle } from 'lucide-react'
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

export function FailedTab({ posts, profiles, loading, onRefresh }: BaseTabProps) {
  const { toast } = useToast()

  // Use shared hooks
  const { selectedIds, selectedCount, toggleSelect, selectAll, deselectAll } = usePostSelection()
  const { previewItem: previewPost, showPreview, openPreview, setShowPreview } = usePreviewModal<Post>()
  const { filters, setFilters } = usePostFilters()

  // Retry-specific state
  const [retryPost, setRetryPost] = useState<Post | null>(null)
  const [showRetry, setShowRetry] = useState(false)
  const [retryContent, setRetryContent] = useState('')
  const [retrying, setRetrying] = useState(false)

  // Filter posts
  const filteredPosts = useFilteredPosts(posts, filters)

  const openRetry = (post: Post) => {
    setRetryPost(post)
    setRetryContent(post.content || '')
    setShowRetry(true)
  }

  const handleRetry = async () => {
    if (!retryPost) return
    
    setRetrying(true)
    try {
      // Update the post content if changed and set status back to SCHEDULED
      const response = await fetch(`/api/posts/${retryPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: retryContent,
          status: 'SCHEDULED',
          scheduledAt: new Date().toISOString(), // Schedule for immediate posting
          errorMessage: null
        })
      })
      
      if (response.ok) {
        toast({ title: 'Retry Queued', description: 'Post has been queued for retry' })
        setShowRetry(false)
        setRetryPost(null)
        onRefresh()
      } else {
        throw new Error('Failed to retry')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to retry post', variant: 'destructive' })
    } finally {
      setRetrying(false)
    }
  }

  const handleBulkRetry = async () => {
    if (selectedIds.size === 0) return
    
    setRetrying(true)
    try {
      const retryPromises = Array.from(selectedIds).map(id =>
        fetch(`/api/posts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'SCHEDULED',
            scheduledAt: new Date().toISOString(),
            errorMessage: null
          })
        })
      )
      await Promise.all(retryPromises)
      
      toast({ title: 'Retry Queued', description: `${selectedCount} posts queued for retry` })
      deselectAll()
      onRefresh()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to retry posts', variant: 'destructive' })
    } finally {
      setRetrying(false)
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Failed Posts
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Failed Posts
              </CardTitle>
              <CardDescription>
                Posts that failed to publish ({filteredPosts.length} posts)
              </CardDescription>
            </div>
            {filteredPosts.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleBulkRetry} disabled={selectedCount === 0 || retrying}>
                <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                Retry Selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning Banner */}
          {filteredPosts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Some posts failed to publish</p>
                <p className="text-sm text-amber-700 mt-1">
                  Review the error messages below and retry or edit your posts before retrying.
                </p>
              </div>
            </div>
          )}

          <PostFilters filters={filters} onFiltersChange={setFilters} profiles={profiles} showStatusFilter={false} />

          {filteredPosts.length === 0 ? (
            <EmptyState type="failed" />
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} selected={selectedIds.has(post.id)} onSelect={toggleSelect} onPreview={openPreview} onRetry={openRetry} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <BulkActions selectedCount={selectedCount} totalCount={filteredPosts.length} onSelectAll={() => selectAll(filteredPosts.map(p => p.id))} onDeselectAll={deselectAll} onRetry={handleBulkRetry} isRetrying={retrying} />

      {/* Preview Modal */}
      <PostPreviewModal post={previewPost} open={showPreview} onOpenChange={setShowPreview} onRetry={openRetry} />

      {/* Retry Dialog */}
      <Dialog open={showRetry} onOpenChange={setShowRetry}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Retry Failed Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {retryPost?.errorMessage && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-sm text-red-600">{retryPost.errorMessage}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Edit content before retrying (optional)</Label>
              <Textarea value={retryContent} onChange={(e) => setRetryContent(e.target.value)} rows={4} placeholder="Post content..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRetry(false)}>Cancel</Button>
            <Button onClick={handleRetry} disabled={retrying}>
              <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Retrying...' : 'Retry Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

