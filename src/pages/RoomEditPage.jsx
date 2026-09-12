import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getRoomItems, saveRoomLayout } from '../lib/roomService'

const SIZE = 0.22          // 아이템 크기 (방 폭 대비 비율)

export default function RoomEditPage() {
  const { session } = useAuth()
  const myId = session?.user.id
  const navigate = useNavigate()
  const roomRef = useRef(null)

  const [rows, setRows] = useState([])
  const [dragId, setDragId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!myId) return
    getRoomItems(myId).then(setRows).catch(console.error)
  }, [myId])

  const placed = rows.filter((r) => r.placed)
  const stored = rows.filter((r) => !r.placed)

  const update = (id, fields) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...fields } : r)))
    setDirty(true)
  }

  /** 포인터 위치를 방 기준 비율로 변환 */
  const toRatio = (e) => {
    const box = roomRef.current.getBoundingClientRect()
    return {
      x: Math.min(0.95, Math.max(0.05, (e.clientX - box.left) / box.width)),
      y: Math.min(0.95, Math.max(0.05, (e.clientY - box.top) / box.height)),
    }
  }

  const handleMove = (e) => {
    if (!dragId) return
    e.preventDefault()
    update(dragId, toRatio(e))
  }

  /** 보관함에서 방으로 꺼내기 */
  const placeItem = (row) => {
    const maxZ = Math.max(0, ...rows.map((r) => r.z ?? 0))
    update(row.id, { placed: true, x: 0.5, y: 0.5, z: maxZ + 1, scale: 1 })
    setSelected(row.id)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveRoomLayout(rows)
      setDirty(false)
      alert('방을 저장했어요!')
    } catch (err) {
      alert('저장 실패: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const sel = rows.find((r) => r.id === selected)

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="text-xl text-gray-400">←</button>
          <h2 className="text-lg font-bold">방 꾸미기</h2>
        </div>
        <button onClick={handleSave} disabled={!dirty || saving}
                className="rounded-full bg-lime-400 px-4 py-1.5 text-sm font-bold disabled:bg-gray-200 disabled:text-gray-400">
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* 방 */}
      <div ref={roomRef}
           onPointerMove={handleMove}
           onPointerUp={() => setDragId(null)}
           onPointerLeave={() => setDragId(null)}
           onPointerDown={(e) => { if (e.target === roomRef.current) setSelected(null) }}
           className="relative aspect-square w-full touch-none overflow-hidden rounded-2xl bg-gray-100">
        {placed.map((r) => (
          <img key={r.id}
               src={r.items.image_url}
               alt={r.items.name}
               draggable={false}
               onPointerDown={(e) => {
                 e.preventDefault()
                 e.currentTarget.setPointerCapture(e.pointerId)
                 setDragId(r.id)
                 setSelected(r.id)
               }}
               className={`pixel absolute -translate-x-1/2 -translate-y-1/2 cursor-move select-none
                 ${selected === r.id ? 'ring-2 ring-lime-400' : ''}`}
               style={{
                 left: `${(r.x ?? 0.5) * 100}%`,
                 top: `${(r.y ?? 0.5) * 100}%`,
                 width: `${SIZE * (r.scale ?? 1) * 100}%`,
                 zIndex: r.z ?? 0,
                 transform: `translate(-50%, -50%) scaleX(${r.flipped ? -1 : 1})`,
               }} />
        ))}

        {placed.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            아래 보관함에서 아이템을 꺼내보세요
          </p>
        )}
      </div>

      {/* 선택한 아이템 조작 */}
      {sel && (
        <div className="mt-2 rounded-xl bg-gray-50 p-2">
         <div className="flex items-center gap-2">
          <span className="line-clamp-1 flex-1 text-xs font-bold">{sel.items.name}</span>
          <button onClick={() => update(sel.id, { flipped: !sel.flipped })}
                  className="rounded bg-white px-2 py-1 text-xs">좌우반전</button>
          <button onClick={() => {
                    const maxZ = Math.max(0, ...rows.map((r) => r.z ?? 0))
                    update(sel.id, { z: maxZ + 1 })
                  }}
                  className="rounded bg-white px-2 py-1 text-xs">앞으로</button>
          <button onClick={() => { update(sel.id, { placed: false }); setSelected(null) }}
                  className="rounded bg-red-100 px-2 py-1 text-xs text-red-500">치우기</button>
        </div>

         <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-400">크기</span>
            <input type="range" min="0.4" max="2" step="0.05"
                   value={sel.scale ?? 1}
                   onChange={(e) => update(sel.id, { scale: Number(e.target.value) })}
                   className="flex-1" />
            <span className="w-10 text-right text-xs">
              {Math.round((sel.scale ?? 1) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* 보관함 */}
      <p className="mb-2 mt-3 text-sm font-bold text-gray-500">
        보관함 ({stored.length})
      </p>
      <div className="flex-1 overflow-y-auto">
        {stored.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            상점에서 아이템을 구매하면 여기에 담겨요.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {stored.map((r) => (
              <button key={r.id} onClick={() => placeItem(r)}
                      className="flex flex-col items-center rounded-xl border p-1">
                <img src={r.items.image_url} alt={r.items.name}
                     className="pixel h-12 w-12 object-contain" />
                <span className="mt-0.5 line-clamp-1 text-[10px]">{r.items.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}