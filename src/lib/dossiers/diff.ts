import { DOSSIER_SECTION_KEYS, type DossierSectionKey } from './sections'
import type { DossierSections } from './schema'

export interface SectionsDiff {
  changedKeys: DossierSectionKey[]
  before: Partial<DossierSections>
  after: Partial<DossierSections>
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null || a === undefined || b === undefined) return a === b
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  if (typeof a === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)])
    for (const k of keys) {
      if (!deepEqual(aObj[k], bObj[k])) return false
    }
    return true
  }
  return false
}

/**
 * Returns the keys that differ between `prev` and `next`, plus before/after
 * snapshots restricted to those keys. Stored verbatim in `dossier_versions.diff`
 * so the audit log doesn't bloat with unchanged sections.
 */
export function computeSectionsDiff(
  prev: DossierSections | null | undefined,
  next: DossierSections,
): SectionsDiff {
  const changedKeys: DossierSectionKey[] = []
  const before: Partial<DossierSections> = {}
  const after: Partial<DossierSections> = {}

  for (const key of DOSSIER_SECTION_KEYS) {
    const prevValue = prev?.[key]
    const nextValue = next[key]
    if (!deepEqual(prevValue, nextValue)) {
      changedKeys.push(key)
      if (prevValue !== undefined) (before as Record<string, unknown>)[key] = prevValue
      if (nextValue !== undefined) (after as Record<string, unknown>)[key] = nextValue
    }
  }

  return { changedKeys, before, after }
}
