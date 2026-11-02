import type { CardData } from './types'
import { defaultData } from '../data'

/** 存储结构变更时直接升版本，旧缓存不再读取（不做迁移） */
const STORAGE_KEY = 'gif-card:v2'

/** 把用户粘贴的主页链接压成平台 ID */
export function normalizeUid(input: string): string {
  let v = input.trim()
  if (!v)
    return ''
  v = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  const slash = v.indexOf('/')
  if (slash > 0)
    v = v.slice(slash + 1)
  v = v.replace(/[?#].*$/, '').replace(/\/+$/, '')
  v = v.replace(/^(people|user|users|u|in|profile|space)\//i, '')
  return v.replace(/^@/, '')
}

export function loadData(): CardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw
      ? JSON.parse(raw) as CardData
      : defaultData()
  }
  catch {
    return defaultData()
  }
}

export function saveData(data: CardData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  catch {
    // 超出配额时静默失败，不影响编辑
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  }
  catch {
    // ignore
  }
}
