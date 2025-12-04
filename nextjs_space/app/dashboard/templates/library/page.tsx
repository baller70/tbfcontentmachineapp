
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Search,
  Share2,
  Eye,
  TrendingUp,
  Copy,
  Check,
  Loader2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  Globe,
  Lock
} from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

interface Template {
  id: string
  name: string
  description: string | null
  category: string
  imageUrl: string
  width: number
  height: number
  isPublic: boolean
  usageCount: number
  shareableLink: string | null
  platforms: string[]
  _count: {
    fields: number
    graphics: number
  }
  createdAt: string
}

interface PlatformIcon {
  name: string
  icon: React.ReactNode
  color: string
}

const platformIcons: Record<string, PlatformIcon> = {
  facebook: {
    name: 'Facebook',
    icon: <Facebook className="w-5 h-5" />,
    color: 'text-blue-600'
  },
  twitter: {
    name: 'Twitter',
    icon: <Twitter className="w-5 h-5" />,
    color: 'text-sky-500'
  },
  instagram: {
    name: 'Instagram',
    icon: <Instagram className="w-5 h-5" />,
    color: 'text-pink-600'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: <Linkedin className="w-5 h-5" />,
    color: 'text-blue-700'
  },
  youtube: {
    name: 'YouTube',
    icon: <Youtube className="w-5 h-5" />,
    color: 'text-red-600'
  }
}

