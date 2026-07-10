import type { DossierSections } from './schema'
import {
  DOSSIER_HOOK_MIN_CHARS,
  DOSSIER_HOOK_REQUIRED_COUNT,
  DOSSIER_SIGNAL_MAX_AGE_DAYS,
} from './constants'
import { DOSSIER_SECTION_KEYS } from './sections'
import { findUngroundedUrlsFromSections } from './ungrounded'

/**
 * Quality rules for “Mark ready”.
 *
 * For AI-generated drafts, {@link import('@/lib/dossiers/ungrounded').stripUngroundedUrls}
 * removes out-of-grounding URLs before save (Phase 5).
 *
 * - **manual** (default): human baseline per ROADMAP Phase 2. Section 8 = three
 *   hand-filled case slots (`checkCases`).
 * - **ai** (reserved, Phase 5+): dossier.mdc also calls for cosine similarity on
 *   Section 8 and AI metadata on the row — enforced by the generator + future
 *   `validateDossier` branches, not manual entry.
 *
 * dossier.mdc checklist items tied to enrichment + pgvector remain out of scope
 * here until those phases ship.
 */
export type DossierValidationMode = 'manual' | 'ai'

export type QualityFailureCode =
  | 'section_empty'
  | 'no_recent_signal'
  | 'no_contact_method'
  | 'hooks_count_or_length'
  | 'cases_incomplete'
  | 'ungrounded_urls'

export interface QualityFailure {
  code: QualityFailureCode
  sectionId?: number
  messageKey: string
}

export type QualityCheckCode =
  | 'all_sections_filled'
  | 'recent_signal'
  | 'contact_method'
  | 'hooks_3_meaningful'
  | 'cases_complete'
  | 'grounded_urls'

export type QualityCheckStatus = 'passed' | 'failed' | 'pending'

export interface QualityCheck {
  code: QualityCheckCode
  status: QualityCheckStatus
  messageKey: string
  sectionId?: number
}

export interface QualityResult {
  passed: boolean
  failures: QualityFailure[]
  checks: QualityCheck[]
}

interface ValidateOptions {
  /**
   * Defaults to `manual`. When `ai` ships end-to-end, extend this module for
   * dossier.mdc items 5–6 (vector similarity, `ai_metadata` presence) without
   * blocking the manual authoring path.
   */
  mode?: DossierValidationMode
  /**
   * Resolved from CRM contacts tied to Section 4. `'pending'` means IDs are missing
   * or rows are unresolved — failures still block Mark ready but use a softer message key.
   */
  hasContactMethod?: boolean | 'pending'
  /**
   * When set (e.g. after AI draft or QA), any http(s) URL in sections not
   * derivable from this blob fails validation with `ungrounded_urls`.
   */
  groundingSnapshot?: string
}

function isEmptySection(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every((v) => isEmptySection(v))
  }
  return false
}

function checkAllSectionsFilled(sections: DossierSections): {
  ok: boolean
  emptyIds: number[]
} {
  const emptyIds: number[] = []
  for (let i = 0; i < DOSSIER_SECTION_KEYS.length; i++) {
    const key = DOSSIER_SECTION_KEYS[i]
    const value = sections[key]
    if (isEmptySection(value)) emptyIds.push(i + 1)
  }
  return { ok: emptyIds.length === 0, emptyIds }
}

function checkRecentSignal(sections: DossierSections): boolean {
  const items = sections.signals?.items ?? []
  const cutoff =
    Date.now() - DOSSIER_SIGNAL_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  return items.some((s) => {
    if (!s.sourceUrl) return false
    if (!s.occurredAt) return false
    const ts = Date.parse(s.occurredAt)
    if (Number.isNaN(ts)) return false
    return ts >= cutoff
  })
}

function checkHooks(sections: DossierSections): boolean {
  const items = sections.hooks?.items ?? []
  if (items.length !== DOSSIER_HOOK_REQUIRED_COUNT) return false
  const unique = new Set(items.map((h) => h.trim().toLowerCase()))
  if (unique.size !== DOSSIER_HOOK_REQUIRED_COUNT) return false
  return items.every((h) => h.trim().length >= DOSSIER_HOOK_MIN_CHARS)
}

