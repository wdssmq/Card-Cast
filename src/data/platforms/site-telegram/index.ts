import type { Platform } from '../platform'
import icon from './icon.svg?raw'

export const telegram: Platform = {
  id: 'telegram',
  name: 'Telegram',
  color: '#2AABEE',
  color2: '#1878B4',
  onColor: '#FFFFFF',
  prefix: '@',
  url: uid => `t.me/${uid}`,
  identity: { username: '显示名', uid: '用户名' },
  icon: { svg: icon },
}
