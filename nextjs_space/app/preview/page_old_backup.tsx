
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  Home,
  Grid3x3,
  FolderOpen,
  Folder,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Clock,
  Users,
  Palette,
  FileText,
  Image as ImageIcon,
  Wand2
} from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

interface TemplateField {
  id: string
  fieldName: string
  fieldLabel: string
  fieldType: string
  defaultValue: string | null
  isRequired: boolean
  order: number
}

interface Template {
  id: string
  name: string
  description: string | null
  category: string
  imageUrl: string
  width: number
  height: number
  usageCount: number
  shareableLink: string | null
  platforms: string[]
  fields?: TemplateField[]
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

export default function PreviewPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null) // null = show folders
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [postCaption, setPostCaption] = useState('')
  const [postHashtags, setPostHashtags] = useState('')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      // Fetch public templates (no authentication required)
      const response = await fetch('/api/templates/public')
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

  const fetchTemplateWithFields = async (templateId: string) => {
    setIsLoadingTemplate(true)
    try {
      const response = await fetch(`/api/templates/public/${templateId}`)
      if (!response.ok) throw new Error('Failed to fetch template details')
      const data = await response.json()
      return data.template
    } catch (error) {
      console.error('Error fetching template:', error)
      toast({
        title: 'Error',
        description: 'Failed to load template details',
        variant: 'destructive'
      })
      return null
    } finally {
      setIsLoadingTemplate(false)
    }
  }

  const openPreview = (template: Template) => {
    setSelectedTemplate(template)
    setSelectedPlatforms(template.platforms || [])
    setShowPreview(true)
  }

  const openPostDialog = async (template: Template) => {
    // Fetch full template with fields
    const fullTemplate = await fetchTemplateWithFields(template.id)
    if (!fullTemplate) return

    setSelectedTemplate(fullTemplate)
    setSelectedPlatforms([]) // Start with no platforms selected
    setPostContent('')
    setPostCaption('')
    setPostHashtags('')
    setHasGenerated(false) // Reset generation state
    
    // Initialize form data with default values
    const initialFormData: Record<string, string> = {}
    if (fullTemplate.fields) {
      fullTemplate.fields.forEach((field: TemplateField) => {
        initialFormData[field.fieldName] = field.defaultValue || ''
      })
    }
    setFormData(initialFormData)
    
    setShowPostDialog(true)
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handleGenerate = async () => {
    if (!selectedTemplate) return

    // Validate required fields first
    if (selectedTemplate?.fields) {
      const requiredFields = selectedTemplate.fields.filter(f => f.isRequired)
      for (const field of requiredFields) {
        if (!formData[field.fieldName]?.trim()) {
          toast({
            title: 'Error',
            description: `Please fill in the required field: ${field.fieldLabel}`,
            variant: 'destructive'
          })
          return
        }
      }
    }

    setIsGenerating(true)

    try {
      // Build a prompt from the template data and form fields
      let prompt = `Generate engaging social media content for a ${selectedTemplate.category} post. `
      prompt += `Template: ${selectedTemplate.name}. `
      
      if (selectedTemplate.description) {
        prompt += `Context: ${selectedTemplate.description}. `
      }

      // Add form data to the prompt
      if (selectedTemplate.fields && selectedTemplate.fields.length > 0) {
        prompt += `\n\nForm Details:\n`
        selectedTemplate.fields.forEach((field) => {
          if (formData[field.fieldName]) {
            prompt += `${field.fieldLabel}: ${formData[field.fieldName]}\n`
          }
        })
      }

      prompt += `\n\nGenerate:\n1. Main post content (2-3 sentences, engaging)\n2. A catchy caption\n3. Relevant hashtags (5-7 hashtags)\n\nFormat your response as:\nCONTENT: [content here]\nCAPTION: [caption here]\nHASHTAGS: [hashtags here]`

      // Call generate-content API and handle streaming response
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          templateData: formData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      // Read the streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let generatedText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(line.slice(6))
                if (jsonData.content) {
                  generatedText += jsonData.content
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      }

      // Parse the generated content
      const contentMatch = generatedText.match(/CONTENT:\s*(.+?)(?=\nCAPTION:|$)/s)
      const captionMatch = generatedText.match(/CAPTION:\s*(.+?)(?=\nHASHTAGS:|$)/s)
      const hashtagsMatch = generatedText.match(/HASHTAGS:\s*(.+?)$/s)

      setPostContent(contentMatch ? contentMatch[1].trim() : generatedText)
      setPostCaption(captionMatch ? captionMatch[1].trim() : '')
      setPostHashtags(hashtagsMatch ? hashtagsMatch[1].trim() : '')
      setHasGenerated(true)

      toast({
        title: 'Success!',
        description: 'Content generated successfully. Now select platforms to post.',
      })
    } catch (error: any) {
      console.error('Error generating content:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate content',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePostConfirmation = () => {
    if (!hasGenerated) {
      toast({
        title: 'Error',
        description: 'Please generate content first',
        variant: 'destructive'
      })
      return
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one platform',
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
          formData: formData,
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
      setFormData({})
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

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(templates.map(t => t.category)))

  // Sort templates by usage count to show rotation info
  const sortedTemplates = [...filteredTemplates].sort((a, b) => b.usageCount - a.usageCount)

  // Get category statistics for folder view
  const categoryStats = categories.map(category => {
    const categoryTemplates = templates.filter(t => t.category === category)
    return {
      name: category,
      count: categoryTemplates.length,
      usageCount: categoryTemplates.reduce((sum, t) => sum + t.usageCount, 0)
    }
  })

  // Folder colors - matching the screenshot style
  const folderColors: Record<string, { bg: string, icon: string }> = {
    sports: { bg: 'bg-blue-50', icon: 'text-blue-500' },
    quotes: { bg: 'bg-purple-50', icon: 'text-purple-500' },
    promotional: { bg: 'bg-green-50', icon: 'text-green-500' },
    events: { bg: 'bg-yellow-50', icon: 'text-yellow-500' },
    custom: { bg: 'bg-gray-50', icon: 'text-gray-500' },
    accounting: { bg: 'bg-orange-50', icon: 'text-orange-500' },
    'ai automation': { bg: 'bg-teal-50', icon: 'text-teal-500' },
    'ai chatbot': { bg: 'bg-red-50', icon: 'text-red-500' },
    'ai technology': { bg: 'bg-blue-50', icon: 'text-blue-600' },
    'ai vibe coding': { bg: 'bg-green-50', icon: 'text-green-600' },
  }

  // Get folder color or default
  const getFolderColor = (category: string) => {
    return folderColors[category.toLowerCase()] || { bg: 'bg-gray-50', icon: 'text-gray-500' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Late Content Poster
              </Link>
            </div>
            <nav className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  <Home className="w-4 h-4" />
                  Home
                </Button>
              </Link>
              <Link href="/preview">
                <Button variant="default" className="gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Templates
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" className="gap-2">
                  Sign In
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          {selectedCategory && (
            <div className="flex items-center gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="gap-2 text-blue-600 hover:text-blue-700"
              >
                <Home className="w-4 h-4" />
                Folders
              </Button>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-gray-900">
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {!selectedCategory 
                  ? 'Template Library' 
                  : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </h1>
              <p className="text-gray-600 mt-1">
                {!selectedCategory 
                  ? `Browse ${categories.length} ${categories.length === 1 ? 'folder' : 'folders'}` 
                  : `${filteredTemplates.length} template${filteredTemplates.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
          </div>

          {/* Search - only show when viewing templates */}
          {selectedCategory && (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search templates by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
          ) : !selectedCategory ? (
            /* Folder Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {categoryStats.map((category) => {
                const colors = getFolderColor(category.name)
                return (
                  <Card
                    key={category.name}
                    className="group cursor-pointer transition-all duration-300 hover:shadow-lg border border-border hover:border-primary/50 overflow-hidden bg-card"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <CardContent className="p-0">
                      {/* Folder Icon Area */}
                      <div className={`${colors.bg} border-b border-border p-8 flex items-center justify-center relative overflow-hidden group-hover:opacity-90 transition-opacity duration-300`}>
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border shadow-sm">
                            <span className="text-xs font-bold text-muted-foreground">{category.count}</span>
                          </div>
                        </div>
                        <Folder className={`w-20 h-20 ${colors.icon} group-hover:scale-110 transition-transform duration-300`} strokeWidth={1.5} />
                      </div>

                      {/* Category Info */}
                      <div className="p-4 space-y-3">
                        <div className="space-y-1">
                          <h3 className="font-bold text-base text-foreground uppercase tracking-wide line-clamp-1 group-hover:text-primary transition-colors duration-200">
                            {category.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Click to browse templates
                          </p>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-muted-foreground/60" />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {category.count} {category.count === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                          <div className="text-primary group-hover:translate-x-1 transition-transform duration-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : sortedTemplates.length === 0 ? (
            /* Empty State */
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600 text-center max-w-md">
                  {searchTerm
                    ? 'Try adjusting your search'
                    : 'This folder is empty'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setSelectedCategory(null)}
                >
                  <Home className="w-4 h-4" />
                  Back to Folders
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Templates Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
        </div>
      </main>

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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Your Post</DialogTitle>
            <DialogDescription>
              {!hasGenerated 
                ? "Step 1: Fill in the template fields and generate content"
                : "Step 2: Select platforms and review your generated content"}
            </DialogDescription>
          </DialogHeader>

          {isLoadingTemplate ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading template...</span>
            </div>
          ) : selectedTemplate && (
            <div className="space-y-6 mt-4">
              {/* Template Preview */}
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={selectedTemplate.imageUrl}
                  alt={selectedTemplate.name}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Template Fields Form */}
              {selectedTemplate.fields && selectedTemplate.fields.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📝 Template Fields
                    </CardTitle>
                    <CardDescription>
                      Fill in the required information for your post
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTemplate.fields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={field.fieldName} className="text-base font-semibold">
                            {field.fieldLabel}
                            {field.isRequired && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>
                          {field.fieldType === 'textarea' ? (
                            <Textarea
                              id={field.fieldName}
                              value={formData[field.fieldName] || ''}
                              onChange={(e) => 
                                setFormData(prev => ({
                                  ...prev,
                                  [field.fieldName]: e.target.value
                                }))
                              }
                              placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
                              className="min-h-[100px]"
                              required={field.isRequired}
                              disabled={hasGenerated}
                            />
                          ) : (
                            <Input
                              id={field.fieldName}
                              type={field.fieldType === 'number' ? 'number' : 'text'}
                              value={formData[field.fieldName] || ''}
                              onChange={(e) => 
                                setFormData(prev => ({
                                  ...prev,
                                  [field.fieldName]: e.target.value
                                }))
                              }
                              placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
                              required={field.isRequired}
                              disabled={hasGenerated}
                            />
                          )}
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ) : null}

              {/* Generate Button */}
              {!hasGenerated && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Platform Selection - Only show after generation */}
              {hasGenerated && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        🌐 Select Platforms
                      </CardTitle>
                      <CardDescription>
                        Choose which social media platforms to publish to
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(platformIcons).map(([key, info]) => (
                          <div
                            key={key}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                              selectedPlatforms.includes(key)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              togglePlatform(key)
                            }}
                          >
                            <div className="flex items-center gap-3 pointer-events-none">
                              <Checkbox
                                checked={selectedPlatforms.includes(key)}
                                className="pointer-events-auto"
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <span className={info.color}>{info.icon}</span>
                                <span className="font-medium text-sm">{info.name}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generated Post Content */}
                  <Card className="border-2 border-green-200 bg-green-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        ✨ Generated Content
                      </CardTitle>
                      <CardDescription>
                        Review and edit your AI-generated post content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="content" className="text-base font-semibold">Post Content</Label>
                        <Textarea
                          id="content"
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="Your generated content will appear here..."
                          className="mt-2 min-h-[100px] bg-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="caption" className="text-base font-semibold">Caption</Label>
                        <Textarea
                          id="caption"
                          value={postCaption}
                          onChange={(e) => setPostCaption(e.target.value)}
                          placeholder="Your generated caption will appear here..."
                          className="mt-2 min-h-[80px] bg-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="hashtags" className="text-base font-semibold">Hashtags</Label>
                        <Input
                          id="hashtags"
                          value={postHashtags}
                          onChange={(e) => setPostHashtags(e.target.value)}
                          placeholder="#generated #hashtags #here"
                          className="mt-2 bg-white"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPostDialog(false)}
              disabled={isLoadingTemplate || isGenerating}
            >
              Cancel
            </Button>
            {hasGenerated && (
              <Button
                onClick={handlePostConfirmation}
                className="gap-2"
                disabled={isLoadingTemplate || isGenerating}
              >
                <Send className="w-4 h-4" />
                Continue to Post
              </Button>
            )}
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
