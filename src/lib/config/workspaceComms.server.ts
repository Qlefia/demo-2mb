import 'server-only'
import type { CommsProviderStatus } from '@/lib/comms/types'

function isNonEmptyEnv(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

/**
 * Presence-only comms integration status. Phase 0 needs no env vars (tel:/mailto:).
 * Phase 1 flips `mode` to `api` when credentials are set server-side.
 */
export function getCommsProvidersStatus(): CommsProviderStatus[] {
  const easybellApi = isNonEmptyEnv(process.env.EASYBELL_API_TOKEN)
  const ionosSmtp =
    isNonEmptyEnv(process.env.IONOS_SMTP_HOST) && isNonEmptyEnv(process.env.IONOS_SMTP_USER)

  return [
    {
      id: 'easybell',
      mode: easybellApi ? 'api' : 'native',
      configured: easybellApi,
    },
    {
      id: 'ionos',
      mode: ionosSmtp ? 'api' : 'native',
      configured: ionosSmtp,
    },
  ]
}

/** Credentials checklist for Ops — what to request from Easybell / IONOS account owner. */
export const COMMS_INTEGRATION_CHECKLIST = {
  easybell: [
    'EASYBELL_API_TOKEN — REST API token (click-to-dial + CDR webhooks when enabled)',
    'EASYBELL_SIP_USER — optional SIP trunk user for deep link / softphone routing',
    'Webhook URL target — POST /api/integrations/easybell/webhook (route TBD in phase 1)',
  ],
  ionos: [
    'IONOS_SMTP_HOST — typically smtp.ionos.de or smtp.ionos.com',
    'IONOS_SMTP_USER — mailbox login (e.g. sales@yourdomain.de)',
    'IONOS_SMTP_PASSWORD — app password / mailbox password',
    'Optional IONOS_IMAP_* — for inbox sync phase 2',
  ],
} as const
