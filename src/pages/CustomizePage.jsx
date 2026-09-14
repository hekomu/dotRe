import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAvatar, buyAvatarPart, equipAvatarPart } from '../lib/api'
import { AVATAR_CATEGORY_KEYS, AVATAR_CATEGORY_LABELS } from '../game/avatar'

export default function CustomizePage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [category, setCategory] = useState(AVATAR_CATEGORY_KEYS[0])
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const load = () => { getAvatar().then(setData).catch((e) => setError(e.message)) }
  useEffect(load, [])

  const handleBuy = async (part) => {
    if (!confirm(`"${part.name}"을(를) 너트 ${part.price}개로 구매할까요?`)) return
    setBusy(part.id)
    try {
      await buyAvatarPart(part.id)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(null)
    }
  }

  const handleEquip = async (part) => {
    setBusy(part.id)
    try {
      await equipAvatarPart(category, part.id)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(null)
    }
  }

  if (error) return <div className="p-4 text-sm text-gray-500">{error}</div>
  if (!data) return <div className="p-4 text-gray-400">불러오는 중...</div>

  const parts = data.items.filter((p) => p.category === category)
  const equippedId = data.equipped[category]
  const equippedPart = data.items.find((p) => p.id === equippedId)

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate('/profile')} className="text-xl text-gray-400">←</button>
        <h2 className="text-xl font-bold">커스터마이징</h2>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold">🥜 {data.nuts}</span>
      </div>

      {/* 아바타 서 있는 영역 — 에셋 나오면 equippedPart 이미지들을 겹쳐서 실제 아바타로 교체 */}
      <div className="mx-auto mb-4 flex h-56 w-full max-w-[220px] flex-col items-center justify-end rounded-2xl bg-gray-100 p-4">
        {equippedPart?.image_url ? (
          <img src={equippedPart.image_url} alt={equippedPart.name} className="pixel h-40 w-40 object-contain" />
        ) : (
          <div className="flex h-40 w-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-center text-xs text-gray-400">
            아바타 자리<br />(에셋 준비 중)
          </div>
        )}
      </div>

      <div className="mb-3 flex gap-2">
        {AVATAR_CATEGORY_KEYS.map((key) => (
          <button key={key} onClick={() => setCategory(key)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold ${
              category === key ? 'bg-lime-400' : 'bg-gray-100 text-gray-500'
            }`}>
            {AVATAR_CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      {parts.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-400">이 카테고리엔 아직 파츠가 없어요.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {parts.map((p) => {
            const isEquipped = equippedId === p.id
            return (
              <div key={p.id} className={`flex flex-col items-center rounded-2xl border p-2 ${
                isEquipped ? 'border-lime-400 bg-lime-50' : ''
              }`}>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="pixel h-12 w-12 object-contain" />
                  ) : (
                    <span className="text-[9px] text-gray-300">준비 중</span>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-[11px] font-bold">{p.name}</p>

                {isEquipped ? (
                  <div className="mt-1 rounded-lg bg-lime-400 px-2 py-1 text-[10px] font-bold">장착중</div>
                ) : p.owned ? (
                  <button onClick={() => handleEquip(p)} disabled={busy === p.id}
                          className="mt-1 rounded-lg bg-gray-200 px-2 py-1 text-[10px] font-bold disabled:opacity-50">
                    장착
                  </button>
                ) : (
                  <button onClick={() => handleBuy(p)} disabled={busy === p.id}
                          className="mt-1 rounded-lg bg-lime-400 px-2 py-1 text-[10px] font-bold disabled:opacity-50">
                    🥜 {p.price}
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