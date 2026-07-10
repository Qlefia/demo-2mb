import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import {
  accountCompanyProfileSchema,
  normalizeCompanyProfile,
} from '@/lib/accounts/companyProfile'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const { data, error } = await auth.supabase
    .from('accounts')
    .select('offices, billing')
    .eq('id', parsedId.data)
    .maybeSingle()

  if (error) {
    console.error('[api/accounts/:id/company-profile GET]', error)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(normalizeCompanyProfile(data))
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = accountCompanyProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const normalized = normalizeCompanyProfile(parsed.data)

  const { data, error } = await auth.supabase
    .from('accounts')
    .update({
      offices: normalized.offices,
      billing: normalized.billing,
    })
    .eq('id', parsedId.data)
    .select('offices, billing')
    .maybeSingle()

  if (error) {
    console.error('[api/accounts/:id/company-profile PUT]', error)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(normalizeCompanyProfile(data))
}
