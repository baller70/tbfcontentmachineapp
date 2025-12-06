'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { 
  Repeat, Plus, Edit, Trash2, Calendar, Clock, Play, Pause,
  Folder, RefreshCw, Loader2, Eye
} from 'lucide-react'
import { Profile, PostSeries, PLATFORMS, PostSkeleton, EmptyState } from '@/components/posts'
import { DropboxFolderPicker } from '@/components/dropbox-folder-picker'

interface SeriesTabProps {
  profiles: Profile[]
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const FREQUENCIES = [
  { value: 'ONCE_DAY', label: 'Once a Day' },
  { value: 'TWICE_DAY', label: 'Twice a Day' },
  { value: 'THREE_DAY', label: 'Three Times a Day' },
  { value: 'ONCE_WEEK', label: 'Once a Week' },
  { value: 'TWICE_WEEK', label: 'Twice a Week' },
  { value: 'THREE_WEEK', label: 'Three Times a Week' }
]

export function SeriesTab({ profiles }: SeriesTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [series, setSeries] = useState<PostSeries[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingSeries, setEditingSeries] = useState<PostSeries | null>(null)
  const [saving, setSaving] = useState(false)
  const [showDropboxPicker, setShowDropboxPicker] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '', description: '', frequency: 'ONCE_WEEK', daysOfWeek: [] as string[],
    timeOfDay: '09:00', platforms: [] as string[], startDate: '', endDate: '',
    profileId: '', dropboxFolderId: '', dropboxFolderPath: '', prompt: '', loopEnabled: false
  })

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/series')
      if (response.ok) {
        const data = await response.json()
        setSeries(data.series || [])
      }
    } catch (error) {
      console.error('Failed to fetch series:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSeries() }, [fetchSeries])

  const resetForm = () => {
    setFormData({
      name: '', description: '', frequency: 'ONCE_WEEK', daysOfWeek: [],
      timeOfDay: '09:00', platforms: [], startDate: '', endDate: '',
      profileId: profiles[0]?.id || '', dropboxFolderId: '', dropboxFolderPath: '', prompt: '', loopEnabled: false
    })
    setEditingSeries(null)
  }

  const openDialog = (s?: PostSeries) => {
    if (s) {
      setEditingSeries(s)
      setFormData({
        name: s.name, description: s.description || '', frequency: s.frequency,
        daysOfWeek: s.daysOfWeek || [], timeOfDay: s.timeOfDay || '09:00',
        platforms: s.platforms || [], startDate: s.startDate?.split('T')[0] || '',
        endDate: s.endDate?.split('T')[0] || '', profileId: '',
        dropboxFolderId: s.dropboxFolderId || '', dropboxFolderPath: s.dropboxFolderPath || '',
        prompt: s.prompt || '', loopEnabled: s.loopEnabled || false
      })
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }))
  }

  const togglePlatform = (p: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p]
    }))
  }

  const saveSeries = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Series name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const url = editingSeries ? `/api/series/${editingSeries.id}` : '/api/series'
      const method = editingSeries ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        toast({ title: editingSeries ? 'Updated' : 'Created', description: `Series ${editingSeries ? 'updated' : 'created'} successfully` })
        setShowDialog(false)
        fetchSeries()
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.error || 'Failed to save series', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save series', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteSeries = async (id: string) => {
    if (!confirm('Are you sure you want to delete this series?')) return
    try {
      const response = await fetch(`/api/series/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: 'Deleted', description: 'Series deleted successfully' })
        fetchSeries()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete series', variant: 'destructive' })
    }
  }

  const toggleStatus = async (s: PostSeries) => {
    const newStatus = s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      const response = await fetch(`/api/series/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s, status: newStatus })
      })
      if (response.ok) {
        toast({ title: newStatus === 'ACTIVE' ? 'Activated' : 'Paused', description: `Series is now ${newStatus.toLowerCase()}` })
        fetchSeries()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update series', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><Repeat className="w-5 h-5 text-violet-600" />Series</CardTitle></CardHeader>
        <CardContent><PostSkeleton count={3} /></CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Repeat className="w-5 h-5 text-violet-600" />Post Series</CardTitle>
              <CardDescription>Automate recurring posts with series ({series.length} series)</CardDescription>
            </div>
            <Button onClick={() => openDialog()}><Plus className="w-4 h-4 mr-2" />New Series</Button>
          </div>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <EmptyState type="series" action={{ label: 'Create Series', onClick: () => openDialog() }} />
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {series.map(s => (
                <SeriesCard key={s.id} series={s} onEdit={() => openDialog(s)} onDelete={() => deleteSeries(s.id)} onToggleStatus={() => toggleStatus(s)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Series Dialog - will be continued in next edit */}
      <SeriesDialog 
        open={showDialog} 
        onOpenChange={setShowDialog} 
        formData={formData}
        setFormData={setFormData}
        profiles={profiles}
        editingSeries={editingSeries}
        saving={saving}
        onSave={saveSeries}
        onToggleDay={toggleDay}
        onTogglePlatform={togglePlatform}
        showDropboxPicker={showDropboxPicker}
        setShowDropboxPicker={setShowDropboxPicker}
      />
    </>
  )
}

// Series Card Component
function SeriesCard({ series, onEdit, onDelete, onToggleStatus }: { 
  series: PostSeries; onEdit: () => void; onDelete: () => void; onToggleStatus: () => void 
}) {
  const isActive = series.status === 'ACTIVE'
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{series.name}</h3>
            <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-100 text-green-700' : ''}>{series.status}</Badge>
            <Badge variant="outline">{series._count?.posts || 0} posts</Badge>
          </div>
          {series.description && <p className="text-sm text-gray-600 mb-2">{series.description}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span><Clock className="w-3 h-3 inline mr-1" />{series.timeOfDay || '09:00'}</span>
            <span><Calendar className="w-3 h-3 inline mr-1" />{series.daysOfWeek?.join(', ') || 'Not set'}</span>
            {series.dropboxFolderId && <span><Folder className="w-3 h-3 inline mr-1" />Dropbox linked</span>}
          </div>
          <div className="flex gap-1 mt-2">
            {series.platforms?.map(p => {
              const platform = PLATFORMS.find(pl => pl.id === p.toLowerCase())
              return <Badge key={p} variant="outline" className="text-xs" style={{ color: platform?.color }}>{platform?.label || p}</Badge>
            })}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onToggleStatus}>{isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button>
          <Button variant="ghost" size="sm" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  )
}

// Series Form Data interface
interface SeriesFormData {
  name: string
  description: string
  frequency: string
  daysOfWeek: string[]
  timeOfDay: string
  platforms: string[]
  startDate: string
  endDate: string
  profileId: string
  dropboxFolderId: string
  dropboxFolderPath: string
  prompt: string
  loopEnabled: boolean
}

// Series Dialog Props
interface SeriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: SeriesFormData
  setFormData: React.Dispatch<React.SetStateAction<SeriesFormData>>
  profiles: Profile[]
  editingSeries: PostSeries | null
  saving: boolean
  onSave: () => void
  onToggleDay: (day: string) => void
  onTogglePlatform: (platform: string) => void
  showDropboxPicker: boolean
  setShowDropboxPicker: (show: boolean) => void
}

// Series Dialog component
function SeriesDialog({ open, onOpenChange, formData, setFormData, profiles, editingSeries, saving, onSave, onToggleDay, onTogglePlatform, showDropboxPicker, setShowDropboxPicker }: SeriesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingSeries ? 'Edit Series' : 'Create Series'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Series name" />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={formData.frequency} onValueChange={(v) => setFormData(p => ({ ...p, frequency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Describe this series..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <Button key={day} type="button" variant={formData.daysOfWeek.includes(day) ? 'default' : 'outline'} size="sm" onClick={() => onToggleDay(day)}>{day.slice(0, 3)}</Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={formData.timeOfDay} onChange={(e) => setFormData(p => ({ ...p, timeOfDay: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={formData.startDate} onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <Checkbox checked={formData.platforms.includes(p.id)} onCheckedChange={() => onTogglePlatform(p.id)} />
                  <Label className="text-sm cursor-pointer">{p.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>AI Prompt (optional)</Label>
            <Textarea value={formData.prompt} onChange={(e) => setFormData(p => ({ ...p, prompt: e.target.value }))} placeholder="Instructions for AI content generation..." rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.loopEnabled} onCheckedChange={(c) => setFormData(p => ({ ...p, loopEnabled: c }))} />
            <Label>Loop through Dropbox files</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editingSeries ? 'Update Series' : 'Create Series'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

