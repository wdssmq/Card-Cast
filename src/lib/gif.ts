import type { CardData } from './types'
import { CARD_H, CARD_W, drawCard, TRANSITION_MS } from './draw'

class ByteStream {
  private buf: Uint8Array
  private len = 0

  constructor(initial = 1 << 16) {
    this.buf = new Uint8Array(initial)
  }

  private ensure(extra: number): void {
    if (this.len + extra <= this.buf.length)
      return
    let cap = this.buf.length * 2
    while (cap < this.len + extra)
      cap *= 2
    const next = new Uint8Array(cap)
    next.set(this.buf.subarray(0, this.len))
    this.buf = next
  }

  byte(value: number): void {
    this.ensure(1)
    this.buf[this.len++] = value & 0xFF
  }

  u16(value: number): void {
    this.byte(value & 0xFF)
    this.byte((value >> 8) & 0xFF)
  }

  str(text: string): void {
    this.ensure(text.length)
    for (let i = 0; i < text.length; i++)
      this.buf[this.len++] = text.charCodeAt(i) & 0xFF
  }

  block(data: Uint8Array): void {
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.subarray(i, Math.min(i + 255, data.length))
      this.byte(chunk.length)
      this.ensure(chunk.length)
      this.buf.set(chunk, this.len)
      this.len += chunk.length
    }
    this.byte(0)
  }

  uint8(): Uint8Array {
    return this.buf.slice(0, this.len)
  }
}

/** GIF LZW 编码（可变码长 + 4096 复位） */
export function lzwEncode(indices: Uint8Array, minCodeSize: number): Uint8Array {
  const out = new ByteStream(Math.max(4096, indices.length >> 1))
  const clearCode = 1 << minCodeSize
  const codeMask = clearCode - 1
  const eoiCode = clearCode + 1
  let nextCode = eoiCode + 1
  let codeSize = minCodeSize + 1
  let cur = 0
  let curShift = 0

  const emit = (code: number): void => {
    cur |= code << curShift
    curShift += codeSize
    while (curShift >= 8) {
      out.byte(cur & 0xFF)
      cur >>= 8
      curShift -= 8
    }
  }

  emit(clearCode)

  if (!indices.length) {
    emit(eoiCode)
    if (curShift > 0)
      out.byte(cur & 0xFF)
    return out.uint8()
  }

  let table = new Map<number, number>()
  let ib = indices[0] & codeMask

  for (let i = 1; i < indices.length; i++) {
    const k = indices[i] & codeMask
    const key = (ib << 8) | k
    const code = table.get(key)
    if (code === undefined) {
      emit(ib)
      if (nextCode === 4096) {
        emit(clearCode)
        nextCode = eoiCode + 1
        codeSize = minCodeSize + 1
        table = new Map()
      }
      else {
        if (nextCode >= (1 << codeSize))
          codeSize++
        table.set(key, nextCode++)
      }
      ib = k
    }
    else {
      ib = code
    }
  }

  emit(ib)
  emit(eoiCode)
  if (curShift > 0)
    out.byte(cur & 0xFF)
  return out.uint8()
}

const BINS = 32768

export interface Palette {
  table: Uint8Array
  lut: Uint8Array
  colors: number
  bits: number
}

interface Box {
  bins: number[]
  count: number
  locked: boolean
}

function binChannel(bin: number, ch: number): number {
  return ch === 0
    ? (bin >> 10) & 31
    : ch === 1
      ? (bin >> 5) & 31
      : bin & 31
}

