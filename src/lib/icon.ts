import type { IconSource } from '../data/platforms/platform'

export const FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif'

interface ParsedIcon {
  /** viewBox 边长，用于把图标缩放到目标尺寸 */
  box: number
  /** 线框粗细（viewBox 坐标系内） */
  strokeWidth: number
  strokes: Path2D[]
  fills: Path2D[]
}

const parsedCache = new Map<string, ParsedIcon>()

/**
 * 解析站点自带的 icon.svg
 * - 只取 <path>；坐标系取 viewBox 的宽
 * - 根节点 fill="none" 时 path 按线框绘制；path 自身写 fill="currentColor" 则按实心绘制
 * - 线宽取根节点 stroke-width，默认 2.1
 */
function parseIcon(svg: string): ParsedIcon {
  const cached = parsedCache.get(svg)
  if (cached)
    return cached

  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  const viewBox = (root.getAttribute('viewBox') ?? '0 0 24 24').split(/[\s,]+/).map(Number)
  const box = viewBox[2] > 0
    ? viewBox[2]
    : 24
  const rootFill = root.getAttribute('fill') ?? 'currentColor'
  const strokeWidth = Number(root.getAttribute('stroke-width')) || 2.1

  const strokes: Path2D[] = []
  const fills: Path2D[] = []
  for (const el of Array.from(doc.querySelectorAll('path'))) {
    const d = el.getAttribute('d')
    if (!d)
      continue
    const path = new Path2D(d)
    if ((el.getAttribute('fill') ?? rootFill) === 'none')
      strokes.push(path)
    else
      fills.push(path)
  }

  const parsed: ParsedIcon = { box, strokeWidth, strokes, fills }
  parsedCache.set(svg, parsed)
  return parsed
}

/**
 * 以 (cx, cy) 为中心、边长 size 绘制站点图标。
 * 优先用站点目录里的 icon.svg，没有则回退到文字图标（知乎「知」、LinkedIn「in」等）。
 */
export function drawPlatformIcon(
  ctx: CanvasRenderingContext2D,
  icon: IconSource,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = color

  if (icon.text) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const scale = icon.text.length > 1
      ? 0.6
      : 0.86
    ctx.font = `800 ${size * scale}px ${FONT}`
    ctx.fillText(icon.text, cx, cy + size * 0.03)
    ctx.restore()
    return
  }

  if (!icon.svg) {
    ctx.restore()
    return
  }

  const { box, strokeWidth, strokes, fills } = parseIcon(icon.svg)
  ctx.translate(cx - size / 2, cy - size / 2)
  ctx.scale(size / box, size / box)
  ctx.lineWidth = strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const path of strokes)
    ctx.stroke(path)
  for (const path of fills)
    ctx.fill(path)

  ctx.restore()
}
