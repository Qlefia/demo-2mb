import {
  compilePlaybookBody,
  parsePlaybookSections,
  playbookListPreview,
  type PlaybookKind,
  type PlaybookSections,
} from '@/lib/playbooks/schema'

const PLAYBOOK_SELECT =
  'id, name, language, kind, summary, sections, version, body, created_at, updated_at'

export const PLAYBOOK_LIST_SELECT =
  'id, name, language, kind, summary, sections, version, body, updated_at'

export type SerializedPlaybookListItem = {
  id: string
  name: string
  language: string
  kind: PlaybookKind
  summary: string
  version: number
  updatedAt: string
  bodyPreview: string
}

export type SerializedPlaybookDetail = SerializedPlaybookListItem & {
  body: string
  sections: PlaybookSections
  createdAt: string
}

export function serializePlaybookListRow(row: Record<string, unknown>): SerializedPlaybookListItem {
  const sections = parsePlaybookSections(row.sections)
  const body = typeof row.body === 'string' ? row.body : ''
  const summary = typeof row.summary === 'string' ? row.summary : ''
  return {
    id: row.id as string,
    name: row.name as string,
    language: row.language as string,
    kind: (row.kind as PlaybookKind) ?? 'first_touch',
    summary,
    version: row.version as number,
    updatedAt: row.updated_at as string,
    bodyPreview: playbookListPreview(summary, sections, body),
  }
}

export function serializePlaybookDetailRow(row: Record<string, unknown>): SerializedPlaybookDetail {
  const sections = parsePlaybookSections(row.sections)
  return {
    ...serializePlaybookListRow(row),
    body: row.body as string,
    sections,
    createdAt: row.created_at as string,
  }
}

export { PLAYBOOK_SELECT }

export function bodyFromSectionsPatch(
  sections: PlaybookSections | undefined,
  explicitBody: string | undefined,
): string | undefined {
  if (sections !== undefined) return compilePlaybookBody(sections)
  return explicitBody
}
