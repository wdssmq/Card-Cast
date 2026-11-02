import type { Profile } from '../lib/types'

/** 用户自己的站点：平台 id + 平台 ID + 用户名 */
export interface UserSite {
  platform: string
  uid: string
  /** 平台用户名/昵称，仅用于展示；留空则卡片标题回退为 @ID */
  username?: string
}

/**
 * 预置用户资料（名片上属于「人」的部分）
 * 可用平台清单不在这里，见 data/platforms/
 */
export const PRESET_PROFILE: Profile = {
  name: '沉冰浮水',
  role: 'GesF Lib / diu 协会',
  location: '石家庄',
  email: 'wdssmq@qq.com',
  website: 'www.wdssmq.com',
  /** 头像：直接指向 public/avatar.png */
  avatar: '/avatar.png',
  holdMs: 2000,
  size: 720,
}

/** 预置用户站点（名片上属于「账号」的部分） */
export const PRESET_SITES: UserSite[] = [
  { platform: 'github', uid: 'wdssmq', username: '沉冰浮水' },
  { platform: 'zhihu', uid: 'wdssmq', username: '沉冰浮水' },
  { platform: 'bilibili', uid: '44744006', username: '沉冰浮水' },
]
