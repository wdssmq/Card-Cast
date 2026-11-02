import type { Platform } from '../platform'
import icon from './icon.svg?raw'

export const juejin: Platform = {
  id: 'juejin',
  name: '掘金',
  color: '#1E80FF',
  color2: '#0A4FC4',
  onColor: '#FFFFFF',
  prefix: '@',
  url: uid => `juejin.cn/user/${uid}`,
  identity: { username: '用户名', uid: '用户 ID' },
  icon: { svg: icon },
}
