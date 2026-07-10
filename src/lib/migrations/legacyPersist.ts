/**
 * One-shot migration from the legacy `oprosnik-*` / `proscus-*` localStorage
 * namespace to the new `2mb-crm-*` namespace. Idempotent: each key is moved
 * only if the new slot is empty, then the legacy slot is deleted.
 *
 * Runs at module load time on the client (imported by `src/i18n/index.ts`),
 * which is the earliest browser-side code path before any Zustand persist
 * middleware reads from storage.
 */

const RENAMES: ReadonlyArray<readonly [string, string]> = [
  ['oprosnik-user', '2mb-crm-user'],
  ['oprosnik-language', '2mb-crm-language'],
  ['proscus-prospects-ui', '2mb-crm-prospects-ui'],
]

const DROPS: readonly string[] = [
  'oprosnik-cookie-consent',
  'oprosnik-notifications',
  'oprosnik-team',
  'oprosnik-leads',
  'oprosnik-surveys',
  'oprosnik-versions',
  'oprosnik-workspaces',
]

let migrated = false

export function migrateLegacyPersistKeys(): void {
  if (migrated) return
  migrated = true
  if (typeof window === 'undefined') return

  try {
    for (const [from, to] of RENAMES) {
      const oldValue = window.localStorage.getItem(from)
      if (oldValue === null) continue
      const newValue = window.localStorage.getItem(to)
      if (newValue === null) {
        window.localStorage.setItem(to, oldValue)
      }
      window.localStorage.removeItem(from)
    }
    for (const key of DROPS) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Quota / privacy mode — non-fatal; defaults will simply apply.
  }
}
