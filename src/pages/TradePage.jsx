import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getMyFriends } from '../lib/friendService'
import { getTradableItems, tradeItem, getReceivedItems } from '../lib/tradeService'
import { RARITY_TABLE } from '../game/statSystem'

export default function TradePage() {
  const { session } = useAuth()
  const myId = session?.user.id

  const [friends, setFriends] = useState([])
  const [items, setItems] = useState([])
  const [received, setReceived] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showBox, setShowBox] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    if (!myId) return
    const [fr, it, rc] = await Promise.all([
      getMyFriends(myId),
      getTradableItems(myId),
      getReceivedItems(myId),
    ])
    setFriends(fr)
    setItems(it)
    setReceived(rc)
  }

  useEffect(() => { refresh() }, [myId])

  const handleTrade = async () => {
    if (!selectedFriend || !selectedItem) return
    setBusy(true)
    try {
      const result = await tradeItem({
        myId,
        friendId: selectedFriend.id,
        myItemId: selectedItem.id,
      })
      const messages = {
        already_today: '이 친구와는 오늘 이미 교환했어요. 내일 다시 시도해주세요.',
        not_owner: '교환할 수 없는 아이템입니다.',
        not_ready: '아직 생성 중인 아이템이에요.',
      }
      if (result.ok) {
        alert('아이템을 보냈습니다!')
        setSelectedItem(null)
        setSelectedFriend(null)
      } else {
        alert(messages[result.reason] ?? '교환에 실패했습니다.')
      }
    } catch (err) {
      alert('교환 오류: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const label = (p) => p?.nickname ?? p?.full_name ?? p?.email ?? '알 수 없음'

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">아이템 교환소</h2>
        <button onClick={() => setShowBox(true)}
                className="relative rounded bg-gray-200 px-3 py-1.5 text-sm font-bold">
          보관함
          {received.length > 0 && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-400" />
          )}
        </button>
      </div>

      {/* 1. 친구 선택 */}
      <section className="mb-5">
        <h3 className="mb-2 text-sm font-bold text-gray-500">1. 보낼 친구</h3>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-400">친구가 없어요. 먼저 친구를 맺어보세요.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {friends.map((f) => (
              <button key={f.id} onClick={() => setSelectedFriend(f)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  selectedFriend?.id === f.id
                    ? 'border-green-500 bg-green-100 font-bold'
                    : ''
                }`}>
                {label(f)}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 2. 아이템 선택 */}
      <section className="mb-5">
        <h3 className="mb-2 text-sm font-bold text-gray-500">
          2. 보낼 아이템 <span className="font-normal"></span>
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">이번 주에 만든 아이템이 없어요.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((it) => {
              const rarity = RARITY_TABLE[it.rarity] || RARITY_TABLE.normal
              return (
                <button key={it.id} onClick={() => setSelectedItem(it)}
                  className={`flex flex-col items-center rounded-xl border p-2 ${
                    selectedItem?.id === it.id ? 'border-green-500 bg-green-50' : ''
                  }`}>
                  <img src={it.image_url} alt={it.name}
                       className="pixel h-14 w-14 rounded"
                       style={{ backgroundColor: rarity.color + '22' }} />
                  <span className="mt-1 line-clamp-1 text-[11px]">{it.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <button onClick={handleTrade} disabled={!selectedFriend || !selectedItem || busy}
              className="w-full rounded-xl bg-green-400 py-3 font-bold disabled:opacity-40">
        {busy ? '보내는 중...' : '전송!'}
      </button>

      {/* 보관함 모달 */}
      {showBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
             onClick={() => setShowBox(false)}>
          <div className="max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4"
               onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">보관함</h3>
              <button onClick={() => setShowBox(false)} className="px-2 text-gray-400">✕</button>
            </div>

            {received.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                아직 받은 아이템이 없어요.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {received.map((it) => {
                  const rarity = RARITY_TABLE[it.rarity] || RARITY_TABLE.normal
                  return (
                    <div key={it.id} className="flex flex-col items-center">
                      <img src={it.image_url} alt={it.name}
                           className="pixel h-16 w-16 rounded-lg"
                           style={{ backgroundColor: rarity.color + '22' }} />
                      <span className="mt-1 line-clamp-1 text-[11px]">{it.name}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}