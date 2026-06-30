import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getMyProfile } from '../lib/profileService'

export default function ProfilePage() {
  const { session } = useAuth()

  const [profile, setProfile] = useState(null)
  const [diaryCount, setDiaryCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    getMyProfile(session.user.id)
      .then(({ profile, diaryCount }) => {
        setProfile(profile)
        setDiaryCount(diaryCount)
      })
      .catch((err) => console.error('프로필 불러오기 실패:', err))
      .finally(() => setLoading(false))
  }, [session])

  if (loading) return <div className="p-4">불러오는 중...</div>

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* 캐릭터 자리 (나중에 픽셀 캐릭터로 교체) */}
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200">
        캐릭터
      </div>

      <h2 className="text-xl font-bold">
        {profile?.full_name ?? '이름 없음'}
      </h2>

      {/* 정보 카드 */}
      <div className="w-full rounded border p-4">
        <div className="flex justify-between border-b py-2">
          <span className="text-gray-500">플레이어 ID</span>
          <span className="text-sm">{profile?.email}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-500">일기 작성 횟수</span>
          <span className="font-bold">{diaryCount}회</span>
        </div>
      </div>
    </div>
  )
}