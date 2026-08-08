import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { claimPlate, ownerExists, savePendingClaim } from '../lib/account'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const { signIn, signUp, refreshProfile } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plate, setPlate] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Until a garage owner exists, the first registration creates that account.
  // After that, registering means "I'm a customer" and needs plate + phone.
  const [hasOwner, setHasOwner] = useState<boolean | null>(null)

  useEffect(() => {
    ownerExists()
      .then(setHasOwner)
      .catch(() => setHasOwner(true))
  }, [])

  const registeringAsCustomer = mode === 'register' && hasOwner === true

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        return
      }

      const { needsConfirm } = await signUp(email, password)

      if (registeringAsCustomer) {
        if (needsConfirm) {
          // No session yet, so the claim has to wait for the first sign-in.
          savePendingClaim(plate, phone)
          setNotice(
            'Account created. Confirm your email, then sign in and your vehicle will appear.',
          )
          setMode('login')
          return
        }
        const result = await claimPlate(plate, phone)
        if (!result.ok) {
          setError(
            `${result.error ?? 'Could not match that vehicle.'} Your account was created — you can add the vehicle once the details are corrected.`,
          )
        }
        await refreshProfile()
        return
      }

      if (needsConfirm) {
        setNotice('Account created. Confirm your email, then sign in.')
        setMode('login')
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
          <img src="/logo.png" alt="SK Auto Garage" className="auth-logo-img" />
          <p>{registeringAsCustomer ? 'Track your vehicle' : 'Workshop records'}</p>
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
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </label>

          {registeringAsCustomer && (
            <>
              <label className="field">
                <span>License plate</span>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  autoCapitalize="characters"
                  placeholder="e.g. ΗΚΥ2876"
                  required
                />
              </label>

              <label className="field">
                <span>Phone number</span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="The number the garage has for you"
                  required
                />
                <span className="hint">
                  Used to confirm the vehicle is yours — it must match what the
                  garage has on file.
                </span>
              </label>
            </>
          )}

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
            ? 'No account yet? Register your vehicle'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
