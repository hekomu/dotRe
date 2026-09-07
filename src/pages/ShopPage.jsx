import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getShop, buyItem } from '../lib/api'
import { RARITY_TABLE } from '../game/statSystem'

export default function ShopPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')   // all | mine | friend
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const load = () => { getShop().then(setData).catch((e) => setError(e.message)) }
  useEffect(load, [])

  const handleBuy = async (item) => {
    if (!confirm(`"${item.name}"을(를) 너트 ${item.price}개로 구매할까요?`)) return
    setBusy(item.id)
    try {
      const r = await buyItem(item.id)
      alert(`구매 완료! 남은 너트 ${r.nuts}개\n방 꾸미기에서 배치할 수 있어요.`)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(null)
    }
  }

  if (error) return <div className="p-4 text-sm text-gray-500">{error}</div>
  if (!data) return <div className="p-4 text-gray-400">불러오는 중...</div>

  const list = data.items.filter((it) =>
    filter === 'all' ? true : filter === 'mine' ? !it.fromFriend : it.fromFriend
  )

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="text-xl text-gray-400">←</button>
          <h2 className="text-xl font-bold">상점</h2>
        </div>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold">
          🥜 {data.nuts}
        </span>
      </div>

      <p className="mb-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
        아이템을 구매하면 방에 배치할 수 있어요.
      </p>

      <div className="mb-3 flex gap-2">
        {[['all', '전체'], ['mine', '내가 만든'], ['friend', '받은 것']].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === k ? 'bg-lime-400 font-bold' : 'bg-gray-100 text-gray-500'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-400">
          아직 아이템이 없어요. 일기를 작성해보세요!
        </p>
      ) : (
        <div className="grid auto-rows-fr grid-cols-3 gap-2">
          {list.map((it) => {
            const rarity = RARITY_TABLE[it.rarity] || RARITY_TABLE.normal
            const canBuy = !it.purchased && data.nuts >= it.price

            return (
              <div key={it.id} className="flex h-full flex-col rounded-2xl border p-2"> 
                <div className="flex justify-center rounded-xl py-2"
                     style={{ backgroundColor: rarity.color + '22' }}>
                  <img src={it.image_url} alt={it.name}
                       className="pixel h-16 w-16 object-contain" />
                </div>

                <div className="mt-2 flex items-center gap-1">
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ backgroundColor: rarity.color }}>
                    {rarity.label}
                  </span>
                  {it.fromFriend && (
                    <span className="text-[10px] text-gray-400">선물</span>
                  )}
                </div>

                <p className="mt-1 line-clamp-2 h-8 text-center text-xs font-bold leading-4">{it.name}</p>

                {it.purchased ? (
                  <div className="mt-auto rounded-lg bg-gray-100 py-1.5 text-center text-xs text-gray-400">
                    보유 중
                  </div>
                ) : (
                  <button onClick={() => handleBuy(it)}
                          disabled={!canBuy || busy === it.id}
                          className="mt-auto w-full rounded-lg bg-lime-400 py-1.5 text-sm font-bold disabled:bg-gray-100 disabled:text-gray-400">
                    {busy === it.id ? '구매 중...' : `🥜 ${it.price}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}