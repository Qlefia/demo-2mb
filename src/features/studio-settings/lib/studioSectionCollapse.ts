/** Fixed set of section keys (e.g. General, Work detail). */
export function sectionOpenMap<K extends string>(keys: readonly K[], all: boolean): Record<K, boolean> {
  return Object.fromEntries(keys.map((k) => [k, all])) as Record<K, boolean>
}

export function everyKeyOpen<K extends string>(
  keys: readonly K[],
  open: Partial<Record<K, boolean>>,
): boolean {
  return keys.length > 0 && keys.every((k) => open[k] !== false)
}

export function isKeyOpen<K extends string>(open: Partial<Record<K, boolean>>, key: K): boolean {
  return open[key] !== false
}

/** Row ids (segments, reviews): undefined / missing id means expanded. */
export function everyDynamicRowOpen(ids: string[], open: Record<string, boolean | undefined>): boolean {
  return ids.length > 0 && ids.every((id) => open[id] !== false)
}

export function allDynamicRowsCollapsed(ids: string[]): Record<string, boolean> {
  return Object.fromEntries(ids.map((id) => [id, false]))
}

export function toggleDynamicRowOpen(
  open: Record<string, boolean | undefined>,
  id: string,
): Record<string, boolean | undefined> {
  const next = { ...open }
  if (next[id] !== false) next[id] = false
  else delete next[id]
  return next
}
