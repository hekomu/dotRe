import { useLocation, useNavigate } from 'react-router-dom'

export default function ItemResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const item = location.state?.item

  // 아이템 정보 없이 직접 들어온 경우 홈으로
  if (!item) {
    return (
      <div className="p-4">
        <p>표시할 아이템이 없습니다.</p>
        <button onClick={() => navigate('/')} className="mt-2 underline">
          홈으로
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <img src={item.image_url} alt={item.name} className="h-48 w-48" />
      <h2 className="text-xl font-bold">{item.name}</h2>
      <p className="text-center text-gray-600">{item.description}</p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => navigate('/')}
          className="rounded bg-gray-200 px-4 py-2"
        >
          메인화면으로
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className="rounded bg-gray-200 px-4 py-2"
        >
          캘린더 확인
        </button>
      </div>
    </div>
  )
}