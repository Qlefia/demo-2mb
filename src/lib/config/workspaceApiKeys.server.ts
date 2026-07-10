import 'server-only'

/** Keys mirrored in Settings → API Keys (server env only today). */
export const WORKSPACE_API_KEY_IDS = [
  'apollo',
  'phantombuster',
  'browse_ai',
  'anthropic',
] as const

export type WorkspaceApiKeyId = (typeof WORKSPACE_API_KEY_IDS)[number]

export type WorkspaceApiKeysConfigured = Record<WorkspaceApiKeyId, boolean>

function isNonEmptyEnv(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

/**
 * Presence-only check for server-side env vars. Never return raw values.
 * Used by GET /api/settings/api-keys-status.
 */
export function getWorkspaceApiKeysConfigured(): WorkspaceApiKeysConfigured {
  return {
    apollo: isNonEmptyEnv(process.env.APOLLO_API_KEY),
    phantombuster: isNonEmptyEnv(process.env.PHANTOMBUSTER_API_KEY),
    browse_ai: isNonEmptyEnv(process.env.BROWSE_AI_API_KEY),
    anthropic: isNonEmptyEnv(process.env.ANTHROPIC_API_KEY),
  }
}
