import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import NutsBadge from '../components/NutsBadge'
import MyRoom from '../components/MyRoom'
import HomeHeader from '../components/HomeHeader'

export default function HomePage() {
  const navigate = useNavigate()
  const [hasWrittenToday, setHasWrittenToday] = useState(false)

  const handleStatusLoaded = useCallback((isWritten) => {
    setHasWrittenToday(isWritten)
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 1. 상단 바: 좌측 너트 배지 & 우측 날짜/연속작성 컴포넌트 */}
      <div className="flex items-center justify-between">
        <NutsBadge />
        <HomeHeader onStatusLoaded={handleStatusLoaded} />
      </div>

      {/* 2. 프로필 카드 */}
      <button onClick={() => navigate('/profile')}
              className="flex items-center gap-3 rounded-2xl border border-grey/10 bg-white/5 p-3 text-left">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-gray-700 text-xl border border-white/20">
          👤
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold ">프로필 설정</span>
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
      <div className="flex items-center justify-between gap-3 mt-2">
        <button onClick={() => navigate('/shop')}
                className="rounded-xl bg-grey/10 border border-white/20 px-5 py-3 font-bold shadow">
          상점
        </button>

        <button
          onClick={() => navigate('/write')}
          disabled={hasWrittenToday}
          aria-label={hasWrittenToday ? '오늘 일기 작성 완료' : '일기 작성'}
        >
          <img
            src={hasWrittenToday ? 'public/assets/ui/WriteButton_dis.png' : 'public/assets/ui/WriteButton.png'}
            alt={hasWrittenToday ? '오늘 일기 작성 완료' : '일기 작성'}
            className="h-auto w-auto select-none"
            draggable={false}
          />
        </button>
      </div>
    </div>
  )
}