import { z } from 'zod'
import { TASK_STATUSES, type TaskStatus } from '@/lib/db/schema/enums'

export type { TaskStatus }

export const createTaskSchema = z
  .object({
    title: z.string().min(1).max(300),
    assigneeId: z.string().uuid(),
    dueAt: z.string().datetime().nullable().optional(),
    playbookId: z.string().uuid().nullable().optional(),
  })
  .strict()

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    assigneeId: z.string().uuid().optional(),
    dueAt: z.string().datetime().nullable().optional(),
    status: z.enum(TASK_STATUSES).optional(),
    playbookId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'no_fields' })

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

export interface TaskDTO {
  id: string
  prospectId: string | null
  assigneeId: string
  title: string
  status: TaskStatus
  dueAt: string | null
  playbookId: string | null
  createdAt: string
  completedAt: string | null
}
