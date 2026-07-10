'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/components/molecules/Toast'
import { useUserStore } from '@/stores/userStore'
import type { AssignableOwner } from '@/lib/team/types'
import { TasksList } from './TasksList'
import type { TaskDTO, TaskFormValues, TaskStatus } from './types'

interface TasksPanelProps {
  prospectId: string
  territory?: 'DE' | 'UK' | 'EU_other' | null
}

const PRIVILEGED_ROLES = new Set(['founder', 'ops', 'admin'])

export function TasksPanel({ prospectId, territory }: TasksPanelProps) {
  const { t } = useTranslation()
  const role = useUserStore((s) => s.role)
  const userId = useUserStore((s) => s.user.id || null)
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [owners, setOwners] = useState<AssignableOwner[]>([])

  const isPrivileged = role !== null && PRIVILEGED_ROLES.has(role)

  // Load the assignable-owner roster once per territory so we can resolve
  // assignee IDs to display names on each row (Audit P1 #15).
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (territory === 'DE' || territory === 'UK') params.set('territory', territory)
    void fetch(`/api/team/assignable-owners?${params.toString()}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { owners: [] }))
      .then((data: { owners?: AssignableOwner[] }) => {
        if (!cancelled) setOwners(data.owners ?? [])
      })
      .catch(() => {
        if (!cancelled) setOwners([])
      })
    return () => {
      cancelled = true
    }
  }, [territory])

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/tasks?limit=200`, {
        credentials: 'include',
      })
      if (!res.ok) {
        setTasks([])
        return
      }
      const data = (await res.json()) as { items: TaskDTO[] }
      setTasks(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [prospectId])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleCreate = useCallback(
    async (values: TaskFormValues): Promise<TaskDTO | null> => {
      const res = await fetch(`/api/prospects/${prospectId}/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          assigneeId: values.assigneeId,
          dueAt: values.dueAt,
        }),
      })
      if (!res.ok) {
        toast(t('tasks.errors.create_failed'), 'error')
        return null
      }
      const data = (await res.json()) as { task: TaskDTO }
      setTasks((arr) => [data.task, ...arr])
      return data.task
    },
    [prospectId, t],
  )

  const handleUpdate = useCallback(
    async (
      id: string,
      patch: Partial<TaskFormValues> & { status?: TaskStatus },
    ): Promise<TaskDTO | null> => {
      const body: Record<string, unknown> = {}
      if (patch.title !== undefined) body.title = patch.title
      if (patch.assigneeId !== undefined) body.assigneeId = patch.assigneeId
      if (patch.dueAt !== undefined) body.dueAt = patch.dueAt
      if (patch.status !== undefined) body.status = patch.status
      if (Object.keys(body).length === 0) return null

      const res = await fetch(`/api/prospects/${prospectId}/tasks/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        toast(t('tasks.errors.update_failed'), 'error')
        return null
      }
      const data = (await res.json()) as { task: TaskDTO }
      setTasks((arr) => arr.map((tk) => (tk.id === id ? data.task : tk)))
      return data.task
    },
    [prospectId, t],
  )

  const handleDelete = useCallback(
    async (id: string): Promise<boolean> => {
      const res = await fetch(`/api/prospects/${prospectId}/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        toast(t('tasks.errors.delete_failed'), 'error')
        return false
      }
      setTasks((arr) => arr.filter((tk) => tk.id !== id))
      return true
    },
    [prospectId, t],
  )

  return (
    <TasksList
      tasks={tasks}
      loading={loading}
      currentUserId={userId}
      isPrivilegedActor={isPrivileged}
      territory={territory}
      owners={owners}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  )
}
