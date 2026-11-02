import type { Platform } from '../platform'

/** 没有可靠的单色矢量图，用文字图标替代（icon.text） */
export const zhihu: Platform = {
  id: 'zhihu',
  name: '知乎',
  color: '#0F88EB',
  color2: '#0057C2',
  onColor: '#FFFFFF',
  prefix: '@',
  url: uid => `zhihu.com/people/${uid}`,
  identity: { username: '用户名', uid: 'ID' },
  icon: { text: '知' },
}
