export const WORKSPACE_STUDIO_BUCKET = 'workspace-studio'

/** Value is an HTTPS URL in our workspace-studio bucket (not a data: URL). */
export function isWorkspaceStudioStorageUrl(value: string): boolean {
  return value.includes(`/storage/v1/object/public/${WORKSPACE_STUDIO_BUCKET}/`)
}

/** Use as `<img src>` — supports legacy data: URLs and storage public URLs. */
export function studioMediaDisplayUrl(value: string | null | undefined): string | null {
  if (!value) return null
  return value
}
