import { config as loadEnv } from 'dotenv'
import { z } from 'zod'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, sql } from 'drizzle-orm'
import { accounts, prospects, triggers } from '@/lib/db/schema'
import type { ProspectStage, ProspectSource, Territory } from '@/lib/db/schema/enums'
import { DEFAULT_WORKSPACE_ID } from '@/lib/workspace/constants'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
})

interface SeedSpec {
  account: {
    name: string
    website: string
    legalForm?: string
    hqCountry: string
    hqCity?: string
    employees?: number
  }
  trigger: {
    type: string
    text: string
    sourceUrl?: string
    occurredHoursAgo: number
  }
  prospect: {
    source: ProspectSource
    territory: Territory
    stage: ProspectStage
    priority: number
  }
}

const SEED: readonly SeedSpec[] = [
  {
    account: {
      name: 'Berliner Spiele Stiftung',
      website: 'https://berliner-spiele-stiftung.de',
      legalForm: 'Stiftung',
      hqCountry: 'DE',
      hqCity: 'Berlin',
      employees: 18,
    },
    trigger: {
      type: 'tender_published',
      text: 'Ausschreibung „Sanierung Bürohaus Mitte" auf competitionline veröffentlicht.',
      sourceUrl: 'https://competitionline.com/de/ausschreibungen/example-1',
      occurredHoursAgo: 2,
    },
    prospect: {
      source: 'competitionline',
      territory: 'DE',
      stage: 'new',
      priority: 1,
    },
  },
  {
    account: {
      name: 'Hammerschmidt Immobilien GmbH',
      website: 'https://hammerschmidt-immo.de',
      legalForm: 'GmbH',
      hqCountry: 'DE',
      hqCity: 'Hamburg',
      employees: 240,
    },
    trigger: {
      type: 'tender_published',
      text: 'Neubauprojekt Berlin-Mitte 12.000m² ausgeschrieben.',
      sourceUrl: 'https://competitionline.com/de/ausschreibungen/example-2',
      occurredHoursAgo: 8,
    },
    prospect: {
      source: 'competitionline',
      territory: 'DE',
      stage: 'triaged',
      priority: 2,
    },
  },
  {
    account: {
      name: 'Sankt Augustin Bauwerke AG',
      website: 'https://sa-bauwerke.de',
      legalForm: 'AG',
      hqCountry: 'DE',
      hqCity: 'Sankt Augustin',
      employees: 1100,
    },
    trigger: {
      type: 'leadership_change',
      text: 'CEO-Wechsel: Markus Lehmann übernimmt zum 01.05.',
      occurredHoursAgo: 72,
    },
    prospect: {
      source: 'manual',
      territory: 'DE',
      stage: 'dossier_in_progress',
      priority: 2,
    },
  },
  {
    account: {
      name: 'Northgate Property Trust',
      website: 'https://northgate-trust.co.uk',
      legalForm: 'Ltd',
      hqCountry: 'UK',
      hqCity: 'Manchester',
      employees: 320,
    },
    trigger: {
      type: 'acquisition',
      text: 'Acquired 4 commercial buildings in Manchester for £42m.',
      sourceUrl: 'https://propertyweek.com/example-3',
      occurredHoursAgo: 28,
    },
    prospect: {
      source: 'propertyweek',
      territory: 'UK',
      stage: 'enriching',
      priority: 1,
    },
  },
  {
    account: {
      name: 'Greenfield Estates Ltd',
      website: 'https://greenfield.co.uk',
      legalForm: 'Ltd',
      hqCountry: 'UK',
      hqCity: 'London',
      employees: 64,
    },
    trigger: {
      type: 'funding_round',
      text: 'Series B funding £18m closed; expanding into commercial portfolio.',
      sourceUrl: 'https://propertyweek.com/example-4',
      occurredHoursAgo: 120,
    },
    prospect: {
      source: 'linkedin_outreach',
      territory: 'UK',
      stage: 'dossier_ready',
      priority: 1,
    },
  },
  {
    account: {
      name: 'Royal Crown Developments',
      website: 'https://royalcrown.co.uk',
      legalForm: 'Ltd',
      hqCountry: 'UK',
      hqCity: 'London',
      employees: 480,
    },
    trigger: {
      type: 'rfp_published',
      text: 'RFP for facility management services 2026.',
      occurredHoursAgo: 168,
    },
    prospect: {
      source: 'inbound_form',
      territory: 'UK',
      stage: 'proposal_sent',
      priority: 1,
    },
  },
  {
    account: {
      name: 'Vienna Holding Properties',
      website: 'https://viennaholding.at',
      legalForm: 'AG',
      hqCountry: 'AT',
      hqCity: 'Wien',
      employees: 95,
    },
    trigger: {
      type: 'referral',
      text: 'Empfehlung von Bauer & Partner; Termin am 02.05.',
      occurredHoursAgo: 48,
    },
    prospect: {
      source: 'referral',
      territory: 'EU_other',
      stage: '1st_call',
      priority: 2,
    },
  },
  {
    account: {
      name: 'Stockholm Real Estate AB',
      website: 'https://stockholm-re.se',
      legalForm: 'AB',
      hqCountry: 'SE',
      hqCity: 'Stockholm',
      employees: 130,
    },
    trigger: {
      type: 'expansion',
      text: 'Expansion into German market announced.',
      occurredHoursAgo: 24,
    },
    prospect: {
      source: 'linkedin_outreach',
      territory: 'EU_other',
      stage: 'meeting_scheduled',
      priority: 2,
    },
  },
] as const

