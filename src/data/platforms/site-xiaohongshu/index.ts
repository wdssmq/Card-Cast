import type { Platform } from '../platform'

export const xiaohongshu: Platform = {
  id: 'xiaohongshu',
  name: '小红书',
  color: '#FF2442',
  color2: '#FF6C82',
  onColor: '#FFFFFF',
  prefix: '@',
  url: uid => `xiaohongshu.com/user/profile/${uid}`,
  identity: { username: '昵称', uid: '小红书号' },
  icon: { text: '红' },
}
