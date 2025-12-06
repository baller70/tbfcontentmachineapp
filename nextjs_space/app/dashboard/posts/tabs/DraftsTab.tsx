'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { FileText, Plus, Calendar, Send } from 'lucide-react'
import {
  Post,
  Profile,
  PLATFORMS,
  PostCard,
  PostFilters,
  PostFilters as PostFiltersType,
  BulkActions,
  PostPreviewModal,
  PostSkeleton,
  EmptyState
} from '@/components/posts'

interface DraftsTabProps {
  posts: Post[]
  profiles: Profile[]
  loading: boolean
  onRefresh: () => void
}

export function DraftsTab({ posts, profiles, loading, onRefresh }: DraftsTabProps) {
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [saving, setSaving] = useState(false)

  // Draft form state
  const [draftContent, setDraftContent] = useState('')
  const [draftCaption, setDraftCaption] = useState('')
  const [draftPlatforms, setDraftPlatforms] = useState<string[]>([])
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')

  const [filters, setFilters] = useState<PostFiltersType>({
    status: 'all', platform: 'all', profile: 'all', dateRange: 'all', search: ''
  })

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (filters.platform !== 'all' && !post.platforms.includes(filters.platform)) return false
      if (filters.search) {
        const search = filters.search.toLowerCase()
        const content = (post.content || '').toLowerCase()
        if (!content.includes(search)) return false
      }
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

  const openEditor = (post?: Post) => {
    if (post) {
      setEditingPost(post)
      setDraftContent(post.content || '')
      setDraftCaption(post.caption || '')
      setDraftPlatforms(post.platforms || [])
    } else {
      setEditingPost(null)
      setDraftContent('')
      setDraftCaption('')
      setDraftPlatforms([])
    }
    setScheduleDate('')
    setScheduleTime('09:00')
    setShowEditor(true)
  }

  const togglePlatform = (platform: string) => {
    setDraftPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const saveDraft = async (schedule: boolean = false) => {
    if (!draftContent.trim()) {
      toast({ title: 'Error', description: 'Content is required', variant: 'destructive' })
      return
    }
    
    setSaving(true)
    try {
      const body: any = {
        content: draftContent,
        caption: draftCaption,
        platforms: draftPlatforms,
        status: schedule && scheduleDate ? 'SCHEDULED' : 'DRAFT',
      }
      
      if (schedule && scheduleDate) {
        body.scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      }
      
      const url = editingPost ? `/api/posts/${editingPost.id}` : '/api/posts'
      const method = editingPost ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        toast({ title: schedule ? 'Scheduled' : 'Saved', description: schedule ? 'Post scheduled successfully' : 'Draft saved successfully' })
        setShowEditor(false)
        onRefresh()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save draft', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" />Drafts</CardTitle></CardHeader>
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
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" />Drafts</CardTitle>
              <CardDescription>Work in progress posts ({filteredPosts.length} drafts)</CardDescription>
            </div>
            <Button onClick={() => openEditor()} size="sm"><Plus className="w-4 h-4 mr-2" />New Draft</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PostFilters filters={filters} onFiltersChange={setFilters} profiles={profiles} showStatusFilter={false} showDateFilter={false} />
          {filteredPosts.length === 0 ? (
            <EmptyState type="drafts" action={{ label: 'Create Draft', onClick: () => openEditor() }} />
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} selected={selectedIds.has(post.id)} onSelect={toggleSelect} onPreview={(p) => { setPreviewPost(p); setShowPreview(true) }} onEdit={openEditor} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <BulkActions selectedCount={selectedIds.size} totalCount={filteredPosts.length} onSelectAll={() => setSelectedIds(new Set(filteredPosts.map(p => p.id)))} onDeselectAll={() => setSelectedIds(new Set())} />

      {/* Preview Modal */}
      <PostPreviewModal post={previewPost} open={showPreview} onOpenChange={setShowPreview} onEdit={openEditor} />

      {/* Draft Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingPost ? 'Edit Draft' : 'New Draft'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea value={draftContent} onChange={(e) => setDraftContent(e.target.value)} rows={4} placeholder="What do you want to share?" />
            </div>
            <div className="space-y-2">
              <Label>Caption (optional)</Label>
              <Input value={draftCaption} onChange={(e) => setDraftCaption(e.target.value)} placeholder="Add a caption..." />
            </div>
            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.slice(0, 6).map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Checkbox id={p.id} checked={draftPlatforms.includes(p.id)} onCheckedChange={() => togglePlatform(p.id)} />
                    <Label htmlFor={p.id} className="text-sm cursor-pointer">{p.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule Date (optional)</Label>
                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => saveDraft(false)} disabled={saving}><FileText className="w-4 h-4 mr-2" />Save Draft</Button>
            {scheduleDate && <Button onClick={() => saveDraft(true)} disabled={saving}><Calendar className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Schedule'}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

