import { supabase } from './supabaseClient'

/** 교환에 내놓을 수 있는 아이템 — 완료된 내 창작물 전부 (주간 제한 없음) */
export async function getTradableItems(myId) {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, image_url, rarity, created_at')
    .eq('creator_id', myId)
    .eq('owner_id', myId)
    .eq('meta_status', 'done')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** 아이템 교환 — 원본은 그대로 두고, 상대에게는 '수령 대기' 상태로만 보낸다 */
export async function tradeItem({ myId, friendId, myItemId }) {
  // 원본 전체를 가져온다 (내 것이 맞는지도 확인)
  const { data: original, error: fetchError } = await supabase
    .from('items')
    .select('id, meta_status')
    .eq('id', myItemId)
    .eq('owner_id', myId)
    .eq('creator_id', myId)
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!original) return { ok: false, reason: 'not_owner' }
  if (original.meta_status !== 'done') return { ok: false, reason: 'not_ready' }

  // 이 시점엔 items row를 만들지 않는다 — 상대가 수령을 눌러야 정식 소유가 된다
  const { error: tradeError } = await supabase.from('item_trades').insert({
    item_id: myItemId,
    from_user: myId,
    to_user: friendId,
    status: 'pending',
  })
  if (tradeError) throw tradeError

  return { ok: true }
}

/** 보관함 — 아직 수령/폐기를 결정하지 않은 도착 아이템 목록 */
export async function getPendingTrades(myId) {
  const { data: trades, error } = await supabase
    .from('item_trades')
    .select('id, item_id, from_user, created_at')
    .eq('to_user', myId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!trades.length) return []

  const itemIds = [...new Set(trades.map((t) => t.item_id))]
  const senderIds = [...new Set(trades.map((t) => t.from_user))]

  const [{ data: items, error: iErr }, { data: senders, error: sErr }] = await Promise.all([
    supabase.from('items')
      .select('id, name, description, image_url, rarity, stats, power, category')
      .in('id', itemIds),
    supabase.from('profiles')
      .select('id, nickname, full_name, bio')
      .in('id', senderIds),
  ])
  if (iErr) throw iErr
  if (sErr) throw sErr

  const itemMap = Object.fromEntries((items ?? []).map((it) => [it.id, it]))
  const senderMap = Object.fromEntries((senders ?? []).map((s) => [s.id, s]))

  // item이 삭제된 경우(원본 제거 등) 대비해 null 방어
  return trades.map((t) => ({
    tradeId: t.id,
    createdAt: t.created_at,
    item: itemMap[t.item_id] ?? null,
    sender: senderMap[t.from_user] ?? null,
  }))
}

/** 도착한 아이템 수령 — 이 순간부터 정식 소유 아이템(캘린더·방꾸미기 등에 노출) */
export async function receiveTrade(tradeId) {
  // 1. 거래 정보 조회
  const { data: trade, error: tErr } = await supabase
    .from('item_trades')
    .select('id, item_id, to_user, status')
    .eq('id', tradeId)
    .maybeSingle()
  console.log('[receive] 1단계 거래 조회:', { trade, tErr })
  if (tErr) throw tErr
  if (!trade) return { ok: false, reason: 'not_found' }
  if (trade.status !== 'pending') return { ok: false, reason: 'not_pending' }

  // 2. 원본 아이템 조회 — status가 아직 'pending'이라 RLS 정책을 통과한다 (순서 중요!)
  const { data: original, error: oErr } = await supabase
    .from('items')
    .select('*')
    .eq('id', trade.item_id)
    .maybeSingle()
  console.log('[receive] 2단계 원본 조회:', { original, oErr })
  if (oErr) throw oErr
  if (!original) return { ok: false, reason: 'original_missing' }

  // 3. 이제서야 원자적으로 선점 (중복 수령 방지는 그대로 유지)
  const { data: claimed, error: claimError } = await supabase
    .from('item_trades')
    .update({ status: 'received', received_at: new Date().toISOString() })
    .eq('id', tradeId)
    .eq('status', 'pending')
    .select('id')
  console.log('[receive] 3단계 선점:', { claimed, claimError })
  if (claimError) throw claimError
  if (!claimed || claimed.length === 0) return { ok: false, reason: 'not_pending' }

  // 실패 시 되돌리기
  const rollback = async () => {
    await supabase
      .from('item_trades')
      .update({ status: 'pending', received_at: null })
      .eq('id', tradeId)
  }

  // 4. 내 소유로 복사본 생성
  const { data: copied, error: copyError } = await supabase
    .from('items')
    .insert({
      owner_id:    trade.to_user,
      creator_id:  original.creator_id,
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
    .select('id')
  console.log('[receive] 4단계 복사본 insert:', { copied, copyError })

  if (copyError) {
    await rollback()
    throw copyError
  }
  if (!copied || copied.length === 0) {
    await rollback()
    return { ok: false, reason: 'copy_blocked' }
  }

  return { ok: true }
}

/** 도착한 아이템 폐기 — 소유로 인정하지 않고 대기 목록에서 제거 (수령기록에도 안 남음) */
export async function discardTrade(tradeId) {
  const { data, error } = await supabase
    .from('item_trades')
    .update({ status: 'discarded' })
    .eq('id', tradeId)
    .eq('status', 'pending')
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) {
    return { ok: false, reason: 'not_pending' }
  }
  return { ok: true }
}

/** 결정 안 한(pending) 아이템 개수 — 탭바 교환 아이콘·보관함 버튼 알림 배지용 */
export async function getPendingTradeCount(myId) {
  const { count, error } = await supabase
    .from('item_trades')
    .select('id', { count: 'exact', head: true })
    .eq('to_user', myId)
    .eq('status', 'pending')
  if (error) throw error
  return count ?? 0
}

/** 수령기록 — 실제로 '수령'을 결정한 아이템만 (폐기한 건 안 뜸) */
export async function getReceivedItems(myId) {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, image_url, description, rarity, stats, power, created_at, creator_id')
    .eq('owner_id', myId)
    .neq('creator_id', myId)
    .eq('meta_status', 'done')
    .order('created_at', { ascending: false })
  if (error) throw error

  const ids = [...new Set(data.map((d) => d.creator_id).filter(Boolean))]
  if (ids.length === 0) return data

  const { data: senders } = await supabase
    .from('profiles')
    .select('id, nickname, full_name, bio')
    .in('id', ids)

  const map = Object.fromEntries((senders ?? []).map((s) => [s.id, s]))
  return data.map((it) => ({ ...it, sender: map[it.creator_id] ?? null }))
}