import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { provisionStudioWorkspace } from '@/lib/workspace/provisionStudioWorkspace'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z
  .object({
    studioName: z.string().trim().min(1).max(120),
    onlyIfNoWorkspace: z.boolean().optional(),
  })
  .strict()

export async function POST(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const result = await provisionStudioWorkspace(auth.user.id, parsed.data.studioName, {
      onlyIfNoWorkspace: parsed.data.onlyIfNoWorkspace,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/workspace/provision POST]', err)
    return NextResponse.json({ error: 'provision_failed' }, { status: 500 })
  }
}
