import { supabase } from './supabaseClient'

// 오늘 그 친구와 이미 교환했는지 확인
async function hasTradedTodayWith(myId, friendId) {
  const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

  const { data, error } = await supabase
    .from('item_trades')
    .select('id')
    .or(
      `and(from_user.eq.${myId},to_user.eq.${friendId}),and(from_user.eq.${friendId},to_user.eq.${myId})`
    )
    .gte('created_at', `${today}T00:00:00`)
    .limit(1)
  if (error) throw error
  return data.length > 0
}

// 아이템 교환 실행 (원본은 유지, 친구에게 복사본 전달)
export async function tradeItem({ myId, friendId, myItemId }) {
  // 1) 하루 한 번 제한 검사
  const traded = await hasTradedTodayWith(myId, friendId)
  if (traded) {
    return { ok: false, reason: 'already_today' }
  }

  // 2) 원본 아이템 정보 가져오기 (내 것이 맞는지도 확인)
  const { data: original, error: fetchError } = await supabase
    .from('items')
    .select('name, description, image_url, creator_id, diary_id')
    .eq('id', myItemId)
    .eq('owner_id', myId)
    .single()
  if (fetchError) throw fetchError
  if (!original) {
    return { ok: false, reason: 'not_owner' }
  }

  // 3) 친구 소유의 복사본 생성 (원 제작자는 나로 유지)
  const { error: copyError } = await supabase
    .from('items')
    .insert({
      owner_id: friendId,         // 소유자는 친구
      creator_id: original.creator_id ?? myId, // 원 제작자는 그대로 (나)
      diary_id: original.diary_id, // 원본 일기 연결 유지 (일시 확인용)
      name: original.name,
      description: original.description,
      image_url: original.image_url,
    })
  if (copyError) throw copyError

  // 4) 교환 기록 저장
  const { error: tradeError } = await supabase
    .from('item_trades')
    .insert({
      item_id: myItemId,
      from_user: myId,
      to_user: friendId,
      status: 'completed',
    })
  if (tradeError) throw tradeError

  return { ok: true }
}

// 교환으로 받은 아이템 (내가 소유했지만 원 제작자는 남)
export async function getReceivedItems(myId) {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, image_url, description, creator:profiles!items_creator_id_fkey(full_name, email), diaries(diary_date, content)')
    .eq('owner_id', myId)
    .neq('creator_id', myId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}