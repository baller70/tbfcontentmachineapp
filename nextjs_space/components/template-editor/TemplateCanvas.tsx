'use client'

import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { TemplateField, StagingElement, AlignmentGuide, EditorMode } from './types'
import { cn } from '@/lib/utils'

interface TemplateCanvasProps {
  width: number
  height: number
  backgroundImage?: string
  fields: TemplateField[]
  stagingElement: StagingElement | null
  selectedFieldId: string | null
  alignmentGuides: AlignmentGuide[]
  editorMode: EditorMode
  showGrid?: boolean
  showGuides?: boolean
  className?: string
  // Event handlers
  onCanvasClick?: (x: number, y: number) => void
  onFieldSelect?: (fieldId: string | null) => void
  onFieldDragStart?: (fieldId: string, x: number, y: number) => void
  onFieldDrag?: (fieldId: string, x: number, y: number) => void
  onFieldDragEnd?: (fieldId: string) => void
  onFieldResize?: (fieldId: string, handle: string, x: number, y: number) => void
  onFieldRotate?: (fieldId: string, angle: number) => void
  onStagingMove?: (x: number, y: number) => void
}

export interface TemplateCanvasRef {
  canvas: HTMLCanvasElement | null
  redraw: () => void
  toDataURL: (type?: string, quality?: number) => string
  getContext: () => CanvasRenderingContext2D | null
}

const GRID_SIZE = 50
const HANDLE_SIZE = 10

