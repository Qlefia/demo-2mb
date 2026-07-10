import { config as loadEnv } from 'dotenv'
import postgres from 'postgres'

loadEnv({ path: '.env.local' })
loadEnv()

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL missing')
    process.exit(1)
  }
  const masked = url.replace(/:([^:@/]+)@/, ':***@')
  console.log('Connecting:', masked)

  const sql = postgres(url, { prepare: false, connect_timeout: 10, max: 1 })
  try {
    const t0 = Date.now()
    const rows = await sql`select now() as now, current_user as user, current_database() as db`
    const ms = Date.now() - t0
    console.log('OK', ms + 'ms', rows[0])
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('FAIL:', message)
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 1 })
  }
}

main()
