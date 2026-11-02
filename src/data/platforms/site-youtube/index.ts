import type { Platform } from '../platform'
import icon from './icon.svg?raw'

export const youtube: Platform = {
  id: 'youtube',
  name: 'YouTube',
  color: '#FF2D37',
  color2: '#C1121F',
  onColor: '#FFFFFF',
  prefix: '@',
  url: uid => `youtube.com/@${uid}`,
  identity: { username: '频道名', uid: 'handle' },
  icon: { svg: icon },
}
