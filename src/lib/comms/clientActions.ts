import { buildMailtoUri } from '@/lib/comms/email'
import { buildTelUri } from '@/lib/comms/phone'
import type { OpenEmailInput } from '@/lib/comms/types'

function navigate(uri: string): void {
  window.location.href = uri
}

/** Opens the system dialer / Easybell softphone handler via `tel:`. */
export function openEasybellCall(phone: string): boolean {
  const uri = buildTelUri(phone)
  if (!uri) return false
  navigate(uri)
  return true
}

/** Opens the default mail client (IONOS mailbox when configured in the OS). */
export function openIonosEmail(input: OpenEmailInput): boolean {
  const uri = buildMailtoUri(input)
  if (!uri) return false
  navigate(uri)
  return true
}
