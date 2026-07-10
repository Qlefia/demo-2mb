import { z } from 'zod'

export const PLAYBOOK_LANGUAGES = ['de', 'en'] as const
export type PlaybookLanguage = (typeof PLAYBOOK_LANGUAGES)[number]

export const PLAYBOOK_KINDS = [
  'first_touch',
  'follow_up',
  'voicemail',
  'objection',
  'discovery_call',
] as const
export type PlaybookKind = (typeof PLAYBOOK_KINDS)[number]

export const playbookLanguageSchema = z.enum(PLAYBOOK_LANGUAGES)
export const playbookKindSchema = z.enum(PLAYBOOK_KINDS)

export const playbookSectionsSchema = z.object({
  opening: z.string().max(2000).optional().default(''),
  context: z.string().max(2000).optional().default(''),
  valueProp: z.string().max(2000).optional().default(''),
  discoveryQuestions: z.string().max(4000).optional().default(''),
  talkTrack: z.string().max(8000).optional().default(''),
  objections: z.string().max(8000).optional().default(''),
  voicemail: z.string().max(2000).optional().default(''),
  followUpEmail: z.string().max(4000).optional().default(''),
  nextStep: z.string().max(1000).optional().default(''),
})

export type PlaybookSections = z.infer<typeof playbookSectionsSchema>

export const emptyPlaybookSections = (): PlaybookSections => playbookSectionsSchema.parse({})

export function parsePlaybookSections(raw: unknown): PlaybookSections {
  const parsed = playbookSectionsSchema.safeParse(raw ?? {})
  return parsed.success ? parsed.data : emptyPlaybookSections()
}

export const PLAYBOOK_SECTION_ORDER = [
  'opening',
  'context',
  'valueProp',
  'discoveryQuestions',
  'talkTrack',
  'objections',
  'voicemail',
  'followUpEmail',
  'nextStep',
] as const satisfies readonly (keyof PlaybookSections)[]

const SECTION_LABELS: Record<keyof PlaybookSections, string> = {
  opening: 'Opening',
  context: 'Context (why now)',
  valueProp: 'Value proposition (30 sec)',
  discoveryQuestions: 'Discovery questions',
  talkTrack: 'Talk track',
  objections: 'Objection handling',
  voicemail: 'Voicemail (30 sec)',
  followUpEmail: 'Follow-up email',
  nextStep: 'Next step / CTA',
}

export function compilePlaybookBody(sections: PlaybookSections): string {
  const blocks: string[] = []
  for (const key of PLAYBOOK_SECTION_ORDER) {
    const text = sections[key]?.trim()
    if (!text) continue
    blocks.push(`## ${SECTION_LABELS[key]}\n\n${text}`)
  }
  return blocks.join('\n\n')
}

export function playbookListPreview(summary: string, sections: PlaybookSections, body: string): string {
  const summaryT = summary.trim()
  if (summaryT) return summaryT
  const opening = sections.opening?.trim()
  if (opening) return opening.replace(/\s+/g, ' ').slice(0, 180)
  return body.replace(/\s+/g, ' ').trim().slice(0, 180)
}

export const createPlaybookSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    language: playbookLanguageSchema,
    kind: playbookKindSchema.optional().default('first_touch'),
    summary: z.string().max(280).optional().default(''),
    sections: playbookSectionsSchema.optional(),
    body: z.string().max(50_000).optional(),
  })
  .strict()

export const updatePlaybookSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    language: playbookLanguageSchema.optional(),
    kind: playbookKindSchema.optional(),
    summary: z.string().max(280).optional(),
    sections: playbookSectionsSchema.optional(),
    body: z.string().max(50_000).optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.name !== undefined ||
      v.language !== undefined ||
      v.kind !== undefined ||
      v.summary !== undefined ||
      v.sections !== undefined ||
      v.body !== undefined,
    { message: 'empty_patch' },
  )

export type CreatePlaybookInput = z.infer<typeof createPlaybookSchema>
export type UpdatePlaybookInput = z.infer<typeof updatePlaybookSchema>

export function resolvePlaybookBody(
  sections: PlaybookSections | undefined,
  explicitBody: string | undefined,
): string {
  if (explicitBody !== undefined && explicitBody.trim()) return explicitBody
  if (sections) {
    const compiled = compilePlaybookBody(sections)
    if (compiled.trim()) return compiled
  }
  return explicitBody ?? ''
}
