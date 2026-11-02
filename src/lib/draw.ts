import type { CardData, Site } from './types'
import { getPlatform } from '../data/platforms'
import { clamp, easeInOut, mix, rgba } from './color'
import { drawPlatformIcon, FONT } from './icon'

export const CARD_W = 900
export const CARD_H = 560
export const TRANSITION_MS = 620

const PAD = 44
export const TAB_Y = 150
export const TAB_H = 52
const PANEL_Y = 228
const PANEL_H = 220
const TAB_ICON = 17

type Ctx = CanvasRenderingContext2D

export interface RenderOptions {
  data: CardData
  avatar: HTMLImageElement | null
  time: number
}

export interface TabRect {
  x: number
  w: number
  site: Site
  label: string
}

interface FrameState {
  from: number
  to: number
  p: number
}

function frameAt(data: CardData, time: number): FrameState {
  const n = data.sites.length
  if (!n)
    return { from: 0, to: 0, p: 0 }
  const per = data.holdMs + TRANSITION_MS
  const idx = Math.floor(time / per) % n
  const local = time % per
  return {
    from: (idx - 1 + n) % n,
    to: idx,
    p: easeInOut(clamp(local / TRANSITION_MS, 0, 1)),
  }
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function setLetterSpacing(ctx: Ctx, px: number): void {
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = `${px}px`
}

function truncate(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth)
    return text
  let out = text
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth)
    out = out.slice(0, -1)
  return `${out}…`
}

/** tab 的横向排布，预览点击命中也复用它 */
export function layoutTabs(ctx: Ctx, data: CardData): TabRect[] {
  const sites = data.sites
  if (!sites.length)
    return []

  const avail = CARD_W - PAD * 2 - 10
  const measure = (padX: number) => {
    ctx.save()
    ctx.font = `600 15px ${FONT}`
    const widths = sites.map((s) => {
      const label = getPlatform(s.platform).name
      return ctx.measureText(label).width + padX * 2 + TAB_ICON + 8
    })
    ctx.restore()
    return widths
  }

  let padX = 18
  let gap = 8
  let widths = measure(padX)
  let total = widths.reduce((a, b) => a + b, 0) + gap * (sites.length - 1)
  if (total > avail) {
    padX = 12
    widths = measure(padX)
    total = widths.reduce((a, b) => a + b, 0) + gap * (sites.length - 1)
  }
  if (total > avail) {
    padX = 8
    gap = 4
    widths = measure(padX)
    total = widths.reduce((a, b) => a + b, 0) + gap * (sites.length - 1)
  }

  let x = (CARD_W - total) / 2
  const rects: TabRect[] = []
  sites.forEach((site, i) => {
    rects.push({
      x,
      w: widths[i],
      site,
      label: getPlatform(site.platform).name,
    })
    x += widths[i] + gap
  })
  return rects
}

function drawBackground(ctx: Ctx, accent: string, accent2: string): void {
  const g = ctx.createLinearGradient(120, 0, 620, CARD_H)
  g.addColorStop(0, '#090C14')
  g.addColorStop(0.5, '#0C1322')
  g.addColorStop(1, '#070A11')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glowA = ctx.createRadialGradient(CARD_W * 0.88, -40, 0, CARD_W * 0.88, -40, 520)
  glowA.addColorStop(0, rgba(accent, 0.34))
  glowA.addColorStop(0.55, rgba(accent, 0.08))
  glowA.addColorStop(1, rgba(accent, 0))
  ctx.fillStyle = glowA
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glowB = ctx.createRadialGradient(CARD_W * 0.06, CARD_H * 1.04, 0, CARD_W * 0.06, CARD_H * 1.04, 460)
  glowB.addColorStop(0, rgba(accent2, 0.2))
  glowB.addColorStop(1, rgba(accent2, 0))
  ctx.fillStyle = glowB
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.022)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 60; x < CARD_W; x += 60) {
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, CARD_H)
  }
  for (let y = 60; y < CARD_H; y += 60) {
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(CARD_W, y + 0.5)
  }
  ctx.stroke()
}

