'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Calendar as CalendarIcon } from 'lucide-react'
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
import { format } from 'date-fns'

export function ScheduledTab({ posts, profiles, loading, onRefresh }: BaseTabProps) {
  const { toast } = useToast()

  // Use shared hooks
  const { selectedIds, selectedCount, toggleSelect, selectAll, deselectAll } = usePostSelection()
  const { previewItem: previewPost, showPreview, openPreview, setShowPreview } = usePreviewModal<Post>()
  const { filters, setFilters } = usePostFilters()

  // Reschedule-specific state
  const [reschedulePost, setReschedulePost] = useState<Post | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('09:00')
  const [rescheduling, setRescheduling] = useState(false)

  // Filter posts - sorted by scheduled time (ascending for upcoming)
  const filteredPosts = useFilteredPosts(posts, filters, { sortBy: 'scheduledAt', sortOrder: 'asc' })

  const handleReschedule = async () => {
    if (!reschedulePost || !rescheduleDate) return
    
    setRescheduling(true)
    try {
      const scheduledAt = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString()
      
      const response = await fetch(`/api/posts/${reschedulePost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt })
      })
      
      if (response.ok) {
        toast({ title: 'Rescheduled', description: 'Post has been rescheduled' })
        setShowReschedule(false)
        setReschedulePost(null)
        onRefresh()
      } else {
        throw new Error('Failed to reschedule')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reschedule post', variant: 'destructive' })
    } finally {
      setRescheduling(false)
    }
  }

  const openReschedule = (post: Post) => {
    setReschedulePost(post)
    if (post.scheduledAt) {
      const date = new Date(post.scheduledAt)
      setRescheduleDate(format(date, 'yyyy-MM-dd'))
      setRescheduleTime(format(date, 'HH:mm'))
    }
    setShowReschedule(true)
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Scheduled Posts
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
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Scheduled Posts
          </CardTitle>
          <CardDescription>
            Posts waiting to be published ({filteredPosts.length} posts)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PostFilters filters={filters} onFiltersChange={setFilters} profiles={profiles} showStatusFilter={false} />

          {filteredPosts.length === 0 ? (
            <EmptyState type="scheduled" action={{ label: 'Schedule a Post', onClick: () => window.location.href = '/dashboard' }} />
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  selected={selectedIds.has(post.id)}
                  onSelect={toggleSelect}
                  onPreview={openPreview}
                  onReschedule={openReschedule}
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
        onReschedule={() => {
          if (selectedCount === 1) {
            const post = filteredPosts.find(p => selectedIds.has(p.id))
            if (post) openReschedule(post)
          }
        }}
      />

      {/* Preview Modal */}
      <PostPreviewModal post={previewPost} open={showPreview} onOpenChange={setShowPreview} onReschedule={openReschedule} />

      {/* Reschedule Dialog */}
      <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReschedule(false)}>Cancel</Button>
            <Button onClick={handleReschedule} disabled={rescheduling || !rescheduleDate}>
              {rescheduling ? 'Saving...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

