import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withUserRls } from '@/lib/db/rls'
import { prospectArtifacts } from '@/lib/db/schema'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import {
  toArtifactDto,
  validateParentFolder,
} from '@/lib/prospects/prospectArtifactsData'
import { artifactLinkUrlSchema } from '@/lib/prospects/artifactLinkUrlSchema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { id: prospectId } = await ctx.params

  try {
    const rows = await withUserRls(auth.session.access_token, async (tx) => {
      return tx
        .select()
        .from(prospectArtifacts)
        .where(eq(prospectArtifacts.prospectId, prospectId))
        .orderBy(asc(prospectArtifacts.sortOrder), asc(prospectArtifacts.createdAt))
    })
    const supabase = await createClient()
    const items = await Promise.all(rows.map((row) => toArtifactDto(supabase, row)))
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/prospects/.../artifacts GET]', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

const postSchema = z
  .object({
    kind: z.enum(['folder', 'entry']),
    title: z.string().min(1).max(500),
    body: z.string().max(8000).optional(),
    linkUrl: artifactLinkUrlSchema,
    parentId: z.string().uuid().nullable().optional(),
  })
  .strict()

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { id: prospectId } = await ctx.params

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  const parentId = parsed.data.parentId ?? null
  const parentOk = await validateParentFolder(auth.session.access_token, prospectId, parentId)
  if (!parentOk) {
    return NextResponse.json({ error: 'invalid_parent' }, { status: 422 })
  }

  const link =
    parsed.data.kind === 'entry' && parsed.data.linkUrl && parsed.data.linkUrl.length > 0
      ? parsed.data.linkUrl.trim()
      : null

  try {
    const [row] = await withUserRls(auth.session.access_token, async (tx) => {
      return tx
        .insert(prospectArtifacts)
        .values({
          prospectId,
          parentId,
          kind: parsed.data.kind,
          title: parsed.data.title.trim(),
          body: parsed.data.kind === 'entry' ? parsed.data.body?.trim() || null : null,
          url: link,
          createdBy: auth.user.id,
        })
        .returning()
    })
    const supabase = await createClient()
    const item = await toArtifactDto(supabase, row)
    return NextResponse.json({ item }, { status: 201 })
  } catch (err) {
    console.error('[api/prospects/.../artifacts POST]', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
