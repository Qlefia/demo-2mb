export const DOCUMENT_KINDS = ['proposal', 'offer'] as const
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]

export function parseDocumentKind(raw: string | null | undefined): DocumentKind {
  return raw === 'offer' ? 'offer' : 'proposal'
}