function drawAvatar(ctx: Ctx, opts: RenderOptions): void {
  const cx = PAD + 38
  const cy = 86
  const r = 38

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()

  if (opts.avatar && opts.avatar.complete && opts.avatar.naturalWidth > 0) {
    ctx.save()
    ctx.clip()
    const img = opts.avatar
    const scale = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h)
    ctx.restore()
  }
  else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
    g.addColorStop(0, '#2B3350')
    g.addColorStop(1, '#161C2C')
    ctx.fillStyle = g
    ctx.fill()
    const initial = (opts.data.name.trim()[0] ?? 'G').toUpperCase()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
    ctx.font = `600 30px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initial, cx, cy + 1)
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawHeader(ctx: Ctx, opts: RenderOptions): void {
  drawAvatar(ctx, opts)

  const name = opts.data.name.trim() || 'Your Name'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `600 34px ${FONT}`
  ctx.fillStyle = '#F4F7FF'
  ctx.fillText(truncate(ctx, name, 420), PAD + 94, 82)

  const meta = [opts.data.role, opts.data.location].map(s => s?.trim()).filter(Boolean).join('  ·  ')
  if (meta) {
    ctx.font = `400 15px ${FONT}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)'
    ctx.fillText(truncate(ctx, meta, 520), PAD + 95, 114)
  }

  ctx.textAlign = 'right'
  ctx.font = `600 11px ${FONT}`
  setLetterSpacing(ctx, 2.6)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.26)'
  ctx.fillText('GIF CARD', CARD_W - PAD, 62)
  setLetterSpacing(ctx, 0)
}

function drawTabs(ctx: Ctx, data: CardData, st: FrameState, e: number): void {
  const rects = layoutTabs(ctx, data)
  if (!rects.length)
    return

  const first = rects[0]
  const last = rects[rects.length - 1]
  const containerX = first.x - 9
  const containerW = last.x + last.w - containerX + 9

  rr(ctx, containerX, TAB_Y - 6, containerW, TAB_H + 12, 20)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
  ctx.lineWidth = 1
  ctx.stroke()

  const a = rects[st.from] ?? first
  const b = rects[st.to] ?? first
  const pa = getPlatform(a.site.platform)
  const pb = getPlatform(b.site.platform)
  const ix = a.x + (b.x - a.x) * e
  const iw = a.w + (b.w - a.w) * e
  const fromColor = mix(pa.color, pb.color, e)
  const toColor = mix(pa.color2, pb.color2, e)

  ctx.save()
  ctx.shadowColor = rgba(fromColor, 0.55)
  ctx.shadowBlur = 22
  ctx.shadowOffsetY = 4
  const pill = ctx.createLinearGradient(ix, TAB_Y, ix + iw, TAB_Y + TAB_H)
  pill.addColorStop(0, fromColor)
  pill.addColorStop(1, toColor)
  ctx.fillStyle = pill
  rr(ctx, ix, TAB_Y, iw, TAB_H, 14)
  ctx.fill()
  ctx.restore()

  const pillCenter = ix + iw / 2
  const activeInk = mix(pa.onColor, pb.onColor, e)

  for (const tab of rects) {
    const center = tab.x + tab.w / 2
    const t = clamp(1 - Math.abs(pillCenter - center) / (tab.w / 2 + 26), 0, 1)
    const ink = mix('#98A2B6', activeInk, t)
    ctx.font = `600 15px ${FONT}`
    const textW = ctx.measureText(tab.label).width
    const startX = tab.x + (tab.w - (TAB_ICON + 8 + textW)) / 2
    drawPlatformIcon(ctx, getPlatform(tab.site.platform).icon, startX + TAB_ICON / 2, TAB_Y + TAB_H / 2, TAB_ICON, ink)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = ink
    ctx.fillText(tab.label, startX + TAB_ICON + 8, TAB_Y + TAB_H / 2 + 0.5)
  }
  ctx.textBaseline = 'alphabetic'
}

