'use client'

import { useCallback } from 'react'
import { TemplateField } from '../types'

interface UseAlignmentProps {
  fields: TemplateField[]
  selectedFieldIds: string[]
  canvasWidth: number
  canvasHeight: number
  updateFields: (updates: { id: string; changes: Partial<TemplateField> }[]) => void
}

export function useAlignment({
  fields,
  selectedFieldIds,
  canvasWidth,
  canvasHeight,
  updateFields,
}: UseAlignmentProps) {
  // Get selected fields
  const getSelectedFields = useCallback(() => {
    return fields.filter(f => selectedFieldIds.includes(f.id) && !f.locked)
  }, [fields, selectedFieldIds])

  // Align Left - align all selected to leftmost edge
  const alignLeft = useCallback(() => {
    const selected = getSelectedFields()
    if (selected.length === 0) return
    const minX = Math.min(...selected.map(f => f.x))
    updateFields(selected.map(f => ({ id: f.id, changes: { x: minX } })))
  }, [getSelectedFields, updateFields])

  // Align Center (horizontal) - align to horizontal center
  const alignCenterH = useCallback(() => {
    const selected = getSelectedFields()
    if (selected.length === 0) return
    if (selected.length === 1) {
      // Align to canvas center
      const centerX = canvasWidth / 2 - selected[0].width / 2
      updateFields([{ id: selected[0].id, changes: { x: centerX } }])
    } else {
      // Align to selection center
      const minX = Math.min(...selected.map(f => f.x))
      const maxX = Math.max(...selected.map(f => f.x + f.width))
      const centerX = (minX + maxX) / 2
      updateFields(selected.map(f => ({ id: f.id, changes: { x: centerX - f.width / 2 } })))
    }
  }, [getSelectedFields, canvasWidth, updateFields])

  // Align Right - align all selected to rightmost edge
  const alignRight = useCallback(() => {
    const selected = getSelectedFields()
    if (selected.length === 0) return
    const maxX = Math.max(...selected.map(f => f.x + f.width))
    updateFields(selected.map(f => ({ id: f.id, changes: { x: maxX - f.width } })))
  }, [getSelectedFields, updateFields])

  // Align Top - align all selected to topmost edge
  const alignTop = useCallback(() => {
    const selected = getSelectedFields()
    if (selected.length === 0) return
    const minY = Math.min(...selected.map(f => f.y))
    updateFields(selected.map(f => ({ id: f.id, changes: { y: minY } })))
  }, [getSelectedFields, updateFields])

  // Align Middle (vertical) - align to vertical center
  const alignCenterV = useCallback(() => {
    const selected = getSelectedFields()
    if (selected.length === 0) return
    if (selected.length === 1) {
      // Align to canvas center
      const centerY = canvasHeight / 2 - selected[0].height / 2
      updateFields([{ id: selected[0].id, changes: { y: centerY } }])
    } else {
      // Align to selection center
      const minY = Math.min(...selected.map(f => f.y))
      const maxY = Math.max(...selected.map(f => f.y + f.height))
      const centerY = (minY + maxY) / 2
      updateFields(selected.map(f => ({ id: f.id, changes: { y: centerY - f.height / 2 } })))
    }
  }, [getSelectedFields, canvasHeight, updateFields])

  // Align Bottom - align all selected to bottommost edge
  const alignBottom = useCallback(() => {
    const selected = getSelectedFields()
    if (selected.length === 0) return
    const maxY = Math.max(...selected.map(f => f.y + f.height))
    updateFields(selected.map(f => ({ id: f.id, changes: { y: maxY - f.height } })))
  }, [getSelectedFields, updateFields])

  // Distribute Horizontally - evenly space selected elements
  const distributeH = useCallback(() => {
    const selected = getSelectedFields()
    if (selected.length < 3) return
    // Sort by x position
    const sorted = [...selected].sort((a, b) => a.x - b.x)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalWidth = sorted.reduce((sum, f) => sum + f.width, 0)
    const availableSpace = (last.x + last.width) - first.x - totalWidth
    const gap = availableSpace / (sorted.length - 1)
    let currentX = first.x + first.width + gap
    const updates = sorted.slice(1, -1).map(f => {
      const update = { id: f.id, changes: { x: currentX } }
      currentX += f.width + gap
      return update
    })
    updateFields(updates)
  }, [getSelectedFields, updateFields])

  // Distribute Vertically - evenly space selected elements
  const distributeV = useCallback(() => {
    const selected = getSelectedFields()
    if (selected.length < 3) return
    // Sort by y position
    const sorted = [...selected].sort((a, b) => a.y - b.y)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalHeight = sorted.reduce((sum, f) => sum + f.height, 0)
    const availableSpace = (last.y + last.height) - first.y - totalHeight
    const gap = availableSpace / (sorted.length - 1)
    let currentY = first.y + first.height + gap
    const updates = sorted.slice(1, -1).map(f => {
      const update = { id: f.id, changes: { y: currentY } }
      currentY += f.height + gap
      return update
    })
    updateFields(updates)
  }, [getSelectedFields, updateFields])

  return {
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignCenterV,
    alignBottom,
    distributeH,
    distributeV,
  }
}

