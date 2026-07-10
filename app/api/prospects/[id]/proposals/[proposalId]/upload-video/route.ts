import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'] as const
const EXT_BY_MIME: Record<(typeof VIDEO_MIMES)[number], string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
}

const MAX_VIDEO_BYTES = 100 * 1024 * 1024

interface RouteContext {
  params: Promise<{ id: string; proposalId: string }>
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id: prospectId, proposalId } = await ctx.params
  const parsedProspect = idSchema.safeParse(prospectId)
  const parsedProposal = idSchema.safeParse(proposalId)
  if (!parsedProspect.success || !parsedProposal.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
  }

  const mime = file.type
  if (!VIDEO_MIMES.includes(mime as (typeof VIDEO_MIMES)[number])) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }

  const ext = EXT_BY_MIME[mime as (typeof VIDEO_MIMES)[number]]
  const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()))
  const supabase = await createClient()
  const objectPath = `${parsedProposal.data}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('proposals-media')
    .upload(objectPath, buffer, {
      contentType: mime,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'upload_failed', message: uploadError.message }, { status: 400 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('proposals-media')
    .createSignedUrl(objectPath, 60 * 60 * 24 * 365)

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'sign_failed' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl, path: objectPath })
}
