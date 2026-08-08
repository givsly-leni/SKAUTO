import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createVehicle,
  getVehicle,
  updateVehicle,
  vehicleToInput,
} from '../lib/vehicles'
import type { JobStatus, VehicleInput } from '../lib/types'
import { STATUS_META, STATUS_ORDER, emptyVehicleInput } from '../lib/types'
import { Link, navigate } from '../lib/router'
import PartsInput from '../components/PartsInput'

export default function VehicleFormPage({ id }: { id?: string }) {
  const editing = Boolean(id)
  const [form, setForm] = useState<VehicleInput>(emptyVehicleInput())
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getVehicle(id)
      .then((v) => {
        if (v) setForm(vehicleToInput(v))
        else setError('That vehicle no longer exists.')
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  function set<K extends keyof VehicleInput>(key: K, value: VehicleInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (id) {
        await updateVehicle(id, form)
        navigate(`/vehicles/${id}`)
      } else {
        const created = await createVehicle(form)
        navigate(`/vehicles/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="muted">Loading…</p>

  return (
    <div className="page">
      <Link to={id ? `/vehicles/${id}` : '/vehicles'} className="back">
        ‹ Back
      </Link>

      <div className="page-head">
        <h1>{editing ? 'Edit vehicle' : 'New vehicle'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <fieldset>
          <legend>Customer</legend>

          <label className="field">
            <span>Customer name *</span>
            <input
              type="text"
              value={form.customer_name}
              onChange={(e) => set('customer_name', e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Phone number</span>
            <input
              type="tel"
              inputMode="tel"
              value={form.customer_phone}
              onChange={(e) => set('customer_phone', e.target.value)}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Vehicle</legend>

          <label className="field">
            <span>License plate *</span>
            <input
              type="text"
              value={form.license_plate}
              onChange={(e) => set('license_plate', e.target.value)}
              autoCapitalize="characters"
              required
            />
          </label>

          <label className="field">
            <span>VIN (chassis number)</span>
            <input
              type="text"
              className="mono"
              value={form.vin}
              onChange={(e) => set('vin', e.target.value)}
              autoCapitalize="characters"
              maxLength={17}
            />
          </label>

          <label className="field">
            <span>Engine number</span>
            <input
              type="text"
              className="mono"
              value={form.engine_number}
              onChange={(e) => set('engine_number', e.target.value)}
              autoCapitalize="characters"
            />
          </label>

          <label className="field">
            <span>Kilometers</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={form.odometer_km}
              onChange={(e) => set('odometer_km', e.target.value)}
              placeholder="e.g. 184000"
            />
          </label>

          <label className="field">
            <span>Vehicle year / date</span>
            <input
              type="date"
              value={form.vehicle_date}
              onChange={(e) => set('vehicle_date', e.target.value)}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Job</legend>

          <div className="field">
            <span>Status</span>
            <div className="segmented">
              {STATUS_ORDER.map((status: JobStatus) => (
                <button
                  key={status}
                  type="button"
                  className={form.status === status ? 'seg active' : 'seg'}
                  onClick={() => set('status', status)}
                >
                  {STATUS_META[status].label}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>Cost</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.cost}
              onChange={(e) => set('cost', e.target.value)}
              placeholder="0.00"
            />
          </label>

          <div className="field">
            <span>Restored parts</span>
            <PartsInput
              value={form.restored_parts}
              onChange={(next) => set('restored_parts', next)}
            />
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows={5}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Work done, parts ordered, what to check next time…"
            />
          </label>
        </fieldset>

        <p className="hint">
          The registration date is filled in automatically when the record is
          created.
        </p>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add vehicle'}
          </button>
        </div>
      </form>
    </div>
  )
}
