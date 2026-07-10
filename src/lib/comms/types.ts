export type CommsProviderId = 'easybell' | 'ionos'

/** Phase 0 = OS handlers (tel:/mailto:). Phase 1 = server API when credentials exist. */
export type CommsIntegrationMode = 'native' | 'api'

export type CommsProviderStatus = {
  id: CommsProviderId
  mode: CommsIntegrationMode
  configured: boolean
}

export type OpenEmailInput = {
  to: string
  subject?: string
  body?: string
}
