import { createEffect } from 'solid-js'
import { getPlatform } from '../data/platforms'
import { drawPlatformIcon } from '../lib/icon'

export default function PlatformMark(props: {
  platform: string
  size?: number
  color?: string
}) {
  let canvas: HTMLCanvasElement | undefined

  createEffect(() => {
    const el = canvas
    if (!el)
      return
    const size = props.size ?? 18
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    el.width = Math.round(size * dpr)
    el.height = Math.round(size * dpr)
    const ctx = el.getContext('2d')
    if (!ctx)
      return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    drawPlatformIcon(ctx, getPlatform(props.platform).icon, size / 2, size / 2, size * 0.94, props.color ?? '#FFFFFF')
  })

  return (
    <canvas
      ref={canvas}
      style={{
        width: `${props.size ?? 18}px`,
        height: `${props.size ?? 18}px`,
        display: 'block',
      }}
    />
  )
}
