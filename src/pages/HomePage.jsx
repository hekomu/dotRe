import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* 상단 바: 우측에 설정 버튼 */}
      <div className="flex w-full justify-end">
        <button
          onClick={() => navigate('/settings')}
          aria-label="설정"
          className="rounded-full p-2 text-2xl"
        >
          ⚙️
        </button>
      </div>

      {/* 프로필로 가는 캐릭터 자리 */}
      <button
        onClick={() => navigate('/profile')}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200"
      >
        내 캐릭터
      </button>

      <div className="text-xl">홈 화면</div>

      <button
        onClick={() => navigate('/write')}
        className="rounded bg-green-400 px-6 py-3 font-bold"
      >
        일기 작성
      </button>
    </div>
  )
}