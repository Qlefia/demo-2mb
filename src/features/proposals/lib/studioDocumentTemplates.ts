import { pickDocumentTemplate } from '@/lib/proposals/blocksFromDocumentTemplate'
import type { DocumentKind } from '@/lib/proposals/documentKind'
import type {
  StudioDocumentTemplate,
  StudioDocumentTemplateKind,
} from '@/stores/studioProfileTypes'

function templateKindForDocument(documentKind: DocumentKind): StudioDocumentTemplateKind {
  return documentKind === 'offer' ? 'offer' : 'proposal'
}

export function studioTemplatesFromGeneral(
  general: unknown,
  documentKind: DocumentKind,
): StudioDocumentTemplate[] {
  if (!general || typeof general !== 'object') return []
  const raw = (general as { documentTemplates?: unknown }).documentTemplates
  if (!Array.isArray(raw)) return []
  const kind = templateKindForDocument(documentKind)
  return (raw as StudioDocumentTemplate[]).filter((tpl) => tpl.kind === kind)
}

export function defaultStudioTemplateId(
  general: unknown,
  documentKind: DocumentKind,
): string | null {
  const kind = templateKindForDocument(documentKind)
  const templates = studioTemplatesFromGeneral(general, documentKind)
  return pickDocumentTemplate(templates, kind)?.id ?? null
}
