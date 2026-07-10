/** Truncate long labels for compact UI (e.g. back navigation). */
export function truncateLabel(text: string, maxLength = 36): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  if (maxLength <= 1) return '…'
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`
}
