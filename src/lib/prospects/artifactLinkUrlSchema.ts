import { z } from 'zod'
import { tryNormalizeExternalUrl } from '@/lib/urls/normalizeExternalUrl'

function coerceArtifactLinkUrl(value: unknown): unknown {
  if (value === undefined || value === null) return value
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return ''
  return tryNormalizeExternalUrl(trimmed) ?? trimmed
}

export const artifactLinkUrlSchema = z.preprocess(
  coerceArtifactLinkUrl,
  z.union([z.string().url().max(2000), z.literal(''), z.null()]).optional(),
)
