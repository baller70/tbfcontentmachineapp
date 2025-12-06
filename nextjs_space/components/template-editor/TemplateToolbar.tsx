'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  MousePointer,
  Type,
  Hash,
  Image,
  Star,
  Video,
  Undo2,
  Redo2,
  Grid3X3,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Layers,
  ChevronUp,
  ChevronDown,
  Square,
} from 'lucide-react'
import { EditorMode } from './types'
import { cn } from '@/lib/utils'

interface ToolbarTool {
  id: EditorMode | string
  icon: React.ReactNode
  label: string
  shortcut?: string
}

const tools: ToolbarTool[] = [
  { id: 'select', icon: <MousePointer className="w-5 h-5" />, label: 'Select', shortcut: 'V' },
  { id: 'place-text', icon: <Type className="w-5 h-5" />, label: 'Text Field', shortcut: 'T' },
  { id: 'place-number', icon: <Hash className="w-5 h-5" />, label: 'Number Field', shortcut: 'N' },
  { id: 'place-image', icon: <Image className="w-5 h-5" />, label: 'Image Field', shortcut: 'I' },
  { id: 'place-logo', icon: <Star className="w-5 h-5" />, label: 'Logo Field', shortcut: 'L' },
  { id: 'place-video', icon: <Video className="w-5 h-5" />, label: 'Video Field', shortcut: 'D' },
  { id: 'place-shape', icon: <Square className="w-5 h-5" />, label: 'Shape', shortcut: 'S' },
]

interface TemplateToolbarProps {
  editorMode: EditorMode
  onModeChange: (mode: EditorMode) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  showGrid: boolean
  onToggleGrid: () => void
  selectedFieldId: string | null
  onDeleteField?: () => void
  onDuplicateField?: () => void
  onMoveLayerUp?: () => void
  onMoveLayerDown?: () => void
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export default function TemplateToolbar({
  editorMode,
  onModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showGrid,
  onToggleGrid,
  selectedFieldId,
  onDeleteField,
  onDuplicateField,
  onMoveLayerUp,
  onMoveLayerDown,
  className,
  orientation = 'horizontal',
}: TemplateToolbarProps) {
  const isVertical = orientation === 'vertical'
  
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        'flex gap-1 p-2 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl',
        isVertical ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}>
        {/* Tool buttons */}
        <div className={cn('flex gap-1', isVertical ? 'flex-col' : 'flex-row')}>
          {tools.map(tool => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={editorMode === tool.id ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => onModeChange(tool.id as EditorMode)}
                  className={cn(
                    'w-11 h-11 transition-all',
                    editorMode === tool.id ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  )}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isVertical ? 'right' : 'bottom'}>
                <p>{tool.label} {tool.shortcut && <span className="text-gray-400 ml-1">({tool.shortcut})</span>}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        
        {/* Divider */}
        <div className={cn('bg-gray-700', isVertical ? 'h-px w-full my-1' : 'w-px h-auto mx-1')} />
        
        {/* History buttons */}
        <div className={cn('flex gap-1', isVertical ? 'flex-col' : 'flex-row')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} className="w-11 h-11 text-gray-300 hover:text-white disabled:opacity-30">
                <Undo2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Undo (Ctrl+Z)</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} className="w-11 h-11 text-gray-300 hover:text-white disabled:opacity-30">
                <Redo2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Redo (Ctrl+Shift+Z)</p></TooltipContent>
          </Tooltip>
        </div>
        
        {/* Divider */}
        <div className={cn('bg-gray-700', isVertical ? 'h-px w-full my-1' : 'w-px h-auto mx-1')} />
        
        {/* View buttons */}
        <div className={cn('flex gap-1', isVertical ? 'flex-col' : 'flex-row')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={showGrid ? 'default' : 'ghost'} size="icon" onClick={onToggleGrid} className={cn('w-11 h-11', showGrid ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white')}>
                <Grid3X3 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Toggle Grid (G)</p></TooltipContent>
          </Tooltip>
        </div>
        
        {/* Selection actions */}
        {selectedFieldId && (
          <>
            <div className={cn('bg-gray-700', isVertical ? 'h-px w-full my-1' : 'w-px h-auto mx-1')} />
            <div className={cn('flex gap-1', isVertical ? 'flex-col' : 'flex-row')}>
              {/* Layer controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onMoveLayerUp} className="w-11 h-11 text-gray-300 hover:text-white">
                    <ChevronUp className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Bring Forward</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onMoveLayerDown} className="w-11 h-11 text-gray-300 hover:text-white">
                    <ChevronDown className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Send Backward</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onDuplicateField} className="w-11 h-11 text-gray-300 hover:text-white">
                    <Copy className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Duplicate (Ctrl+D)</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onDeleteField} className="w-11 h-11 text-red-400 hover:text-red-300 hover:bg-red-900/30">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Delete (Del)</p></TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

