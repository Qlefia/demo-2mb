# GDPR Audit Report

**Date:** 2026-03-18  
**Scope:** Full codebase scan for GDPR and data privacy issues  
**Reference:** BACKLOG.md, product legal pages under `app/legal/`

---

## 1. Font Loading — GDPR Compliance

### Current Implementation

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-sans',
})
```

### Verdict: **GDPR Compliant**

**Reasoning:**

- `next/font/google` **self-hosts** fonts at build time. Fonts are downloaded during `next build` and served from your own domain (`/_next/static/media/*.woff2`).
- **No external requests to Google** at runtime. The browser never contacts `fonts.googleapis.com` or `fonts.gstatic.com`.
- No IP address or other data is sent to Google.
- No third-party cookies or tracking from font loading.

**Alternative (non-compliant):** Loading via `<link href="https://fonts.googleapis.com/css2?family=Inter">` would send the user's IP to Google (US servers) and trigger GDPR concerns (data transfer, potential tracking).

---

## 2. PII Handling

| Check | Status | Notes |
|-------|--------|------|
| No `console.log` of PII | Pass | No `console.log/info/debug/warn/error` in `src/` |
| No PII in URL params | Pass | No email/name/phone in query strings |
| Sentry/Umami | N/A | Internal CRM with no public exposure. If Umami is wired in via `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, only operational page navigation events are sent (no PII, no tracking cookies). |

---

## 3. Cookies and Consent

| Check | Status | Notes |
|-------|--------|------|
| Cookie banner | N/A | Internal tool with closed registration; only strictly necessary auth + functional UI storage. No banner required under GDPR/TTDSG. |
| Strictly necessary cookies | Pass | Supabase `sb-*-auth-token` only |
| Functional storage | Pass | `2mb-crm-user`, `2mb-crm-language`, `2mb-crm-prospects-ui` (localStorage; UI preferences) |
| Tracking / advertising cookies | Pass | None |
| Consent log retained | Pass | `consent_log` table preserved for any future opt-in features |

### Cookie Table (real storage, not placeholders)

| Name | Type | Purpose |
|------|------|---------|
| sb-*-auth-token | Cookie | Supabase auth session (strictly necessary) |
| 2mb-crm-user | localStorage | UI preferences (sidebar, theme) for the signed-in user |
| 2mb-crm-language | localStorage | Selected interface language (DE / EN) |
| 2mb-crm-prospects-ui | localStorage | Cached prospect filters and view mode |

### No consent banner (internal CRM)

2mb CRM is an internal tool with closed registration. We only set strictly
necessary auth cookies and functional `localStorage` entries (UI preferences),
no analytics or advertising tracking. Under GDPR/TTDSG no cookie consent
banner is required for these categories. The `consent_log` table is retained
for any optional opt-in features added later (e.g. Umami analytics opt-in).

---

## 4. Data Residency

| Check | Status | Notes |
|-------|--------|------|
| Supabase region | Pass | `eu-central-1` (Frankfurt) |
| Vercel region | Pass | `fra1` (Frankfurt) per AGENTS.md |
| localStorage | Pass | First-party only; no third-party access |

---

## 5. Right to Erasure

| Check | Status | Notes |
|-------|--------|------|
| Cascade deletion in schema | Pass | Drizzle uses `onDelete: 'cascade'` on owner-scoped tables. **Supabase (2mb CRM):** `public.users.id` references `auth.users(id)` with `ON DELETE CASCADE`, so `auth.admin.deleteUser` removes the profile and dependent rows. |
| Workspace delete | Pass | `POST /api/workspace/delete` removes the workspace immediately when subscription is not in a blocking state (same rule as billing). UI hint matches immediate deletion; statutory retention and backups are described in the Privacy Policy. |
| "Delete my account" flow | Pass | Settings > Data Privacy > Danger Zone. `POST /api/account/delete` checks blocking subscription status for **all** workspaces owned by the user, then `auth.admin.deleteUser`. Client clears local stores and redirects to login. |
| Policy copy (Art. 12 vs 17) | Pass | Privacy strings distinguish **one calendar month** for data-subject request handling (Art. 12(3)) from **without undue delay** erasure from production when deleting in-app (Art. 17), plus backup rotation and tax retention. Terms termination clause states it is separate from Art. 17 requests. |
| Sub-processors | Partial | Respondent/account data in our DB is deleted per above; invoices and payment artefacts may remain with **Paddle** (MoR) per their DPA — covered at high level in Privacy Policy. |

---

## 6. Third-Party Services

| Service | Status | GDPR Note |
|---------|--------|-----------|
| Google Fonts | Compliant | Self-hosted via Next.js; no external requests |
| Sentry | Not connected | When added: EU region, PII disabled, gate by consent |
| Umami | Gated | Loaded only when `analytics` consent; EU script URL |
| Supabase | Compliant | `eu-central-1` |

---

## Summary

| Category | Result |
|----------|--------|
| **Font loading** | Compliant — self-hosted, no Google requests |
| **PII handling** | Pass |
| **Cookie consent UI** | Pass |
| **Cookie consent enforcement** | Pass — useCookieGate, AnalyticsProvider, cleanup |
| **Data residency** | Pass |
| **Right to erasure** | Pass |

---

## Recommended Actions

1. **Fonts:** No change needed.
2. **Sentry:** When adding @sentry/nextjs, ensure init is gated by `useCookieGate('analytics')` and PII is disabled.
3. **Account deletion:** Subscription guard + `deleteUser`; verify Paddle-side data handling with counsel when going live.
