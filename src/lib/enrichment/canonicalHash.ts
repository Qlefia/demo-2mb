import { createHash } from 'node:crypto'

function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sortKeys)
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(obj as object).sort()) {
    out[k] = sortKeys((obj as Record<string, unknown>)[k])
  }
  return out
}

export function canonicalJson(input: Record<string, unknown>): string {
  return JSON.stringify(sortKeys(input))
}

export function queryHash(provider: string, canonicalInput: Record<string, unknown>): string {
  return createHash('sha256').update(`${provider}:${canonicalJson(canonicalInput)}`).digest('hex')
}
