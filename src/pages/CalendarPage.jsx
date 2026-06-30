import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getMyItems } from '../lib/diaryService'

export default function CalendarPage() {
  const { session } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    getMyItems(session.user.id)
      .then((data) => setItems(data))
      .catch((err) => console.error('아이템 불러오기 실패:', err))
      .finally(() => setLoading(false))
  }, [session])

  if (loading) {
    return <div className="p-4">불러오는 중...</div>
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">캘린더</h2>

      {items.length === 0 ? (
        <p className="text-gray-500">아직 기록된 아이템이 없습니다. 일기를 작성해보세요!</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded border p-3">
              <img src={item.image_url} alt={item.name} className="h-16 w-16" />
              <div>
                <p className="text-sm text-gray-500">
                  {item.diaries?.diary_date ?? '날짜 없음'}
                </p>
                <p className="font-bold">{item.name}</p>
                <p className="text-sm text-gray-600">{item.diaries?.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}