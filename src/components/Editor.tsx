import type { SetStoreFunction } from 'solid-js/store'
import type { CardData } from '../lib/types'
import { createSignal, For, Show } from 'solid-js'
import { createSite, getPlatform, identityOf, PLATFORMS } from '../data'
import { normalizeUid } from '../lib/data'
import { HOLD_MAX, HOLD_MIN, MAX_SITES, SIZES } from '../lib/types'
import PlatformMark from './PlatformMark'

const MAX_AVATAR = 240

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

async function toAvatar(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取失败'))
    reader.readAsDataURL(file)
  })
  const img = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = MAX_AVATAR
  canvas.height = MAX_AVATAR
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return dataUrl
  const scale = Math.max(MAX_AVATAR / img.width, MAX_AVATAR / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, (MAX_AVATAR - w) / 2, (MAX_AVATAR - h) / 2, w, h)
  return canvas.toDataURL('image/jpeg', 0.88)
}

export default function Editor(props: {
  data: CardData
  setData: SetStoreFunction<CardData>
}) {
  const [busy, setBusy] = createSignal(false)
  let fileInput: HTMLInputElement | undefined

  const addSite = () => {
    if (props.data.sites.length >= MAX_SITES)
      return
    const used = new Set(props.data.sites.map(s => s.platform))
    const next = PLATFORMS.find(p => !used.has(p.id)) ?? PLATFORMS[0]
    props.setData('sites', sites => [
      ...sites,
      createSite(next.id),
    ])
  }

  const removeSite = (index: number) => {
    props.setData('sites', sites => sites.filter((_, i) => i !== index))
  }

  const moveSite = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= props.data.sites.length)
      return
    props.setData('sites', (sites) => {
      const next = sites.slice()
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const onPickFile = async (file: File | undefined) => {
    if (!file)
      return
    setBusy(true)
    try {
      props.setData('avatar', await toAvatar(file))
    }
    finally {
      setBusy(false)
      if (fileInput)
        fileInput.value = ''
    }
  }

  return (
    <div class="editor">
      <section class="panel">
        <div class="panel-head">
          <h2>基本信息</h2>
        </div>

        <div class="avatar-row">
          <div class="avatar-preview">
            {props.data.avatar
              ? <img src={props.data.avatar} alt="avatar" />
              : <span>{(props.data.name.trim()[0] ?? 'G').toUpperCase()}</span>}
          </div>
          <div class="avatar-actions">
            <button type="button" class="btn ghost small" onClick={() => fileInput?.click()}>
              {busy()
                ? '处理中…'
                : '上传头像'}
            </button>
            {props.data.avatar && (
              <button type="button" class="btn tiny" onClick={() => props.setData('avatar', null)}>
                移除
              </button>
            )}
            <p class="hint">建议正方形，自动裁成 240px</p>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={e => onPickFile(e.currentTarget.files?.[0])}
            />
          </div>
        </div>

        <div class="fields">
          <label class="field">
            <span>名字</span>
            <input
              type="text"
              value={props.data.name}
              placeholder="林雨"
              onInput={e => props.setData('name', e.currentTarget.value)}
            />
          </label>
          <label class="field">
            <span>身份 / 职位</span>
            <input
              type="text"
              value={props.data.role}
              placeholder="前端工程师 · 独立开发者"
              onInput={e => props.setData('role', e.currentTarget.value)}
            />
          </label>
          <label class="field">
            <span>城市</span>
            <input
              type="text"
              value={props.data.location}
              placeholder="Shanghai"
              onInput={e => props.setData('location', e.currentTarget.value)}
            />
          </label>
          <label class="field">
            <span>邮箱</span>
            <input
              type="text"
              value={props.data.email}
              placeholder="hi@example.com"
              onInput={e => props.setData('email', e.currentTarget.value)}
            />
          </label>
          <label class="field">
            <span>个人网站</span>
            <input
              type="text"
              value={props.data.website}
              placeholder="example.com"
              onInput={e => props.setData('website', e.currentTarget.value)}
            />
          </label>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>站点令牌</h2>
          <span class="counter">
            {props.data.sites.length}
            {' '}
            /
            {' '}
            {MAX_SITES}
          </span>
        </div>

        <div class="sites">
          <For each={props.data.sites}>
            {(site, index) => {
              const platform = () => getPlatform(site.platform)
              const identity = () => identityOf(platform())
              return (
                <div class="site">
                  <div class="site-main">
                    <div
                      class="site-mark"
                      style={{ background: `linear-gradient(135deg, ${platform().color}, ${platform().color2})` }}
                    >
                      <PlatformMark platform={site.platform} size={16} color={platform().onColor} />
                    </div>

                    <select
                      class="select"
                      value={site.platform}
                      onChange={e => props.setData('sites', index(), 'platform', e.currentTarget.value)}
                    >
                      <For each={PLATFORMS}>
                        {p => <option value={p.id}>{p.name}</option>}
                      </For>
                    </select>

                    <Show
                      when={!identity().single}
                      fallback={(
                        <input
                          class="site-field"
                          type="text"
                          value={site.uid}
                          placeholder={identity().uidLabel}
                          onInput={e => props.setData('sites', index(), 'uid', e.currentTarget.value)}
                        />
                      )}
                    >
                      <input
                        class="site-field"
                        type="text"
                        value={site.username}
                        placeholder={`${identity().usernameLabel}（展示用，可空）`}
                        onInput={e => props.setData('sites', index(), 'username', e.currentTarget.value)}
                      />
                    </Show>

                    <div class="site-tools">
                      <button type="button" class="icon-btn" title="上移" onClick={() => moveSite(index(), -1)}>↑</button>
                      <button type="button" class="icon-btn" title="下移" onClick={() => moveSite(index(), 1)}>↓</button>
                      <button type="button" class="icon-btn danger" title="删除" onClick={() => removeSite(index())}>✕</button>
                    </div>
                  </div>

                  <Show when={!identity().single}>
                    <div class="site-id">
                      <span class="site-id-label">{identity().uidLabel}</span>
                      <input
                        type="text"
                        value={site.uid}
                        placeholder="ID，或直接粘贴主页链接"
                        onInput={e => props.setData('sites', index(), 'uid', e.currentTarget.value)}
                        onBlur={e => props.setData('sites', index(), 'uid', normalizeUid(e.currentTarget.value))}
                      />
                    </div>
                  </Show>
                </div>
              )
            }}
          </For>
        </div>

        <button
          type="button"
          class="btn ghost add-site"
          disabled={props.data.sites.length >= MAX_SITES}
          onClick={addSite}
        >
          + 添加站点
        </button>

        <p class="hint">
          用户名只用于展示（可留空，此时标题回退为 ID）；ID 用于生成主页链接，可直接粘贴主页链接自动提取。附加信息预留了插件扩展点（
          <code>src/lib/plugins.ts</code>
          ），当前未启用。
        </p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>动效与导出</h2>
        </div>

        <label class="field">
          <span>
            每个站点停留
            <b>
              {(props.data.holdMs / 1000).toFixed(1)}
              s
            </b>
          </span>
          <input
            type="range"
            min={HOLD_MIN}
            max={HOLD_MAX}
            step={200}
            value={props.data.holdMs}
            onInput={e => props.setData('holdMs', Number(e.currentTarget.value))}
          />
        </label>

        <label class="field">
          <span>导出宽度</span>
          <select
            class="select wide"
            value={String(props.data.size)}
            onChange={e => props.setData('size', Number(e.currentTarget.value))}
          >
            <For each={SIZES}>
              {s => (
                <option value={String(s)}>
                  {s}
                  {' '}
                  ×
                  {' '}
                  {Math.round((s * 560) / 900)}
                  {' '}
                  px
                </option>
              )}
            </For>
          </select>
        </label>

        <p class="hint">
          切换动画固定 0.6s，导出时按 10fps 采样过渡帧，静态停留只保留一帧，体积更小。
        </p>
      </section>
    </div>
  )
}
