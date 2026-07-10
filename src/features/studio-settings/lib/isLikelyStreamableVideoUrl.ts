/** True for HTTPS URLs whose path looks like a direct media file (inline `<video>` preview). */
export function isLikelyStreamableVideoUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    if (u.protocol !== 'https:') return false
    return /\.(mp4|webm|ogg)(?:\?|$)/i.test(u.pathname)
  } catch {
    return false
  }
}
