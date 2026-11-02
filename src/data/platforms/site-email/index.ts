import type { Platform } from '../platform'
import icon from './icon.svg?raw'

/** 单值平台：只有一个「邮箱」字段，没有用户名 */
export const email: Platform = {
  id: 'email',
  name: 'Email',
  color: '#6EE7B7',
  color2: '#22B78A',
  onColor: '#04140F',
  prefix: '',
  identity: { single: true, uid: '邮箱' },
  icon: { svg: icon },
}
