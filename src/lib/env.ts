import 'server-only'

import { z } from 'zod'

const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required (Supabase pooler, port 6543, transaction mode)')
    .url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Optional: enables `POST /api/inbound`; without it the route returns 503. */
  INBOUND_WEBHOOK_SECRET: z.preprocess(
    (v) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined),
    z.string().min(8).optional(),
  ),
  /** Optional: `POST /api/prospects/:id/enrich` with `X-Enrichment-Secret` (Edge Functions, cron). */
  ENRICH_INTERNAL_SECRET: z.preprocess(
    (v) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined),
    z.string().min(16).optional(),
  ),
})

type ServerEnv = z.infer<typeof serverEnvSchema>

function loadServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid server environment:\n${issues}`)
  }
  return parsed.data
}

export const env: ServerEnv = loadServerEnv()
