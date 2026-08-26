import { useState, useEffect } from 'react'
import { getWeekly, claimWeekly } from '../lib/api'
import { GRADE_TABLE } from '../game/weekly'

const gradeColor = (g) =>
  GRADE_TABLE.find((x) => x.grade === g)?.color ?? '#9ca3af'

export default function WeeklyPage() {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const load = () => {
    getWeekly().then(setData).catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const handleClaim = async (weekStart) => {
    setBusy(true)
    try {
      const r = await claimWeekly(weekStart)
      alert(`${r.grade} 등급! 너트 ${r.reward}개를 받았어요.`)
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
  const past = data.weeks.filter((w) => !w.isCurrent)

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">주간 평가</h2>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold">
          🥜 {data.nuts}
        </span>
      </div>

      {/* 이번 주 */}
      {current && (
        <div className="rounded-2xl border-2 p-4"
             style={{ borderColor: gradeColor(current.grade) }}>
          <p className="text-xs text-gray-400">이번 주 ({current.weekStart} ~)</p>

          <div className="my-3 flex items-center gap-4">
            <span className="text-4xl font-black"
                  style={{ color: gradeColor(current.grade) }}>
              {current.grade}
            </span>
            <div className="text-sm">
              <p>만든 아이템 <b>{current.itemCount}</b>개</p>
              <p className="text-gray-500">
                보너스 <b>{current.bonusLabel}</b> +{current.bonusCount}
              </p>
              <p className="font-bold">합계 {current.totalCount}</p>
            </div>
          </div>

          {current.claimed ? (
            <p className="text-center text-sm text-gray-400">수령 완료</p>
          ) : current.claimable ? (
            <button onClick={() => handleClaim(current.weekStart)} disabled={busy}
                    className="w-full rounded-xl bg-green-400 py-3 font-bold disabled:opacity-50">
              보상 받기 (🥜 {current.reward})
            </button>
          ) : (
            <p className="text-center text-sm text-gray-400">
              평가는 일요일에 열려요
            </p>
          )}
        </div>
      )}

      {/* 이번 주 보너스 안내 */}
      {current && (
        <p className="mt-3 rounded-xl bg-gray-50 p-3 text-center text-sm">
          이번 주 보너스 카테고리는 <b>{current.bonusLabel}</b>! <br />
          <span className="text-gray-500">해당 아이템은 1개당 2개로 계산돼요.</span>
        </p>
      )}

      {/* 지난 주들 */}
      <h3 className="mb-2 mt-6 text-sm font-bold text-gray-500">지난 주</h3>
      <div className="flex flex-col gap-2">
        {past.map((w) => (
          <div key={w.weekStart}
               className="flex items-center gap-3 rounded-xl border p-3">
            <span className="w-8 text-center text-xl font-black"
                  style={{ color: gradeColor(w.grade) }}>
              {w.grade}
            </span>
            <div className="flex-1 text-xs text-gray-500">
              <p>{w.weekStart}</p>
              <p>아이템 {w.itemCount} + 보너스 {w.bonusCount} = {w.totalCount}</p>
            </div>
            {w.claimed ? (
              <span className="text-xs text-gray-400">수령완료</span>
            ) : w.reward > 0 ? (
              <button onClick={() => handleClaim(w.weekStart)} disabled={busy}
                      className="rounded bg-green-400 px-3 py-1 text-xs font-bold disabled:opacity-50">
                🥜 {w.reward}
              </button>
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}