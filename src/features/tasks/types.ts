import type { TaskDTO, TaskStatus } from '@/lib/tasks/schema'

export type { TaskDTO, TaskStatus }

export interface TaskFormValues {
  title: string
  assigneeId: string
  dueAt: string | null
}

export const EMPTY_TASK_FORM: TaskFormValues = {
  title: '',
  assigneeId: '',
  dueAt: null,
}
