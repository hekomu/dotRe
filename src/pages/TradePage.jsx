import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getMyFriends } from '../lib/friendService'
import { getMyItems } from '../lib/diaryService'
import { tradeItem } from '../lib/tradeService'
import { useNavigate } from 'react-router-dom'

export default function TradePage() {
  const { session } = useAuth()
  const myId = session?.user.id
  const navigate = useNavigate()

  const [friends, setFriends] = useState([])
  const [items, setItems] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    if (!myId) return
    getMyFriends(myId).then(setFriends).catch(console.error)
    getMyItems(myId).then(setItems).catch(console.error)
  }, [myId])

  const handleTrade = async () => {
    if (!selectedFriend || !selectedItem) {
      alert('친구와 아이템을 모두 선택해주세요.')
      return
    }
    try {
      const result = await tradeItem({
        myId,
        friendId: selectedFriend.id,
        myItemId: selectedItem.id,
      })
      if (result.ok) {
        alert('교환 완료! 아이템을 보냈습니다.')
        setSelectedItem(null)
        setSelectedFriend(null)
      } else if (result.reason === 'already_today') {
        alert('이 친구와는 오늘 이미 교환했습니다. 내일 다시 시도해주세요.')
      } else if (result.reason === 'not_owner') {
        alert('교환할 수 없는 아이템입니다.')
      }
    } catch (err) {
      alert('교환 오류: ' + err.message)
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="text-xl font-bold">아이템 교환소</h2>

      <button
        onClick={() => navigate('/received-items')}
        className="rounded bg-gray-200 py-2 font-bold"
      >
        교환한 아이템 목록 보기
      </button>

      {/* 친구 선택 */}
      <section>
        <h3 className="mb-2 font-bold">1. 보낼 친구 선택</h3>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-500">친구가 없습니다. 먼저 친구를 맺어보세요.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {friends.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFriend(f)}
                className={`rounded border px-3 py-2 ${
                  selectedFriend?.id === f.id ? 'border-green-500 bg-green-100' : ''
                }`}
              >
                {f.full_name ?? f.email}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 아이템 선택 */}
      <section>
        <h3 className="mb-2 font-bold">2. 보낼 아이템 선택</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">보낼 아이템이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => setSelectedItem(it)}
                className={`flex flex-col items-center rounded border p-2 ${
                  selectedItem?.id === it.id ? 'border-green-500 bg-green-100' : ''
                }`}
              >
                <img src={it.image_url} alt={it.name} className="h-12 w-12" />
                <span className="mt-1 text-xs">{it.name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 교환 실행 */}
      <button
        onClick={handleTrade}
        disabled={!selectedFriend || !selectedItem}
        className="rounded bg-green-400 py-3 font-bold disabled:opacity-40"
      >
        교환!
      </button>
    </div>
  )
}