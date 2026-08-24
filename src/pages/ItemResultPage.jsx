import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { regenerateItem } from '../lib/api'
import { STAT_KEYS, STAT_LABELS, RARITY_TABLE, statPercent } from '../game/statSystem'

export default function ItemResultPage() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let alive = true

    supabase.from('items').select('*').eq('id', itemId).single()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) setLoadError('아이템을 찾을 수 없습니다')
        else setItem(data)
      })

    const channel = supabase
      .channel(`item-${itemId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${itemId}` },
        ({ new: row }) => { if (alive) setItem(row) })
      .subscribe()

    return () => { alive = false; supabase.removeChannel(channel) }
  }, [itemId])

  const handleRetry = async () => {
    try {
      setItem((prev) => ({ ...prev, meta_status: 'pending', error_msg: null }))
      await regenerateItem(itemId)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleShare = async () => {
    try {
      const blob = await (await fetch(item.image_url)).blob()
      const file = new File([blob], `${item.name}.png`, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: item.name })
        return
      }
      const url = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'),
        { href: url, download: `${item.name}.png` }).click()
      URL.revokeObjectURL(url)
    } catch {
      alert('이미지를 저장하지 못했습니다')
    }
  }

  if (loadError) {
    return (
      <div className="p-4">
        <p>{loadError}</p>
        <button onClick={() => navigate('/')} className="mt-2 underline">홈으로</button>
      </div>
    )
  }

  if (!item) {
    return <div className="p-4 text-center text-gray-400">불러오는 중...</div>
  }

  // 생성 중
  if (item.meta_status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-500" />
        <p className="font-bold">아이템을 만들고 있어요</p>
        <p className="text-sm text-gray-400">20~30초 정도 걸려요</p>
      </div>
    )
  }

  // 실패
  if (item.meta_status === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-center">{item.error_msg || '아이템 생성에 실패했어요'}</p>
        <div className="flex gap-2">
          <button onClick={handleRetry} className="rounded bg-green-400 px-4 py-2 font-bold">
            다시 시도
          </button>
          <button onClick={() => navigate('/')} className="rounded bg-gray-200 px-4 py-2">
            메인화면으로
          </button>
        </div>
      </div>
    )
  }

  const rarity = RARITY_TABLE[item.rarity] || RARITY_TABLE.normal

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="rounded-2xl p-4" style={{ backgroundColor: rarity.color + '22' }}>
        <img src={item.image_url} alt={item.name} className="pixel h-48 w-48" />
      </div>

      <span className="rounded-full px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: rarity.color }}>
        {rarity.label}
      </span>

      <h2 className="text-xl font-bold">{item.name}</h2>
      <p className="text-center text-sm text-gray-600">{item.description}</p>

      <div className="w-full max-w-xs rounded-xl bg-gray-50 p-4">
        {STAT_KEYS.map((k) => (
          <div key={k} className="mb-2 flex items-center gap-2">
            <span className="w-16 text-sm">
              {STAT_LABELS[k].icon} {STAT_LABELS[k].ko}
            </span>
            <div className="h-2 flex-1 rounded-full bg-gray-200">
              <div className="h-2 rounded-full"
                   style={{ width: `${statPercent(item.stats?.[k] ?? 0)}%`,
                            backgroundColor: STAT_LABELS[k].color }} />
            </div>
            <span className="w-8 text-right text-sm font-bold">{item.stats?.[k] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button onClick={() => navigate('/')} className="rounded bg-gray-200 px-4 py-2">
          메인화면으로
        </button>
        <button onClick={() => navigate('/calendar')} className="rounded bg-gray-200 px-4 py-2">
          캘린더 확인
        </button>
        <button onClick={handleShare} className="rounded bg-green-400 px-4 py-2 font-bold">
          공유 · 저장
        </button>
        <button onClick={handleRetry} className="rounded border px-4 py-2 text-sm">
          다시 뽑기
        </button>
      </div>
    </div>
  )
}