import type { Platform } from '../platform'
import icon from './icon.svg?raw'

export const instagram: Platform = {
  id: 'instagram',
  name: 'Instagram',
  color: '#F58529',
  color2: '#DD2A7B',
  onColor: '#FFFFFF',
  prefix: '@',
  url: uid => `instagram.com/${uid}`,
  identity: { username: '显示名', uid: '用户名' },
  icon: { svg: icon },
}
