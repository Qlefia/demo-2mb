/**
 * Base URL for auth redirects (confirmation, password reset).
 * Use NEXT_PUBLIC_SITE_URL in Vercel: set to https://$VERCEL_URL for auto-detection per deployment.
 * Local dev: falls back to window.location.origin.
 */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || ''
}
