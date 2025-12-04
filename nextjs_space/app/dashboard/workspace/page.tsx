
'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Palette, 
  Upload, 
  Trash2, 
  Plus, 
  Edit2, 
  Star, 
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
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
import { Badge } from '@/components/ui/badge'

interface WorkspaceBranding {
  id: string
  name: string
  logoUrl: string | null
  brandColors: string[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export default function WorkspacePage() {
  const [brandings, setBrandings] = useState<WorkspaceBranding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedBrandingId, setExpandedBrandingId] = useState<string | null>(null)

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentBranding, setCurrentBranding] = useState<WorkspaceBranding | null>(null)

  // Form states
  const [brandingName, setBrandingName] = useState('')
  const [brandingColors, setBrandingColors] = useState<string[]>([
    '#FF0000', '#808080', '#000000', '#FFFFFF'
  ])
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | null>(null)
  const [isDefaultBranding, setIsDefaultBranding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchBrandings()
  }, [])

  const fetchBrandings = async () => {
    try {
      const response = await fetch('/api/branding')
      if (response.ok) {
        const data = await response.json()
        setBrandings(data.brandings || [])
        // Auto-expand the first (default) branding
        if (data.brandings?.length > 0) {
          setExpandedBrandingId(data.brandings[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch brandings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load workspace brandings',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openAddDialog = () => {
    setBrandingName('')
    setBrandingColors(['#FF0000', '#808080', '#000000', '#FFFFFF'])
    setBrandingLogoUrl(null)
    setIsDefaultBranding(brandings.length === 0)
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (branding: WorkspaceBranding) => {
    setCurrentBranding(branding)
    setBrandingName(branding.name)
    setBrandingColors(branding.brandColors)
    setBrandingLogoUrl(branding.logoUrl)
    setIsDefaultBranding(branding.isDefault)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (branding: WorkspaceBranding) => {
    setCurrentBranding(branding)
    setIsDeleteDialogOpen(true)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive'
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setBrandingLogoUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCreateBranding = async () => {
    if (!brandingName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your branding',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandingName,
          logoUrl: brandingLogoUrl,
          brandColors: brandingColors,
          isDefault: isDefaultBranding
        })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Workspace branding created'
        })
        setIsAddDialogOpen(false)
        fetchBrandings()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create workspace branding',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateBranding = async () => {
    if (!currentBranding) return

    if (!brandingName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your branding',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentBranding.id,
          name: brandingName,
          logoUrl: brandingLogoUrl,
          brandColors: brandingColors,
          isDefault: isDefaultBranding
        })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Workspace branding updated'
        })
        setIsEditDialogOpen(false)
        fetchBrandings()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update workspace branding',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBranding = async () => {
    if (!currentBranding) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/branding?id=${currentBranding.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Workspace branding deleted'
        })
        setIsDeleteDialogOpen(false)
        fetchBrandings()
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workspace branding',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addColor = () => {
    setBrandingColors([...brandingColors, '#000000'])
  }

  const updateColor = (index: number, color: string) => {
    const newColors = [...brandingColors]
    newColors[index] = color
    setBrandingColors(newColors)
  }

  const removeColor = (index: number) => {
    if (brandingColors.length > 1) {
      setBrandingColors(brandingColors.filter((_, i) => i !== index))
    }
  }

  const toggleExpand = (brandingId: string) => {
    setExpandedBrandingId(expandedBrandingId === brandingId ? null : brandingId)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspace Branding</h1>
          <p className="text-gray-600">Manage your workspace logos and brand colors for multiple companies</p>
        </div>
        <Button onClick={openAddDialog} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Branding</span>
        </Button>
      </div>

      {/* Brandings List */}
      {brandings.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Building2 className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Workspace Brandings Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Create your first workspace branding to manage logos and brand colors for your company or project.
            </p>
            <Button onClick={openAddDialog} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Your First Branding</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {brandings.map((branding) => (
            <Card key={branding.id} className="shadow-sm border-2 hover:border-gray-300 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {branding.logoUrl ? (
                      <div className="relative w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0">
                        <Image
                          src={branding.logoUrl}
                          alt={branding.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{branding.name}</h3>
                        {branding.isDefault && (
                          <Badge variant="secondary" className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            <Star className="w-3 h-3" />
                            <span>Default</span>
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <div className="flex items-center space-x-1">
                          <Palette className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {branding.brandColors.length} colors
                          </span>
                        </div>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          Created {new Date(branding.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(branding)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpand(branding.id)}
                    >
                      {expandedBrandingId === branding.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Content */}
              {expandedBrandingId === branding.id && (
                <CardContent className="pt-0 border-t">
                  <div className="mt-4 space-y-4">
                    {/* Logo Section */}
                    {branding.logoUrl && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Logo</Label>
                        <div className="relative w-48 h-48 bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden">
                          <Image
                            src={branding.logoUrl}
                            alt={branding.name}
                            fill
                            className="object-contain p-4"
                          />
                        </div>
                      </div>
                    )}

                    {/* Colors Section */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Brand Colors</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                        {branding.brandColors.map((color, index) => (
                          <div key={index} className="space-y-1">
                            <div
                              className="w-full h-16 rounded-lg border-2 border-gray-200"
                              style={{ backgroundColor: color }}
                            ></div>
                            <p className="text-xs font-mono text-gray-600 text-center truncate">
                              {color}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="pt-2 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(branding)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Branding
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddDialogOpen ? 'Add New Branding' : 'Edit Branding'}</DialogTitle>
            <DialogDescription>
              {isAddDialogOpen 
                ? 'Create a new workspace branding for your company or project'
                : 'Update your workspace branding details'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="branding-name">Branding Name *</Label>
              <Input
                id="branding-name"
                placeholder="e.g., Company A, Client Project"
                value={brandingName}
                onChange={(e) => setBrandingName(e.target.value)}
              />
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo</Label>
              {brandingLogoUrl ? (
                <div className="space-y-3">
                  <div className="relative w-48 h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={brandingLogoUrl}
                      alt="Branding Logo"
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBrandingLogoUrl(null)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-48 h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload</p>
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            {/* Brand Colors */}
            <div className="space-y-3">
              <Label>Brand Colors</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {brandingColors.map((color, index) => (
                  <div key={index} className="space-y-2">
                    <div className="relative">
                      <div
                        className="w-full h-20 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color }}
                      ></div>
                      {brandingColors.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                          onClick={() => removeColor(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => updateColor(index, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => updateColor(index, e.target.value)}
                        className="flex-1 px-2 py-1 text-xs font-mono border rounded"
                      />
                    </div>
                  </div>
                ))}

                {/* Add Color Button */}
                <div
                  onClick={addColor}
                  className="w-full h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center cursor-pointer transition-colors bg-gray-50"
                >
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Set as Default */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-default"
                checked={isDefaultBranding}
                onChange={(e) => setIsDefaultBranding(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="is-default" className="cursor-pointer">
                Set as default branding
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setIsEditDialogOpen(false)
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={isAddDialogOpen ? handleCreateBranding : handleUpdateBranding}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isAddDialogOpen ? 'Create Branding' : 'Update Branding'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace Branding?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{currentBranding?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBranding}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSaving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