async function main() {
  const env = envSchema.parse({ DATABASE_URL: process.env.DATABASE_URL })
  const client = postgres(env.DATABASE_URL, {
    prepare: false,
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  })
  const db = drizzle(client, { casing: 'snake_case' })

  console.log(`seeding ${SEED.length} prospects...`)

  for (const spec of SEED) {
    await db.transaction(async (tx) => {
      const existingAccounts = await tx
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.website, spec.account.website))
        .limit(1)

      let accountId: string
      if (existingAccounts.length > 0) {
        accountId = existingAccounts[0].id
        await tx
          .update(accounts)
          .set({
            name: spec.account.name,
            legalForm: spec.account.legalForm,
            hqCountry: spec.account.hqCountry,
            hqCity: spec.account.hqCity,
            employees: spec.account.employees,
            updatedAt: sql`now()`,
          })
          .where(eq(accounts.id, accountId))
      } else {
        const [created] = await tx
          .insert(accounts)
          .values({
            workspaceId: DEFAULT_WORKSPACE_ID,
            name: spec.account.name,
            legalForm: spec.account.legalForm,
            hqCountry: spec.account.hqCountry,
            hqCity: spec.account.hqCity,
            employees: spec.account.employees,
            website: spec.account.website,
          })
          .returning({ id: accounts.id })
        accountId = created.id
      }

      const existingProspect = await tx
        .select({ id: prospects.id })
        .from(prospects)
        .where(eq(prospects.accountId, accountId))
        .limit(1)

      let prospectId: string
      if (existingProspect.length > 0) {
        prospectId = existingProspect[0].id
        await tx
          .update(prospects)
          .set({
            source: spec.prospect.source,
            territory: spec.prospect.territory,
            stage: spec.prospect.stage,
            priority: spec.prospect.priority,
            workspaceId: DEFAULT_WORKSPACE_ID,
            updatedAt: sql`now()`,
          })
          .where(eq(prospects.id, prospectId))
      } else {
        const [created] = await tx
          .insert(prospects)
          .values({
            accountId,
            workspaceId: DEFAULT_WORKSPACE_ID,
            source: spec.prospect.source,
            territory: spec.prospect.territory,
            stage: spec.prospect.stage,
            priority: spec.prospect.priority,
          })
          .returning({ id: prospects.id })
        prospectId = created.id
      }

      const occurredAt = sql`now() - (${spec.trigger.occurredHoursAgo}::int * interval '1 hour')`
      await tx.insert(triggers).values({
        accountId,
        workspaceId: DEFAULT_WORKSPACE_ID,
        prospectId,
        type: spec.trigger.type,
        sourceUrl: spec.trigger.sourceUrl,
        occurredAt: sql`${occurredAt}` as unknown as Date,
        payload: { text: spec.trigger.text },
      })
    })

    console.log(
      `  ✓ ${spec.account.name} → ${spec.prospect.territory} / ${spec.prospect.stage}`,
    )
  }

  await client.end()
  console.log('done.')
}

main().catch(async (err) => {
  console.error(err)
  process.exit(1)
})
