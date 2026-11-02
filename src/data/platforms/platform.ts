/**
 * 站点（平台）配置类型
 * --------------------
 * 每个站点是一个独立目录：src/data/platforms/site-<id>/
 *   ├─ index.ts   导出一个 Platform 常量
 *   └─ icon.svg   该站点的图标（可选，交给 lib/icon.ts 解析绘制）
 * 新增站点：建目录 → 写 index.ts（可带 icon.svg）→ 在 platforms/index.ts 里登记。
 */

/**
 * 图标来源
 * - svg：站点的 icon.svg 原文（`import svg from './icon.svg?raw'`）
 * - text：没有可用矢量图时的文字图标，如「知」「红」「in」
 */
export interface IconSource {
  svg?: string
  text?: string
}

/**
 * 身份字段的平台差异
 * - 默认区分「用户名（展示用）」与「ID（拼链接用）」
 * - single 表示该平台只有一个标识值（邮箱、域名这类）
 */
export interface IdentityLabels {
  single?: boolean
  /** 用户名字段文案，默认「用户名」 */
  username?: string
  /** ID 字段文案，默认「ID」 */
  uid?: string
}

export interface Platform {
  id: string
  name: string
  /** 品牌主色，用于 tab 高亮与光晕 */
  color: string
  /** 渐变的收尾色 */
  color2: string
  /** 落在主色上的文字颜色 */
  onColor: string
  /** ID 前缀，仅在用户名缺省、用 ID 当标题时显示 */
  prefix: string
  /** 由平台 ID 拼出主页链接 */
  url?: (uid: string) => string
  identity?: IdentityLabels
  icon: IconSource
}

export interface ResolvedIdentity {
  single: boolean
  usernameLabel: string
  uidLabel: string
}
