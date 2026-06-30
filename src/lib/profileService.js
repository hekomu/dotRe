import { supabase } from './supabaseClient'

// 내 프로필 정보 + 통계 불러오기
export async function getMyProfile(userId) {
  // 1) 프로필 기본 정보
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (profileError) throw profileError

  // 2) 일기 작성 횟수 (개수만 세기)
  const { count, error: countError } = await supabase
    .from('diaries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (countError) throw countError

  return { profile, diaryCount: count ?? 0 }
}