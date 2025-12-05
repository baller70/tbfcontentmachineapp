'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  ChevronDown,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Eye,
  EyeOff,
  Palette,
  X,
} from 'lucide-react'
import { TemplateField, FONT_FAMILIES } from './types'
import { BLEND_MODES, CORNER_STYLES, FILTERS, PHOTO_EFFECTS, TEXTURES } from './constants'
import { cn } from '@/lib/utils'

interface FieldPropertiesPanelProps {
  field: TemplateField | null
  onUpdate: (updates: Partial<TemplateField>) => void
  onClose?: () => void
  className?: string
}

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-gray-700 last:border-b-0">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 hover:bg-gray-800/50 transition-colors">
        <span className="font-medium text-sm text-gray-200">{title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default function FieldPropertiesPanel({ field, onUpdate, onClose, className }: FieldPropertiesPanelProps) {
  if (!field) {
    return (
      <div className={cn('bg-gray-900 border border-gray-700 rounded-lg p-4 text-center text-gray-400', className)}>
        <p>Select a field to edit its properties</p>
      </div>
    )
  }

  const isTextType = field.fieldType === 'text' || field.fieldType === 'number'

  return (
    <div className={cn('bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col max-h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
        <div>
          <h3 className="font-semibold text-white">{field.fieldLabel}</h3>
          <p className="text-xs text-gray-400 capitalize">{field.fieldType} Field</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-gray-700 bg-transparent p-0">
            <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent">Basic</TabsTrigger>
            <TabsTrigger value="style" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent">Style</TabsTrigger>
            <TabsTrigger value="effects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent">Effects</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="mt-0">
            <Section title="Field Info">
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Label</Label>
                <Input value={field.fieldLabel} onChange={e => onUpdate({ fieldLabel: e.target.value })} className="h-9 bg-gray-800 border-gray-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Field Name</Label>
                <Input value={field.fieldName} onChange={e => onUpdate({ fieldName: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="h-9 bg-gray-800 border-gray-600" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-400">Required</Label>
                <Switch checked={field.isRequired} onCheckedChange={v => onUpdate({ isRequired: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-400">Visible</Label>
                <Switch checked={field.visible !== false} onCheckedChange={v => onUpdate({ visible: v })} />
              </div>
            </Section>
            
            <Section title="Position & Size">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">X</Label>
                  <Input type="number" value={Math.round(field.x)} onChange={e => onUpdate({ x: parseInt(e.target.value) || 0 })} className="h-9 bg-gray-800 border-gray-600" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Y</Label>
                  <Input type="number" value={Math.round(field.y)} onChange={e => onUpdate({ y: parseInt(e.target.value) || 0 })} className="h-9 bg-gray-800 border-gray-600" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Width</Label>
                  <Input type="number" value={Math.round(field.width)} onChange={e => onUpdate({ width: parseInt(e.target.value) || 100 })} className="h-9 bg-gray-800 border-gray-600" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Height</Label>
                  <Input type="number" value={Math.round(field.height)} onChange={e => onUpdate({ height: parseInt(e.target.value) || 50 })} className="h-9 bg-gray-800 border-gray-600" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-gray-400">Rotation</Label>
                  <span className="text-xs text-gray-500">{field.rotation || 0}°</span>
                </div>
                <Slider value={[field.rotation || 0]} min={-180} max={180} step={1} onValueChange={([v]) => onUpdate({ rotation: v })} className="w-full" />
              </div>
            </Section>
          </TabsContent>
          
          <TabsContent value="style" className="mt-0">
            {isTextType && (
              <Section title="Typography">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Font Family</Label>
                  <Select value={field.fontFamily} onValueChange={v => onUpdate({ fontFamily: v })}>
                    <SelectTrigger className="h-9 bg-gray-800 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {FONT_FAMILIES.map(f => (
                        <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Font Size</Label>
                    <Input type="number" value={field.fontSize} onChange={e => onUpdate({ fontSize: parseInt(e.target.value) || 24 })} className="h-9 bg-gray-800 border-gray-600" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Color</Label>
                    <div className="flex gap-1">
                      <input type="color" value={field.fontColor} onChange={e => onUpdate({ fontColor: e.target.value })} className="w-9 h-9 rounded border border-gray-600 cursor-pointer" />
                      <Input value={field.fontColor} onChange={e => onUpdate({ fontColor: e.target.value })} className="h-9 bg-gray-800 border-gray-600 flex-1" />
                    </div>
                  </div>
                </div>
              </Section>
            )}
          </TabsContent>
          
          <TabsContent value="effects" className="mt-0">
            <Section title="Opacity & Blend">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-gray-400">Opacity</Label>
                  <span className="text-xs text-gray-500">{Math.round((field.opacity ?? 1) * 100)}%</span>
                </div>
                <Slider value={[(field.opacity ?? 1) * 100]} min={0} max={100} step={1} onValueChange={([v]) => onUpdate({ opacity: v / 100 })} />
              </div>
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

