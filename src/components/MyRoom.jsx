import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getPlacedItems, getPlacedFurniture } from '../lib/roomService'

const SIZE = 0.22
const FURN_SIZE = 0.3

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