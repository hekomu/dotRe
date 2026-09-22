import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { isDevAccount } from '../lib/devAccounts'
import NutsBadge from '../components/NutsBadge'
import MyRoom from '../components/MyRoom'
import HomeHeader from '../components/HomeHeader'

export default function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [hasWrittenToday, setHasWrittenToday] = useState(false)

  const handleStatusLoaded = useCallback((isWritten) => {
    setHasWrittenToday(isWritten)
  }, [])

  // 개발자 계정은 오늘 이미 썼더라도 버튼을 잠그지 않는다
  const lockWrite = hasWrittenToday && !isDevAccount(session?.user?.id)

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* 1. 프로필 카드 + 오늘 기록 카드 */}
      <div className="flex gap-[2%]">
        {/* 프로필 카드 — 클릭 시 프로필 설정으로 이동 */}
          <button
            onClick={() => navigate('/profile')}
            className="flex w-[61%] items-center gap-[4%] rounded-xl bg-surface-2 p-[3.5%] text-left"
          >
            <div className="w-[35%] flex-none overflow-hidden rounded-lg bg-white p-[4%]">
              <img src="/assets/char/Portrait.png" alt="" className="block w-full" draggable={false} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {/* ▼ 닉네임 필드명은 실제 스키마에 맞게 바꿔줘 */}
              <span className="truncate font-galmuri11 text-[13px] text-ink">
                {session?.user?.user_metadata?.nickname ?? '이름'}
              </span>
              <NutsBadge />
              <span className="text-right font-galmuri11 text-[9px] text-ink-dim">프로필 설정</span>
            </div>
          </button>

    {/* 오늘 기록 카드 */}
    <div className="flex flex-1 flex-col justify-center rounded-xl bg-surface-2 p-[3.5%]">
      <HomeHeader onStatusLoaded={handleStatusLoaded} />
    </div>
  </div>
      {/* 3. 방 (MyRoom) */}
      <div className="relative w-full">
        <MyRoom className="rounded-2xl border border-white/10" />
        <button onClick={() => navigate('/room')} aria-label="방 꾸미기"
                className="absolute right-2 top-2 z-50 rounded-full bg-black/60 p-2 shadow backdrop-blur-md">
          ✏️
        </button>
      </div>

      {/* 4. 하단 버튼 */}
      <div className="flex w-full items-center justify-between gap-3 mt-0">
        <button onClick={() => navigate('/shop')} aria-label="상점">
          <img
            src="/assets/ui/Shop.png"
            alt="상점"
            className="shop-btn select-none"
            draggable={false}
          />
        </button>

        <button
          onClick={() => navigate('/write')}
          disabled={lockWrite}
          aria-label={lockWrite ? '오늘 일기 작성 완료' : '일기 작성'}
        >
          <img
            src={lockWrite ? '/assets/ui/WriteButton_dis.png' : '/assets/ui/WriteButton.png'}
            alt={lockWrite ? '오늘 일기 작성 완료' : '일기 작성'}
            className="ml-auto write-btn select-none"
            draggable={false}
          />
        </button>
      </div>
    </div>
  )
}