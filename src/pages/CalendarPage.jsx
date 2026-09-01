import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getMyItems } from '../lib/diaryService'
import { getReceivedItems } from '../lib/tradeService'
import { RARITY_TABLE, STAT_KEYS, STAT_LABELS, statPercent } from '../game/statSystem'

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
  const [detail, setDetail] = useState(null)
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
              <div key={it.id} className="mb-4 flex gap-3 last:mb-0">
                <button onClick={() => setDetail(it)} className="flex-none">
                  <img src={it.image_url} alt={it.name}
                       className="pixel h-20 w-20 rounded-lg"
                       style={{ backgroundColor: rarity.color + '22' }} />
                </button>

                <div className="min-w-0 flex-1 rounded-lg bg-white p-3">
                  {tab === 'mine' ? (
                    <p className="whitespace-pre-wrap text-sm">
                      {it.diaries?.content || '작성된 일기가 없어요'}
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400">보낸 사람</p>
                      <p className="text-sm font-bold">
                        {it.sender?.nickname ?? it.sender?.full_name ?? '알 수 없음'}
                      </p>
                    </>
                  )}
                </div>
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
          {detail && (() => {
        const rarity = RARITY_TABLE[detail.rarity] || RARITY_TABLE.normal
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
               onClick={() => setDetail(null)}>
            <div className="max-h-[80vh] w-full max-w-xs overflow-y-auto rounded-2xl bg-white p-5"
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