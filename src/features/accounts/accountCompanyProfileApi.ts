import type { AccountCompanyProfile } from '@/lib/accounts/companyProfile'

export async function fetchAccountCompanyProfile(accountId: string): Promise<AccountCompanyProfile> {
  const res = await fetch(`/api/accounts/${accountId}/company-profile`, { credentials: 'include' })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `fetch_failed_${res.status}`)
  }
  return res.json() as Promise<AccountCompanyProfile>
}

export async function putAccountCompanyProfile(
  accountId: string,
  payload: AccountCompanyProfile,
): Promise<AccountCompanyProfile> {
  const res = await fetch(`/api/accounts/${accountId}/company-profile`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `save_failed_${res.status}`)
  }
  return res.json() as Promise<AccountCompanyProfile>
}
