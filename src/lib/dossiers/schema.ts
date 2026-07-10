import { z } from 'zod'

const optionalUrl = z
  .string()
  .url()
  .max(500)
  .optional()
  .or(z.literal('').transform(() => undefined))

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
  .optional()

/* ───── Section 1: Company snapshot ───── */
export const snapshotSchema = z
  .object({
    legalForm: z.string().max(120).optional(),
    hqCity: z.string().max(120).optional(),
    hqCountry: z.string().max(120).optional(),
    employees: z.number().int().min(1).max(2_000_000).optional(),
    foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
    publicPrivate: z.enum(['public', 'private', 'unknown']).optional(),
    websiteOverride: optionalUrl,
    /** Project phase / commercialisation timing (e.g. PC filed, pre-launch). */
    projectPhase: z.string().max(500).optional(),
    /** Lead architect or agency on the active programme. */
    architectAgency: z.string().max(200).optional(),
    /** Site / render quality observation for outreach. */
    notes: z.string().max(1000).optional(),
  })
  .strict()

/* ───── Section 2: What they do ───── */
export const whatTheyDoSchema = z
  .object({
    summary: z.string().max(2000).optional(),
    segments: z.array(z.string().min(1).max(120)).max(20).optional(),
    flagshipOffering: z.string().max(500).optional(),
    targetCustomer: z.string().max(500).optional(),
  })
  .strict()

/* ───── Section 3: Recent signals ───── */
export const signalSchema = z
  .object({
    text: z.string().min(3).max(1000),
    sourceUrl: optionalUrl,
    occurredAt: isoDate,
    type: z.string().max(80).optional(),
  })
  .strict()

export const signalsSchema = z
  .object({
    items: z.array(signalSchema).max(20).default([]),
  })
  .strict()

/* ───── Section 4: Decision-makers (joins contacts table) ───── */
export const decisionMakersSchema = z
  .object({
    contactIds: z.array(z.string().uuid()).max(20).default([]),
    notes: z.string().max(1000).optional(),
  })
  .strict()

/* ───── Section 5: Tech & process clues ───── */
export const techCluesSchema = z
  .object({
    siteStack: z.array(z.string().min(1).max(80)).max(40).optional(),
    visibleVendors: z.array(z.string().min(1).max(120)).max(40).optional(),
    careersTooling: z.array(z.string().min(1).max(120)).max(40).optional(),
    notes: z.string().max(1000).optional(),
  })
  .strict()

/* ───── Section 6: Competitive context ───── */
export const competitiveSchema = z
  .object({
    currentVendors: z.array(z.string().min(1).max(200)).max(20).optional(),
    inHouseTeam: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
  })
  .strict()

/* ───── Section 7: Hooks for outreach ───── */
export const hooksSchema = z
  .object({
    items: z.array(z.string().min(1).max(500)).max(10).default([]),
  })
  .strict()

/* ───── Section 8: Comparable 2mb cases ───── */
export const caseSlotSchema = z
  .object({
    name: z.string().max(200).optional().or(z.literal('').transform(() => undefined)),
    why: z.string().max(500).optional().or(z.literal('').transform(() => undefined)),
  })
  .strict()

export const casesSchema = z
  .object({
    items: z.array(caseSlotSchema).length(3).default([{}, {}, {}]),
  })
  .strict()

/* ───── Section 9: Risks & blockers ───── */
export const risksSchema = z
  .object({
    summary: z.string().max(2000).optional(),
    blockers: z.array(z.string().min(1).max(500)).max(20).optional(),
  })
  .strict()

/* ───── Section 10: Suggested next step ───── */
export const nextStepSchema = z
  .object({
    channel: z.enum(['call', 'email', 'linkedin', 'warm_intro']).optional(),
    suggestedPlaybookId: z.string().uuid().nullable().optional(),
    notes: z.string().max(1000).optional(),
  })
  .strict()

/* ───── All sections ───── */
export const dossierSectionsSchema = z
  .object({
    snapshot: snapshotSchema.optional(),
    what_they_do: whatTheyDoSchema.optional(),
    signals: signalsSchema.optional(),
    decision_makers: decisionMakersSchema.optional(),
    tech_clues: techCluesSchema.optional(),
    competitive: competitiveSchema.optional(),
    hooks: hooksSchema.optional(),
    cases: casesSchema.optional(),
    risks: risksSchema.optional(),
    next_step: nextStepSchema.optional(),
  })
  .strict()

export type DossierSections = z.infer<typeof dossierSectionsSchema>
export type SnapshotSection = z.infer<typeof snapshotSchema>
export type WhatTheyDoSection = z.infer<typeof whatTheyDoSchema>
export type SignalsSection = z.infer<typeof signalsSchema>
export type DecisionMakersSection = z.infer<typeof decisionMakersSchema>
export type TechCluesSection = z.infer<typeof techCluesSchema>
export type CompetitiveSection = z.infer<typeof competitiveSchema>
export type HooksSection = z.infer<typeof hooksSchema>
export type CasesSection = z.infer<typeof casesSchema>
export type RisksSection = z.infer<typeof risksSchema>
export type NextStepSection = z.infer<typeof nextStepSchema>

export const EMPTY_SECTIONS: DossierSections = {
  snapshot: {},
  what_they_do: {},
  signals: { items: [] },
  decision_makers: { contactIds: [] },
  tech_clues: {},
  competitive: {},
  hooks: { items: [] },
  cases: { items: [{}, {}, {}] },
  risks: {},
  next_step: {},
}
