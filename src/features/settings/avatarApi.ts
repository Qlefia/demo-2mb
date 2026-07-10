import type { MeResponse } from '@/stores/userStore'

export async function uploadUserAvatar(file: File): Promise<MeResponse & { avatarUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/me/avatar', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(json?.error ?? 'upload_failed')
  }

  return (await res.json()) as MeResponse & { avatarUrl: string }
}
