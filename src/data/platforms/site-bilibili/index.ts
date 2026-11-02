import type { Platform } from '../platform'
import icon from './icon.svg?raw'

export const bilibili: Platform = {
  id: 'bilibili',
  name: '哔哩哔哩',
  color: '#00A1D6',
  color2: '#00DBFF',
  onColor: '#03131B',
  prefix: '@',
  url: uid => `space.bilibili.com/${uid}`,
  identity: { username: '昵称', uid: 'UID' },
  icon: { svg: icon },
}
