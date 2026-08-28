import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWeekly, claimWeekly } from '../lib/api'
import { GRADE_TABLE } from '../game/weekly'

const gradeColor = (g) => GRADE_TABLE.find((x) => x.grade === g)?.color ?? '#9ca3af'

/** 단상 하나 — 아이템이 없으면 빈 받침만 */
function Pedestal({ item }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-14 w-14 items-end justify-center">
        {item && (
          <img src={item.image_url} alt={item.name}
               className="pixel max-h-14 max-w-14 object-contain" />
        )}
      </div>
      <div className="h-4 w-14 rounded-[50%] bg-lime-400 shadow-inner" />
    </div>
  )
}

export default function WeeklyPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)   // 결산 창

  const load = () => { getWeekly().then(setData).catch((e) => setError(e.message)) }
  useEffect(load, [])

  const handleStart = async () => {
    setBusy(true)
    try {
      const r = await claimWeekly(current.weekStart)
      setResult(r)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (error) return <div className="p-4 text-sm text-gray-500">{error}</div>
  if (!data) return <div className="p-4 text-gray-400">불러오는 중...</div>

  const current = data.weeks.find((w) => w.isCurrent)
  if (!current) return <div className="p-4">평가 정보를 불러오지 못했습니다</div>

  // 단상 7칸 — 위 4개, 아래 3개
  const slots = Array.from({ length: 7 }, (_, i) => current.items[i] ?? null)

  return (
    <div className="relative flex min-h-full flex-col items-center p-4">
      {/* 너트 */}
      <div className="absolute right-4 top-4 rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold">
        🥜 {data.nuts}
      </div>

      <h2 className="mt-8 text-2xl font-black text-pink-500">주간 평가</h2>

      {/* 박사 + 말풍선 */}
      <div className="mt-6 flex w-full items-start gap-2">
        <div className="h-24 w-20 flex-none rounded-xl bg-gray-100" />
        <div className="relative flex-1 rounded-xl bg-gray-100 p-3 text-sm">
          이번 주 주간평가<br />보너스 아이템은...<br />
          <b className="text-lg text-pink-500">{current.bonusLabel}</b> 라네..
        </div>
      </div>

      {/* 단상 7개 */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex gap-3">
          {slots.slice(0, 4).map((it, i) => <Pedestal key={i} item={it} />)}
        </div>
        <div className="flex gap-3">
          {slots.slice(4, 7).map((it, i) => <Pedestal key={i} item={it} />)}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        이번 주 아이템 {current.itemCount}개
        {current.bonusCount > 0 && ` · 보너스 +${current.bonusCount}`}
      </p>

      {/* 평가 시작 */}
      <div className="mt-6 w-full max-w-xs">
        {current.claimed ? (
          <div className="rounded-full bg-gray-200 py-3 text-center font-bold text-gray-400">
            이번 주 평가 완료
          </div>
        ) : (
          <button onClick={handleStart} disabled={!current.claimable || busy}
            className="w-full rounded-full bg-lime-400 py-3 text-lg font-black shadow disabled:bg-gray-200 disabled:text-gray-400">
            {busy ? '평가 중...' : '평가 시작!'}
          </button>
        )}
        {!current.claimed && !current.isSunday && (
          <p className="mt-2 text-center text-xs text-gray-400">
            평가는 일요일에 열려요
          </p>
        )}
      </div>

      <button onClick={() => navigate('/')}
              className="mt-6 self-start rounded-full bg-lime-400 px-4 py-2 font-bold">
        ←
      </button>

      {/* 결산 창 */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
             onClick={() => setResult(null)}>
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center"
               onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-400">이번 주 평가 결과</p>
            <p className="my-3 text-6xl font-black"
               style={{ color: gradeColor(result.grade) }}>
              {result.grade}
            </p>
            <div className="rounded-xl bg-yellow-50 py-3 font-bold">
              🥜 너트 {result.reward} 획득!
            </div>
            <p className="mt-2 text-xs text-gray-400">보유 너트 {result.nuts}</p>
            <button onClick={() => setResult(null)}
                    className="mt-4 w-full rounded-full bg-lime-400 py-2 font-bold">
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}