/** 中位切分量化：5bit 直方图聚合 → 按色彩跨度切分出 maxColors 个色块 */
export function buildPalette(samples: Uint8ClampedArray[], maxColors = 256): Palette {
  const counts = new Uint32Array(BINS)
  const rSum = new Float64Array(BINS)
  const gSum = new Float64Array(BINS)
  const bSum = new Float64Array(BINS)

  for (const px of samples) {
    for (let i = 0; i < px.length; i += 8) {
      const r = px[i]
      const g = px[i + 1]
      const b = px[i + 2]
      const bin = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
      counts[bin]++
      rSum[bin] += r
      gSum[bin] += g
      bSum[bin] += b
    }
  }

  const used: number[] = []
  for (let i = 0; i < BINS; i++) {
    if (counts[i])
      used.push(i)
  }

  const palette: number[] = []

  if (!used.length) {
    palette.push(0, 0, 0, 255, 255, 255)
  }
  else if (used.length <= maxColors) {
    for (const bin of used) {
      const c = counts[bin]
      palette.push(
        Math.round(rSum[bin] / c),
        Math.round(gSum[bin] / c),
        Math.round(bSum[bin] / c),
      )
    }
  }
  else {
    let total = 0
    for (const bin of used)
      total += counts[bin]

    const boxes: Box[] = [
      { bins: used, count: total, locked: false },
    ]

    while (boxes.length < maxColors) {
      let pick = -1
      let bestScore = 0
      let bestChannel = 0

      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i]
        if (box.locked || box.bins.length < 2)
          continue
        let minR = 32
        let maxR = -1
        let minG = 32
        let maxG = -1
        let minB = 32
        let maxB = -1
        for (const bin of box.bins) {
          const r = (bin >> 10) & 31
          const g = (bin >> 5) & 31
          const b = bin & 31
          if (r < minR)
            minR = r
          if (r > maxR)
            maxR = r
          if (g < minG)
            minG = g
          if (g > maxG)
            maxG = g
          if (b < minB)
            minB = b
          if (b > maxB)
            maxB = b
        }
        const ranges = [maxR - minR, maxG - minG, maxB - minB]
        let ch = 0
        if (ranges[1] > ranges[ch])
          ch = 1
        if (ranges[2] > ranges[ch])
          ch = 2
        const score = box.count * ranges[ch]
        if (score > bestScore) {
          bestScore = score
          pick = i
          bestChannel = ch
        }
      }

      if (pick < 0 || bestScore <= 0)
        break

      const box = boxes[pick]
      box.bins.sort((a, b) => binChannel(a, bestChannel) - binChannel(b, bestChannel))

      let acc = 0
      let split = 0
      for (let i = 0; i < box.bins.length - 1; i++) {
        acc += counts[box.bins[i]]
        if (acc >= box.count / 2) {
          split = i + 1
          break
        }
      }
      if (split <= 0 || split >= box.bins.length) {
        box.locked = true
        continue
      }

      const left = box.bins.slice(0, split)
      const right = box.bins.slice(split)
      let leftCount = 0
      for (const bin of left)
        leftCount += counts[bin]

      boxes[pick] = { bins: left, count: leftCount, locked: false }
      boxes.push({ bins: right, count: box.count - leftCount, locked: false })
    }

    for (const box of boxes) {
      let r = 0
      let g = 0
      let b = 0
      let c = 0
      for (const bin of box.bins) {
        r += rSum[bin]
        g += gSum[bin]
        b += bSum[bin]
        c += counts[bin]
      }
      palette.push(Math.round(r / c), Math.round(g / c), Math.round(b / c))
    }
  }

  const colors = Math.max(2, Math.min(256, palette.length / 3))
  let bits = 1
  while ((1 << bits) < colors)
    bits++
  bits = Math.max(2, bits)

  const table = new Uint8Array((1 << bits) * 3)
  table.set(palette.slice(0, colors * 3))

  const lut = new Uint8Array(BINS)
  for (let bin = 0; bin < BINS; bin++) {
    const r = (((bin >> 10) & 31) << 3) | 4
    const g = (((bin >> 5) & 31) << 3) | 4
    const b = ((bin & 31) << 3) | 4
    let best = 0
    let bestDist = Number.POSITIVE_INFINITY
    for (let c = 0; c < colors; c++) {
      const dr = r - palette[c * 3]
      const dg = g - palette[c * 3 + 1]
      const db = b - palette[c * 3 + 2]
      const dist = dr * dr + dg * dg + db * db
      if (dist < bestDist) {
        bestDist = dist
        best = c
      }
    }
    lut[bin] = best
  }

  return { table, lut, colors, bits }
}

export interface GifSource {
  width: number
  height: number
  /** 帧数 */
  count: number
  /** 每帧延迟，单位 1/100 秒 */
  delay: (index: number) => number
  /** 取第 index 帧的 RGBA 像素 */
  pixels: (index: number) => Uint8ClampedArray
  /** 用于统计配色的采样帧（可以是低分辨率缩略图） */
  samples: Uint8ClampedArray[]
}

export interface EncodeHooks {
  onFrame?: (index: number, total: number) => void
  /** 每编码多少帧让出一次事件循环，默认 2 */
  yieldEvery?: number
}

function toIndices(pixels: Uint8ClampedArray, lut: Uint8Array, target: Uint8Array): void {
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++)
    target[p] = lut[((pixels[i] >> 3) << 10) | ((pixels[i + 1] >> 3) << 5) | (pixels[i + 2] >> 3)]
}

