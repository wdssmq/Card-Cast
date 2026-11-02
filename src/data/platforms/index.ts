import type { Platform, ResolvedIdentity } from './platform'
import { bilibili } from './site-bilibili'
import { douyin } from './site-douyin'
import { email } from './site-email'
import { github } from './site-github'
import { instagram } from './site-instagram'
import { juejin } from './site-juejin'
import { linkedin } from './site-linkedin'
import { telegram } from './site-telegram'
import { website } from './site-website'
import { weibo } from './site-weibo'
import { x } from './site-x'
import { xiaohongshu } from './site-xiaohongshu'
import { youtube } from './site-youtube'
import { zhihu } from './site-zhihu'

export type { IconSource, IdentityLabels, Platform, ResolvedIdentity } from './platform'

/** 可用站点清单，顺序即编辑器下拉与默认配色顺序 */
export const PLATFORMS: Platform[] = [
  github,
  bilibili,
  zhihu,
  juejin,
  xiaohongshu,
  weibo,
  douyin,
  x,
  youtube,
  instagram,
  telegram,
  linkedin,
  email,
  website,
]

const PLATFORM_MAP = new Map(PLATFORMS.map(p => [p.id, p]))

export function getPlatform(id: string): Platform {
  const platform = PLATFORM_MAP.get(id)
  if (!platform)
    throw new Error(`未知站点：${id}`)
  return platform
}

export function identityOf(platform: Platform): ResolvedIdentity {
  return {
    single: platform.identity?.single ?? false,
    usernameLabel: platform.identity?.username ?? '用户名',
    uidLabel: platform.identity?.uid ?? 'ID',
  }
}
