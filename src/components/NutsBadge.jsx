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
    <span className={`rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold ${className}`}>
      🥜 {nuts}
    </span>
  )
}