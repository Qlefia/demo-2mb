import { NextRequest, NextResponse } from 'next/server'
import { and, asc, eq, ilike, max, or } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { serviceTags } from '@/lib/db/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const postSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(96)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    labelDe: z.string().min(1).max(240),
    labelEn: z.string().min(1).max(240),
  })
  .strict()

export async function GET(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const q = (request.nextUrl.searchParams.get('q') ?? '').trim()
  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get('limit') ?? '40') || 40, 1),
    100,
  )

  try {
    const items = await withUserRls(auth.session.access_token, async (tx) => {
      if (q.length > 0) {
        const pattern = `%${q.replace(/([%_])/g, '\\$1')}%`
        return await tx
          .select({
            id: serviceTags.id,
            slug: serviceTags.slug,
            labelDe: serviceTags.labelDe,
            labelEn: serviceTags.labelEn,
          })
          .from(serviceTags)
          .where(
            and(
              eq(serviceTags.isActive, true),
              or(
                ilike(serviceTags.labelDe, pattern),
                ilike(serviceTags.labelEn, pattern),
                ilike(serviceTags.slug, pattern),
              ),
            ),
          )
          .orderBy(asc(serviceTags.sortOrder))
          .limit(limit)
      }

      return await tx
        .select({
          id: serviceTags.id,
          slug: serviceTags.slug,
          labelDe: serviceTags.labelDe,
          labelEn: serviceTags.labelEn,
        })
        .from(serviceTags)
        .where(eq(serviceTags.isActive, true))
        .orderBy(asc(serviceTags.sortOrder))
        .limit(limit)
    })

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/service-tags GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  try {
    const row = await withUserRls(auth.session.access_token, async (tx) => {
      const [agg] = await tx.select({ mx: max(serviceTags.sortOrder) }).from(serviceTags)
      const nextOrder = (agg?.mx ?? 0) + 10

      const [inserted] = await tx
        .insert(serviceTags)
        .values({
          slug: body.slug,
          labelDe: body.labelDe.trim(),
          labelEn: body.labelEn.trim(),
          sortOrder: nextOrder,
          isActive: true,
        })
        .returning({
          id: serviceTags.id,
          slug: serviceTags.slug,
          labelDe: serviceTags.labelDe,
          labelEn: serviceTags.labelEn,
        })

      return inserted
    })

    if (!row) {
      return NextResponse.json({ error: 'create_failed' }, { status: 500 })
    }
    return NextResponse.json({ tag: row }, { status: 201 })
  } catch (err) {
    console.error('[api/service-tags POST] failed', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
