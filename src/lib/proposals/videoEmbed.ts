/** Resolve pasted URLs for proposal deck video blocks (iframe embed vs native video tag). */

export type VideoPlayback =
  | { mode: 'iframe'; src: string }
  | { mode: 'video'; src: string }

function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') {
    const id = url.pathname.replace(/^\//, '').split('/')[0]
    return id || null
  }
  if (host.endsWith('youtube.com')) {
    const v = url.searchParams.get('v')
    if (v) return v
    const parts = url.pathname.split('/').filter(Boolean)
    const embedIdx = parts.indexOf('embed')
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1]
    const shortIdx = parts.indexOf('shorts')
    if (shortIdx >= 0 && parts[shortIdx + 1]) return parts[shortIdx + 1]
  }
  return null
}

function vimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts[0] === 'video' && parts[1]) return parts[1]
  if (parts[0] && /^\d+$/.test(parts[0])) return parts[0]
  return null
}

export function resolveVideoPlayback(raw: string): VideoPlayback | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const yt = youtubeVideoId(url)
    if (yt) {
      return {
        mode: 'iframe',
        src: `https://www.youtube-nocookie.com/embed/${yt}`,
      }
    }
    const vm = vimeoId(url)
    if (vm) {
      return {
        mode: 'iframe',
        src: `https://player.vimeo.com/video/${vm}`,
      }
    }
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return { mode: 'video', src: url.toString() }
    }
  } catch {
    return null
  }
  return null
}
