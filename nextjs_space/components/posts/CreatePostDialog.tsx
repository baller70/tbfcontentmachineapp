'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Send,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  Hash,
  Globe
} from 'lucide-react'
import { PLATFORMS } from './types'

interface Profile {
  id: string
  name: string
  lateProfileId?: string | null
  companyId?: string | null
  company?: { name: string } | null
  platformSettings?: {
    platform: string
    isConnected: boolean
    platformId?: string | null
  }[]
}

interface MediaFile {
  id: string
  file?: File
  url: string
  type: 'image' | 'video'
  uploading?: boolean
  error?: string
}

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated?: () => void
}

// Character limits per platform
const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  threads: 500,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  tiktok: 4000,
  bluesky: 300,
  youtube: 5000
}

export function CreatePostDialog({ open, onOpenChange, onPostCreated }: CreatePostDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [timezone] = useState('America/New_York')

  // Data states
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Fetch profiles with platform settings
  useEffect(() => {
    if (!open) return

    const fetchProfiles = async () => {
      setLoadingProfiles(true)
      try {
        const response = await fetch('/api/profiles')
        if (response.ok) {
          const data = await response.json()
          setProfiles(data.profiles || [])
          // Auto-select first profile
          if (data.profiles?.length > 0 && !selectedProfileId) {
            setSelectedProfileId(data.profiles[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error)
        toast({ title: 'Error', description: 'Failed to load profiles', variant: 'destructive' })
      } finally {
        setLoadingProfiles(false)
      }
    }

    fetchProfiles()
  }, [open, toast, selectedProfileId])

  // Get connected platforms for selected profile
  const getConnectedPlatforms = useCallback(() => {
    const profile = profiles.find(p => p.id === selectedProfileId)
    if (!profile?.platformSettings) return []
    return profile.platformSettings
      .filter(ps => ps.isConnected)
      .map(ps => ps.platform)
  }, [profiles, selectedProfileId])

  const connectedPlatforms = getConnectedPlatforms()

  // Toggle platform selection
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    )
  }

  // Get minimum character limit from selected platforms
  const getMinCharLimit = () => {
    if (selectedPlatforms.length === 0) return Infinity
    return Math.min(...selectedPlatforms.map(p => CHAR_LIMITS[p] || 5000))
  }

  const minCharLimit = getMinCharLimit()
  const contentLength = content.length + (hashtags ? hashtags.length + 2 : 0)
  const isOverLimit = contentLength > minCharLimit && minCharLimit < Infinity

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  // Process and upload files
  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        toast({ title: 'Invalid file', description: 'Only images and videos are supported', variant: 'destructive' })
        continue
      }

      // Check file size (500MB max)
      if (file.size > 500 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Maximum file size is 500MB', variant: 'destructive' })
        continue
      }

      const mediaId = `media-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const preview = URL.createObjectURL(file)

      // Add file with uploading state
      setMediaFiles(prev => [...prev, {
        id: mediaId,
        file,
        url: preview,
        type: isImage ? 'image' : 'video',
        uploading: true
      }])

      // Upload to Late API
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/late/media', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const data = await response.json()

        // Update with uploaded URL
        setMediaFiles(prev => prev.map(m =>
          m.id === mediaId ? { ...m, url: data.url, uploading: false } : m
        ))

        toast({ title: 'Uploaded', description: `${file.name} uploaded successfully` })
      } catch (error) {
        console.error('Upload error:', error)
        setMediaFiles(prev => prev.map(m =>
          m.id === mediaId ? { ...m, uploading: false, error: 'Upload failed' } : m
        ))
        toast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' })
      }
    }
  }

  // Remove media file
  const removeMedia = (id: string) => {
    setMediaFiles(prev => prev.filter(m => m.id !== id))
  }

  // Reset form
  const resetForm = () => {
    setContent('')
    setHashtags('')
    setMediaFiles([])
    setSelectedPlatforms([])
    setScheduleType('now')
    setScheduledDate('')
    setScheduledTime('')
  }

  // Submit post
  const handleSubmit = async () => {
    // Validation
    if (!content.trim()) {
      toast({ title: 'Error', description: 'Please enter post content', variant: 'destructive' })
      return
    }

    if (selectedPlatforms.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one platform', variant: 'destructive' })
      return
    }

    if (scheduleType === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        toast({ title: 'Error', description: 'Please select date and time', variant: 'destructive' })
        return
      }
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      if (scheduledDateTime <= new Date()) {
        toast({ title: 'Error', description: 'Scheduled time must be in the future', variant: 'destructive' })
        return
      }
    }

    // Check for uploading files
    if (mediaFiles.some(m => m.uploading)) {
      toast({ title: 'Please wait', description: 'Media files are still uploading', variant: 'destructive' })
      return
    }

    setSubmitting(true)

    try {
      const fullContent = hashtags ? `${content}\n\n${hashtags}` : content
      const mediaUrls = mediaFiles.filter(m => !m.error).map(m => m.url)

      const payload: any = {
        profileId: selectedProfileId,
        content: fullContent,
        platforms: selectedPlatforms,
        mediaUrls
      }

      if (scheduleType === 'scheduled') {
        payload.scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      }

      const response = await fetch('/api/late/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create post')
      }

      toast({
        title: 'Success!',
        description: scheduleType === 'now' ? 'Post published successfully!' : 'Post scheduled successfully!'
      })

      resetForm()
      onOpenChange(false)
      onPostCreated?.()
    } catch (error) {
      console.error('Post error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create post',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Group profiles by company
  const groupedProfiles = profiles.reduce((acc, profile) => {
    const companyName = profile.company?.name || 'Personal'
    if (!acc[companyName]) acc[companyName] = []
    acc[companyName].push(profile)
    return acc
  }, {} as Record<string, Profile[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Create New Post
          </DialogTitle>
          <DialogDescription>
            Create and publish content to your social media platforms
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Profile Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Select Profile
              </Label>
              {loadingProfiles ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading profiles...
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedProfiles).map(([company, companyProfiles]) => (
                    <div key={company}>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{company}</p>
                      <div className="flex flex-wrap gap-2">
                        {companyProfiles.map(profile => (
                          <Button
                            key={profile.id}
                            type="button"
                            variant={selectedProfileId === profile.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setSelectedProfileId(profile.id)
                              setSelectedPlatforms([]) // Reset platforms on profile change
                            }}
                            className="gap-2"
                          >
                            {selectedProfileId === profile.id && <CheckCircle2 className="w-3 h-3" />}
                            {profile.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Selection */}
            {selectedProfileId && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Select Platforms
                </Label>
                {connectedPlatforms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No platforms connected for this profile. Connect platforms in Settings.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.filter(p => connectedPlatforms.includes(p.id)).map(platform => (
                      <Button
                        key={platform.id}
                        type="button"
                        variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => togglePlatform(platform.id)}
                        className="gap-2"
                        style={{
                          backgroundColor: selectedPlatforms.includes(platform.id) ? platform.color : undefined,
                          borderColor: platform.color
                        }}
                      >
                        {selectedPlatforms.includes(platform.id) && <CheckCircle2 className="w-3 h-3" />}
                        {platform.label}
                      </Button>
                    ))}
                  </div>
                )}
                {selectedPlatforms.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Media Upload */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Media (Optional)
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop images or videos here, or
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports: JPG, PNG, GIF, WebP, MP4, MOV (max 500MB)
                </p>
              </div>

              {/* Media Preview */}
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {mediaFiles.map(media => (
                    <div key={media.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        {media.type === 'image' ? (
                          <img src={media.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <video src={media.url} className="w-full h-full object-cover" />
                        )}
                        {media.uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        {media.error && (
                          <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMedia(media.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <Badge
                        variant="secondary"
                        className="absolute bottom-1 left-1 text-xs"
                      >
                        {media.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Post Content</Label>
                <span className={`text-xs ${isOverLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                  {contentLength}{minCharLimit < Infinity ? ` / ${minCharLimit}` : ''}
                  {isOverLimit && ' (over limit)'}
                </span>
              </div>
              <Textarea
                placeholder="What's on your mind? Write your post content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className={isOverLimit ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Hashtags (Optional)
              </Label>
              <Input
                placeholder="#marketing #socialmedia #content"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>

            {/* Scheduling */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                When to Post
              </Label>
              <Tabs value={scheduleType} onValueChange={(v) => setScheduleType(v as 'now' | 'scheduled')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="now" className="gap-2">
                    <Send className="w-4 h-4" />
                    Post Now
                  </TabsTrigger>
                  <TabsTrigger value="scheduled" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="now" className="mt-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        Your post will be published immediately to the selected platforms.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="scheduled" className="mt-3">
                  <Card>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Timezone: {timezone} (Eastern Time)
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || selectedPlatforms.length === 0 || isOverLimit}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {scheduleType === 'now' ? 'Publishing...' : 'Scheduling...'}
              </>
            ) : (
              <>
                {scheduleType === 'now' ? <Send className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                {scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePostDialog

