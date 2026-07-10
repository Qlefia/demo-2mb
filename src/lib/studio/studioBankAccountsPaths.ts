/**
 * Workspace Settings → Bank accounts library.
 *
 * The list lives inside the Invoicing tab (via `StudioBankAccountsHubSection`)
 * and the detail-edit screen has its own route — same shape as Offices
 * (`/settings/studio/offices/[id]`).
 */
export const STUDIO_BANK_ACCOUNTS_BASE = '/settings/studio/bank-accounts' as const

export function studioBankAccountDetailPath(bankAccountId: string): string {
  return `${STUDIO_BANK_ACCOUNTS_BASE}/${bankAccountId}`
}

const BANK_ACCOUNT_DETAIL_RE = /^\/settings\/studio\/bank-accounts\/([^/]+)$/

export function isStudioBankAccountDetailPath(pathname: string): boolean {
  return BANK_ACCOUNT_DETAIL_RE.test(pathname)
}

export function studioBankAccountIdFromPath(pathname: string): string | null {
  const m = pathname.match(BANK_ACCOUNT_DETAIL_RE)
  return m?.[1] ?? null
}
