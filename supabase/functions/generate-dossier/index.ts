/**
 * Proxies AI dossier generation to the deployed CRM (same pattern as enrich-prospect).
 *
 * Supabase secrets:
 * - ENRICH_INTERNAL_SECRET — shared with CRM (`X-Enrichment-Secret`)
 * - CRM_API_BASE_URL — origin only
 *
 * Invoke: POST { "prospectId": "<uuid>" }
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-enrichment-secret',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const secret = Deno.env.get('ENRICH_INTERNAL_SECRET')
  const base = Deno.env.get('CRM_API_BASE_URL')?.replace(/\/$/, '')
  if (!secret || !base) {
    return new Response(JSON.stringify({ error: 'function_misconfigured' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  let body: { prospectId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const id = typeof body.prospectId === 'string' ? body.prospectId.trim() : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return new Response(JSON.stringify({ error: 'invalid_prospect_id' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch(`${base}/api/prospects/${id}/dossier/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Enrichment-Secret': secret,
    },
  })

  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})
