import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; proposalId: string }>
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

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
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
  }

  const mime = file.type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }

  const input = Buffer.from(new Uint8Array(await file.arrayBuffer()))
  let processed: Buffer
  try {
    processed = await sharp(input)
      .rotate()
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({
        quality: 85,
        alphaQuality: 90,
        lossless: false,
        effort: 6,
        smartSubsample: true,
      })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: 'image_process_failed' }, { status: 400 })
  }

  const supabase = await createClient()
  const objectPath = `${parsedProposal.data}/${crypto.randomUUID()}.webp`

  const { error: uploadError } = await supabase.storage
    .from('proposals-media')
    .upload(objectPath, processed, {
      contentType: 'image/webp',
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
