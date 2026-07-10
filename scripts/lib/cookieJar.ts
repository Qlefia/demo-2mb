/**
 * Tiny cookie jar for Node fetch — just enough to hold the SSR session
 * cookies that Next.js / Supabase set during smoke runs. Not RFC-compliant,
 * not for production use.
 */

interface CookieEntry {
  name: string
  value: string
  path: string
}

export interface CookieJar {
  set: (host: string, name: string, value: string, path?: string) => void
  ingest: (host: string, setCookieHeaders: string[]) => void
  toHeader: (host: string) => string | null
}

export function createCookieJar(): CookieJar {
  const store = new Map<string, Map<string, CookieEntry>>()

  function getHostBucket(host: string): Map<string, CookieEntry> {
    let bucket = store.get(host)
    if (!bucket) {
      bucket = new Map()
      store.set(host, bucket)
    }
    return bucket
  }

  return {
    set(host, name, value, path = '/') {
      const bucket = getHostBucket(host)
      bucket.set(name, { name, value, path })
    },
    ingest(host, setCookieHeaders) {
      const bucket = getHostBucket(host)
      for (const raw of setCookieHeaders) {
        const [pair, ...attrs] = raw.split(';').map((s) => s.trim())
        if (!pair) continue
        const eq = pair.indexOf('=')
        if (eq <= 0) continue
        const name = pair.slice(0, eq)
        const value = pair.slice(eq + 1)
        let path = '/'
        for (const attr of attrs) {
          const lower = attr.toLowerCase()
          if (lower.startsWith('path=')) path = attr.slice('path='.length)
          if (lower === 'max-age=0' || lower.startsWith('expires=thu, 01 jan 1970')) {
            bucket.delete(name)
            break
          }
        }
        if (bucket.has(name) || value !== '') {
          bucket.set(name, { name, value, path })
        }
      }
    },
    toHeader(host) {
      const bucket = store.get(host)
      if (!bucket || bucket.size === 0) return null
      return Array.from(bucket.values())
        .map((c) => `${c.name}=${c.value}`)
        .join('; ')
    },
  }
}

function pickSetCookieHeaders(headers: Headers): string[] {
  // Node's fetch exposes the raw set-cookie list via getSetCookie().
  const maybeWith = headers as Headers & { getSetCookie?: () => string[] }
  if (typeof maybeWith.getSetCookie === 'function') {
    return maybeWith.getSetCookie()
  }
  const flat = headers.get('set-cookie')
  return flat ? [flat] : []
}

export async function jarFetch(
  jar: CookieJar,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const u = new URL(url)
  const headers = new Headers(init?.headers)
  const cookieHeader = jar.toHeader(u.host)
  if (cookieHeader && !headers.has('cookie')) {
    headers.set('cookie', cookieHeader)
  }
  const res = await fetch(url, { ...init, headers, redirect: 'manual' })
  jar.ingest(u.host, pickSetCookieHeaders(res.headers))

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location')
    if (location) {
      const nextUrl = new URL(location, url).toString()
      return jarFetch(jar, nextUrl, { method: 'GET' })
    }
  }
  return res
}
