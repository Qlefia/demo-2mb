import type { DossierSections } from '@/lib/dossiers/schema'

/** Overlay AI draft onto existing sections (partial-overwrite per section). */
export function mergeAiDraftOver(base: DossierSections, draft: DossierSections): DossierSections {
  return {
    snapshot: { ...base.snapshot, ...draft.snapshot },
    what_they_do: { ...base.what_they_do, ...draft.what_they_do },
    signals: draft.signals ?? base.signals,
    decision_makers: draft.decision_makers ?? base.decision_makers,
    tech_clues: { ...base.tech_clues, ...draft.tech_clues },
    competitive: { ...base.competitive, ...draft.competitive },
    hooks: draft.hooks ?? base.hooks,
    cases: draft.cases ?? base.cases,
    risks: { ...base.risks, ...draft.risks },
    next_step: { ...base.next_step, ...draft.next_step },
  }
}
