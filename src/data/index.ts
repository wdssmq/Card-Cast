import type { CardData } from '../lib/types'
import { createSite } from './sites'
import { PRESET_PROFILE, PRESET_SITES } from './user'

export { getPlatform, identityOf, PLATFORMS } from './platforms'
export type { IconSource, IdentityLabels, Platform, ResolvedIdentity } from './platforms'
export { createSite } from './sites'
export { PRESET_PROFILE, PRESET_SITES } from './user'
export type { UserSite } from './user'

/**
 * 预置名片 = 用户资料 + 用户站点（都在 data/user.ts）
 * 首次打开、点「恢复示例」时使用
 */
export function defaultData(): CardData {
  return {
    ...PRESET_PROFILE,
    sites: PRESET_SITES.map(site => createSite(site.platform, site.uid, site.username)),
  }
}