function checkCases(sections: DossierSections): boolean {
  const items = sections.cases?.items ?? []
  if (items.length !== 3) return false
  return items.every(
    (c) =>
      typeof c.name === 'string' &&
      c.name.trim().length > 0 &&
      typeof c.why === 'string' &&
      c.why.trim().length > 0,
  )
}

export function validateDossier(
  sections: DossierSections,
  opts: ValidateOptions = {},
): QualityResult {
  const failures: QualityFailure[] = []
  const checks: QualityCheck[] = []

  const sectionsCheck = checkAllSectionsFilled(sections)
  if (!sectionsCheck.ok) {
    for (const sectionId of sectionsCheck.emptyIds) {
      failures.push({
        code: 'section_empty',
        sectionId,
        messageKey: 'dossier.checklist.failures.section_empty',
      })
    }
  }
  checks.push({
    code: 'all_sections_filled',
    status: sectionsCheck.ok ? 'passed' : 'failed',
    messageKey: 'dossier.checklist.checks.all_sections_filled',
  })

  const signalOk = checkRecentSignal(sections)
  if (!signalOk) {
    failures.push({
      code: 'no_recent_signal',
      sectionId: 3,
      messageKey: 'dossier.checklist.failures.no_recent_signal',
    })
  }
  checks.push({
    code: 'recent_signal',
    status: signalOk ? 'passed' : 'failed',
    messageKey: 'dossier.checklist.checks.recent_signal',
    sectionId: 3,
  })

  const hasContactMethod = opts.hasContactMethod
  if (hasContactMethod === 'pending') {
    checks.push({
      code: 'contact_method',
      status: 'pending',
      messageKey: 'dossier.checklist.checks.contact_method',
      sectionId: 4,
    })
    failures.push({
      code: 'no_contact_method',
      sectionId: 4,
      messageKey: 'dossier.checklist.failures.no_contact_method_pending',
    })
  } else {
    const ok = hasContactMethod === true
    if (!ok) {
      failures.push({
        code: 'no_contact_method',
        sectionId: 4,
        messageKey: 'dossier.checklist.failures.no_contact_method',
      })
    }
    checks.push({
      code: 'contact_method',
      status: ok ? 'passed' : 'failed',
      messageKey: 'dossier.checklist.checks.contact_method',
      sectionId: 4,
    })
  }

  const hooksOk = checkHooks(sections)
  if (!hooksOk) {
    failures.push({
      code: 'hooks_count_or_length',
      sectionId: 7,
      messageKey: 'dossier.checklist.failures.hooks_count_or_length',
    })
  }
  checks.push({
    code: 'hooks_3_meaningful',
    status: hooksOk ? 'passed' : 'failed',
    messageKey: 'dossier.checklist.checks.hooks_3_meaningful',
    sectionId: 7,
  })

  const casesOk = checkCases(sections)
  if (!casesOk) {
    failures.push({
      code: 'cases_incomplete',
      sectionId: 8,
      messageKey: 'dossier.checklist.failures.cases_incomplete',
    })
  }
  checks.push({
    code: 'cases_complete',
    status: casesOk ? 'passed' : 'failed',
    messageKey: 'dossier.checklist.checks.cases_complete',
    sectionId: 8,
  })

  let groundedOk = true
  if (opts.groundingSnapshot != null && opts.groundingSnapshot.length > 0) {
    const badUrls = findUngroundedUrlsFromSections(sections, opts.groundingSnapshot)
    groundedOk = badUrls.length === 0
    if (!groundedOk) {
      failures.push({
        code: 'ungrounded_urls',
        messageKey: 'dossier.checklist.failures.ungrounded_urls',
      })
    }
    checks.push({
      code: 'grounded_urls',
      status: groundedOk ? 'passed' : 'failed',
      messageKey: 'dossier.checklist.checks.grounded_urls',
    })
  }

  const passed = checks.every((c) => c.status === 'passed')
  return { passed, failures, checks }
}
