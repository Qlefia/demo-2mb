import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

loadEnv({ path: '.env.local' })
loadEnv()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for drizzle-kit (see .env.local).')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema',
  out: './supabase/migrations',
  casing: 'snake_case',
  dbCredentials: {
    url: databaseUrl,
  },
  migrations: {
    prefix: 'timestamp',
  },
  verbose: true,
  strict: true,
})
