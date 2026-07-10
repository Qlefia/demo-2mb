import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, type Database } from '@/lib/db/client'
import { env } from '@/lib/env'
import { checkInboundRateLimit } from '@/lib/inbound/rateLimit'
import { verifyWebhookSecret } from '@/lib/inbound/verifySecret'
import { insertProspectWithTrigger } from '@/lib/prospects/createProspectWithTrigger'
import { TERRITORIES } from '@/lib/db/schema/enums'
import { DEFAULT_WORKSPACE_ID } from '@/lib/workspace/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function clientKey(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function extractSecret(request: NextRequest): string | undefined {
  const h = request.headers.get('x-webhook-secret')?.trim()
  if (h) return h
  const auth = request.headers.get('authorization')?.trim()
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }
  return undefined
}

const inboundFormSchema = z
  .object({
    integration: z.literal('inbound_form'),
    companyName: z.string().min(1).max(200),
    website: z
      .string()
      .url()
      .max(500)
      .optional()
      .or(z.literal('').transform(() => undefined)),
    territory: z.enum(TERRITORIES).default('EU_other'),
    source: z.literal('inbound_form'),
    triggerText: z.string().min(1).max(2000),
    triggerSourceUrl: z
      .string()
      .url()
      .max(500)
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .strict()

const calendlySchema = z
  .object({
    integration: z.literal('calendly'),
    inviteeName: z.string().min(1).max(200),
    inviteeEmail: z.string().email(),
    eventName: z.string().max(300).optional(),
    eventUri: z.string().url().max(500).optional(),
    territory: z.enum(TERRITORIES).default('EU_other'),
  })
  .strict()

const inboundSchema = z.discriminatedUnion('integration', [inboundFormSchema, calendlySchema])

export async function POST(request: NextRequest) {
  const secretConfigured = env.INBOUND_WEBHOOK_SECRET
  if (!secretConfigured) {
    return NextResponse.json({ error: 'inbound_not_configured' }, { status: 503 })
  }

  const rl = checkInboundRateLimit(clientKey(request))
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSec: rl.retryAfterSec },
      {
        status: 429,
        headers:
          rl.retryAfterSec != null ? { 'Retry-After': String(rl.retryAfterSec) } : undefined,
      },
    )
  }

  const supplied = extractSecret(request)
  if (!supplied || !verifyWebhookSecret(supplied, secretConfigured)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = inboundSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const payload = parsed.data

  try {
    const { prospectId } = await db.transaction(async (tx) => {
      if (payload.integration === 'inbound_form') {
        return insertProspectWithTrigger(tx as unknown as Database, {
          workspaceId: DEFAULT_WORKSPACE_ID,
          accountName: payload.companyName,
          website: payload.website,
          territory: payload.territory,
          source: payload.source,
          priority: 3,
          triggerText: payload.triggerText,
          triggerType: 'inbound_form',
          triggerSourceUrl: payload.triggerSourceUrl,
        })
      }
      const parts = ['Calendly booking', payload.eventName, payload.inviteeEmail].filter(
        (x): x is string => Boolean(x && x.length > 0),
      )
      const triggerText = parts.join(' · ')
      return insertProspectWithTrigger(tx as unknown as Database, {
        workspaceId: DEFAULT_WORKSPACE_ID,
        accountName: payload.inviteeName,
        website: undefined,
        territory: payload.territory,
        source: 'manual',
        priority: 3,
        triggerText,
        triggerType: 'calendly',
        triggerSourceUrl: payload.eventUri,
      })
    })

    return NextResponse.json({ prospectId }, { status: 201 })
  } catch (err) {
    console.error('[api/inbound POST]', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
