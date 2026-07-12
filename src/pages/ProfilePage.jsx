import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import {
  getMyProfile,
  isNicknameAvailable,
  updateNickname,
} from '../lib/profileService'

export default function ProfilePage() {
  const { session } = useAuth()
  const myId = session?.user.id

  const [profile, setProfile] = useState(null)
  const [diaryCount, setDiaryCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [nickInput, setNickInput] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    if (!myId) return
    getMyProfile(myId)
      .then(({ profile, diaryCount }) => {
        setProfile(profile)
        setDiaryCount(diaryCount)
        setNickInput(profile?.nickname ?? '')
      })
      .catch((err) => console.error('프로필 불러오기 실패:', err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [myId])

  const handleSaveNickname = async () => {
    const nick = nickInput.trim()
    if (!nick) {
      alert('닉네임을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      // 1) 중복 확인
      const available = await isNicknameAvailable(nick, myId)
      if (!available) {
        alert('이미 사용 중인 닉네임입니다.')
        setSaving(false)
        return
      }
      // 2) 저장
      const result = await updateNickname(myId, nick)
      if (!result.ok && result.reason === 'duplicate') {
        alert('이미 사용 중인 닉네임입니다.')
        setSaving(false)
        return
      }
      alert('닉네임이 저장되었습니다.')
      setEditing(false)
      load()
    } catch (err) {
      alert('저장 오류: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4">불러오는 중...</div>

  // 표시용 닉네임: 설정했으면 닉네임, 아니면 이메일
  const displayName = profile?.nickname ?? profile?.email

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200">
        캐릭터
      </div>

      <h2 className="text-xl font-bold">{displayName}</h2>

      <div className="w-full rounded border p-4">
        {/* 닉네임 행 */}
        <div className="flex items-center justify-between border-b py-2">
          <span className="text-gray-500">닉네임</span>
          {editing ? (
            <div className="flex gap-2">
              <input
                value={nickInput}
                onChange={(e) => setNickInput(e.target.value)}
                placeholder="닉네임 입력"
                className="w-32 rounded border p-1 text-sm"
              />
              <button
                onClick={handleSaveNickname}
                disabled={saving}
                className="rounded bg-green-400 px-2 text-sm font-bold disabled:opacity-50"
              >
                {saving ? '...' : '저장'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-gray-400"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{profile?.nickname ?? '(미설정)'}</span>
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-blue-500 underline"
              >
                변경
              </button>
            </div>
          )}
        </div>

        {/* 플레이어 ID(=닉네임 또는 이메일) */}
        <div className="flex justify-between border-b py-2">
          <span className="text-gray-500">플레이어 ID</span>
          <span className="text-sm">{displayName}</span>
        </div>

        <div className="flex justify-between py-2">
          <span className="text-gray-500">일기 작성 횟수</span>
          <span className="font-bold">{diaryCount}회</span>
        </div>
      </div>
    </div>
  )
}