import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  mergeProfileMetaPatch,
  profileMetaToClientUser,
  readProfileMetaFromAuth,
  sanitizeAvatarUrl,
} from '@/lib/user/profileMeta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AVATAR_TYPES = ['photo', 'emoji', 'initials', 'icon'] as const
const LANGUAGES = ['de', 'en', 'ru'] as const

function pickRole(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return value.length > 0 ? value : null
}

function pickTerritory(value: unknown): 'DE' | 'UK' | null {
  return value === 'DE' || value === 'UK' ? value : null
}

const patchSchema = z
  .object({
    displayName: z.string().min(1).max(120).optional(),
    avatarUrl: z
      .union([z.string().url(), z.null()])
      .optional()
      .transform((v) => (v === undefined ? undefined : sanitizeAvatarUrl(v))),
    avatarType: z.enum(AVATAR_TYPES).optional(),
    avatarEmoji: z.string().max(8).nullable().optional(),
    avatarIcon: z.string().max(40).nullable().optional(),
    avatarBg: z.string().max(40).nullable().optional(),
    language: z.enum(LANGUAGES).optional(),
    timezone: z.string().min(1).max(60).optional(),
  })
  .strict()

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
  const profileMeta = readProfileMetaFromAuth(userMeta)
  const email = user.email ?? ''

  return NextResponse.json({
    user: profileMetaToClientUser(user.id, email, profileMeta),
    role: pickRole(appMeta.role),
    territory: pickTerritory(appMeta.territory),
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const patch = parsed.data
  const currentMeta = (user.user_metadata ?? {}) as Record<string, unknown>
  const nextMeta = mergeProfileMetaPatch(currentMeta, patch)

  const { data, error: updateError } = await supabase.auth.updateUser({ data: nextMeta })
  if (updateError || !data.user) {
    console.error('[api/me PATCH] updateUser failed', updateError?.message)
    return NextResponse.json(
      { error: 'update_failed', message: updateError?.message ?? 'unknown' },
      { status: 500 },
    )
  }

  const updatedMeta = readProfileMetaFromAuth(
    (data.user.user_metadata ?? {}) as Record<string, unknown>,
  )
  const appMeta = (data.user.app_metadata ?? {}) as Record<string, unknown>
  const email = data.user.email ?? ''

  return NextResponse.json({
    user: profileMetaToClientUser(data.user.id, email, updatedMeta),
    role: pickRole(appMeta.role),
    territory: pickTerritory(appMeta.territory),
  })
}
