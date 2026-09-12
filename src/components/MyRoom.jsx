import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getPlacedItems } from '../lib/roomService'

const SIZE = 0.22

export default function MyRoom({ className = '' }) {
  const { session } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    const id = session?.user?.id
    if (!id) return
    getPlacedItems(id).then(setItems).catch(console.error)
  }, [session])

  return (
    <div className={`relative aspect-square w-full overflow-hidden ${className}`}>
      {items.map((r) => (
        <img key={r.id} src={r.items.image_url} alt={r.items.name}
             className="pixel absolute"
             style={{
               left: `${(r.x ?? 0.5) * 100}%`,
               top: `${(r.y ?? 0.5) * 100}%`,
               width: `${SIZE * (r.scale ?? 1) * 100}%`,
               zIndex: r.z ?? 0,
               transform: `translate(-50%, -50%) scaleX(${r.flipped ? -1 : 1})`,
             }} />
      ))}
    </div>
  )
}