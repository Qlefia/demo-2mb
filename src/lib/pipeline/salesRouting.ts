import 'server-only'

import type { Database } from '@/lib/db/client'
import { pickCrmRole, pickTerritory, type CrmRole } from '@/lib/auth/roles'
import type { Territory } from '@/lib/db/schema/enums'
import { deriveSeatStatus, listAllUsers } from '@/lib/team/seatService'
import { getActiveLoad } from '@/lib/team/workload'

const TERRITORY_SALES_ROLE: Record<'DE' | 'UK', CrmRole> = {
  DE: 'sales_de',
  UK: 'sales_uk',
}

/**
 * Pick the active sales seat with the lowest open pipeline load for a territory.
 * Returns null for EU_other (manual Ops assign) or when no eligible seat exists.
 */
export async function pickSalesAssignee(
  tx: Database,
  territory: Territory,
): Promise<string | null> {
  if (territory === 'EU_other') return null

  const targetRole = TERRITORY_SALES_ROLE[territory]
  const users = await listAllUsers()

  const candidates = users.filter((u) => {
    if (deriveSeatStatus(u) !== 'active') return false
    const role = pickCrmRole((u.app_metadata ?? {}).role)
    if (role !== targetRole) return false
    const seatTerritory = pickTerritory((u.app_metadata ?? {}).territory)
    return seatTerritory === territory
  })

  if (candidates.length === 0) return null

  const loads = await Promise.all(
    candidates.map(async (u) => ({ id: u.id, load: await getActiveLoad(tx, u.id) })),
  )
  loads.sort((a, b) => a.load - b.load)

  const minLoad = loads[0]!.load
  const tied = loads.filter((l) => l.load === minLoad)
  const pick = tied[Math.floor(Math.random() * tied.length)]!
  return pick.id
}
