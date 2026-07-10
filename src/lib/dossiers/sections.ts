/**
 * 10-section Dossier shape — the source of truth shared by:
 * - Zod schema (`schema.ts`)
 * - Quality validator (`validate.ts`)
 * - UI editor renderer (`src/features/dossiers/sections/Section{1..10}.tsx`)
 * - Versioning diff (`diff.ts`)
 *
 * Section 4 (decision_makers) lives partly in the JSONB blob (contactIds + notes)
 * and partly in the normalized `contacts` table. See `.cursor/rules/dossier.mdc`.
 */

export const DOSSIER_SECTION_KEYS = [
  'snapshot',
  'what_they_do',
  'signals',
  'decision_makers',
  'tech_clues',
  'competitive',
  'hooks',
  'cases',
  'risks',
  'next_step',
] as const

export type DossierSectionKey = (typeof DOSSIER_SECTION_KEYS)[number]

export interface DossierSectionMeta {
  id: number
  key: DossierSectionKey
  labelKey: string
  helpKey: string
}

export const DOSSIER_SECTIONS: readonly DossierSectionMeta[] = [
  { id: 1, key: 'snapshot', labelKey: 'dossier.sections.snapshot.label', helpKey: 'dossier.sections.snapshot.help' },
  { id: 2, key: 'what_they_do', labelKey: 'dossier.sections.what_they_do.label', helpKey: 'dossier.sections.what_they_do.help' },
  { id: 3, key: 'signals', labelKey: 'dossier.sections.signals.label', helpKey: 'dossier.sections.signals.help' },
  { id: 4, key: 'decision_makers', labelKey: 'dossier.sections.decision_makers.label', helpKey: 'dossier.sections.decision_makers.help' },
  { id: 5, key: 'tech_clues', labelKey: 'dossier.sections.tech_clues.label', helpKey: 'dossier.sections.tech_clues.help' },
  { id: 6, key: 'competitive', labelKey: 'dossier.sections.competitive.label', helpKey: 'dossier.sections.competitive.help' },
  { id: 7, key: 'hooks', labelKey: 'dossier.sections.hooks.label', helpKey: 'dossier.sections.hooks.help' },
  { id: 8, key: 'cases', labelKey: 'dossier.sections.cases.label', helpKey: 'dossier.sections.cases.help' },
  { id: 9, key: 'risks', labelKey: 'dossier.sections.risks.label', helpKey: 'dossier.sections.risks.help' },
  { id: 10, key: 'next_step', labelKey: 'dossier.sections.next_step.label', helpKey: 'dossier.sections.next_step.help' },
] as const

export const DOSSIER_SECTION_BY_KEY: Record<DossierSectionKey, DossierSectionMeta> =
  DOSSIER_SECTIONS.reduce(
    (acc, meta) => {
      acc[meta.key] = meta
      return acc
    },
    {} as Record<DossierSectionKey, DossierSectionMeta>,
  )
