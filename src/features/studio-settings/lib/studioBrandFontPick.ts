'use client'

import type { TFunction } from 'i18next'
import { toast } from '@/components/molecules/Toast'
import { STUDIO_FONT_UPLOAD_MAX_BYTES } from '@/features/studio-settings/constants'

const FONT_EXT_RE = /\.(ttf|otf|woff2?)$/i

const FONT_MIME_PREFIXES = ['font/', 'application/font', 'application/x-font']

function isFontFile(file: File): boolean {
  if (FONT_EXT_RE.test(file.name)) return true
  return FONT_MIME_PREFIXES.some((p) => file.type.startsWith(p))
}

function familyFromFilename(name: string): string {
  return name.replace(FONT_EXT_RE, '').replace(/[-_]+/g, ' ').trim().slice(0, 120)
}

export async function pickStudioBrandFontDataUrl(
  file: File,
  t: TFunction,
): Promise<{ dataUrl: string; family: string } | null> {
  if (!isFontFile(file)) {
    toast(t('studioSettings.brandKit.fontUploadInvalid'), 'error')
    return null
  }
  if (file.size > STUDIO_FONT_UPLOAD_MAX_BYTES) {
    toast(t('studioSettings.brandKit.fontUploadTooLarge'), 'error')
    return null
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      if (!dataUrl) {
        toast(t('studioSettings.brandKit.fontUploadFailed'), 'error')
        resolve(null)
        return
      }
      resolve({ dataUrl, family: familyFromFilename(file.name) || 'Custom font' })
    }
    reader.onerror = () => {
      toast(t('studioSettings.brandKit.fontUploadFailed'), 'error')
      resolve(null)
    }
    reader.readAsDataURL(file)
  })
}
