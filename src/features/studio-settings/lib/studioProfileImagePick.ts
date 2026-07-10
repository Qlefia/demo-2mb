'use client'

import type { TFunction } from 'i18next'
import { toast } from '@/components/molecules/Toast'
import { STUDIO_IMAGE_UPLOAD_MAX_BYTES } from '@/features/studio-settings/constants'
import { isWorkspaceStudioStorageUrl } from '@/features/studio-settings/lib/studioMediaUrl'

/** Upload studio image to Supabase Storage; returns a stable public HTTPS URL. */
export async function pickStudioProfileImageUrl(
  file: File,
  t: TFunction,
  replaceUrl?: string | null,
): Promise<string | null> {
  if (file.size > STUDIO_IMAGE_UPLOAD_MAX_BYTES) {
    toast(t('studioSettings.images.inputTooLarge'), 'error')
    return null
  }

  const fd = new FormData()
  fd.append('file', file)
  if (replaceUrl && isWorkspaceStudioStorageUrl(replaceUrl)) {
    fd.append('replaceUrl', replaceUrl)
  }

  const res = await fetch('/api/workspace/studio-settings/upload-image', {
    method: 'POST',
    body: fd,
    credentials: 'include',
  })

  if (!res.ok) {
    toast(t('studioSettings.images.encodeFailed'), 'error')
    return null
  }

  const data = (await res.json()) as { url?: string }
  if (!data.url) {
    toast(t('studioSettings.images.encodeFailed'), 'error')
    return null
  }
  return data.url
}

/** Removes a previously uploaded workspace-studio object when the user clears the field. */
export async function removeStudioProfileImageUrl(url: string | null | undefined): Promise<void> {
  if (!url || !isWorkspaceStudioStorageUrl(url)) return
  await fetch('/api/workspace/studio-settings/upload-image', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
}

/** @deprecated Use {@link pickStudioProfileImageUrl} — kept for gradual migration. */
export async function pickStudioProfileImageDataUrl(
  file: File,
  t: TFunction,
  _tier?: 'standard' | 'compact',
  replaceUrl?: string | null,
): Promise<string | null> {
  return pickStudioProfileImageUrl(file, t, replaceUrl)
}
