import { supabase } from './supabaseClient'

/** 이번 주 월요일 00:00 (로컬) */
function weekStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

// 오늘 그 친구와 이미 교환했는지 확인
//tradeItem 윗 세 줄 비활성화 해둬서 하루 제한 없는 상태
async function hasTradedTodayWith(myId, friendId) {
  const since = `${new Date().toLocaleDateString('sv-SE')}T00:00:00`

  const [sent, got] = await Promise.all([
    supabase.from('item_trades').select('id')
      .eq('from_user', myId).eq('to_user', friendId)
      .gte('created_at', since).limit(1),
    supabase.from('item_trades').select('id')
      .eq('from_user', friendId).eq('to_user', myId)
      .gte('created_at', since).limit(1),
  ])

  if (sent.error) throw sent.error
  if (got.error) throw got.error
  return sent.data.length > 0 || got.data.length > 0
}

/** 교환에 내놓을 수 있는 아이템 — 이번 주에 내가 만든 완성품만 */
export async function getTradableItems(myId) {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, image_url, rarity, created_at')
    .eq('creator_id', myId)
    .eq('owner_id', myId)
    .eq('meta_status', 'done')
    .gte('created_at', weekStart().toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// 아이템 교환 실행 (원본은 유지, 친구에게 복사본 전달)
export async function tradeItem({ myId, friendId, myItemId }) {

  // if (await hasTradedTodayWith(myId, friendId)) {
  //   return { ok: false, reason: 'already_today' }
  // }

  // 원본 전체를 가져온다 (내 것이 맞는지도 확인)
  const { data: original, error: fetchError } = await supabase
    .from('items')
    .select('*')
    .eq('id', myItemId)
    .eq('owner_id', myId)
    .eq('creator_id', myId)
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!original) return { ok: false, reason: 'not_owner' }
  if (original.meta_status !== 'done') return { ok: false, reason: 'not_ready' }

  // 친구 소유의 복사본 생성 — 스탯·등급까지 그대로
  const { error: copyError } = await supabase.from('items').insert({
    owner_id:    friendId,
    creator_id:  myId,
    diary_id:    original.diary_id,
    name:        original.name,
    description: original.description,
    image_url:   original.image_url,
    category:    original.category,
    rarity:      original.rarity,
    stats:       original.stats,
    power:       original.power,
    diary_score: original.diary_score,
    meta_status: 'done',
  })
  if (copyError) throw copyError

  const { error: tradeError } = await supabase.from('item_trades').insert({
    item_id: myItemId,
    from_user: myId,
    to_user: friendId,
    status: 'completed',
  })
  if (tradeError) throw tradeError

  return { ok: true }
}

/** 교환으로 받은 아이템 (보관함·교환 캘린더용) */
export async function getReceivedItems(myId) {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, image_url, description, rarity, stats, power, created_at, creator_id')
    .eq('owner_id', myId)
    .neq('creator_id', myId)
    .eq('meta_status', 'done')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}