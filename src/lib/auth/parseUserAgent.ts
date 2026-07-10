export type ParsedUserAgent = {
  device: 'Mobile' | 'Desktop'
  browser: string
  os: string
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  const str = ua ?? ''
  const isMobile = /mobile|android|iphone|ipad/i.test(str)

  let browser = 'Unknown browser'
  if (/edg/i.test(str)) browser = 'Edge'
  else if (/chrome/i.test(str)) browser = 'Chrome'
  else if (/firefox/i.test(str)) browser = 'Firefox'
  else if (/safari/i.test(str)) browser = 'Safari'
  else if (/opera|opr/i.test(str)) browser = 'Opera'

  let os = 'Unknown OS'
  if (/windows/i.test(str)) os = 'Windows'
  else if (/mac os/i.test(str)) os = 'macOS'
  else if (/linux/i.test(str)) os = 'Linux'
  else if (/android/i.test(str)) os = 'Android'
  else if (/iphone|ipad/i.test(str)) os = 'iOS'

  return { device: isMobile ? 'Mobile' : 'Desktop', browser, os }
}
