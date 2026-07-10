import type { DossierSections } from '@/lib/dossiers/schema'
import { extractAllowedUrlHints } from '@/lib/ai/groundingAllowlist'

const URL_RE = /https?:\/\/[^\s)'"<>\]]+/gi

function urlAllowed(url: string, allowed: Set<string>): boolean {
  const cleaned = url.replace(/[.,;:!?)]+$/, '')
  if (allowed.has(cleaned)) return true
  try {
    const u = new URL(cleaned)
    if (allowed.has(u.hostname) || allowed.has(u.origin)) return true
  } catch {
    /* ignore */
  }
  return [...allowed].some((a) => a.length > 8 && cleaned.includes(a))
}

function scrubString(s: string, allowed: Set<string>): string {
  let out = s
  for (const m of s.matchAll(URL_RE)) {
    const raw = m[0]
    if (!urlAllowed(raw, allowed)) {
      out = out.split(raw).join('')
    }
  }
  return out.replace(/\s{2,}/g, ' ').trim()
}

/**
 * Remove URL tokens from sections that are not present in the grounding blob.
 * Phase 5 scope: URL anti-fabrication; numeric/name checks can extend later.
 */
export function stripUngroundedUrls(sections: DossierSections, groundingBlob: string): DossierSections {
  const allowed = extractAllowedUrlHints(groundingBlob)
  const clone = structuredClone(sections) as DossierSections

  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return scrubString(v, allowed)
    if (Array.isArray(v)) return v.map((x) => walk(x))
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      const out: Record<string, unknown> = {}
      for (const [k, val] of Object.entries(o)) {
        out[k] = walk(val)
      }
      return out
    }
    return v
  }

  return walk(clone) as DossierSections
}

/**
 * Collect distinct http(s) tokens in section strings that are not allowed by the grounding blob.
 */
export function findUngroundedUrlsFromSections(
  sections: DossierSections,
  groundingBlob: string,
): string[] {
  const allowed = extractAllowedUrlHints(groundingBlob)
  const found = new Set<string>()

  const walk = (v: unknown): void => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(URL_RE)) {
        const raw = m[0]
        if (!urlAllowed(raw, allowed)) {
          found.add(raw.replace(/[.,;:!?)]+$/, ''))
        }
      }
    } else if (Array.isArray(v)) {
      for (const x of v) walk(x)
    } else if (v && typeof v === 'object') {
      for (const val of Object.values(v as Record<string, unknown>)) walk(val)
    }
  }

  walk(sections as unknown)
  return [...found]
}
