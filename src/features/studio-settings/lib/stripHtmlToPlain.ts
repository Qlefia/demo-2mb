/** Plain-text preview for TipTap HTML — no `dangerouslySetInnerHTML` in lists. */
export function stripHtmlToPlain(html: string, maxChars: number): string {
  const raw = html.trim()
  if (raw === '') return ''

  let text: string
  if (typeof document !== 'undefined') {
    const el = document.createElement('div')
    el.innerHTML = raw
    text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
  } else {
    text = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(0, maxChars - 1))}…`
}
