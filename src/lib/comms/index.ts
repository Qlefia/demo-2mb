export type { CommsProviderId, CommsIntegrationMode, CommsProviderStatus, OpenEmailInput } from '@/lib/comms/types'
export { normalizePhoneForTel, buildTelUri } from '@/lib/comms/phone'
export { buildMailtoUri } from '@/lib/comms/email'
export { openEasybellCall, openIonosEmail } from '@/lib/comms/clientActions'
