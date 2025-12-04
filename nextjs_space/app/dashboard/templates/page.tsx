
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Image as ImageIcon,
  MoreVertical,
  Edit,
  Trash2,
  Wand2,
  Grid3x3,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
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
  _count: {
    fields: number
    graphics: number
  }
  createdAt: string
  isPublic?: boolean
  isOwned?: boolean
  user?: {
    name: string | null
    email: string
  }
}

const categoryColors: Record<string, string> = {
  sports: 'bg-blue-100 text-blue-800',
  quotes: 'bg-purple-100 text-purple-800',
  promotional: 'bg-green-100 text-green-800',
  events: 'bg-yellow-100 text-yellow-800',
  custom: 'bg-gray-100 text-gray-800',
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      // Fetch both user's own templates AND public templates
      const [ownResponse, publicResponse] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/templates/public')
      ])
      
      const ownData = ownResponse.ok ? await ownResponse.json() : { templates: [] }
      const publicData = publicResponse.ok ? await publicResponse.json() : { templates: [] }
      
      // Mark user's own templates
      const ownTemplates = (ownData.templates || []).map((t: Template) => ({
        ...t,
        isOwned: true
      }))
      
      // Mark public templates (that aren't already owned by user)
      const ownTemplateIds = new Set(ownTemplates.map((t: Template) => t.id))
      const publicTemplates = (publicData.templates || [])
        .filter((t: Template) => !ownTemplateIds.has(t.id))
        .map((t: Template) => ({
          ...t,
          isOwned: false,
          isPublic: true
        }))
      
      // Combine both lists: user's templates first, then public templates
      setTemplates([...ownTemplates, ...publicTemplates])
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

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete template')
      
      setTemplates(templates.filter(t => t.id !== id))
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete template',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600">Create and manage your graphic templates</p>
        </div>
        <Link href="/dashboard/templates/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Grid3x3 className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first template'}
            </p>
            <Link href="/dashboard/templates/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="p-4">
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <Image
                    src={template.imageUrl}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {template.description || 'No description'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className={categoryColors[template.category] || categoryColors.custom}>
                      {template.category}
                    </Badge>
                    <span className="text-gray-500">
                      {template.width} × {template.height}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <span>{template._count.fields} fields</span>
                    <span>•</span>
                    <span>{template._count.graphics} graphics</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/dashboard/templates/${template.id}/${template.isOwned ? 'edit' : 'generate'}`} className="flex-1">
                    <Button 
                      variant="default"
                      className="w-full" 
                      size="sm"
                    >
                      {template.isOwned ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          View
                        </>
                      )}
                    </Button>
                  </Link>
                  <Link href={`/dashboard/templates/${template.id}/generate`} className="flex-1">
                    <Button variant="secondary" className="w-full" size="sm">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
