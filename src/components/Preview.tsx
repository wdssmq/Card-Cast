import type { CardData } from '../lib/types'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { CARD_H, CARD_W, drawCard, layoutTabs, TAB_H, TAB_Y, TRANSITION_MS } from '../lib/draw'
import { buildGif } from '../lib/gif'

export default function Preview(props: { data: CardData }) {
  let canvas: HTMLCanvasElement | undefined
  let stage: HTMLDivElement | undefined

  const [playing, setPlaying] = createSignal(true)
  const [exporting, setExporting] = createSignal(false)
  const [progress, setProgress] = createSignal(0)
  const [status, setStatus] = createSignal('')

  let time = 0
  let lastTs = 0
  let signature = ''
  let avatar: HTMLImageElement | null = null

  const draw = () => {
    const el = canvas
    if (!el)
      return
    const ctx = el.getContext('2d')
    if (!ctx)
      return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = el.clientWidth || 720
    const w = Math.round(cssW * dpr)
    const h = Math.round(cssW * (CARD_H / CARD_W) * dpr)
    if (el.width !== w || el.height !== h) {
      el.width = w
      el.height = h
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const scale = w / CARD_W
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    drawCard(ctx, { data: props.data, avatar, time })
  }

  createEffect(() => {
    const src = props.data.avatar
    if (!src) {
      avatar = null
      signature = ''
      return
    }
    const img = new Image()
    img.onload = () => {
      avatar = img
      signature = ''
    }
    img.src = src
  })

  onMount(() => {
    let raf = 0
    const loop = (ts: number) => {
      const dt = lastTs
        ? Math.min(ts - lastTs, 120)
        : 16
      lastTs = ts
      if (playing())
        time += dt
      const sig = `${Math.round(time)}|${avatar ? 1 : 0}|${JSON.stringify(props.data)}`
      if (sig !== signature) {
        signature = sig
        draw()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const observer = new ResizeObserver(() => {
      signature = ''
    })
    if (stage)
      observer.observe(stage)

    onCleanup(() => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    })
  })

  const jumpToTab = (event: MouseEvent) => {
    const el = canvas
    if (!el || !props.data.sites.length)
      return
    const rect = el.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * CARD_W
    const y = ((event.clientY - rect.top) / rect.height) * CARD_H
    if (y < TAB_Y - 8 || y > TAB_Y + TAB_H + 8)
      return
    const ctx = el.getContext('2d')
    if (!ctx)
      return
    const tabs = layoutTabs(ctx, props.data)
    const hit = tabs.findIndex(t => x >= t.x && x <= t.x + t.w)
    if (hit < 0)
      return
    time = hit * (props.data.holdMs + TRANSITION_MS) + TRANSITION_MS + 20
    setPlaying(false)
    signature = ''
  }

  const download = async () => {
    if (exporting())
      return
    setExporting(true)
    setProgress(0)
    setStatus('准备中…')
    try {
      const blob = await buildGif({
        data: props.data,
        avatar,
        width: props.data.size,
        onProgress: (ratio, label) => {
          setProgress(ratio)
          setStatus(label)
        },
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const name = (props.data.name.trim() || 'card').replace(/[\\/:*?"<>|\s]+/g, '-')
      link.href = url
      link.download = `${name}-card.gif`
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      setStatus(`已导出 ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
    }
    catch (error) {
      setStatus(`导出失败：${(error as Error).message}`)
    }
    finally {
      setExporting(false)
      setProgress(0)
    }
  }

  return (
    <aside class="preview">
      <div class="stage" ref={stage}>
        <canvas ref={canvas} class="stage-canvas" onClick={jumpToTab} />
        <Show when={exporting()}>
          <div class="stage-overlay">
            <strong>正在生成 GIF</strong>
            <div class="bar"><i style={{ width: `${Math.round(progress() * 100)}%` }} /></div>
            <span>
              {status()}
              {' '}
              ·
              {' '}
              {Math.round(progress() * 100)}
              %
            </span>
          </div>
        </Show>
      </div>

      <div class="actions">
        <button type="button" class="btn ghost" onClick={() => setPlaying(v => !v)}>
          {playing()
            ? '暂停'
            : '播放'}
        </button>
        <button
          type="button"
          class="btn ghost"
          onClick={() => {
            time = 0
            setPlaying(true)
            signature = ''
          }}
        >
          重播
        </button>
        <button type="button" class="btn primary" disabled={exporting()} onClick={download}>
          {exporting()
            ? '生成中…'
            : '下载 GIF'}
        </button>
      </div>

      <p class="status">{status() || '点击画布上的 tab 可以停在某个站点'}</p>
    </aside>
  )
}
