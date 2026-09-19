import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getShop, buyItem, getFurniture, buyFurniture } from '../lib/api'
import { RARITY_TABLE } from '../game/statSystem'
import { FURNITURE_CATEGORY_KEYS, FURNITURE_CATEGORY_LABELS } from '../game/furniture'

export default function ShopPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('item')
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')
  const [qty, setQty] = useState({})
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const [furniture, setFurniture] = useState(null)
  const [furnCategory, setFurnCategory] = useState(FURNITURE_CATEGORY_KEYS[0])
  const [furnBusy, setFurnBusy] = useState(null)

  const loadItems = () => { getShop().then(setData).catch((e) => setError(e.message)) }
  const loadFurniture = () => { getFurniture().then(setFurniture).catch((e) => setError(e.message)) }

  useEffect(() => { loadItems(); loadFurniture() }, [])

  const handleBuy = async (item) => {
    const n = qty[item.id] ?? 1
    if (!confirm(`"${item.name}"을(를) ${n}개, 너트 ${item.price * n}개로 구매할까요?`)) return
    setBusy(item.id)
    try {
      const r = await buyItem(item.id, n)
      alert(`구매 완료! 남은 너트 ${r.nuts}개\n방 꾸미기에서 배치할 수 있어요.`)
      setQty((q) => ({ ...q, [item.id]: 1 }))
      loadItems()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(null)
    }
  }

  const handleBuyFurniture = async (f) => {
    if (!confirm(`"${f.name}"을(를) 너트 ${f.price}개로 구매할까요?`)) return
    setFurnBusy(f.id)
    try {
      const r = await buyFurniture(f.id)
      alert(`구매 완료! 남은 너트 ${r.nuts}개\n방 꾸미기에서 배치할 수 있어요.`)
      loadFurniture()
    } catch (err) {
      alert(err.message)
    } finally {
      setFurnBusy(null)
    }
  }

  if (error) return <div className="p-4 text-sm text-gray-500">{error}</div>
  if (!data || !furniture) return <div className="p-4 text-gray-400">불러오는 중...</div>

  const list = data.items.filter((it) =>
    filter === 'all' ? true : filter === 'mine' ? !it.fromFriend : it.fromFriend
  )
  const furnList = furniture.items.filter((f) => f.category === furnCategory)
  const nuts = tab === 'item' ? data.nuts : furniture.nuts

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="text-xl text-gray-400">←</button>
          <h2 className="text-xl font-bold">상점</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-5 py-1 text-lg font-bold">
        <img src="/assets/icons/Nuts.png" className="h-8 w-8" alt="" />{nuts}</span>
      </div>

      <div className="mb-3 flex gap-2">
        {[['item', '아이템'], ['furniture', '가구']].map(([k, name]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold ${
              tab === k ? 'bg-lime-400' : 'bg-gray-100 text-gray-500'
            }`}>
            {name}
          </button>
        ))}
      </div>

      {tab === 'item' ? (
        <>
          <p className="mb-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
            아이템을 구매하면 방에 배치할 수 있어요. 한 아이템은 최대 5개까지 살 수 있어요.
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
            <p className="mt-8 text-center text-sm text-gray-400">아직 아이템이 없어요. 일기를 작성해보세요!</p>
          ) : (
            <div className="grid auto-rows-fr grid-cols-3 gap-2">
              {list.map((it) => {
                const rarity = RARITY_TABLE[it.rarity] || RARITY_TABLE.normal
                const remaining = 5 - (it.ownedCount ?? 0)
                const n = qty[it.id] ?? 1
                const canBuy = !it.maxedOut && data.nuts >= it.price * n

                return (
                  <div key={it.id} className="flex h-full flex-col rounded-2xl border p-2">
                    <div className="flex justify-center rounded-xl py-2"
                         style={{ backgroundColor: rarity.color + '22' }}>
                      <img src={it.image_url} alt={it.name} className="pixel h-16 w-16 object-contain" />
                    </div>

                    <div className="mt-2 flex items-center gap-1">
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: rarity.color }}>
                        {rarity.label}
                      </span>
                      {it.fromFriend && <span className="text-[10px] text-gray-400">선물</span>}
                      {it.ownedCount > 0 && <span className="text-[10px] text-gray-400">보유 {it.ownedCount}개</span>}
                    </div>

                    <p className="mt-1 line-clamp-2 h-8 text-center text-xs font-bold leading-4">{it.name}</p>

                    {it.maxedOut ? (
                      <div className="mt-auto rounded-lg bg-gray-100 py-1.5 text-center text-xs text-gray-400">
                        보유 중 (최대 5개)
                      </div>
                    ) : (
                      <div className="mt-auto flex flex-col gap-1">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setQty((q) => ({ ...q, [it.id]: Math.max(1, n - 1) }))}
                                  className="h-6 w-6 rounded bg-gray-100 text-sm">−</button>
                          <span className="w-5 text-center text-xs font-bold">{n}</span>
                          <button onClick={() => setQty((q) => ({ ...q, [it.id]: Math.min(remaining, n + 1) }))}
                                  className="h-6 w-6 rounded bg-gray-100 text-sm">+</button>
                        </div>
                        
                         <button onClick={() => handleBuy(it)}
                            disabled={!canBuy || busy === it.id}
                            className="flex w-full items-center justify-center gap-1 rounded-lg bg-lime-400 py-1.5 text-sm font-bold disabled:bg-gray-100 disabled:text-gray-400">
                            {busy === it.id ? ('구매 중...') : (<><img src="/assets/icons/Nuts.png" className="h-5.5 w-5.5" alt="" />
                                {it.price * n}</>)}
                    </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mb-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
            가구는 종류당 1개까지 구매할 수 있어요. 에셋은 추후 추가될 예정이에요.
          </p>

          <div className="mb-3 flex gap-2 overflow-x-auto">
            {FURNITURE_CATEGORY_KEYS.map((key) => (
              <button key={key} onClick={() => setFurnCategory(key)}
                className={`flex-none rounded-full px-3 py-1 text-sm ${
                  furnCategory === key ? 'bg-lime-400 font-bold' : 'bg-gray-100 text-gray-500'
                }`}>
                {FURNITURE_CATEGORY_LABELS[key]}
              </button>
            ))}
          </div>

{furnList.length === 0 ? (
  <p className="mt-8 text-center text-sm text-gray-400">이 카테고리엔 아직 가구가 없어요.</p>
) : (
  <div className="grid auto-rows-fr grid-cols-3 gap-2">
    {furnList.map((f) => {
      const canBuyFurn = furniture.nuts >= f.price

      return (
        <div key={f.id} className="flex h-full flex-col rounded-2xl border p-2">
          <div className="flex h-20 items-center justify-center rounded-xl bg-gray-50">
            {f.image_url ? (
              <img src={f.image_url} alt={f.name} className="pixel h-16 w-16 object-contain" />
            ) : (
              <span className="text-[10px] text-gray-300">이미지 준비 중</span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 h-8 text-center text-xs font-bold leading-4">{f.name}</p>

          {f.owned ? (
            <div className="mt-auto rounded-lg bg-gray-100 py-1.5 text-center text-xs text-gray-400">보유 중</div>
          ) : (
            <button onClick={() => handleBuyFurniture(f)}
                    disabled={!canBuyFurn || furnBusy === f.id}
                    className="mt-auto flex w-full items-center justify-center gap-1 rounded-lg bg-lime-400 py-1.5 text-sm font-bold disabled:bg-gray-100 disabled:text-gray-400">
              {furnBusy === f.id ? ('구매 중...') : (<><img src="/assets/icons/Nuts.png" className="h-3.5 w-3.5" alt="" />
                  {f.price}</>)}
            </button>
          )}
        </div>
      )
    })}
  </div>
)}
        </>
      )}
    </div>
  )
}