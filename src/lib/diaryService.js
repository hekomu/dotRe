import { supabase } from './supabaseClient'

// 가짜 AI: 일기를 받아 샘플 아이템 정보를 돌려줌
// 나중에 이 함수 내부만 Replicate API 호출로 교체하면 됨
function mockGenerateItem(diaryContent) {
  return {
    name: '각성의 검은 정수',
    description:
      '머나먼 북쪽 대륙의 기획자들이 밤을 지새우며 마셨다고 전해지는 전설적인 정수입니다.',
    image_url: 'https://placehold.co/300x300/8B4513/ffffff?text=ITEM',
  }
}

// 사진을 Storage에 올리고 공개 주소를 반환
async function uploadPhoto(userId, file) {
  const fileName = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('diary-photos')
    .upload(fileName, file)
  if (error) throw error

  const { data } = supabase.storage.from('diary-photos').getPublicUrl(fileName)
  return data.publicUrl
}

// 메인 함수: 일기 저장 → 아이템 생성까지 한 번에 처리
export async function createDiaryWithItem({ userId, content, photoFile }) {
  // 1) 사진 업로드 (사진이 있을 때만)
  let photoUrl = null
  if (photoFile) {
    photoUrl = await uploadPhoto(userId, photoFile)
  }

  // 2) 일기 저장
  const { data: diary, error: diaryError } = await supabase
    .from('diaries')
    .insert({ user_id: userId, content, photo_url: photoUrl })
    .select()
    .single()
  if (diaryError) throw diaryError

  // 3) (가짜 AI) 아이템 생성
  const itemData = mockGenerateItem(content)

  // 4) 아이템 저장
  const { data: item, error: itemError } = await supabase
    .from('items')
    .insert({
      diary_id: diary.id,
      owner_id: userId,
      name: itemData.name,
      description: itemData.description,
      image_url: itemData.image_url,
    })
    .select()
    .single()
  if (itemError) throw itemError

  return { diary, item }
  
}

export async function getMyItems(userId) {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, image_url, description, diaries(diary_date, content, photo_url)')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}