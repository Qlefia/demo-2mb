'use client'

import Script from 'next/script'

const UMAMI_SCRIPT = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? 'https://eu.umami.is/script.js'
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

/**
 * Internal CRM analytics. We only inject the Umami script when explicitly
 * configured for the deployment, and the data we send is operational
 * (page navigations) — no PII, no tracking cookies. Because access is
 * restricted to invited employees, no consent banner is required.
 */
export function AnalyticsProvider() {
  if (!UMAMI_WEBSITE_ID) return null

  return (
    <Script
      src={UMAMI_SCRIPT}
      data-website-id={UMAMI_WEBSITE_ID}
      strategy="afterInteractive"
    />
  )
}
