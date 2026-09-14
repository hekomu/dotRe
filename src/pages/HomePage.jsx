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
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-gray-700 text-xl border border-white/20">
          👤
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">프로필 설정</span>
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

      {/* 4. 하단 버튼 (일기 작성 제한 해제) */}
      <div className="flex items-center justify-between gap-3 mt-2">
        <button onClick={() => navigate('/shop')}
                className="rounded-xl bg-white/10 border border-white/20 px-5 py-3 font-bold text-white shadow">
          상점
        </button>

        {/* 오늘 작성 여부와 관계없이 항상 클릭 가능한 원래 버튼 */}
        <button 
          onClick={() => navigate('/write')}
          className="rounded-xl bg-green-400 px-6 py-3 font-bold text-black shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          일기 작성
        </button>
      </div>
    </div>
  )
}