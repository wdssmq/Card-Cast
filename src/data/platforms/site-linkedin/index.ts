import type { Platform } from '../platform'

export const linkedin: Platform = {
  id: 'linkedin',
  name: 'LinkedIn',
  color: '#0A66C2',
  color2: '#06437F',
  onColor: '#FFFFFF',
  prefix: '',
  url: uid => `linkedin.com/in/${uid}`,
  identity: { username: '姓名', uid: 'ID' },
  icon: { text: 'in' },
}
