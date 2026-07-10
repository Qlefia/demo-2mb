import 'server-only'

import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

declare global {
  var __supabase_service__: SupabaseClient | undefined
}

function build(): SupabaseClient {
  return createServiceClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

export function getServiceClient(): SupabaseClient {
  if (env.NODE_ENV === 'production') return build()
  if (!globalThis.__supabase_service__) {
    globalThis.__supabase_service__ = build()
  }
  return globalThis.__supabase_service__
}
