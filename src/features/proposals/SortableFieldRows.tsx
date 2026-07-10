'use client'

import type { ReactNode } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

const FIELD_ID_SEP = '::sf::'

export function sortableFieldRowDndId(blockId: string, itemId: string) {
  return `${blockId}${FIELD_ID_SEP}${itemId}`
}

function parseFieldRowDndId(dndId: string, blockId: string): string | null {
  const p = `${blockId}${FIELD_ID_SEP}`
  if (!dndId.startsWith(p)) return null
  return dndId.slice(p.length)
}

function SortableFieldRow({
  dndId,
  alignStart,
  children,
}: {
  dndId: string
  alignStart?: boolean
  children: (dragHandle: ReactNode) => ReactNode
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dndId,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  }
  const handle = (
    <button
      type="button"
      className={cn(
        'shrink-0 cursor-grab rounded p-1 text-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing',
        alignStart && 'mt-0.5',
      )}
      aria-label={t('proposals.dragToReorderField')}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={16} aria-hidden />
    </button>
  )
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex min-w-0 gap-2',
        alignStart ? 'items-start' : 'items-center',
      )}
    >
      {children(handle)}
    </div>
  )
}

export function SortableFieldRows({
  blockId,
  itemIds,
  onReorder,
  listLabel,
  alignStart,
  containerClassName,
  children,
}: {
  blockId: string
  itemIds: string[]
  onReorder: (next: string[]) => void
  listLabel: string
  alignStart?: boolean
  /** e.g. responsive KPI grid — default is a single column of rows */
  containerClassName?: string
  children: (itemId: string, dragHandle: ReactNode) => ReactNode
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeItem = parseFieldRowDndId(String(active.id), blockId)
    const overItem = parseFieldRowDndId(String(over.id), blockId)
    if (activeItem === null || overItem === null) return
    const oldIndex = itemIds.indexOf(activeItem)
    const newIndex = itemIds.indexOf(overItem)
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove(itemIds, oldIndex, newIndex))
  }

  const sortableIds = itemIds.map((id) => sortableFieldRowDndId(blockId, id))

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div
          className={cn('min-w-0 gap-2', containerClassName ?? 'grid')}
          role="list"
          aria-label={listLabel}
        >
          {itemIds.map((itemId) => (
            <SortableFieldRow
              key={itemId}
              dndId={sortableFieldRowDndId(blockId, itemId)}
              alignStart={alignStart}
            >
              {(handle) => children(itemId, handle)}
            </SortableFieldRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
