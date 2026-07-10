/** Relative luminance (sRGB) — 0 = black, 1 = white. */
export function hexRelativeLuminance(hex: string): number {
  const h = hex.replace('#', '')
  if (h.length !== 6) return 0
  const channels = [0, 2, 4].map((i) => {
    const c = Number.parseInt(h.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

/** Blend two hex colors (t = 0 → a, t = 1 → b). */
export function mixHexColors(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '')
    return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16))
  }
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  const r = clamp(ar + (br - ar) * t)
  const g = clamp(ag + (bg - ag) * t)
  const bl = clamp(ab + (bb - ab) * t)
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}
