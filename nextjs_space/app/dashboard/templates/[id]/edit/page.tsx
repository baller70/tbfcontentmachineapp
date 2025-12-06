'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, Upload, Save, Loader2, Layers, Menu, Plus, Trash2, ChevronUp, ChevronDown, Copy
} from 'lucide-react'
import {
  TemplateCanvas, TemplateToolbar, FieldPropertiesPanel, useTemplateEditor, useFieldManagement,
  TemplateField, StagingElement, EditorMode, CATEGORIES,
} from '@/components/template-editor'
import { DEFAULT_FIELD } from '@/components/template-editor/constants'
import type { TemplateCanvasRef } from '@/components/template-editor/TemplateCanvas'

interface Template {
  id: string; name: string; description: string | null; category: string
  imageUrl: string; width: number; height: number; isPublic: boolean; fields: TemplateField[]
}

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const canvasRef = useRef<TemplateCanvasRef>(null)

  const [template, setTemplate] = useState<Template | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateCategory, setTemplateCategory] = useState('custom')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageDimensions, setImageDimensions] = useState({ width: 1080, height: 1080 })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showFieldDialog, setShowFieldDialog] = useState(false)
  const [showPropertiesSheet, setShowPropertiesSheet] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')

  const {
    fields, setFields, selectedFieldId, setSelectedFieldId, selectedField, stagingElement, setStagingElement,
    editorMode, setEditorMode, alignmentGuides, undo, redo, canUndo, canRedo, saveToHistory, snapToGrid,
  } = useTemplateEditor({ canvasWidth: imageDimensions.width, canvasHeight: imageDimensions.height })

  const { addField, updateField, updateSelectedField, deleteField, duplicateField, moveFieldLayer } = useFieldManagement({
    fields, setFields, selectedFieldId, setSelectedFieldId, saveToHistory,
  })

  useEffect(() => { fetchTemplate() }, [params.id])

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/templates/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch template')
      const data = await res.json()
      const tpl = data.template
      setTemplate(tpl)
      setTemplateName(tpl.name)
      setTemplateDescription(tpl.description || '')
      setTemplateCategory(tpl.category)
      setImagePreview(tpl.imageUrl)
      setImageDimensions({ width: tpl.width, height: tpl.height })
      const formattedFields: TemplateField[] = (tpl.fields || []).map((f: any) => ({
        id: f.id, fieldName: f.fieldName, fieldLabel: f.fieldLabel, fieldType: f.fieldType,
        x: f.x, y: f.y, width: f.width || 200, height: f.height || 60,
        fontSize: f.fontSize || 48, fontFamily: f.fontFamily || 'Arial', fontColor: f.fontColor || '#FFFFFF',
        fontWeight: f.fontWeight || 'bold', textAlign: f.textAlign || 'center', opacity: f.opacity || 1,
        rotation: f.rotation || 0, zIndex: f.zIndex || 0, defaultValue: f.defaultValue || '',
        isRequired: f.isRequired || false, order: f.order || 0, visible: f.visible !== false,
        imagePreview: f.imagePreview, letterSpacing: f.letterSpacing || 0, lineHeight: f.lineHeight || 1.2,
        textTransform: f.textTransform || 'none', shadowEnabled: f.shadowEnabled || false,
        shadowColor: f.shadowColor || '#000000', shadowBlur: f.shadowBlur || 4,
        shadowOffsetX: f.shadowOffsetX || 2, shadowOffsetY: f.shadowOffsetY || 2,
        borderRadius: f.borderRadius || 0, borderWidth: f.borderWidth || 0, borderColor: f.borderColor || '#000000',
        blendMode: f.blendMode || 'normal', effectIntensity: f.effectIntensity || 50,
      }))
      setFields(formattedFields)
    } catch (error) {
      console.error('Error fetching template:', error)
      toast({ title: 'Error', description: 'Failed to load template', variant: 'destructive' })
    } finally { setIsLoading(false) }
  }

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setImagePreview(dataUrl)
      const img = new window.Image()
      img.onload = () => setImageDimensions({ width: img.width, height: img.height })
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }, [])

  const handleModeChange = useCallback((mode: EditorMode) => {
    setEditorMode(mode)
    if (mode !== 'select') {
      setSelectedFieldId(null)
      const type = mode.replace('place-', '') as StagingElement['type']
      // Set default dimensions based on field type
      let w = 200, h = 200
      if (type === 'text' || type === 'number') { w = 300; h = 60 }
      else if (type === 'shape') { w = 150; h = 150 }
      setStagingElement({ id: 'staging', type, x: imageDimensions.width/2 - w/2, y: imageDimensions.height/2 - h/2, width: w, height: h, content: 'New ' + type, ...DEFAULT_FIELD } as StagingElement)
    } else { setStagingElement(null) }
  }, [imageDimensions, setEditorMode, setSelectedFieldId, setStagingElement])

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (editorMode !== 'select' && stagingElement) { setShowFieldDialog(true); setNewFieldName(''); setNewFieldLabel('') }
  }, [editorMode, stagingElement])

  const confirmAddField = useCallback(() => {
    if (!stagingElement || !newFieldLabel.trim()) { toast({ title: 'Error', description: 'Please enter a field label', variant: 'destructive' }); return }
    const name = newFieldName.trim() || newFieldLabel.toLowerCase().replace(/\s+/g, '_')
    addField(stagingElement, name, newFieldLabel.trim())
    setStagingElement(null); setEditorMode('select'); setShowFieldDialog(false)
    toast({ title: 'Field Added', description: newFieldLabel + ' has been added' })
  }, [stagingElement, newFieldName, newFieldLabel, addField, setStagingElement, setEditorMode, toast])

  const handleFieldSelect = useCallback((id: string | null) => {
    setSelectedFieldId(id)
    if (id && window.innerWidth < 1024) setShowPropertiesSheet(true)
  }, [setSelectedFieldId])

  const handleFieldDrag = useCallback((id: string, x: number, y: number) => {
    const snappedX = snapToGrid(x), snappedY = snapToGrid(y)
    updateField(id, { x: Math.max(0, snappedX), y: Math.max(0, snappedY) })
  }, [snapToGrid, updateField])

  const handleFieldResize = useCallback((id: string, handle: string, x: number, y: number) => {
    const field = fields.find(f => f.id === id)
    if (!field) return
    let newX = field.x, newY = field.y, newW = field.width, newH = field.height
    if (handle.includes('e')) newW = Math.max(50, x - field.x)
    if (handle.includes('w')) { newW = Math.max(50, field.x + field.width - x); newX = x }
    if (handle.includes('s')) newH = Math.max(30, y - field.y)
    if (handle.includes('n')) { newH = Math.max(30, field.y + field.height - y); newY = y }
    updateField(id, { x: newX, y: newY, width: newW, height: newH })
  }, [fields, updateField])

  const handleSave = async () => {
    if (!templateName.trim()) { toast({ title: 'Error', description: 'Please enter a template name', variant: 'destructive' }); return }
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', templateName)
      formData.append('description', templateDescription)
      formData.append('category', templateCategory)
      formData.append('width', String(imageDimensions.width))
      formData.append('height', String(imageDimensions.height))
      formData.append('fields', JSON.stringify(fields))
      if (imageFile) formData.append('image', imageFile)
      const res = await fetch(`/api/templates/${params.id}`, { method: 'PUT', body: formData })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Success', description: 'Template saved successfully' })
      router.push('/dashboard/templates')
    } catch (e) { toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' }) }
    finally { setIsSaving(false) }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/templates">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="hidden sm:block">
            <h1 className="font-semibold text-lg">Edit Template</h1>
            <p className="text-xs text-gray-400">{imageDimensions.width} × {imageDimensions.height}px</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/templates/${params.id}/generate`}>
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white">
              Use Template
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setShowMobileMenu(true)}><Menu className="w-5 h-5" /></Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-80 border-r border-gray-800 bg-gray-900/50">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input value={templateName} onChange={e => setTemplateName(e.target.value)} className="bg-gray-800 border-gray-700" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={templateDescription} onChange={e => setTemplateDescription(e.target.value)} className="bg-gray-800 border-gray-700 min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={templateCategory} onValueChange={setTemplateCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Background Image</Label>
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <><Upload className="w-8 h-8 text-gray-500 mb-2" /><span className="text-sm text-gray-400">Click to upload</span></>
                  )}
                </label>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-800">
              <h3 className="font-medium mb-3 flex items-center gap-2"><Layers className="w-4 h-4" /> Fields ({fields.length})</h3>
              <div className="space-y-2">
                {fields.map((f, idx) => (
                  <div key={f.id} onClick={() => setSelectedFieldId(f.id)} className={'p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between ' + (selectedFieldId === f.id ? 'bg-blue-600/20 border border-blue-500' : 'bg-gray-800/50 hover:bg-gray-800')}>
                    <div>
                      <span className="text-sm font-medium">{f.fieldLabel}</span>
                      <span className="text-xs text-gray-400 ml-2 capitalize">{f.fieldType}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveFieldLayer(f.id, 'up') }} disabled={idx === 0}><ChevronUp className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveFieldLayer(f.id, 'down') }} disabled={idx === fields.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); duplicateField(f.id) }}><Copy className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={(e) => { e.stopPropagation(); deleteField(f.id) }}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {fields.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No fields yet. Use the toolbar to add fields.</p>}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar - extra padding bottom for tooltip visibility */}
          <div className="p-2 pb-14 border-b border-gray-800 bg-gray-900/30 flex justify-center">
            <TemplateToolbar editorMode={editorMode} onModeChange={handleModeChange} canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} showGrid={showGrid} onToggleGrid={() => setShowGrid(!showGrid)} selectedFieldId={selectedFieldId} onDeleteField={() => selectedFieldId && deleteField(selectedFieldId)} onDuplicateField={() => selectedFieldId && duplicateField(selectedFieldId)} onMoveLayerUp={() => selectedFieldId && moveFieldLayer(selectedFieldId, 'up')} onMoveLayerDown={() => selectedFieldId && moveFieldLayer(selectedFieldId, 'down')} />
          </div>
          <div className="flex-1 overflow-hidden">
            <TemplateCanvas ref={canvasRef} width={imageDimensions.width} height={imageDimensions.height} backgroundImage={imagePreview} fields={fields} stagingElement={stagingElement} selectedFieldId={selectedFieldId} alignmentGuides={alignmentGuides} editorMode={editorMode} showGrid={showGrid} onCanvasClick={handleCanvasClick} onFieldSelect={handleFieldSelect} onFieldDrag={handleFieldDrag} onFieldResize={handleFieldResize} onStagingMove={(x, y) => stagingElement && setStagingElement({ ...stagingElement, x, y })} />
          </div>
        </main>

        {/* Properties Panel - Desktop */}
        <aside className="hidden lg:block w-80 border-l border-gray-800 bg-gray-900/50 overflow-y-auto">
          <FieldPropertiesPanel field={selectedField} onUpdate={updateSelectedField} />
        </aside>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetContent side="left" className="w-80 bg-gray-900 border-gray-800 p-0">
          <SheetHeader className="p-4 border-b border-gray-800"><SheetTitle>Template Settings</SheetTitle></SheetHeader>
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="space-y-2"><Label>Template Name</Label><Input value={templateName} onChange={e => setTemplateName(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
            <div className="space-y-2"><Label>Category</Label><Select value={templateCategory} onValueChange={setTemplateCategory}><SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Properties Sheet */}
      <Sheet open={showPropertiesSheet} onOpenChange={setShowPropertiesSheet}>
        <SheetContent side="right" className="w-80 bg-gray-900 border-gray-800 p-0">
          <FieldPropertiesPanel field={selectedField} onUpdate={updateSelectedField} onClose={() => setShowPropertiesSheet(false)} />
        </SheetContent>
      </Sheet>

      {/* Add Field Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader><DialogTitle className="text-white">Add Field</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label className="text-gray-200">Field Label (Required)</Label><Input value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} placeholder="e.g. Player Name, Score" className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" autoFocus /></div>
            <div className="space-y-2"><Label className="text-gray-200">Field Name (Optional)</Label><Input value={newFieldName} onChange={e => setNewFieldName(e.target.value)} placeholder="e.g. player_name" className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" /><p className="text-xs text-gray-400">Auto-generated from label if left empty</p></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowFieldDialog(false)} className="text-gray-300 hover:text-white">Cancel</Button>
            <Button onClick={confirmAddField} className="bg-blue-600 hover:bg-blue-700 text-white">Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}