const TemplateCanvas = forwardRef<TemplateCanvasRef, TemplateCanvasProps>(({
  width,
  height,
  backgroundImage,
  fields,
  stagingElement,
  selectedFieldId,
  alignmentGuides,
  editorMode,
  showGrid = true,
  showGuides = true,
  className,
  onCanvasClick,
  onFieldSelect,
  onFieldDragStart,
  onFieldDrag,
  onFieldDragEnd,
  onFieldResize,
  onFieldRotate,
  onStagingMove,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragFieldId, setDragFieldId] = useState<string | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const backgroundImageRef = useRef<HTMLImageElement | null>(null)
  
  // Calculate scale to fit container
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.clientWidth - 32 // padding
      const containerHeight = containerRef.current.clientHeight - 32
      const scaleX = containerWidth / width
      const scaleY = containerHeight / height
      setScale(Math.min(scaleX, scaleY, 1))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [width, height])
  
  // Load background image
  useEffect(() => {
    if (!backgroundImage) {
      backgroundImageRef.current = null
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      backgroundImageRef.current = img
      redraw()
    }
    img.src = backgroundImage
  }, [backgroundImage])
  
  // Get canvas coordinates from event
  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      if (e.touches.length === 0) {
        const touch = (e as React.TouchEvent).changedTouches[0]
        clientX = touch.clientX
        clientY = touch.clientY
      } else {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      }
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    }
  }, [scale])
  
  // Find field at point (top layer first)
  const findFieldAtPoint = useCallback((x: number, y: number): TemplateField | null => {
    for (let i = fields.length - 1; i >= 0; i--) {
      const f = fields[i]
      if (x >= f.x && x <= f.x + f.width && y >= f.y && y <= f.y + f.height) {
        return f
      }
    }
    return null
  }, [fields])
  
  // Check resize handle
  const getResizeHandle = useCallback((x: number, y: number, field: TemplateField): string | null => {
    const handles = [
      { name: 'nw', hx: field.x, hy: field.y },
      { name: 'ne', hx: field.x + field.width, hy: field.y },
      { name: 'se', hx: field.x + field.width, hy: field.y + field.height },
      { name: 'sw', hx: field.x, hy: field.y + field.height },
      { name: 'n', hx: field.x + field.width / 2, hy: field.y },
      { name: 's', hx: field.x + field.width / 2, hy: field.y + field.height },
      { name: 'e', hx: field.x + field.width, hy: field.y + field.height / 2 },
      { name: 'w', hx: field.x, hy: field.y + field.height / 2 },
    ]
    const size = HANDLE_SIZE / scale
    for (const h of handles) {
      if (Math.abs(x - h.hx) < size && Math.abs(y - h.hy) < size) return h.name
    }
    return null
  }, [scale])
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    canvas: canvasRef.current,
    redraw,
    toDataURL: (type = 'image/png', quality = 1) => canvasRef.current?.toDataURL(type, quality) || '',
    getContext: () => canvasRef.current?.getContext('2d') || null,
  }))

  // Draw grid
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    // Vertical lines
    for (let x = 0; x <= width; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    // Horizontal lines
    for (let y = 0; y <= height; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    // Center guides
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    // Vertical center
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()
    // Horizontal center
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()
    ctx.setLineDash([])
  }, [width, height, showGrid])

  // Draw alignment guides
  const drawAlignmentGuides = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGuides) return
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    for (const guide of alignmentGuides) {
      ctx.beginPath()
      if (guide.type === 'vertical') {
        ctx.moveTo(guide.position, 0)
        ctx.lineTo(guide.position, height)
      } else {
        ctx.moveTo(0, guide.position)
        ctx.lineTo(width, guide.position)
      }
      ctx.stroke()
    }
    ctx.setLineDash([])
  }, [alignmentGuides, width, height, showGuides])

  // Draw a single field
  const drawField = useCallback((ctx: CanvasRenderingContext2D, field: TemplateField, isSelected: boolean) => {
    ctx.save()
    // Apply rotation if any
    if (field.rotation) {
      const cx = field.x + field.width / 2
      const cy = field.y + field.height / 2
      ctx.translate(cx, cy)
      ctx.rotate((field.rotation * Math.PI) / 180)
      ctx.translate(-cx, -cy)
    }
    // Apply opacity
    ctx.globalAlpha = field.opacity ?? 1
    // Apply blend mode
    if (field.blendMode) ctx.globalCompositeOperation = field.blendMode as GlobalCompositeOperation

    // Draw based on field type
    if (field.fieldType === 'text' || field.fieldType === 'number') {
      // Text placeholder
      ctx.fillStyle = field.backgroundColor || 'rgba(59, 130, 246, 0.3)'
      ctx.fillRect(field.x, field.y, field.width, field.height)
      // Text label
      ctx.font = `${field.fontWeight || 'bold'} ${Math.min(field.fontSize || 24, field.height * 0.8)}px ${field.fontFamily || 'Arial'}`
      ctx.fillStyle = field.fontColor || '#ffffff'
      ctx.textAlign = field.textAlign as CanvasTextAlign || 'center'
      ctx.textBaseline = 'middle'
      let textX = field.x + field.width / 2
      if (field.textAlign === 'left') textX = field.x + 10
      if (field.textAlign === 'right') textX = field.x + field.width - 10
      ctx.fillText(`{${field.fieldLabel}}`, textX, field.y + field.height / 2, field.width - 20)
    } else if (field.fieldType === 'image' || field.fieldType === 'logo' || field.fieldType === 'video') {
      // Image/video placeholder
      ctx.fillStyle = field.backgroundColor || 'rgba(139, 92, 246, 0.3)'
      ctx.fillRect(field.x, field.y, field.width, field.height)
      // Icon
      ctx.font = 'bold 32px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const icon = field.fieldType === 'video' ? '🎬' : '🖼️'
      ctx.fillText(icon, field.x + field.width / 2, field.y + field.height / 2 - 20)
      // Label
      ctx.font = '14px Arial'
      ctx.fillText(field.fieldLabel, field.x + field.width / 2, field.y + field.height / 2 + 20, field.width - 20)
    } else if (field.fieldType === 'shape') {
      ctx.fillStyle = field.fill || field.fontColor || '#3b82f6'
      if (field.shape === 'circle' || field.shape === 'ellipse') {
        ctx.beginPath()
        ctx.ellipse(field.x + field.width / 2, field.y + field.height / 2, field.width / 2, field.height / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(field.x, field.y, field.width, field.height)
      }
    }

    // Draw selection handles
    if (isSelected) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.strokeRect(field.x, field.y, field.width, field.height)
      // Corner handles
      const handles = [
        { x: field.x, y: field.y },
        { x: field.x + field.width, y: field.y },
        { x: field.x + field.width, y: field.y + field.height },
        { x: field.x, y: field.y + field.height },
        { x: field.x + field.width / 2, y: field.y },
        { x: field.x + field.width / 2, y: field.y + field.height },
        { x: field.x, y: field.y + field.height / 2 },
        { x: field.x + field.width, y: field.y + field.height / 2 },
      ]
      ctx.fillStyle = '#ffffff'
      for (const h of handles) {
        ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
        ctx.strokeRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
      }
    }
    ctx.restore()
  }, [])

  // Main draw function
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Clear
    ctx.clearRect(0, 0, width, height)
    // Draw background
    if (backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0, width, height)
    } else {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, width, height)
    }
    // Draw grid
    drawGrid(ctx)
    // Draw fields
    for (const field of fields) {
      if (field.visible !== false) {
        drawField(ctx, field, field.id === selectedFieldId)
      }
    }
    // Draw staging element
    if (stagingElement) {
      const stagingField: TemplateField = {
        ...stagingElement,
        fieldName: 'staging',
        fieldLabel: stagingElement.content || 'New Field',
        isRequired: false,
        order: 0,
      } as TemplateField
      ctx.globalAlpha = 0.7
      drawField(ctx, stagingField, false)
      ctx.globalAlpha = 1
    }
    // Draw alignment guides
    drawAlignmentGuides(ctx)
  }, [width, height, fields, stagingElement, selectedFieldId, drawGrid, drawField, drawAlignmentGuides])

  useEffect(() => { redraw() }, [redraw, fields, stagingElement, selectedFieldId])

  // Mouse/touch handlers
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const coords = getCanvasCoords(e)

    // If in placement mode, just update staging position
    if (editorMode !== 'select' && stagingElement) {
      onStagingMove?.(coords.x - stagingElement.width / 2, coords.y - stagingElement.height / 2)
      return
    }

    // Check if clicking on selected field's resize handle
    if (selectedFieldId) {
      const selectedField = fields.find(f => f.id === selectedFieldId)
      if (selectedField) {
        const handle = getResizeHandle(coords.x, coords.y, selectedField)
        if (handle) {
          setResizeHandle(handle)
          setIsDragging(true)
          setDragFieldId(selectedFieldId)
          setDragOffset({ x: coords.x, y: coords.y })
          onFieldDragStart?.(selectedFieldId, coords.x, coords.y)
          return
        }
      }
    }

    // Check if clicking on a field
    const clickedField = findFieldAtPoint(coords.x, coords.y)
    if (clickedField) {
      onFieldSelect?.(clickedField.id)
      setIsDragging(true)
      setDragFieldId(clickedField.id)
      setDragOffset({ x: coords.x - clickedField.x, y: coords.y - clickedField.y })
      onFieldDragStart?.(clickedField.id, coords.x, coords.y)
    } else {
      onFieldSelect?.(null)
      onCanvasClick?.(coords.x, coords.y)
    }
  }, [editorMode, stagingElement, selectedFieldId, fields, getCanvasCoords, findFieldAtPoint, getResizeHandle, onCanvasClick, onFieldSelect, onFieldDragStart, onStagingMove])

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCanvasCoords(e)

    // Update staging element position
    if (editorMode !== 'select' && stagingElement) {
      onStagingMove?.(coords.x - stagingElement.width / 2, coords.y - stagingElement.height / 2)
      return
    }

    // Handle dragging/resizing
    if (isDragging && dragFieldId) {
      if (resizeHandle) {
        onFieldResize?.(dragFieldId, resizeHandle, coords.x, coords.y)
      } else {
        onFieldDrag?.(dragFieldId, coords.x - dragOffset.x, coords.y - dragOffset.y)
      }
    }
  }, [editorMode, stagingElement, isDragging, dragFieldId, resizeHandle, dragOffset, getCanvasCoords, onStagingMove, onFieldDrag, onFieldResize])

  const handlePointerUp = useCallback(() => {
    if (isDragging && dragFieldId) {
      onFieldDragEnd?.(dragFieldId)
    }
    setIsDragging(false)
    setDragFieldId(null)
    setResizeHandle(null)
  }, [isDragging, dragFieldId, onFieldDragEnd])

  // Get cursor based on state
  const getCursor = useCallback(() => {
    if (editorMode !== 'select') return 'crosshair'
    if (resizeHandle) {
      const cursors: Record<string, string> = {
        nw: 'nwse-resize', ne: 'nesw-resize', se: 'nwse-resize', sw: 'nesw-resize',
        n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
      }
      return cursors[resizeHandle] || 'move'
    }
    if (isDragging) return 'grabbing'
    return 'default'
  }, [editorMode, resizeHandle, isDragging])

  return (
    <div ref={containerRef} className={cn('relative w-full h-full flex items-center justify-center bg-gray-900 overflow-hidden p-4', className)}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center', cursor: getCursor() }}
        className="border border-gray-700 shadow-xl touch-none select-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
      {/* Zoom indicator */}
      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {Math.round(scale * 100)}%
      </div>
    </div>
  )
})

TemplateCanvas.displayName = 'TemplateCanvas'
export default TemplateCanvas

