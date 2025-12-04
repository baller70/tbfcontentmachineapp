
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Sparkles, Copy, Search, Wand2, Folder, FolderOpen, FolderPlus, Home } from 'lucide-react'

interface PromptFolder {
  id: string
  name: string
  color: string | null
  promptCount: number
  createdAt: string
}

interface Prompt {
  id: string
  title: string
  prompt: string
  category: string
  folderId: string | null
  folder: {
    id: string
    name: string
    color: string | null
  } | null
  createdAt: string
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [folders, setFolders] = useState<PromptFolder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false)
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null)
  const [currentFolder, setCurrentFolder] = useState<PromptFolder | null>(null)
  const [formData, setFormData] = useState({ title: '', prompt: '', category: '', folderId: '' })
  const [folderFormData, setFolderFormData] = useState({ name: '', color: '' })
  const [submitting, setSubmitting] = useState(false)
  const [enhancingPrompt, setEnhancingPrompt] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchFolders()
    fetchPrompts()
  }, [])

  useEffect(() => {
    fetchPrompts()
  }, [currentFolderId])

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/prompts/folders')
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const url = currentFolderId 
        ? `/api/prompts?folderId=${currentFolderId}`
        : '/api/prompts'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load prompts',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!folderFormData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Folder name is required',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/prompts/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderFormData)
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Folder created successfully' })
        setShowCreateFolderDialog(false)
        setFolderFormData({ name: '', color: '' })
        fetchFolders()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create folder')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create folder',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateFolder = async () => {
    if (!currentFolder || !folderFormData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Folder name is required',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/prompts/folders/${currentFolder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderFormData)
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Folder updated successfully' })
        setShowEditFolderDialog(false)
        setCurrentFolder(null)
        setFolderFormData({ name: '', color: '' })
        fetchFolders()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update folder')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update folder',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteFolder = async () => {
    if (!currentFolder) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/prompts/folders/${currentFolder.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Folder deleted successfully' })
        setShowDeleteFolderDialog(false)
        setCurrentFolder(null)
        if (currentFolderId === currentFolder.id) {
          setCurrentFolderId(null)
        }
        fetchFolders()
        fetchPrompts()
      } else {
        throw new Error('Failed to delete folder')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete folder',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditFolderDialog = (folder: PromptFolder) => {
    setCurrentFolder(folder)
    setFolderFormData({
      name: folder.name,
      color: folder.color || ''
    })
    setShowEditFolderDialog(true)
  }

  const openDeleteFolderDialog = (folder: PromptFolder) => {
    setCurrentFolder(folder)
    setShowDeleteFolderDialog(true)
  }

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.prompt.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and prompt are required',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Prompt created successfully' })
        setShowCreateDialog(false)
        setFormData({ title: '', prompt: '', category: '', folderId: '' })
        fetchPrompts()
      } else {
        throw new Error('Failed to create prompt')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create prompt',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!currentPrompt || !formData.title.trim() || !formData.prompt.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and prompt are required',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/prompts/${currentPrompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Prompt updated successfully' })
        setShowEditDialog(false)
        setCurrentPrompt(null)
        setFormData({ title: '', prompt: '', category: '', folderId: '' })
        fetchPrompts()
      } else {
        throw new Error('Failed to update prompt')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update prompt',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentPrompt) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/prompts/${currentPrompt.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Prompt deleted successfully' })
        setShowDeleteDialog(false)
        setCurrentPrompt(null)
        fetchPrompts()
      } else {
        throw new Error('Failed to delete prompt')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete prompt',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (prompt: Prompt) => {
    setCurrentPrompt(prompt)
    setFormData({
      title: prompt.title,
      prompt: prompt.prompt,
      category: prompt.category || '',
      folderId: prompt.folderId || ''
    })
    setShowEditDialog(true)
  }

  const openCreateDialog = () => {
    setFormData({
      title: '',
      prompt: '',
      category: '',
      folderId: currentFolderId || ''
    })
    setShowCreateDialog(true)
  }

  const openDeleteDialog = (prompt: Prompt) => {
    setCurrentPrompt(prompt)
    setShowDeleteDialog(true)
  }

  const copyPromptText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied!', description: 'Prompt copied to clipboard' })
  }

  const enhancePrompt = async () => {
    if (!formData.prompt.trim()) {
      toast({
        title: 'No Prompt',
        description: 'Please enter prompt instructions first',
        variant: 'destructive'
      })
      return
    }

    setEnhancingPrompt(true)
    try {
      const response = await fetch('/api/polish-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: formData.prompt,
          isInstructions: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to enhance prompt')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let enhancedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                enhancedText += parsed.content
                // Update the form data in real-time to show streaming
                setFormData(prev => ({ ...prev, prompt: enhancedText }))
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      toast({
        title: 'Prompt Enhanced!',
        description: 'Your prompt has been optimized for AI understanding'
      })
    } catch (error) {
      console.error('Error enhancing prompt:', error)
      toast({
        title: 'Error',
        description: 'Failed to enhance prompt',
        variant: 'destructive'
      })
    } finally {
      setEnhancingPrompt(false)
    }
  }

  const filteredPrompts = searchTerm
    ? prompts.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : prompts

  const categories = Array.from(new Set(prompts.map(p => p.category).filter(Boolean)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Prompt Library
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage reusable AI prompts for content generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowCreateFolderDialog(true)}>
            <FolderPlus className="w-4 h-4" />
            New Folder
          </Button>
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="w-4 h-4" />
            Create Prompt
          </Button>
        </div>
      </div>

      {/* Create Prompt Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
            <DialogDescription>
              Create a reusable prompt template for AI content generation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-title">Title *</Label>
                <Input
                  id="create-title"
                  placeholder="E.g., Game Day Hype Post"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-category">Category (Optional)</Label>
                <Input
                  id="create-category"
                  placeholder="E.g., Sports, Promotions, Announcements"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="create-prompt">Prompt Instructions *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={enhancePrompt}
                    disabled={enhancingPrompt || !formData.prompt.trim()}
                    className="gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    {enhancingPrompt ? 'Enhancing...' : 'Enhance'}
                  </Button>
                </div>
                <Textarea
                  id="create-prompt"
                  placeholder="E.g., Create an exciting game day announcement with emojis, keep it under 280 characters, use energetic language..."
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  className="min-h-[150px]"
                  disabled={enhancingPrompt}
                />
                <p className="text-xs text-gray-500">
                  {formData.prompt.length} characters • Tip: Click "Enhance" to optimize your prompt for better AI understanding
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Prompt'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Prompts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{prompts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {prompts.filter(p => {
                const created = new Date(p.createdAt)
                const now = new Date()
                return created.getMonth() === now.getMonth() && 
                       created.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search prompts by title, content, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Folders and Prompts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folders Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Folders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* All Prompts */}
              <button
                onClick={() => setCurrentFolderId(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-left ${
                  currentFolderId === null
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="flex-1 text-sm">All Prompts</span>
                <Badge variant="secondary" className="text-xs">
                  {prompts.length}
                </Badge>
              </button>

              {/* Folder List */}
              {folders.map((folder) => (
                <div key={folder.id} className="group relative">
                  <button
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-left ${
                      currentFolderId === folder.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {currentFolderId === folder.id ? (
                      <FolderOpen className="w-4 h-4" style={{ color: folder.color || undefined }} />
                    ) : (
                      <Folder className="w-4 h-4" style={{ color: folder.color || undefined }} />
                    )}
                    <span className="flex-1 text-sm truncate">{folder.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {folder.promptCount}
                    </Badge>
                  </button>
                  {/* Folder Actions - shown on hover */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditFolderDialog(folder)
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteFolderDialog(folder)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {folders.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  No folders yet. Create one to organize your prompts!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Prompts List */}
        <div className="lg:col-span-3">
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Loading prompts...</p>
          </CardContent>
        </Card>
      ) : filteredPrompts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No prompts found' : 'No prompts yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create your first prompt template to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Prompt
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPrompts.map(prompt => (
            <Card key={prompt.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      {prompt.category && (
                        <Badge variant="secondary">{prompt.category}</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Created {new Date(prompt.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyPromptText(prompt.prompt)}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(prompt)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(prompt)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {prompt.prompt}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Update your prompt template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category (Optional)</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-prompt">Prompt Instructions *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={enhancePrompt}
                  disabled={enhancingPrompt || !formData.prompt.trim()}
                  className="gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  {enhancingPrompt ? 'Enhancing...' : 'Enhance'}
                </Button>
              </div>
              <Textarea
                id="edit-prompt"
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                className="min-h-[150px]"
                disabled={enhancingPrompt}
              />
              <p className="text-xs text-gray-500">
                {formData.prompt.length} characters • Tip: Click "Enhance" to optimize your prompt for better AI understanding
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Prompt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{currentPrompt?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Organize your prompts into folders for better management
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name *</Label>
              <Input
                id="folder-name"
                placeholder="E.g., Sports Posts, Announcements"
                value={folderFormData.name}
                onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-color">Folder Color (Optional)</Label>
              <Input
                id="folder-color"
                type="color"
                value={folderFormData.color || '#3b82f6'}
                onChange={(e) => setFolderFormData({ ...folderFormData, color: e.target.value })}
                className="h-10 w-full"
              />
              <p className="text-xs text-gray-500">
                Choose a color to help identify this folder
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={showEditFolderDialog} onOpenChange={setShowEditFolderDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update folder name and color
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">Folder Name *</Label>
              <Input
                id="edit-folder-name"
                value={folderFormData.name}
                onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-folder-color">Folder Color (Optional)</Label>
              <Input
                id="edit-folder-color"
                type="color"
                value={folderFormData.color || '#3b82f6'}
                onChange={(e) => setFolderFormData({ ...folderFormData, color: e.target.value })}
                className="h-10 w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFolder} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirmation Dialog */}
      <AlertDialog open={showDeleteFolderDialog} onOpenChange={setShowDeleteFolderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{currentFolder?.name}"? Prompts in this folder will be moved to the root. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteFolderDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
