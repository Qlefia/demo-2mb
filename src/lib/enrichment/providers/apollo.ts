import 'server-only'

import { db } from '@/lib/db/client'
import { fetchOrCacheJson } from '@/lib/enrichment/fetchOrCache'
import { incrementQuotaUsed } from '@/lib/enrichment/quotas'
import type { ApolloEnrichmentPayload, EnrichmentAccountContext } from '@/lib/enrichment/types'

const TTL_SECONDS = 30 * 24 * 3600

function domainFromWebsite(website: string | null): string | null {
  if (!website?.trim()) return null
  try {
    const u = website.startsWith('http') ? new URL(website) : new URL(`https://${website}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function mapPerson(p: Record<string, unknown>): ApolloEnrichmentPayload['people'][number] {
  const first = typeof p.first_name === 'string' ? p.first_name : ''
  const last = typeof p.last_name === 'string' ? p.last_name : ''
  const fullName = [first, last].filter(Boolean).join(' ') || 'Unknown'
  return {
    fullName,
    role: typeof p.title === 'string' ? p.title : undefined,
    email: typeof p.email === 'string' ? p.email : undefined,
    phone: typeof p.sanitized_phone === 'string' ? p.sanitized_phone : undefined,
    linkedinUrl: typeof p.linkedin_url === 'string' ? p.linkedin_url : undefined,
  }
}

export async function enrichApollo(ctx: EnrichmentAccountContext): Promise<ApolloEnrichmentPayload> {
  const apiKey = process.env.APOLLO_API_KEY?.trim()
  const domain = domainFromWebsite(ctx.website)
  if (!apiKey || !domain) {
    return { people: [] }
  }

  const canonicalInput = { domain, purpose: 'mixed_people_search', auth: 'x_api_key' }
  const { payload, fromCache } = await fetchOrCacheJson<ApolloEnrichmentPayload>({
    provider: 'apollo',
    canonicalInput,
    ttlSeconds: TTL_SECONDS,
    fetchFresh: async () => {
      const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          q_organization_domains_list: [domain],
          page: 1,
          per_page: 10,
        }),
      })
      const raw = (await res.json()) as Record<string, unknown>
      if (!res.ok) {
        const err = typeof raw.error === 'string' ? raw.error : `http_${res.status}`
        throw new Error(err)
      }
      const peopleRaw = (raw.people as Record<string, unknown>[] | undefined) ?? []
      const people = peopleRaw.map((p) => mapPerson(p))
      const org = (raw.organization as Record<string, unknown> | undefined) ?? {}
      return {
        people,
        org: {
          employees:
            typeof org.estimated_num_employees === 'number'
              ? org.estimated_num_employees
              : undefined,
          industry: typeof org.industry === 'string' ? org.industry : undefined,
          annualRevenue:
            typeof org.annual_revenue_printed === 'string'
              ? org.annual_revenue_printed
              : typeof org.estimated_annual_revenue === 'string'
                ? org.estimated_annual_revenue
                : undefined,
          hqCity: typeof org.city === 'string' ? org.city : undefined,
          hqCountry: typeof org.country === 'string' ? org.country : undefined,
          publicPrivate: 'unknown',
        },
        rawUsage: {
          credits_used: raw.credits_used,
          total_entries: raw.pagination,
        },
      }
    },
  })

  if (!fromCache) {
    await incrementQuotaUsed(db, 'apollo', 1)
  }

  return payload
}
