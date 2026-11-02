import type { Platform } from '../platform'
import icon from './icon.svg?raw'

export const github: Platform = {
  id: 'github',
  name: 'GitHub',
  color: '#E6EDF3',
  color2: '#9CA9BC',
  onColor: '#0A0E16',
  prefix: '@',
  url: uid => `github.com/${uid}`,
  identity: { username: '用户名', uid: 'ID' },
  icon: { svg: icon },
}