function drawSiteContent(ctx: Ctx, site: Site, dx: number, alpha: number): void {
  if (alpha <= 0.01)
    return
  const p = getPlatform(site.platform)
  const tileX = PAD + 30
  const tileY = PANEL_Y + 38
  const tile = 88

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(dx, 0)

  const tileGradient = ctx.createLinearGradient(tileX, tileY, tileX + tile, tileY + tile)
  tileGradient.addColorStop(0, rgba(p.color, 0.52))
  tileGradient.addColorStop(1, rgba(p.color2, 0.14))
  rr(ctx, tileX, tileY, tile, tile, 24)
  ctx.fillStyle = tileGradient
  ctx.fill()
  ctx.strokeStyle = rgba(p.color, 0.42)
  ctx.lineWidth = 1.2
  ctx.stroke()
  drawPlatformIcon(ctx, p.icon, tileX + tile / 2, tileY + tile / 2, 44, p.onColor)

  const tx = tileX + tile + 26
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  ctx.font = `600 12px ${FONT}`
  setLetterSpacing(ctx, 2.2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.48)'
  ctx.fillText(p.name.toUpperCase(), tx, PANEL_Y + 60)
  setLetterSpacing(ctx, 0)

  const uid = site.uid.trim()
  const username = site.username.trim()
  // 标题优先用户名，缺失时回退到 ID（此时才带 @ 前缀）
  const title = username || uid || '—'
  const usePrefix = !!p.prefix && !username

  ctx.font = `600 34px ${FONT}`
  let x = tx
  if (usePrefix) {
    ctx.fillStyle = mix(p.color, '#FFFFFF', 0.12)
    ctx.fillText(p.prefix, x, PANEL_Y + 106)
    x += ctx.measureText(p.prefix).width + 2
  }
  ctx.fillStyle = '#F6F8FF'
  ctx.fillText(truncate(ctx, title, CARD_W - PAD - 34 - x), x, PANEL_Y + 106)

  // 副行始终展示 ID 拼出的主页链接，与用户名区分开
  const url = p.id === 'email'
    ? uid
    : p.url?.(uid)
  if (uid && url) {
    ctx.font = `400 13px ${FONT}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.34)'
    ctx.fillText(truncate(ctx, url, CARD_W - PAD - 34 - tx), tx, PANEL_Y + 132)
  }

  ctx.restore()
}

function drawPanel(ctx: Ctx, data: CardData, st: FrameState, e: number, accent: string): void {
  const x = PAD
  const w = CARD_W - PAD * 2

  ctx.save()
  rr(ctx, x, PANEL_Y, w, PANEL_H, 26)
  ctx.clip()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.032)'
  ctx.fillRect(x, PANEL_Y, w, PANEL_H)

  const tint = ctx.createLinearGradient(x, PANEL_Y, x + 460, PANEL_Y + PANEL_H)
  tint.addColorStop(0, rgba(accent, 0.16))
  tint.addColorStop(1, rgba(accent, 0))
  ctx.fillStyle = tint
  ctx.fillRect(x, PANEL_Y, w, PANEL_H)

  const sites = data.sites
  if (sites.length) {
    const target = getPlatform(sites[st.to].platform)
    ctx.globalAlpha = 0.05
    drawPlatformIcon(ctx, target.icon, x + w - 96, PANEL_Y + PANEL_H / 2, 168, '#FFFFFF')
    ctx.globalAlpha = 1

    drawSiteContent(ctx, sites[st.from], -44 * e, 1 - e)
    drawSiteContent(ctx, sites[st.to], 44 * (1 - e), e)
  }
  else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.font = `500 16px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('在左侧添加站点，这里会轮播你的展示令牌', x + w / 2, PANEL_Y + PANEL_H / 2)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  ctx.restore()

  const border = ctx.createLinearGradient(x, PANEL_Y, x + w, PANEL_Y + PANEL_H)
  border.addColorStop(0, rgba(accent, 0.42))
  border.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)')
  border.addColorStop(1, 'rgba(255, 255, 255, 0.04)')
  ctx.strokeStyle = border
  ctx.lineWidth = 1.2
  rr(ctx, x + 0.6, PANEL_Y + 0.6, w - 1.2, PANEL_H - 1.2, 25)
  ctx.stroke()
}

function drawFooter(ctx: Ctx, data: CardData, accent: string, st: FrameState, e: number): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, 482.5)
  ctx.lineTo(CARD_W - PAD, 482.5)
  ctx.stroke()

  const parts = [
    data.email.trim(),
    data.website.trim(),
  ].filter(Boolean)
  if (parts.length) {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.font = `500 13px ${FONT}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.36)'
    let x = PAD
    parts.forEach((part, i) => {
      if (i > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)'
        ctx.fillText('·', x + 5, 512)
        x += 20
        ctx.fillStyle = 'rgba(255, 255, 255, 0.36)'
      }
      ctx.fillText(truncate(ctx, part, 300), x, 512)
      x += ctx.measureText(part).width + 12
    })
  }

  const n = data.sites.length
  if (n) {
    const slot = 20
    const startX = CARD_W - PAD - n * slot
    const active = e < 0.5
      ? st.from
      : st.to
    for (let i = 0; i < n; i++) {
      const cx = startX + i * slot + slot / 2
      if (i === active) {
        rr(ctx, cx - 9, 506, 18, 6, 3)
        ctx.fillStyle = accent
        ctx.fill()
      }
      else {
        rr(ctx, cx - 3, 506, 6, 6, 3)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fill()
      }
    }
  }
}

export function drawCard(ctx: Ctx, opts: RenderOptions): void {
  const { data } = opts
  const st = frameAt(data, opts.time)
  const sites = data.sites
  const fromPlatform = sites.length
    ? getPlatform(sites[st.from].platform)
    : null
  const toPlatform = sites.length
    ? getPlatform(sites[st.to].platform)
    : null

  const accent = fromPlatform && toPlatform
    ? mix(fromPlatform.color, toPlatform.color, st.p)
    : '#7C8BFF'
  const accent2 = fromPlatform && toPlatform
    ? mix(fromPlatform.color2, toPlatform.color2, st.p)
    : '#4C5BD4'

  drawBackground(ctx, accent, accent2)
  drawHeader(ctx, opts)
  drawTabs(ctx, data, st, st.p)
  drawPanel(ctx, data, st, st.p, accent)
  drawFooter(ctx, data, accent, st, st.p)
}
