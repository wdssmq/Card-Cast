import type { Site } from '../lib/types'
import { createId } from '../lib/id'

/**
 * 站点 = 平台 + ID + 用户名，附加信息由 lib/plugins.ts 提供
 * @param platform 平台 id，见 data/platforms
 * @param uid 平台唯一 ID，用来拼主页链接（必填）
 * @param username 平台用户名/昵称，仅用于展示，可空（空时卡片标题回退到 ID）
 */
export function createSite(platform: string, uid = '', username = ''): Site {
  return {
    id: createId(),
    platform,
    uid,
    username,
    meta: {},
  }
}
