import { useNavigate } from 'react-router-dom'
import NutsBadge from '../components/NutsBadge'
import MyRoom from '../components/MyRoom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 상단 바 */}
      <div className="flex items-center justify-end gap-2">
        <NutsBadge />
        <button onClick={() => navigate('/settings')} aria-label="설정"
                className="rounded-full p-2 text-2xl">
          ⚙️
        </button>
      </div>

      {/* 프로필 카드 */}
      <button onClick={() => navigate('/profile')}
              className="flex items-center gap-3 rounded-2xl border p-3 text-left">
        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-gray-200 text-xs">
          내 캐릭터
        </div>
        <span className="text-sm text-gray-400">프로필 설정</span>
      </button>

      {/* 방 */}
      <div className="relative w-full">
        <MyRoom className="rounded-2xl bg-gray-100" />
        <button onClick={() => navigate('/room')} aria-label="방 꾸미기"
                className="absolute right-2 top-2 z-50 rounded-full bg-white/80 p-2 shadow">
          ✏️
        </button>
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/shop')}
                className="rounded-xl bg-white px-5 py-3 font-bold shadow">
          상점
        </button>
        <button onClick={() => navigate('/write')}
                className="rounded-xl bg-green-400 px-6 py-3 font-bold">
          일기 작성
        </button>
      </div>
    </div>
  )
}