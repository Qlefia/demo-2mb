const URL_RE = /https?:\/\/[^\s)'"<>\]]+/gi

/** URLs present in grounding JSON — model may only cite these (plus host/origin). */
export function extractAllowedUrlHints(blob: string): Set<string> {
  const set = new Set<string>()
  for (const m of blob.matchAll(URL_RE)) {
    const u = m[0].replace(/[.,;:!?)]+$/, '')
    set.add(u)
    try {
      const parsed = new URL(u)
      set.add(parsed.hostname)
      set.add(parsed.origin)
    } catch {
      /* ignore */
    }
  }
  return set
}
