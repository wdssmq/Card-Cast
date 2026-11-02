/** 名片上属于「人」的部分 */
export interface Profile {
  name: string
  role: string
  location: string
  email: string
  website: string
  /** 头像 dataURL，null 表示用首字母 */
  avatar: string | null
  /** 每个站点停留时长（ms） */
  holdMs: number
  /** 导出宽度（px） */
  size: number
}

export interface Site {
  /** 内部记录主键 */
  id: string
  platform: string
  /** 平台 ID / 唯一标识，用来拼主页链接 */
  uid: string
  /** 平台用户名（昵称、显示名），可空；为空时卡片标题回退到 uid */
  username: string
  /** 插件私有数据，核心逻辑不感知内容 */
  meta: Record<string, unknown>
}

export interface CardData extends Profile {
  sites: Site[]
}

export const HOLD_MIN = 1000
export const HOLD_MAX = 4000
export const MAX_SITES = 8
export const SIZES = [600, 720, 900]