/** 把逐帧 RGBA 合成 GIF89a（全局调色板 + 无限循环） */
export async function encodeGif(source: GifSource, hooks: EncodeHooks = {}): Promise<Uint8Array> {
  const { width, height, count } = source
  const palette = buildPalette(source.samples, 256)
  const minCodeSize = Math.max(2, palette.bits)

  const out = new ByteStream(1 << 20)
  out.str('GIF89a')
  out.u16(width)
  out.u16(height)
  out.byte(0x80 | ((palette.bits - 1) << 4) | (palette.bits - 1))
  out.byte(0)
  out.byte(0)
  for (let i = 0; i < palette.table.length; i++)
    out.byte(palette.table[i])

  out.byte(0x21)
  out.byte(0xFF)
  out.byte(11)
  out.str('NETSCAPE2.0')
  out.byte(3)
  out.byte(1)
  out.u16(0)
  out.byte(0)

  const indices = new Uint8Array(width * height)
  const yieldEvery = hooks.yieldEvery ?? 2

  for (let f = 0; f < count; f++) {
    toIndices(source.pixels(f), palette.lut, indices)

    out.byte(0x21)
    out.byte(0xF9)
    out.byte(4)
    out.byte(0x04)
    out.u16(Math.max(2, Math.round(source.delay(f))))
    out.byte(0)
    out.byte(0)

    out.byte(0x2C)
    out.u16(0)
    out.u16(0)
    out.u16(width)
    out.u16(height)
    out.byte(0)
    out.byte(minCodeSize)
    out.block(lzwEncode(indices, minCodeSize))

    hooks.onFrame?.(f, count)
    if (yieldEvery > 0 && f % yieldEvery === 0)
      await new Promise(resolve => setTimeout(resolve, 0))
  }

  out.byte(0x3B)
  return out.uint8()
}

interface FramePlan {
  time: number
  /** 单位：1/100 秒 */
  delay: number
}

function buildFramePlan(data: CardData): FramePlan[] {
  const n = data.sites.length
  if (!n) {
    return [
      { time: 0, delay: 300 },
    ]
  }

  const holdCs = Math.max(20, Math.round(data.holdMs / 10))
  const stepCs = Math.max(4, Math.round(TRANSITION_MS / 9 / 10))
  const steps = Math.max(2, Math.round(TRANSITION_MS / (stepCs * 10)))
  const per = data.holdMs + TRANSITION_MS
  const plan: FramePlan[] = []

  for (let i = 0; i < n; i++) {
    for (let k = i === 0
      ? 0
      : 1; k < steps; k++)
      plan.push({ time: i * per + (k * TRANSITION_MS) / steps, delay: stepCs })
    plan.push({ time: i * per + TRANSITION_MS + 1, delay: holdCs })
  }
  return plan
}

function createContext(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx)
    throw new Error('浏览器不支持 Canvas')
  return ctx
}

function paint(
  ctx: CanvasRenderingContext2D,
  size: { w: number, h: number },
  data: CardData,
  avatar: HTMLImageElement | null,
  time: number,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, size.w, size.h)
  const scale = size.w / CARD_W
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  drawCard(ctx, { data, avatar, time })
}

export interface BuildGifOptions {
  data: CardData
  avatar: HTMLImageElement | null
  width: number
  onProgress?: (ratio: number, label: string) => void
}

export async function buildGif(options: BuildGifOptions): Promise<Blob> {
  const { data, avatar, width } = options
  const report = options.onProgress ?? (() => {})
  const size = {
    w: Math.max(2, Math.round(width)),
    h: Math.max(2, Math.round((width * CARD_H) / CARD_W)),
  }
  const plan = buildFramePlan(data)
  const ctx = createContext(size.w, size.h)

  const sampleW = 360
  const sampleH = Math.round((sampleW * CARD_H) / CARD_W)
  const sampleCtx = createContext(sampleW, sampleH)
  const picks = Array.from({
    length: Math.min(plan.length, 12),
  }, (_, i) =>
    Math.round((i * (plan.length - 1)) / Math.max(1, Math.min(plan.length, 12) - 1)))

  const samples: Uint8ClampedArray[] = []
  for (let i = 0; i < picks.length; i++) {
    paint(sampleCtx, { w: sampleW, h: sampleH }, data, avatar, plan[picks[i]].time)
    samples.push(sampleCtx.getImageData(0, 0, sampleW, sampleH).data)
    report(((i + 1) / picks.length) * 0.15, '采样配色…')
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  const bytes = await encodeGif({
    width: size.w,
    height: size.h,
    count: plan.length,
    delay: i => plan[i].delay,
    pixels: (i) => {
      paint(ctx, size, data, avatar, plan[i].time)
      return ctx.getImageData(0, 0, size.w, size.h).data
    },
    samples,
  }, {
    onFrame: (i, total) => report(0.15 + ((i + 1) / total) * 0.85, `编码第 ${i + 1}/${total} 帧…`),
  })

  report(1, '完成')
  return new Blob([bytes as unknown as BlobPart], { type: 'image/gif' })
}