const categoryColors: Record<string, string> = {
  sports: 'bg-blue-100 text-blue-800 border-blue-200',
  quotes: 'bg-purple-100 text-purple-800 border-purple-200',
  promotional: 'bg-green-100 text-green-800 border-green-200',
  events: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  custom: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function TemplateLibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [postCaption, setPostCaption] = useState('')
  const [postHashtags, setPostHashtags] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateShareLink = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}/share`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to generate share link')
      
      const data = await response.json()
      setShareLink(data.shareableLink)
      setSelectedTemplate(template)
      setShowShareDialog(true)
    } catch (error) {
      console.error('Error generating share link:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive'
      })
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: 'Copied!',
      description: 'Share link copied to clipboard'
    })
  }

  const openPreview = (template: Template) => {
    setSelectedTemplate(template)
    setSelectedPlatforms(template.platforms || [])
    setShowPreview(true)
  }

  const openPostDialog = (template: Template) => {
    setSelectedTemplate(template)
    setSelectedPlatforms(template.platforms || [])
    setPostContent('')
    setPostCaption('')
    setPostHashtags('')
    setShowPostDialog(true)
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handlePostConfirmation = () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one platform',
        variant: 'destructive'
      })
      return
    }
    if (!postContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter post content',
        variant: 'destructive'
      })
      return
    }
    setShowPostDialog(false)
    setShowConfirmDialog(true)
  }

  const handlePost = async () => {
    if (!selectedTemplate) return
    
    setIsPosting(true)
    setShowConfirmDialog(false)

    try {
      const response = await fetch(`/api/templates/${selectedTemplate.id}/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: postContent,
          caption: postCaption,
          hashtags: postHashtags,
          platforms: selectedPlatforms,
          mediaUrl: selectedTemplate.imageUrl
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to post')
      }

      const data = await response.json()
      
      toast({
        title: 'Success!',
        description: `Post published to ${selectedPlatforms.length} platform(s)`,
      })

      // Refresh templates to update usage count
      fetchTemplates()
      
      // Reset state
      setSelectedTemplate(null)
      setSelectedPlatforms([])
      setPostContent('')
      setPostCaption('')
      setPostHashtags('')
    } catch (error: any) {
      console.error('Error posting:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish post',
        variant: 'destructive'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const toggleVisibility = async (templateId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublic: !currentVisibility
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update visibility')
      }

      // Update local state
      setTemplates(prev =>
        prev.map(t =>
          t.id === templateId ? { ...t, isPublic: !currentVisibility } : t
        )
      )

      toast({
        title: 'Success',
        description: `Template is now ${!currentVisibility ? 'public' : 'private'}`,
      })
    } catch (error) {
      console.error('Error updating visibility:', error)
      toast({
        title: 'Error',
        description: 'Failed to update template visibility',
        variant: 'destructive'
      })
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))]

  // Sort templates by usage count to show rotation info
  const sortedTemplates = [...filteredTemplates].sort((a, b) => b.usageCount - a.usageCount)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Library</h1>
          <p className="text-gray-600 mt-1">Browse, preview, and share your templates across social platforms</p>
        </div>
        <Button size="lg" variant="outline" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          View Analytics
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search templates by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  {category !== 'all' && (
                    <Badge variant="secondary" className="ml-2">
                      {templates.filter(t => t.category === category).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : sortedTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 text-center max-w-md">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first template'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedTemplates.map((template) => (
            <Card key={template.id} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300">
              <CardContent className="p-0">
                {/* Template Preview */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  <Image
                    src={template.imageUrl}
                    alt={template.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Usage Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-gray-900 border border-gray-200 backdrop-blur-sm">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {template.usageCount} uses
                    </Badge>
                  </div>
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className={`${categoryColors[template.category] || categoryColors.custom} border backdrop-blur-sm`}>
                      {template.category}
                    </Badge>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.description || 'No description available'}
                    </p>
                  </div>

                  {/* Platform Icons */}
                  {template.platforms && template.platforms.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500 font-medium">Platforms:</span>
                      {template.platforms.map((platform) => {
                        const platformInfo = platformIcons[platform.toLowerCase()]
                        if (!platformInfo) return null
                        return (
                          <div
                            key={platform}
                            className={`${platformInfo.color} bg-white border rounded-lg p-1.5`}
                            title={platformInfo.name}
                          >
                            {platformInfo.icon}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Template Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
                    <span>{template._count.fields} fields</span>
                    <span>•</span>
                    <span>{template._count.graphics} graphics</span>
                    <span>•</span>
                    <span>{template.width}×{template.height}</span>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between pt-3 pb-2 border-t border-b">
                    <div className="flex items-center gap-2">
                      {template.isPublic ? (
                        <>
                          <Globe className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-600">Private</span>
                        </>
                      )}
                    </div>
                    <Switch
                      checked={template.isPublic}
                      onCheckedChange={() => toggleVisibility(template.id, template.isPublic)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPreview(template)}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateShareLink(template)}
                      className="gap-1"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openPostDialog(template)}
                      className="gap-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      <Send className="w-4 h-4" />
                      Post
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Template Preview</DialogTitle>
            <DialogDescription>
              See how your template will look on different platforms
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6 mt-4">
              {/* Template Image */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden max-w-2xl mx-auto">
                <Image
                  src={selectedTemplate.imageUrl}
                  alt={selectedTemplate.name}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Platform Previews */}
              <Tabs defaultValue="facebook" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  {Object.entries(platformIcons).map(([key, info]) => (
                    <TabsTrigger key={key} value={key} className="gap-2">
                      {info.icon}
                      {info.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(platformIcons).map(([key, info]) => (
                  <TabsContent key={key} value={key} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className={info.color}>{info.icon}</span>
                          {info.name} Preview
                        </CardTitle>
                        <CardDescription>
                          This is how your post will appear on {info.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white border rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div>
                              <div className="font-semibold">Your Profile Name</div>
                              <div className="text-xs text-gray-500">Just now</div>
                            </div>
                          </div>
                          <div className="text-sm">
                            {postContent || 'Your post content will appear here...'}
                            {postCaption && <div className="mt-2 text-gray-600">{postCaption}</div>}
                            {postHashtags && <div className="mt-2 text-blue-600">{postHashtags}</div>}
                          </div>
                          <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
                            <Image
                              src={selectedTemplate.imageUrl}
                              alt={selectedTemplate.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex items-center gap-4 pt-2 text-gray-500 text-sm border-t">
                            <span>👍 Like</span>
                            <span>💬 Comment</span>
                            <span>↗️ Share</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Template</DialogTitle>
            <DialogDescription>
              Share this template with others using the link below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={copyShareLink}
                variant="outline"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Anyone with this link can view and use this template
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowShareDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Post</DialogTitle>
            <DialogDescription>
              Compose your post and select platforms to publish
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6 mt-4">
              {/* Template Preview */}
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={selectedTemplate.imageUrl}
                  alt={selectedTemplate.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Platform Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Platforms</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(platformIcons).map(([key, info]) => (
                    <div
                      key={key}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPlatforms.includes(key)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => togglePlatform(key)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedPlatforms.includes(key)}
                          onCheckedChange={() => togglePlatform(key)}
                        />
                        <div className="flex items-center gap-2">
                          <span className={info.color}>{info.icon}</span>
                          <span className="font-medium">{info.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post Content */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content" className="text-base font-semibold">Post Content *</Label>
                  <Textarea
                    id="content"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Write your main post content here..."
                    className="mt-2 min-h-[120px]"
                  />
                </div>

                <div>
                  <Label htmlFor="caption" className="text-base font-semibold">Caption (Optional)</Label>
                  <Textarea
                    id="caption"
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="mt-2 min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="hashtags" className="text-base font-semibold">Hashtags (Optional)</Label>
                  <Input
                    id="hashtags"
                    value={postHashtags}
                    onChange={(e) => setPostHashtags(e.target.value)}
                    placeholder="#example #hashtags #here"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPostDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePostConfirmation}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Continue to Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                ⚠️
              </div>
              Confirm Publishing
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-base">
                You are about to publish this post to <strong>{selectedPlatforms.length}</strong> platform(s):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.map((platform) => {
                  const info = platformIcons[platform]
                  return (
                    <Badge key={platform} variant="secondary" className="gap-2">
                      <span className={info.color}>{info.icon}</span>
                      {info.name}
                    </Badge>
                  )
                })}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>⚠️ Warning:</strong> This action cannot be undone. The post will be published immediately to all selected platforms.
                </p>
              </div>
              <p className="text-base font-semibold">
                Are you sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPosting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePost}
              disabled={isPosting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Yes, Publish Now
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
