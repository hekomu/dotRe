import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getMyItems } from '../lib/diaryService'
import { getReceivedItems } from '../lib/tradeService'
import { RARITY_TABLE } from '../game/statSystem'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** Date → 'YYYY-MM-DD' (로컬 기준) */
function toKey(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function CalendarPage() {
  const { session } = useAuth()
  const [tab, setTab] = useState('mine')          // mine | received
  const [mine, setMine] = useState([])
  const [received, setReceived] = useState([])
  const [cursor, setCursor] = useState(() => new Date())
  const [picked, setPicked] = useState(null)      // 선택한 날짜 키
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    Promise.all([
      getMyItems(session.user.id),
      getReceivedItems(session.user.id),
    ])
      .then(([a, b]) => { setMine(a); setReceived(b) })
      .catch((err) => console.error('불러오기 실패:', err))
      .finally(() => setLoading(false))
  }, [session])

  // 날짜별로 아이템 묶기
  const byDate = useMemo(() => {
    const map = {}
    const list = tab === 'mine' ? mine : received
    for (const it of list) {
      if (tab === 'mine' && it.meta_status !== 'done') continue
      const raw = tab === 'mine' ? (it.diaries?.diary_date || it.created_at) : it.created_at
      if (!raw) continue
      const key = String(raw).slice(0, 10)
      ;(map[key] ||= []).push(it)
    }
    return map
  }, [tab, mine, received])

  // 이번 달 격자 (앞뒤 빈칸 포함)
  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const out = []
    for (let i = 0; i < first.getDay(); i++) out.push(null)
    for (let d = 1; d <= last.getDate(); d++) out.push(new Date(year, month, d))
    return out
  }, [cursor])

  const moveMonth = (delta) => {
    setPicked(null)
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))
  }

  if (loading) return <div className="p-4">불러오는 중...</div>

  const todayKey = toKey(new Date())
  const pickedItems = picked ? byDate[picked] || [] : []

  return (
    <div className="p-4">
      {/* 탭 */}
      <div className="mb-3 flex gap-2">
        {[['mine', '내 기록'], ['received', '받은 아이템']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setPicked(null) }}
            className={`rounded px-3 py-1 text-sm ${
              tab === key ? 'bg-green-400 font-bold' : 'bg-gray-100 text-gray-500'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* 월 이동 */}
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => moveMonth(-1)} className="px-3 py-1 text-lg">‹</button>
        <span className="font-bold">
          {cursor.getFullYear()}. {cursor.getMonth() + 1}
        </span>
        <button onClick={() => moveMonth(1)} className="px-3 py-1 text-lg">›</button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 text-center text-xs text-gray-400">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className={i === 0 ? 'text-red-400' : ''}>{w}</div>
        ))}
      </div>

      {/* 날짜 격자 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const key = toKey(date)
          const dayItems = byDate[key] || []
          const isToday = key === todayKey
          const isPicked = key === picked

          return (
            <button key={i}
              onClick={() => setPicked(dayItems.length ? key : null)}
              className={`flex h-16 flex-col items-center justify-start overflow-hidden rounded p-0.5
                ${isPicked ? 'ring-2 ring-green-400' : ''}
                ${dayItems.length ? '' : 'opacity-50'}`}>
               <span className={`text-[10px] leading-none ${isToday ? 'font-bold text-green-600' : 'text-gray-400'}`}>
                {date.getDate()}
              </span>
              {dayItems[0] && (
                <div className="relative min-h-0 w-full flex-1">
                  <img src={dayItems[0].image_url} alt=""
                       className="pixel h-full w-full object-contain" />
                  {dayItems.length > 1 && (
                    <span className="absolute bottom-0 right-0 rounded-full bg-gray-700 px-1 text-[8px] text-white">
                      +{dayItems.length - 1}
                    </span>
                  )}
                </div>
              )}
              
            </button>
          )
        })}
      </div>

      {/* 선택한 날 상세 */}
      {pickedItems.length > 0 && (
        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <p className="mb-2 text-sm text-gray-400">{picked}</p>

          {pickedItems.map((it) => {
            const rarity = RARITY_TABLE[it.rarity] || RARITY_TABLE.normal
            return (
              <div key={it.id} className="mb-4 last:mb-0">
                <div className="flex gap-3">
                  <img src={it.image_url} alt={it.name}
                       className="pixel h-20 w-20 rounded-lg"
                       style={{ backgroundColor: rarity.color + '22' }} />
                  <div className="flex-1">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: rarity.color }}>
                      {rarity.label}
                    </span>
                    <p className="mt-1 font-bold">{it.name}</p>
                    <p className="text-xs text-gray-500">{it.description}</p>
                  </div>
                </div>

                {tab === 'mine' && it.diaries?.content && (
                  <div className="mt-2 rounded-lg bg-white p-3">
                    <p className="whitespace-pre-wrap text-sm">{it.diaries.content}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {Object.keys(byDate).length === 0 && (
        <p className="mt-6 text-center text-sm text-gray-400">
          {tab === 'mine'
            ? '아직 기록된 아이템이 없어요. 일기를 작성해보세요!'
            : '아직 받은 아이템이 없어요.'}
        </p>
      )}
    </div>
  )
}