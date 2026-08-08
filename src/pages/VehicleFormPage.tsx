import { useEffect, useMemo, useState } from 'react'
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
import {
  decodeVin,
  fetchMakes,
  fetchModels,
  fetchModelsForMakeYear,
  listModelYears,
} from '../lib/vehicleApi'
import PartsInput from '../components/PartsInput'
import Combobox from '../components/Combobox'

export default function VehicleFormPage({ id }: { id?: string }) {
  const editing = Boolean(id)
  const [form, setForm] = useState<VehicleInput>(emptyVehicleInput())
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reference data from the NHTSA vPIC database
  const [makes, setMakes] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [makesLoading, setMakesLoading] = useState(true)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [lookupNote, setLookupNote] = useState<string | null>(null)
  const [decoding, setDecoding] = useState(false)

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

  useEffect(() => {
    const ctrl = new AbortController()
    fetchMakes(ctrl.signal)
      .then(setMakes)
      .catch(() => setMakes([]))
      .finally(() => setMakesLoading(false))
    return () => ctrl.abort()
  }, [])

  const make = form.make
  const year = form.vehicle_year
  useEffect(() => {
    if (!make.trim()) {
      setModels([])
      return
    }
    const ctrl = new AbortController()
    setModelsLoading(true)
    // With a year the list is far tighter and drops other-era models.
    const request = /^\d{4}$/.test(year)
      ? fetchModelsForMakeYear(make, year, ctrl.signal)
      : fetchModels(make, ctrl.signal)
    request
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false))
    return () => ctrl.abort()
  }, [make, year])

  const yearOptions = useMemo(() => listModelYears(), [])

  async function handleDecodeVin() {
    setLookupNote(null)
    setDecoding(true)
    try {
      const details = await decodeVin(form.vin)
      if (!details) {
        setLookupNote('No match for that VIN in the vehicle database.')
        return
      }
      setForm((prev) => ({
        ...prev,
        make: details.make || prev.make,
        model: details.model || prev.model,
        vehicle_year: details.year || prev.vehicle_year,
        // Only fill the engine field if it's still empty — never overwrite
        // something read off the block by hand.
        engine_number: prev.engine_number || details.engineCode,
      }))
      const extras = [
        details.engineCode,
        details.bodyClass,
        details.engine,
        details.fuel,
      ]
        .filter(Boolean)
        .join(' · ')
      setLookupNote(
        `Found ${[details.year, details.make, details.model]
          .filter(Boolean)
          .join(' ')}${extras ? ` — ${extras}` : ''}`,
      )
    } catch (err) {
      setLookupNote(
        err instanceof Error ? err.message : 'Could not reach the VIN database.',
      )
    } finally {
      setDecoding(false)
    }
  }

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

          <div className="field">
            <span>Make</span>
            <Combobox
              value={form.make}
              onChange={(v) => {
                setForm((prev) =>
                  // Changing make invalidates the chosen model.
                  prev.make === v ? prev : { ...prev, make: v, model: '' },
                )
              }}
              options={makes}
              loading={makesLoading}
              placeholder="Search or type a make"
            />
          </div>

          <div className="field">
            <span>Year</span>
            <Combobox
              value={form.vehicle_year}
              onChange={(v) => set('vehicle_year', v.replace(/[^0-9]/g, ''))}
              options={yearOptions}
              placeholder="Select or type a year"
            />
          </div>

          <div className="field">
            <span>Model</span>
            <Combobox
              value={form.model}
              onChange={(v) => set('model', v)}
              options={models}
              loading={modelsLoading}
              placeholder={
                form.make ? 'Search or type a model' : 'Type a model'
              }
              hint={
                form.make && !modelsLoading && models.length === 0
                  ? 'No models listed for this make — type it in.'
                  : undefined
              }
            />
          </div>

          <div className="field">
            <span>VIN (chassis number)</span>
            <div className="vin-row">
              <input
                type="text"
                className="mono"
                value={form.vin}
                onChange={(e) => set('vin', e.target.value)}
                autoCapitalize="characters"
                maxLength={17}
                placeholder="17 characters"
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void handleDecodeVin()}
                disabled={decoding || form.vin.trim().length < 11}
              >
                {decoding ? '…' : 'Decode'}
              </button>
            </div>
            {lookupNote && <p className="hint">{lookupNote}</p>}
          </div>

          <label className="field">
            <span>Engine number / code</span>
            <input
              type="text"
              className="mono"
              value={form.engine_number}
              onChange={(e) => set('engine_number', e.target.value)}
              autoCapitalize="characters"
              placeholder="e.g. 4ZZ"
            />
            <span className="hint">
              Filled from the VIN when the database knows the engine code.
            </span>
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


        </fieldset>

        <fieldset>
          <legend>{editing ? 'Job' : 'First visit'}</legend>

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

          {form.status === 'scheduled' && (
            <label className="field">
              <span>Appointment</span>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => set('scheduled_at', e.target.value)}
              />
              <span className="hint">
                When the car is booked in. Your customer sees this too.
              </span>
            </label>
          )}

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
          {editing
            ? 'Use "Add history" on the vehicle page to log a new visit — editing here changes the current details rather than adding to the history.'
            : 'The registration date fills in automatically, and these details are saved as the first entry in the vehicle history.'}
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
