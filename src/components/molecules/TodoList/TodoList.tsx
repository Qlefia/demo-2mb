'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X, GripVertical, Check } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface TodoItem {
  id: string
  text: string
  completed: boolean
}

interface TodoListProps {
  items: TodoItem[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (id: string, text: string) => void
  onReorder: (items: TodoItem[]) => void
  placeholder?: string
}

function SortableTodoItem({
  item,
  onToggle,
  onRemove,
  onEdit,
}: {
  item: TodoItem
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (id: string, text: string) => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.text)
  const inputRef = useRef<HTMLInputElement>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const [prevText, setPrevText] = useState(item.text)
  if (item.text !== prevText) {
    setPrevText(item.text)
    setDraft(item.text)
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commitEdit = () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.text) onEdit(item.id, trimmed)
    else setDraft(item.text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') {
      setDraft(item.text)
      setEditing(false)
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-md border border-border bg-background px-2 py-2 text-xs transition-colors hover:border-border hover:bg-primary/2 ${
        item.completed ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab text-muted active:cursor-grabbing"
        aria-label={t('builder.dragToReorder')}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          item.completed
            ? 'border-primary bg-primary text-background'
            : 'border-input text-muted hover:border-primary hover:text-foreground'
        }`}
        aria-label={item.completed ? t('todo.markIncomplete') : t('todo.markComplete')}
      >
        {item.completed && <Check size={10} strokeWidth={2.5} />}
      </button>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 rounded border border-input bg-transparent px-1.5 py-0.5 text-xs outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`min-w-0 flex-1 text-left wrap-break-word ${item.completed ? 'line-through text-muted' : 'text-foreground'}`}
        >
          {item.text || t('common.empty')}
        </button>
      )}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="shrink-0 rounded p-1 text-muted opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
        aria-label={t('todo.remove')}
      >
        <X size={12} />
      </button>
    </li>
  )
}

export function TodoList({
  items,
  onAdd,
  onToggle,
  onRemove,
  onEdit,
  onReorder,
  placeholder,
}: TodoListProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const add = () => {
    const text = draft.trim()
    if (!text) return
    onAdd(text)
    setDraft('')
    inputRef.current?.focus()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = items.findIndex((i) => i.id === active.id)
    const toIndex = items.findIndex((i) => i.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    const next = [...items]
    const [removed] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, removed)
    onReorder(next)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeItems = items.filter((i) => !i.completed)
  const completedItems = items.filter((i) => i.completed)
  const activeIds = activeItems.map((i) => i.id)

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t('todo.addPlaceholder')}
          className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 py-1.5 text-xs outline-none placeholder:text-muted"
          aria-label={t('todo.newItem')}
        />
        <button
          type="button"
          onClick={add}
          className="flex shrink-0 items-center justify-center rounded-md border border-input px-2.5 text-muted transition-colors hover:bg-muted/30 hover:text-foreground"
          aria-label={t('common.add')}
        >
          <Plus size={14} />
        </button>
      </div>
      {activeItems.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={activeIds} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5">
              {activeItems.map((item) => (
                <SortableTodoItem
                  key={item.id}
                  item={item}
                  onToggle={onToggle}
                  onRemove={onRemove}
                  onEdit={onEdit}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {completedItems.length > 0 && (
        <div className="mt-3 border-t border-border pt-2">
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">
            {t('todo.doneTitle')}
          </h4>
          <ul className="space-y-1.5">
            {completedItems.map((item) => (
              <li
                key={item.id}
                className="group flex items-center gap-2 rounded-md border border-border bg-background px-2 py-2 text-xs opacity-70"
              >
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary bg-primary text-background"
                  aria-label={t('todo.markIncomplete')}
                >
                  <Check size={10} strokeWidth={2.5} />
                </button>
                <div className="min-w-0 flex-1 text-left text-muted line-through">
                  {item.text || t('common.empty')}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="shrink-0 rounded p-1 text-muted opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                  aria-label={t('todo.remove')}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
