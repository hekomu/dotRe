//모달 페이지로 대체...나중에 지울수있음 지우기
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getReceivedItems } from '../lib/tradeService'

export default function ReceivedItemsPage() {
  const { session } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    getReceivedItems(session.user.id)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session])

  if (loading) return <div className="p-4">불러오는 중...</div>

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">교환한 아이템</h2>

      {items.length === 0 ? (
        <p className="text-gray-500">아직 교환받은 아이템이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded border p-3">
              <img src={item.image_url} alt={item.name} className="h-16 w-16" />
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-sm text-gray-500">
                  제작: {item.creator?.full_name ?? item.creator?.email ?? '알 수 없음'}
                </p>
                <p className="text-sm text-gray-500">
                  원본 일시: {item.diaries?.diary_date ?? '정보 없음'}
                </p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}