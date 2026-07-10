export const playbooksListQueryKey = ['playbooks', 'list'] as const

export function playbookDetailQueryKey(id: string) {
  return ['playbooks', 'detail', id] as const
}
