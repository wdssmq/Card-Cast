import type { Platform } from '../platform'
import icon from './icon.svg?raw'

/** 单值平台：只有一个「域名」字段，链接就是域名本身 */
export const website: Platform = {
  id: 'website',
  name: 'Website',
  color: '#A78BFA',
  color2: '#6D38E0',
  onColor: '#FFFFFF',
  prefix: '',
  url: uid => uid,
  identity: { single: true, uid: '域名' },
  icon: { svg: icon },
}
