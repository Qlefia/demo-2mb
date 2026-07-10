'use client'

import {
  STUDIO_IMAGE_MAX_EDGE_PX,
  STUDIO_IMAGE_UPLOAD_MAX_BYTES,
  STUDIO_PROFILE_COMPACT_IMAGE_BYTES,
  STUDIO_PROFILE_COMPACT_MAX_EDGE_PX,
  STUDIO_PROFILE_MAX_IMAGE_BYTES,
} from '@/features/studio-settings/constants'

export type StudioProfileImageEncodeTier = 'standard' | 'compact'

const ENCODE_TIER_LIMITS: Record<
  StudioProfileImageEncodeTier,
  { maxBytes: number; maxEdge: number }
> = {
  standard: { maxBytes: STUDIO_PROFILE_MAX_IMAGE_BYTES, maxEdge: STUDIO_IMAGE_MAX_EDGE_PX },
  compact: { maxBytes: STUDIO_PROFILE_COMPACT_IMAGE_BYTES, maxEdge: STUDIO_PROFILE_COMPACT_MAX_EDGE_PX },
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|heic|heif|bmp|svg|tiff?)$/i

function looksLikeImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return IMAGE_EXT.test(file.name)
}

function dataUrlStorageBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(',')
  if (i < 0) return Number.POSITIVE_INFINITY
  const payload = dataUrl.slice(i + 1)
  let padding = 0
  if (payload.endsWith('==')) padding = 2
  else if (payload.endsWith('=')) padding = 1
  return Math.floor((payload.length * 3) / 4) - padding
}

function naturalSize(source: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  if (source instanceof HTMLImageElement) {
    return { w: source.naturalWidth, h: source.naturalHeight }
  }
  return { w: source.width, h: source.height }
}

async function loadRasterFromFile(
  file: File,
): Promise<{ kind: 'bitmap'; bitmap: ImageBitmap } | { kind: 'img'; image: HTMLImageElement; revoke: () => void }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
    return { kind: 'bitmap', bitmap }
  } catch {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('img_decode'))
      image.src = url
    })
    return {
      kind: 'img',
      image,
      revoke: () => URL.revokeObjectURL(url),
    }
  }
}

function drawToCanvas(source: CanvasImageSource, maxEdge: number): HTMLCanvasElement | null {
  const sw =
    source instanceof HTMLImageElement
      ? source.naturalWidth
      : source instanceof ImageBitmap
        ? source.width
        : 0
  const sh =
    source instanceof HTMLImageElement
      ? source.naturalHeight
      : source instanceof ImageBitmap
        ? source.height
        : 0
  if (sw < 1 || sh < 1) return null
  const scale = Math.min(1, maxEdge / Math.max(sw, sh))
  const dw = Math.max(1, Math.round(sw * scale))
  const dh = Math.max(1, Math.round(sh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = dw
  canvas.height = dh
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(source, 0, 0, dw, dh)
  return canvas
}

function tryEncodeCanvasWithinBudget(canvas: HTMLCanvasElement, maxBytes: number): string | null {
  for (let q = 0.9; q >= 0.42; q -= 0.06) {
    let dataUrl = canvas.toDataURL('image/webp', q)
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', Math.min(0.92, q + 0.06))
    }
    if (dataUrlStorageBytes(dataUrl) <= maxBytes) return dataUrl
  }
  return null
}

async function rasterToProfileDataUrl(
  source: ImageBitmap | HTMLImageElement,
  limits: { maxBytes: number; maxEdge: number },
): Promise<string | null> {
  const { w, h } = naturalSize(source)
  if (w < 1 || h < 1) return null
  let maxEdge = limits.maxEdge
  while (maxEdge >= 480) {
    const canvas = drawToCanvas(source, maxEdge)
    if (!canvas) return null
    const encoded = tryEncodeCanvasWithinBudget(canvas, limits.maxBytes)
    if (encoded) return encoded
    maxEdge = Math.floor(maxEdge * 0.82)
  }
  return null
}

/**
 * Resize (longest edge up to {@link STUDIO_IMAGE_MAX_EDGE_PX}), encode WebP (JPEG fallback), enforce
 * {@link STUDIO_PROFILE_MAX_IMAGE_BYTES} for localStorage. Accepts files up to {@link STUDIO_IMAGE_UPLOAD_MAX_BYTES}.
 */
export async function tryEncodeStudioProfileImageFromFile(
  file: File,
  tier: StudioProfileImageEncodeTier = 'standard',
): Promise<string | null> {
  if (file.size > STUDIO_IMAGE_UPLOAD_MAX_BYTES) return null
  if (!looksLikeImageFile(file)) return null
  const limits = ENCODE_TIER_LIMITS[tier]
  let bitmap: ImageBitmap | undefined
  let revoke: (() => void) | undefined
  try {
    const loaded = await loadRasterFromFile(file)
    if (loaded.kind === 'bitmap') {
      bitmap = loaded.bitmap
      return await rasterToProfileDataUrl(loaded.bitmap, limits)
    }
    revoke = loaded.revoke
    return await rasterToProfileDataUrl(loaded.image, limits)
  } catch {
    return null
  } finally {
    bitmap?.close()
    revoke?.()
  }
}
