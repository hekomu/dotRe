import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getPlacedItems, getPlacedFurniture } from '../lib/roomService'

const SIZE = 0.22
const FURN_SIZE = 0.3
const AVATAR_SIZE = 0.32

export default function MyRoom({ className = '' }) {
  const { session } = useAuth()
  const [items, setItems] = useState([])
  const [furniture, setFurniture] = useState([])

  useEffect(() => {
    const id = session?.user?.id
    if (!id) return
    getPlacedItems(id).then(setItems).catch(console.error)
    getPlacedFurniture(id).then(setFurniture).catch(console.error)
  }, [session])

  const all = [
    ...items.map((r) => ({ ...r, key: `i-${r.id}`, image: r.items.image_url, name: r.items.name, size: SIZE })),
    ...furniture.map((r) => ({ ...r, key: `f-${r.id}`, image: r.furniture_catalog?.image_url, name: r.furniture_catalog?.name, size: FURN_SIZE })),
  ]

  return (
    <div className={`relative aspect-square w-full overflow-hidden ${className}`}>
      {/* ▼ 방 배경 (room/Room.png) — 항상 맨 뒤 */}
      <img
        src="/assets/room/Room.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ zIndex: -1 }}
        draggable={false}
      />

      {/* ▼ 임시 배치 아바타 (char/Avatar.png) — 파츠 합성 전까지 고정 위치 */}
      <img
        src="/assets/char/Avatar.png"
        alt="내 아바타"
        className="pixel absolute"
        style={{
          left: '50%',
          top: '55%',
          width: `${AVATAR_SIZE * 100}%`,
          zIndex: 1,
          transform: 'translate(-50%, -50%)',
        }}
        draggable={false}
      />

      {all.map((r) => (
        <img key={r.key} src={r.image} alt={r.name}
             className="pixel absolute"
             style={{
               left: `${(r.x ?? 0.5) * 100}%`,
               top: `${(r.y ?? 0.5) * 100}%`,
               width: `${r.size * (r.scale ?? 1) * 100}%`,
               zIndex: r.z ?? 0,
               transform: `translate(-50%, -50%) scaleX(${r.flipped ? -1 : 1})`,
             }} />
      ))}
    </div>
  )
}