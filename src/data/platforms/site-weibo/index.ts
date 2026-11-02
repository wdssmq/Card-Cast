import type { Platform } from '../platform'

export const weibo: Platform = {
  id: 'weibo',
  name: '微博',
  color: '#E6162D',
  color2: '#FF6B5B',
  onColor: '#FFFFFF',
  prefix: '@',
  url: uid => `weibo.com/${uid}`,
  identity: { username: '昵称', uid: 'UID' },
  icon: { text: '微' },
}
