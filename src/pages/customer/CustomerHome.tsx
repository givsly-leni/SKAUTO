import { useEffect, useState } from 'react'
import { listMyVehicles } from '../../lib/account'
import type { Vehicle } from '../../lib/types'
import {
  formatCar,
  formatDate,
  formatDateTime,
  formatKm,
  formatMoney,
} from '../../lib/format'
import { STATUS_META } from '../../lib/types'
import StatusBadge from '../../components/StatusBadge'

function VehicleCard({ v }: { v: Vehicle }) {
  const car = formatCar(v.make, v.model)
  return (
    <article className="cust-card">
      <header className="cust-card-head">
        <div>
          <h2 className="plate-lg">{v.license_plate}</h2>
          {car && <p className="car-line">{car}{v.vehicle_year ? ` · ${v.vehicle_year}` : ''}</p>}
        </div>
        <StatusBadge status={v.status} />
      </header>

      {v.scheduled_at && v.status === 'scheduled' && (
        <div className="appointment">
          <span className="appointment-label">Your appointment</span>
          <strong>{formatDateTime(v.scheduled_at)}</strong>
        </div>
      )}

      <div
        className="cust-progress"
        aria-label={`Status: ${STATUS_META[v.status].label}`}
      >
        {(['scheduled', 'in_progress', 'completed'] as const).map((step, i) => {
          const order = { scheduled: 0, in_progress: 1, completed: 2 }
          const done = order[v.status] >= i
          return (
            <div key={step} className={done ? 'step done' : 'step'}>
              <span
                className="step-dot"
                style={done ? { background: STATUS_META[v.status].color } : undefined}
              />
              <span className="step-label">{STATUS_META[step].label}</span>
            </div>
          )
        })}
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Cost</dt>
          <dd>{formatMoney(v.cost)}</dd>
        </div>
        <div>
          <dt>Kilometers</dt>
          <dd>{formatKm(v.odometer_km)}</dd>
        </div>
        <div>
          <dt>Engine no / code</dt>
          <dd className="mono">{v.engine_number || '—'}</dd>
        </div>
        <div>
          <dt>VIN</dt>
          <dd className="mono">{v.vin || '—'}</dd>
        </div>
        <div>
          <dt>Booked in</dt>
          <dd>{formatDate(v.registered_at)}</dd>
        </div>
        <div>
          <dt>Last update</dt>
          <dd>{formatDate(v.updated_at)}</dd>
        </div>
      </dl>

      {v.restored_parts.length > 0 && (
        <section className="detail-block">
          <h3>Work done</h3>
          <div className="chips">
            {v.restored_parts.map((part) => (
              <span key={part} className="chip static">
                {part}
              </span>
            ))}
          </div>
        </section>
      )}

      {v.notes && (
        <section className="detail-block">
          <h3>Notes from the garage</h3>
          <p className="notes">{v.notes}</p>
        </section>
      )}
    </article>
  )
}

export default function CustomerHome({ reloadKey }: { reloadKey: number }) {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setVehicles(null)
    listMyVehicles()
      .then(setVehicles)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [reloadKey])

  if (error) return <p className="form-error">{error}</p>
  if (!vehicles) return <p className="muted">Loading…</p>

  if (vehicles.length === 0) {
    return (
      <div className="empty">
        <p>No vehicles linked to your account yet.</p>
        <p className="muted small">
          Add your plate below, or ask the garage to check the phone number they
          have on file for you.
        </p>
      </div>
    )
  }

  return (
    <div className="cust-list">
      {vehicles.map((v) => (
        <VehicleCard key={v.id} v={v} />
      ))}
    </div>
  )
}
