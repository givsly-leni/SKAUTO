import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Status = 'checking' | 'connected' | 'not-configured' | 'error'

// Small dev helper that pings Supabase so you can see at a glance whether
// the .env credentials are wired up correctly. Safe to delete once you've
// built real features on top of the database.
export default function ConnectionStatus() {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!url || !key || url.includes('YOUR-PROJECT-REF')) {
      setStatus('not-configured')
      return
    }

    supabase.auth
      .getSession()
      .then(() => setStatus('connected'))
      .catch(() => setStatus('error'))
  }, [])

  const label: Record<Status, string> = {
    checking: 'Checking Supabase connection…',
    connected: 'Supabase connected',
    'not-configured': 'Supabase not configured yet (see .env.example)',
    error: 'Could not reach Supabase',
  }

  const color: Record<Status, string> = {
    checking: '#9CA3AF',
    connected: '#22C55E',
    'not-configured': '#F59E0B',
    error: '#EF4444',
  }

  return (
    <div className="status-pill" style={{ borderColor: color[status] }}>
      <span className="status-dot" style={{ backgroundColor: color[status] }} />
      {label[status]}
    </div>
  )
}
