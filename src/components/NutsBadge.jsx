import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import NutsBar from './NutsBar'

export default function NutsBadge({ widthClass = 'w-full', textClass = 'text-[12px]' }) {
  const { session } = useAuth()
  const [nuts, setNuts] = useState(null)

  useEffect(() => {
    const id = session?.user?.id
    if (!id) return
    supabase.from('profiles').select('nuts').eq('id', id).single()
      .then(({ data }) => setNuts(data?.nuts ?? 0))
  }, [session])

  if (nuts === null) return null

  return <NutsBar value={nuts} widthClass={widthClass} textClass={textClass} />
}