import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createVisit } from '../lib/visits'
import { getVehicle } from '../lib/vehicles'
import type { Vehicle, ServiceVisitInput } from '../lib/types'
import { emptyVisitInput } from '../lib/types'
import { formatCar, formatKm } from '../lib/format'
import { Link, navigate } from '../lib/router'
import PartsInput from '../components/PartsInput'

export default function VisitFormPage({ vehicleId }: { vehicleId: string }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [form, setForm] = useState<ServiceVisitInput>(emptyVisitInput())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getVehicle(vehicleId)
      .then(setVehicle)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [vehicleId])

  function set<K extends keyof ServiceVisitInput>(
    key: K,
    value: ServiceVisitInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await createVisit(vehicleId, form)
      navigate(`/vehicles/${vehicleId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="muted">Loading…</p>

  return (
    <div className="page">
      <Link to={`/vehicles/${vehicleId}`} className="back">
        ‹ Back
      </Link>

      <div className="page-head">
        <h1>New visit</h1>
      </div>

      {vehicle && (
        <p className="muted">
          {vehicle.license_plate}
          {formatCar(vehicle.make, vehicle.model)
            ? ` · ${formatCar(vehicle.make, vehicle.model)}`
            : ''}
          {vehicle.odometer_km != null
            ? ` · last recorded ${formatKm(vehicle.odometer_km)}`
            : ''}
        </p>
      )}

      <form onSubmit={handleSubmit} className="form">
        <fieldset>
          <legend>This visit</legend>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={form.visited_at}
              onChange={(e) => set('visited_at', e.target.value)}
              required
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
              placeholder={
                vehicle?.odometer_km != null
                  ? `Last: ${vehicle.odometer_km}`
                  : 'e.g. 192000'
              }
            />
          </label>

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
            <span>Parts changed</span>
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
              placeholder="What was done this time, what to watch next visit…"
            />
          </label>
        </fieldset>

        <p className="hint">
          This is added to the vehicle's history — nothing already recorded is
          changed or lost.
        </p>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add to history'}
          </button>
        </div>
      </form>
    </div>
  )
}
