import type { Platform } from '../platform'
import icon from './icon.svg?raw'

export const x: Platform = {
  id: 'x',
  name: 'X',
  color: '#F2F4F7',
  color2: '#B9C2D0',
  onColor: '#0A0E16',
  prefix: '@',
  url: uid => `x.com/${uid}`,
  identity: { username: '显示名', uid: '用户名' },
  icon: { svg: icon },
}
