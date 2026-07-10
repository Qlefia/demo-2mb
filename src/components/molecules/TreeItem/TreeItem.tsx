'use client'

import { useState, useRef, useEffect, type ReactNode, type KeyboardEvent } from 'react'
import { ChevronRight, GripVertical } from 'lucide-react'

interface TreeItemProps {
  label: string
  depth?: number
  active?: boolean
  collapsed?: boolean
  onToggle?: () => void
  onSelect?: () => void
  onRename?: (newLabel: string) => void
  count?: number
  suffix?: ReactNode
  dragHandleProps?: Record<string, unknown>
  hasChildren?: boolean
  className?: string
}

export function TreeItem({
  label,
  depth = 0,
  active = false,
  collapsed = false,
  onToggle,
  onSelect,
  onRename,
  count,
  suffix,
  dragHandleProps,
  hasChildren = false,
  className = '',
}: TreeItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commitRename = () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== label) {
      onRename?.(trimmed)
    } else {
      setDraft(label)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') {
      setDraft(label)
      setEditing(false)
    }
  }

  const handleDoubleClick = () => {
    if (!onRename) return
    setDraft(label)
    setEditing(true)
  }

  return (
    <div
      className={`group flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm transition-colors ${
        active ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-primary/5'
      } ${className}`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      {dragHandleProps && (
        <button type="button" className="shrink-0 cursor-grab text-muted active:cursor-grabbing" {...dragHandleProps}>
          <GripVertical size={14} strokeWidth={1.5} />
        </button>
      )}
      {hasChildren && (
        <button type="button" onClick={onToggle} className="shrink-0 text-muted">
          <ChevronRight
            size={14}
            strokeWidth={1.5}
            className={`transition-transform ${collapsed ? '' : 'rotate-90'}`}
          />
        </button>
      )}
      {count !== undefined && (
        <span className="shrink-0 text-xs text-muted">{count}</span>
      )}

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 rounded-sm border border-input bg-transparent px-1 py-0 text-sm outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          onDoubleClick={handleDoubleClick}
          className="min-w-0 flex-1 truncate text-left"
        >
          {label}
        </button>
      )}

      {suffix && <span className="shrink-0">{suffix}</span>}
    </div>
  )
}
