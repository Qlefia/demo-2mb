'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { cn } from '@/lib/cn'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useProspectStore } from '@/stores/prospectStore'
import { useUserStore } from '@/stores/userStore'
import type { Prospect } from './types'
import type { ProspectStage } from '@/lib/db/schema/enums'
import { PROSPECT_STAGES } from '@/lib/db/schema/enums'
import { STAGE_META, STAGE_META_BY_ID } from './stageMeta'
import { ProspectCard } from './ProspectCard'
import { canTransition, type PipelineRole } from '@/lib/pipeline/transitions'
import { useChangeProspectStageMutation } from './api'
import { useProspectsQuery } from './api/useProspectsQuery'

const STAGE_ID_SET = new Set<string>(PROSPECT_STAGES)

function resolveDropStage(overId: string, prospects: Prospect[]): ProspectStage | null {
  if (STAGE_ID_SET.has(overId)) return overId as ProspectStage
  return prospects.find((p) => p.id === overId)?.stage ?? null
}

interface ProspectKanbanProps {
  prospects: Prospect[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  enableDrag?: boolean
}

export function ProspectKanban({
  prospects,
  selectedId,
  onSelect,
  enableDrag = true,
}: ProspectKanbanProps) {
  const { t } = useTranslation()
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')
  const dragEnabled = enableDrag && !isCoarsePointer
  const role = useUserStore((s) => s.role) as PipelineRole
  const changeStage = useChangeProspectStageMutation()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const grouped = useMemo(() => {
    const map = new Map<ProspectStage, Prospect[]>()
    for (const meta of STAGE_META) map.set(meta.id, [])
    for (const p of prospects) map.get(p.stage)?.push(p)
    return map
  }, [prospects])

  const activeProspect = activeId ? prospects.find((p) => p.id === activeId) ?? null : null

  const allowedTargets = useMemo(() => {
    if (!activeProspect) return new Set<ProspectStage>()
    const targets = new Set<ProspectStage>()
    for (const meta of STAGE_META) {
      const verdict = canTransition({
        role,
        fromStage: activeProspect.stage,
        toStage: meta.id,
        dossierStatus: activeProspect.dossierStatus,
      })
      if (verdict.ok) targets.add(meta.id)
    }
    return targets
  }, [activeProspect, role])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
    setErrorMsg(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const id = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : null
    setActiveId(null)
    if (!overId) return

    const prospect = prospects.find((p) => p.id === id)
    if (!prospect) return
    const newStage = resolveDropStage(overId, prospects)
    if (!newStage || newStage === prospect.stage) return

    const verdict = canTransition({
      role,
      fromStage: prospect.stage,
      toStage: newStage,
      dossierStatus: prospect.dossierStatus,
    })
    if (!verdict.ok) {
      setErrorMsg(t(verdict.reasonKey))
      return
    }

    changeStage.mutate(
      { prospectId: id, fromStage: prospect.stage, toStage: newStage },
      {
        onSuccess: () => setErrorMsg(null),
        onError: (err) => {
          const payload = err.payload as { reason?: string } | null
          setErrorMsg(t(payload?.reason ?? 'pipeline.errors.invalidTransition'))
        },
      },
    )
  }

  const kanbanScroll = (
    <div className="flex min-w-0 gap-3 overflow-x-auto overscroll-x-contain touch-pan-x pb-2 [-webkit-overflow-scrolling:touch] lg:min-h-0 lg:flex-1">
      {STAGE_META.map((meta) => {
        const items = grouped.get(meta.id) ?? []
        const isAllowedTarget = activeProspect ? allowedTargets.has(meta.id) : true
        return (
          <KanbanColumn
            key={meta.id}
            stage={meta.id}
            accentClass={meta.accentClass}
            label={t(meta.labelKey)}
            count={items.length}
            emptyLabel={t('prospects.emptyColumn')}
            dimmed={Boolean(activeProspect) && !isAllowedTarget}
            droppable={dragEnabled}
          >
            {items.map((p) =>
              dragEnabled ? (
                <div key={p.id} className="p-1">
                  <DraggableProspectCard
                    prospect={p}
                    selected={selectedId === p.id}
                    onSelect={() => onSelect(p.id === selectedId ? null : p.id)}
                  />
                </div>
              ) : (
                <div key={p.id} className="p-1">
                  <ProspectCard
                    prospect={p}
                    selected={selectedId === p.id}
                    onSelect={() => onSelect(p.id === selectedId ? null : p.id)}
                  />
                </div>
              ),
            )}
          </KanbanColumn>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col gap-2 max-lg:min-h-0 lg:min-h-0 lg:flex-1">
      {errorMsg && (
        <div
          role="alert"
          className="shrink-0 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {errorMsg}
        </div>
      )}

      {dragEnabled ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {kanbanScroll}
          <DragOverlay>
            {activeProspect ? (
              <div className="opacity-90">
                <ProspectCard prospect={activeProspect} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        kanbanScroll
      )}
    </div>
  )
}

interface KanbanColumnProps {
  stage: ProspectStage
  accentClass: string
  label: string
  count: number
  emptyLabel: string
  dimmed: boolean
  droppable?: boolean
  children: React.ReactNode
}

function KanbanColumnFrame({
  accentClass,
  label,
  count,
  emptyLabel,
  dimmed,
  isOver,
  sectionRef,
  children,
}: {
  accentClass: string
  label: string
  count: number
  emptyLabel: string
  dimmed: boolean
  isOver: boolean
  sectionRef?: (node: HTMLElement | null) => void
  children: React.ReactNode
}) {
  return (
    <section
      ref={sectionRef}
      className={cn(
        'flex w-64 shrink-0 flex-col rounded-sm border border-border bg-primary/2 transition-colors',
        'lg:h-full lg:max-h-full lg:min-h-0',
        isOver && !dimmed && 'border-foreground/40 bg-primary/10',
        dimmed && 'opacity-40',
      )}
      aria-label={label}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', accentClass)} />
          <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
        </div>
        <span className="text-xs tabular-nums text-muted">{count}</span>
      </header>
      <div className="flex flex-col gap-2 p-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
        {count === 0 ? <p className="px-1 py-2 text-xs text-muted">{emptyLabel}</p> : children}
      </div>
    </section>
  )
}

function DroppableKanbanColumn({
  stage,
  accentClass,
  label,
  count,
  emptyLabel,
  dimmed,
  children,
}: Omit<KanbanColumnProps, 'droppable'>) {
  const { isOver, setNodeRef } = useDroppable({ id: stage })
  return (
    <KanbanColumnFrame
      accentClass={accentClass}
      label={label}
      count={count}
      emptyLabel={emptyLabel}
      dimmed={dimmed}
      isOver={isOver}
      sectionRef={setNodeRef}
    >
      {children}
    </KanbanColumnFrame>
  )
}

function KanbanColumn({ droppable = true, stage, ...rest }: KanbanColumnProps) {
  if (droppable) {
    return <DroppableKanbanColumn stage={stage} {...rest} />
  }
  return <KanbanColumnFrame {...rest} isOver={false} />
}

interface DraggableProspectCardProps {
  prospect: Prospect
  selected: boolean
  onSelect: () => void
}

function DraggableProspectCard({ prospect, selected, onSelect }: DraggableProspectCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: prospect.id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
    >
      <ProspectCard
        prospect={prospect}
        selected={selected}
        onSelect={() => onSelect()}
      />
    </div>
  )
}

export function ProspectKanbanContainer() {
  const { data: prospects = [] } = useProspectsQuery()
  const selectedId = useProspectStore((s) => s.selectedProspectId)
  const setSelectedId = useProspectStore((s) => s.setSelectedProspectId)
  return <ProspectKanban prospects={prospects} selectedId={selectedId} onSelect={setSelectedId} />
}

// Re-export STAGE_META for backwards compat where this module was the source.
export { STAGE_META, STAGE_META_BY_ID }
