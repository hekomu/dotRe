import { supabase } from './supabaseClient'

// 1) 이메일로 사용자 검색 (친구 찾기)
export async function searchUserByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', email)
    .maybeSingle()
  if (error) throw error
  return data
}

// 2) 친구 신청 보내기
export async function sendFriendRequest(myId, friendId) {
  const { error } = await supabase
    .from('friends')
    .insert({ user_id: myId, friend_id: friendId, status: 'pending' })
  if (error) throw error
}

// 3) 나에게 온 친구 신청 목록 (상대 프로필 포함)
export async function getReceivedRequests(myId) {
  const { data, error } = await supabase
    .from('friends')
    .select('id, status, requester:profiles!friends_user_id_fkey(id, email, full_name)')
    .eq('friend_id', myId)
    .eq('status', 'pending')
  if (error) throw error
  return data
}

// 4) 친구 신청 수락
export async function acceptFriendRequest(requestId) {
  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('id', requestId)
  if (error) throw error
}

// 5) 내 친구 목록 (수락된 것, 양방향)
export async function getMyFriends(myId) {
  const { data, error } = await supabase
    .from('friends')
    .select(`
      id, status,
      user:profiles!friends_user_id_fkey(id, email, full_name),
      friend:profiles!friends_friend_id_fkey(id, email, full_name)
    `)
    .eq('status', 'accepted')
    .or(`user_id.eq.${myId},friend_id.eq.${myId}`)
  if (error) throw error

  // 내가 user쪽이든 friend쪽이든, '상대방'만 추려서 반환
  return data.map((row) => {
    const other = row.user.id === myId ? row.friend : row.user
    return { relationId: row.id, ...other }
  })
}