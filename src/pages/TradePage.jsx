import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getMyFriends } from '../lib/friendService'
import { getTradableItems, tradeItem, getReceivedItems, getBoxSeenAt, markBoxSeen } from '../lib/tradeService'
import { RARITY_TABLE, STAT_KEYS, STAT_LABELS, statPercent } from '../game/statSystem'

export default function TradePage() {
  const { session } = useAuth()
  const myId = session?.user.id

  const [friends, setFriends] = useState([])
  const [items, setItems] = useState([])
  const [received, setReceived] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showBox, setShowBox] = useState(false)
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState(false)
  const [seenAt, setSeenAt] = useState(null) //보관함 표시

  const refresh = async () => {
    if (!myId) return
    const [fr, it, rc, sa] = await Promise.all([
      getMyFriends(myId),
      getTradableItems(myId),
      getReceivedItems(myId),
      getBoxSeenAt(myId),
    ])
    setFriends(fr)
    setItems(it)
    setReceived(rc)
    setSeenAt(sa)
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

  const unseen = received.filter(
    (it) => !seenAt || new Date(it.created_at) > new Date(seenAt)
  ).length

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">아이템 교환소</h2>
         <button onClick={async () => {
                  setShowBox(true)
                  await markBoxSeen(myId)
                  setSeenAt(new Date().toISOString())
                }}
                className="relative rounded bg-gray-200 px-3 py-1.5 text-sm font-bold">
          보관함
          {unseen > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-400 px-1 text-[10px] text-white">
              {unseen}
            </span>
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
                    <button key={it.id} onClick={() => setDetail(it)}
                            className="flex flex-col items-center">
                      <img src={it.image_url} alt={it.name}
                           className="pixel h-16 w-16 rounded-lg"
                           style={{ backgroundColor: rarity.color + '22' }} />
                      <span className="mt-1 line-clamp-1 text-[11px]">{it.name}</span>
                      <span className="line-clamp-1 text-[10px] text-gray-400">
                        {it.sender?.nickname ?? it.sender?.full_name ?? '?'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 아이템 상세 */}
      {detail && (() => {
        const rarity = RARITY_TABLE[detail.rarity] || RARITY_TABLE.normal
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
               onClick={() => setDetail(null)}>
            <div className="w-full max-w-xs rounded-2xl bg-white p-5"
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center">
                <img src={detail.image_url} alt={detail.name}
                     className="pixel h-32 w-32 rounded-xl"
                     style={{ backgroundColor: rarity.color + '22' }} />
                <span className="mt-2 rounded-full px-3 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: rarity.color }}>
                  {rarity.label}
                </span>
                <h4 className="mt-2 text-lg font-bold">{detail.name}</h4>
                <p className="mt-1 text-center text-sm text-gray-500">{detail.description}</p>
              </div>

              {detail.sender && (
                <div className="mt-3 rounded-xl bg-lime-50 p-3 text-center">
                  <p className="text-xs text-gray-400">보낸 사람</p>
                  <p className="font-bold">
                    {detail.sender.nickname ?? detail.sender.full_name}
                  </p>
                  {detail.sender.bio && (
                    <p className="mt-0.5 text-xs text-gray-500">“{detail.sender.bio}”</p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">
                    {String(detail.created_at).slice(0, 10)} 도착
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-xl bg-gray-50 p-3">
                {STAT_KEYS.map((k) => (
                  <div key={k} className="mb-2 flex items-center gap-2 last:mb-0">
                    <span className="w-14 text-xs">
                      {STAT_LABELS[k].icon} {STAT_LABELS[k].ko}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-gray-200">
                      <div className="h-2 rounded-full"
                           style={{ width: `${statPercent(detail.stats?.[k] ?? 0)}%`,
                                    backgroundColor: STAT_LABELS[k].color }} />
                    </div>
                    <span className="w-7 text-right text-xs font-bold">
                      {detail.stats?.[k] ?? 0}
                    </span>
                  </div>
                ))}
                <p className="mt-1 text-right text-[11px] text-gray-400">
                  아이템 종합치 {detail.power}
                </p>
              </div>

              <button onClick={() => setDetail(null)}
                      className="mt-4 w-full rounded-xl bg-gray-200 py-2 font-bold">
                닫기
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}