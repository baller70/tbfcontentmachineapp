'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import {
  Post,
  Profile,
  PostCard,
  PostFilters,
  PostFilters as PostFiltersType,
  BulkActions,
  PostPreviewModal,
  PostSkeleton,
  EmptyState
} from '@/components/posts'
import { format } from 'date-fns'

interface ScheduledTabProps {
  posts: Post[]
  profiles: Profile[]
  loading: boolean
  onRefresh: () => void
}

export function ScheduledTab({ posts, profiles, loading, onRefresh }: ScheduledTabProps) {
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [reschedulePost, setReschedulePost] = useState<Post | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('09:00')
  const [rescheduling, setRescheduling] = useState(false)

  const [filters, setFilters] = useState<PostFiltersType>({
    status: 'all',
    platform: 'all',
    profile: 'all',
    dateRange: 'all',
    search: ''
  })

  // Filter and sort posts by scheduled time
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (filters.platform !== 'all' && !post.platforms.includes(filters.platform)) return false
      if (filters.profile !== 'all' && post.profileId !== filters.profile) return false
      if (filters.search) {
        const search = filters.search.toLowerCase()
        const content = (post.content || '').toLowerCase()
        if (!content.includes(search)) return false
      }
      return true
    }).sort((a, b) => {
      const dateA = new Date(a.scheduledAt || a.createdAt).getTime()
      const dateB = new Date(b.scheduledAt || b.createdAt).getTime()
      return dateA - dateB // Sort by upcoming first
    })
  }, [posts, filters])

  // Handlers
  const toggleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }

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
                  onPreview={(p) => { setPreviewPost(p); setShowPreview(true) }}
                  onReschedule={openReschedule}
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
        onSelectAll={() => setSelectedIds(new Set(filteredPosts.map(p => p.id)))}
        onDeselectAll={() => setSelectedIds(new Set())}
        onReschedule={() => {
          if (selectedIds.size === 1) {
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

