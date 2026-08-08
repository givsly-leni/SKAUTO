import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Registration is a one-time affair: once the garage account exists the
  // sign-up form disappears so nobody else can create an account.
  const [signupOpen, setSignupOpen] = useState<boolean | null>(null)

  useEffect(() => {
    supabase
      .rpc('signup_available')
      .then(({ data, error: rpcError }) => {
        setSignupOpen(rpcError ? false : Boolean(data))
      })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'register') {
        const { needsConfirm } = await signUp(email, password)
        if (needsConfirm) {
          setNotice(
            'Account created. Check your inbox for the confirmation link, then sign in.',
          )
          setMode('login')
        }
        setSignupOpen(false)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">SK</span>
          <h1>SKAUTO</h1>
          <p>Garage workshop records</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === 'register' ? 'new-password' : 'current-password'
              }
              minLength={6}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-notice">{notice}</p>}

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'register'
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        {signupOpen && (
          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError(null)
              setNotice(null)
            }}
          >
            {mode === 'login'
              ? "No account yet? Create one"
              : 'Already have an account? Sign in'}
          </button>
        )}

        {signupOpen === false && mode === 'login' && (
          <p className="auth-hint">This workshop already has an account.</p>
        )}
      </div>
    </div>
  )
}
