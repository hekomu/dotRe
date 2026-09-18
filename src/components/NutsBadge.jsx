import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function NutsBadge({ className = '' }) {
  const { session } = useAuth()
  const [nuts, setNuts] = useState(null)

  useEffect(() => {
    const id = session?.user?.id
    if (!id) return
    supabase.from('profiles').select('nuts').eq('id', id).single()
      .then(({ data }) => setNuts(data?.nuts ?? 0))
  }, [session])

  if (nuts === null) return null

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-line bg-[#fdf0c8] px-3 py-1 font-galmuri9 text-[14px] font-bold text-black ${className}`}
    >
      <img src="/assets/icons/Nuts.png" className="h-6 w-6" /> {nuts}
    </span>
  )
}
