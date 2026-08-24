import { supabase } from './supabaseClient'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('로그인이 필요합니다')

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || '요청에 실패했습니다')
  return body
}

/** 일기로 아이템 생성 요청 — 즉시 itemId를 돌려주고 생성은 백그라운드 */
export function requestItem({ diaryId, streakDays = 0 }) {
  return request('/api/items', {
    method: 'POST',
    body: JSON.stringify({ diaryId, streakDays }),
  })
}

/** 같은 사진으로 다시 생성 */
export function regenerateItem(itemId, streakDays = 0) {
  return request(`/api/items/${itemId}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ streakDays }),
  })
}