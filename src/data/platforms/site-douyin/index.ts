import type { Platform } from '../platform'
import icon from './icon.svg?raw'

export const douyin: Platform = {
  id: 'douyin',
  name: '抖音',
  color: '#25F4EE',
  color2: '#FE2C55',
  onColor: '#061019',
  prefix: '@',
  url: uid => `douyin.com/user/${uid}`,
  identity: { username: '昵称', uid: '抖音号' },
  icon: { svg: icon },
}
