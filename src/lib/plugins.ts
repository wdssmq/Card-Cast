import type { Platform } from '../data/platforms/platform'
import type { Site } from './types'

/**
 * 站点附加信息插件机制（**仅接口，仓库内未内置任何插件**）
 * ============================================================
 * 核心只知道「平台 + ID」这两样东西：
 *
 *   interface Site { id, platform, username, uid, meta }
 *
 * `meta` 是留给插件的空盒子，核心不解释其中任何键值。
 * 将来需要粉丝数、Stars、认证标记、个性签名之类的扩展信息时，
 * 实现一个 SitePlugin 并 `registerPlugin(...)` 即可，核心代码无需改动。
 *
 * 一个插件的完整形态：
 *
 *   registerPlugin({
 *     id: 'github-live',
 *     name: 'GitHub 实时数据',
 *     match: site => site.platform === 'github',
 *     // 异步取数，返回值合并进 site.meta，插件自行决定缓存策略
 *     hydrate: async (site) => ({ stars: await fetchStars(site.uid) }),
 *     // 用 meta 里的数据产出卡片上的指标胶囊
 *     stats: (site) => [{ label: 'Stars', value: String(site.meta.stars ?? '') }],
 *   })
 *
 * 四个可选钩子的语义：
 * - fields：声明式编辑字段，值是 site.meta[field.key]；由编辑器决定如何渲染
 * - stats：卡片面板里的指标胶囊（label + value），返回值里 value 为空的项应被忽略
 * - caption：面板里「ID 链接行」之后的补充说明
 * - hydrate：异步补数据，不得阻塞渲染；返回对象会合并进 site.meta
 *
 * 当前版本没有任何内置插件，因此：
 * - 编辑器不渲染任何附加字段（站点只填平台与 ID）
 * - 渲染器不绘制任何附加信息（不调用 stats / caption）
 * 将来接入时：在 Editor 的站点行里遍历 pluginsFor(site) 渲染 fields，
 * 在 draw.ts 的 drawSiteContent 里遍历 pluginsFor(site) 取用 stats / caption。
 */

export interface PluginStat {
  label: string
  value: string
}

export interface PluginField {
  /** 写入 site.meta[key] */
  key: string
  label: string
  placeholder?: string | ((site: Site, platform: Platform) => string)
  /** 栅格占比，默认 1（半行） */
  span?: 1 | 2
}

export interface PluginContext {
  platform: Platform
}

export interface SitePlugin {
  id: string
  name: string
  description?: string
  /** 只对该站点生效，缺省表示全部站点生效 */
  match?: (site: Site) => boolean
  /** 编辑器里可编辑的附加字段 */
  fields?: PluginField[]
  /** 卡片上展示的指标 */
  stats?: (site: Site, ctx: PluginContext) => PluginStat[]
  /** ID 链接行之后的补充说明 */
  caption?: (site: Site, ctx: PluginContext) => string | undefined
  /** 异步补数据，返回值会合并进 site.meta */
  hydrate?: (site: Site, ctx: PluginContext) => Promise<Record<string, unknown> | void>
}

const registry: SitePlugin[] = []

export function registerPlugin(plugin: SitePlugin): void {
  if (registry.some(p => p.id === plugin.id))
    return
  registry.push(plugin)
}

export function getPlugins(): SitePlugin[] {
  return registry.slice()
}

/** 命中了 match 的插件（缺省 match 视为全部命中） */
export function pluginsFor(site: Site): SitePlugin[] {
  return registry.filter(p => !p.match || p.match(site))
}
