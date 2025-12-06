'use client'

import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronUp, ChevronDown, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TemplateField } from './types'
import { cn } from '@/lib/utils'

interface DraggableFieldListProps {
  fields: TemplateField[]
  selectedFieldId: string | null
  onSelect: (id: string) => void
  onReorder: (fields: TemplateField[]) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
}

interface SortableFieldItemProps {
  field: TemplateField
  isSelected: boolean
  onSelect: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  isFirst: boolean
  isLast: boolean
}

function SortableFieldItem({ field, isSelected, onSelect, onMoveUp, onMoveDown, onDuplicate, onDelete, isFirst, isLast }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group p-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2',
        isSelected ? 'bg-blue-600/20 border border-blue-500' : 'bg-gray-800/50 hover:bg-gray-800',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Field Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{field.fieldLabel}</span>
          <span className="text-xs text-gray-400 capitalize ml-2">{field.fieldType}</span>
        </div>
      </div>

      {/* Action Buttons - Show on hover or when selected */}
      <div className={cn(
        'flex items-center gap-0.5 transition-opacity',
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700"
          onClick={(e) => { e.stopPropagation(); onMoveUp?.() }}
          disabled={isFirst}
          title="Move Up"
        >
          <ChevronUp className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700"
          onClick={(e) => { e.stopPropagation(); onMoveDown?.() }}
          disabled={isLast}
          title="Move Down"
        >
          <ChevronDown className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700"
          onClick={(e) => { e.stopPropagation(); onDuplicate?.() }}
          title="Duplicate"
        >
          <Copy className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-gray-700"
          onClick={(e) => { e.stopPropagation(); onDelete?.() }}
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

export default function DraggableFieldList({
  fields,
  selectedFieldId,
  onSelect,
  onReorder,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: DraggableFieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id)
      const newIndex = fields.findIndex(f => f.id === over.id)
      const newFields = arrayMove(fields, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }))
      onReorder(newFields)
    }
  }

  if (fields.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No fields yet. Use the toolbar to add fields.</p>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <SortableFieldItem
              key={field.id}
              field={field}
              isSelected={selectedFieldId === field.id}
              onSelect={() => onSelect(field.id)}
              onMoveUp={onMoveUp ? () => onMoveUp(field.id) : undefined}
              onMoveDown={onMoveDown ? () => onMoveDown(field.id) : undefined}
              onDuplicate={onDuplicate ? () => onDuplicate(field.id) : undefined}
              onDelete={onDelete ? () => onDelete(field.id) : undefined}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

