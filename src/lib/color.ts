export interface Rgb {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): Rgb {
  let h = hex.replace('#', '').trim()
  if (h.length === 3)
    h = h.split('').map(c => c + c).join('')
  const v = Number.parseInt(h, 16)
  if (Number.isNaN(v))
    return { r: 255, g: 255, b: 255 }
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  const k = Math.min(1, Math.max(0, t))
  const channel = (x: number, y: number) => Math.round(x + (y - x) * k)
  return `#${[
    channel(A.r, B.r),
    channel(A.g, B.g),
    channel(A.b, B.b),
  ]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')}`
}

export function clamp(v: number, min: number, max: number): number {
  return v < min
    ? min
    : v > max
      ? max
      : v
}

export function easeInOut(p: number): number {
  const t = clamp(p, 0, 1)
  return t < 0.5
    ? 4 * t * t * t
    : 1 - ((-2 * t + 2) ** 3) / 2
}
