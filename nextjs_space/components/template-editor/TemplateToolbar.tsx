'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Square,
  Circle,
  Triangle,
  Minus,
  MoveRight,
  Lock,
  Unlock,
  FlipHorizontal,
  FlipVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Group,
  Ungroup,
  Shapes,
  RectangleHorizontal,
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
]

const shapeTools: ToolbarTool[] = [
  { id: 'place-shape', icon: <Square className="w-5 h-5" />, label: 'Rectangle', shortcut: 'R' },
  { id: 'place-circle', icon: <Circle className="w-5 h-5" />, label: 'Circle', shortcut: 'O' },
  { id: 'place-triangle', icon: <Triangle className="w-5 h-5" />, label: 'Triangle' },
  { id: 'place-rounded-rect', icon: <RectangleHorizontal className="w-5 h-5" />, label: 'Rounded Rectangle' },
  { id: 'place-line', icon: <Minus className="w-5 h-5" />, label: 'Line' },
  { id: 'place-arrow', icon: <MoveRight className="w-5 h-5" />, label: 'Arrow' },
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
  selectedFieldIds?: string[]
  isFieldLocked?: boolean
  onDeleteField?: () => void
  onDuplicateField?: () => void
  onMoveLayerUp?: () => void
  onMoveLayerDown?: () => void
  // Lock/Unlock
  onToggleLock?: () => void
  // Flip
  onFlipHorizontal?: () => void
  onFlipVertical?: () => void
  // Alignment
  onAlignLeft?: () => void
  onAlignCenterH?: () => void
  onAlignRight?: () => void
  onAlignTop?: () => void
  onAlignCenterV?: () => void
  onAlignBottom?: () => void
  onDistributeH?: () => void
  onDistributeV?: () => void
  // Grouping
  onGroup?: () => void
  onUngroup?: () => void
  canGroup?: boolean
  canUngroup?: boolean
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
  selectedFieldIds = [],
  isFieldLocked,
  onDeleteField,
  onDuplicateField,
  onMoveLayerUp,
  onMoveLayerDown,
  onToggleLock,
  onFlipHorizontal,
  onFlipVertical,
  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignCenterV,
  onAlignBottom,
  onDistributeH,
  onDistributeV,
  onGroup,
  onUngroup,
  canGroup,
  canUngroup,
  className,
  orientation = 'horizontal',
}: TemplateToolbarProps) {
  const isVertical = orientation === 'vertical'
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false)
  const hasMultipleSelected = selectedFieldIds.length > 1
  
  const isShapeMode = shapeTools.some(s => s.id === editorMode)

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        'flex gap-1 p-2 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl',
        isVertical ? 'flex-col' : 'flex-row flex-wrap items-center',
        className
      )}>
        {/* Field Tools */}
        <div className={cn('flex gap-1', isVertical ? 'flex-col' : 'flex-row')}>
          {tools.map(tool => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={editorMode === tool.id ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => onModeChange(tool.id as EditorMode)}
                  className={cn('w-10 h-10 transition-all', editorMode === tool.id ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800')}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isVertical ? 'right' : 'bottom'}>
                <p>{tool.label} {tool.shortcut && <span className="text-gray-400 ml-1">({tool.shortcut})</span>}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Shape Library Dropdown */}
          <Popover open={shapeMenuOpen} onOpenChange={setShapeMenuOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant={isShapeMode ? 'default' : 'ghost'}
                    size="icon"
                    className={cn('w-10 h-10 transition-all', isShapeMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800')}
                  >
                    <Shapes className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Shapes</p></TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto p-2 bg-gray-900 border-gray-700" side="bottom" align="start">
              <div className="grid grid-cols-3 gap-1">
                {shapeTools.map(shape => (
                  <Tooltip key={shape.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={editorMode === shape.id ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => { onModeChange(shape.id as EditorMode); setShapeMenuOpen(false) }}
                        className={cn('w-10 h-10', editorMode === shape.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800')}
                      >
                        {shape.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>{shape.label}</p></TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className={cn('bg-gray-700', isVertical ? 'h-px w-full my-1' : 'w-px h-6 mx-1')} />

        {/* History */}
        <div className={cn('flex gap-1', isVertical ? 'flex-col' : 'flex-row')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} className="w-10 h-10 text-gray-300 hover:text-white disabled:opacity-30">
                <Undo2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Undo (Ctrl+Z)</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} className="w-10 h-10 text-gray-300 hover:text-white disabled:opacity-30">
                <Redo2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Redo (Ctrl+Shift+Z)</p></TooltipContent>
          </Tooltip>
        </div>

        <div className={cn('bg-gray-700', isVertical ? 'h-px w-full my-1' : 'w-px h-6 mx-1')} />

        {/* View */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={showGrid ? 'default' : 'ghost'} size="icon" onClick={onToggleGrid} className={cn('w-10 h-10', showGrid ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white')}>
              <Grid3X3 className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={isVertical ? 'right' : 'bottom'}><p>Toggle Grid (G)</p></TooltipContent>
        </Tooltip>

        {/* Selection Actions */}
        {selectedFieldId && (
          <>
            <div className={cn('bg-gray-700', isVertical ? 'h-px w-full my-1' : 'w-px h-6 mx-1')} />

            {/* Alignment Tools */}
            <div className={cn('flex gap-0.5', isVertical ? 'flex-col' : 'flex-row')}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onAlignLeft} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Align Left</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onAlignCenterH} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Align Center</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onAlignRight} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Align Right</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onAlignTop} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <AlignStartVertical className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Align Top</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onAlignCenterV} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <AlignCenterVertical className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Align Middle</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onAlignBottom} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <AlignEndVertical className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Align Bottom</p></TooltipContent>
              </Tooltip>
              {hasMultipleSelected && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={onDistributeH} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                        <AlignHorizontalDistributeCenter className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Distribute Horizontally</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={onDistributeV} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                        <AlignVerticalDistributeCenter className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Distribute Vertically</p></TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>

            <div className={cn('bg-gray-700', isVertical ? 'h-px w-full my-1' : 'w-px h-6 mx-1')} />

            {/* Flip & Lock */}
            <div className={cn('flex gap-0.5', isVertical ? 'flex-col' : 'flex-row')}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onFlipHorizontal} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <FlipHorizontal className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Flip Horizontal</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onFlipVertical} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <FlipVertical className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Flip Vertical</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={isFieldLocked ? 'default' : 'ghost'} size="icon" onClick={onToggleLock} className={cn('w-8 h-8', isFieldLocked ? 'bg-amber-600 text-white hover:bg-amber-700' : 'text-gray-300 hover:text-white hover:bg-gray-800')}>
                    {isFieldLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>{isFieldLocked ? 'Unlock' : 'Lock'}</p></TooltipContent>
              </Tooltip>
            </div>

            <div className={cn('bg-gray-700', isVertical ? 'h-px w-full my-1' : 'w-px h-6 mx-1')} />

            {/* Grouping */}
            {(canGroup || canUngroup) && (
              <>
                <div className={cn('flex gap-0.5', isVertical ? 'flex-col' : 'flex-row')}>
                  {canGroup && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onGroup} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                          <Group className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>Group (Ctrl+G)</p></TooltipContent>
                    </Tooltip>
                  )}
                  {canUngroup && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onUngroup} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                          <Ungroup className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>Ungroup (Ctrl+Shift+G)</p></TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className={cn('bg-gray-700', isVertical ? 'h-px w-full my-1' : 'w-px h-6 mx-1')} />
              </>
            )}

            {/* Layer & Actions */}
            <div className={cn('flex gap-0.5', isVertical ? 'flex-col' : 'flex-row')}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onMoveLayerUp} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Bring Forward</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onMoveLayerDown} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Send Backward</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onDuplicateField} className="w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-800">
                    <Copy className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Duplicate (Ctrl+D)</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onDeleteField} className="w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-900/30">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Delete (Del)</p></TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

