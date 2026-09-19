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
    <div className="flex flex-col gap-4 p-4">
      {/* 1. 상단 바: 좌측 너트 배지 & 우측 날짜/연속작성 컴포넌트 */}
      <div className="flex items-center justify-between">
        <NutsBadge />
        <HomeHeader onStatusLoaded={handleStatusLoaded} />
      </div>

      {/* 2. 프로필 카드 */}
      <button onClick={() => navigate('/profile')}
              className="flex items-center gap-3 rounded-2xl border border-gray-500/10 bg-white/5 p-3 text-left">
        <div className="h-14 w-14 flex-none overflow-hidden rounded-full border border-white/20 bg-gray-700">
          <img
            src="/assets/char/Portrait.png"
            alt="프로필"
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold">프로필 설정</span>
        </div>
      </button>

      {/* 3. 방 (MyRoom) */}
      <div className="relative w-full">
        <MyRoom className="rounded-2xl bg-gray-900 border border-white/10" />
        <button onClick={() => navigate('/room')} aria-label="방 꾸미기"
                className="absolute right-2 top-2 z-50 rounded-full bg-black/60 p-2 shadow backdrop-blur-md">
          ✏️
        </button>
      </div>

      {/* 4. 하단 버튼 */}
      <div className="flex w-full items-center justify-between gap-3 mt-2">
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