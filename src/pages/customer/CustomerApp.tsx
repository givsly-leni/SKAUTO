import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  claimPlate,
  listMyPlates,
  removePlate,
} from '../../lib/account'
import type { ClaimedPlate } from '../../lib/account'
import CustomerHome from './CustomerHome'

export default function CustomerApp() {
  const { signOut } = useAuth()
  const [plates, setPlates] = useState<ClaimedPlate[]>([])
  const [reloadKey, setReloadKey] = useState(0)
  const [adding, setAdding] = useState(false)
  const [plate, setPlate] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    listMyPlates()
      .then(setPlates)
      .catch(() => setPlates([]))
  }, [reloadKey])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      const result = await claimPlate(plate, phone)
      if (!result.ok) {
        setError(result.error ?? 'Could not match that vehicle.')
        return
      }
      setNotice(`${result.plate} added.`)
      setPlate('')
      setPhone('')
      setAdding(false)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(id: string) {
    await removePlate(id)
    setReloadKey((k) => k + 1)
  }

  return (
    <div className="app">
      <header className="cust-topbar">
        <img src="/icons/icon-192.png" alt="" className="brand-logo-img" />
        <span className="brand-name">SK AUTO GARAGE</span>
        <button className="btn btn-ghost btn-sm" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>

      <main className="content cust-content">
        <div className="page-head">
          <h1>My vehicles</h1>
        </div>

        <CustomerHome reloadKey={reloadKey} />

        <section className="detail-block">
          <h2>Linked plates</h2>
          {plates.length === 0 ? (
            <p className="muted small">None yet.</p>
          ) : (
            <ul className="plate-list">
              {plates.map((p) => (
                <li key={p.id}>
                  <span className="plate">{p.license_plate}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void handleRemove(p.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {adding ? (
            <form onSubmit={handleAdd} className="form add-plate">
              <label className="field">
                <span>License plate</span>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  autoCapitalize="characters"
                  required
                />
              </label>
              <label className="field">
                <span>Phone number on file</span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <div className="form-actions">
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? 'Checking…' : 'Add vehicle'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setAdding(false)
                    setError(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              {error && <p className="form-error">{error}</p>}
              {notice && <p className="form-notice">{notice}</p>}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setAdding(true)}
              >
                + Add another vehicle
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
