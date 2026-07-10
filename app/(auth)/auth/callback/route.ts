import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

function safeNext(target: string | null, origin: string): URL {
  const fallback = new URL('/', origin)
  if (!target) return fallback
  if (!target.startsWith('/') || target.startsWith('//')) return fallback
  return new URL(target, origin)
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const typeParam = url.searchParams.get('type') as EmailOtpType | null
  const next = safeNext(url.searchParams.get('next'), url.origin)

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const errUrl = new URL('/login', url.origin)
      errUrl.searchParams.set('error', 'auth_callback_failed')
      return NextResponse.redirect(errUrl, { status: 302 })
    }
    return NextResponse.redirect(next, { status: 302 })
  }

  if (tokenHash && typeParam && ALLOWED_OTP_TYPES.has(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({ type: typeParam, token_hash: tokenHash })
    if (error) {
      const errUrl = new URL('/login', url.origin)
      errUrl.searchParams.set('error', 'auth_callback_failed')
      return NextResponse.redirect(errUrl, { status: 302 })
    }
    return NextResponse.redirect(next, { status: 302 })
  }

  const errUrl = new URL('/login', url.origin)
  errUrl.searchParams.set('error', 'auth_callback_invalid')
  return NextResponse.redirect(errUrl, { status: 302 })
}
