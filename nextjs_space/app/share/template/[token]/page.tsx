
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, Share2, User } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
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
  fields: TemplateField[]
  user: {
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

export default function SharedTemplatePage() {
  const params = useParams()
  const token = params?.token as string
  const [template, setTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (token) {
      fetchTemplate()
    }
  }, [token])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${token}/share?token=${token}`)
      if (!response.ok) throw new Error('Failed to fetch template')
      const data = await response.json()
      setTemplate(data.template)
      
      // Initialize form data with default values
      const initialFormData: Record<string, string> = {}
      data.template.fields.forEach((field: TemplateField) => {
        initialFormData[field.fieldName] = field.defaultValue || ''
      })
      setFormData(initialFormData)
    } catch (error) {
      console.error('Error fetching template:', error)
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleDownload = () => {
    toast({
      title: 'Download Started',
      description: 'Template will be downloaded shortly'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading template...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Template Not Found</h2>
            <p className="text-gray-600 text-center">
              This template link is invalid or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-blue-200 shadow-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-3xl">{template.name}</CardTitle>
                  <Badge className={categoryColors[template.category] || categoryColors.custom}>
                    {template.category}
                  </Badge>
                </div>
                <CardDescription className="text-base">
                  {template.description || 'No description available'}
                </CardDescription>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                  <User className="w-4 h-4" />
                  <span>Shared by {template.user.name || template.user.email}</span>
                </div>
              </div>
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Template Preview */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                {template.width} × {template.height} pixels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={template.imageUrl}
                  alt={template.name}
                  fill
                  className="object-contain"
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Fields */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Customize Template</CardTitle>
              <CardDescription>
                Fill in the fields below to personalize your template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {template.fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No customizable fields for this template</p>
                </div>
              ) : (
                <>
                  {template.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.fieldName} className="text-base">
                        {field.fieldLabel}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.fieldType === 'textarea' ? (
                        <textarea
                          id={field.fieldName}
                          value={formData[field.fieldName] || ''}
                          onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                          className="w-full min-h-[100px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={field.isRequired}
                        />
                      ) : (
                        <Input
                          id={field.fieldName}
                          type={field.fieldType}
                          value={formData[field.fieldName] || ''}
                          onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                          required={field.isRequired}
                        />
                      )}
                    </div>
                  ))}

                  <div className="pt-4 space-y-3">
                    <Button 
                      className="w-full h-12 text-base gap-2" 
                      size="lg"
                      onClick={handleDownload}
                    >
                      <Download className="w-5 h-5" />
                      Download Customized Template
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                      Your customizations will be applied to the template
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💡</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900">Want to create your own templates?</h3>
                <p className="text-blue-800 text-sm">
                  Sign up for a free account to access our full template library, create custom templates, and share them with your team.
                </p>
                <Button variant="outline" className="mt-3 border-blue-300 hover:bg-blue-100">
                  Get Started Free
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
