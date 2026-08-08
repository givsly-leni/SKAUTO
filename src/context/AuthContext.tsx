import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthValue {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsConfirm: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      },
      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // If email confirmation is on, there's no session until the link is clicked.
        return { needsConfirm: !data.session }
      },
      async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
