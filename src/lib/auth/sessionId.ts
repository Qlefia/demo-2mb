import 'server-only'

export function readSessionIdFromAccessToken(accessToken: string): string | null {
  const part = accessToken.split('.')[1]
  if (!part) return null
  try {
    const json = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as {
      session_id?: unknown
    }
    return typeof json.session_id === 'string' ? json.session_id : null
  } catch {
    return null
  }
}
