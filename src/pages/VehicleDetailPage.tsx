import { useEffect, useState } from 'react'
import { deleteVehicle, getVehicle } from '../lib/vehicles'
import type { Vehicle } from '../lib/types'
import { formatDate, formatKm, formatMoney } from '../lib/format'
import { Link, navigate } from '../lib/router'
import StatusBadge from '../components/StatusBadge'

export default function VehicleDetailPage({ id }: { id: string }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setLoading(true)
    getVehicle(id)
      .then(setVehicle)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    try {
      await deleteVehicle(id)
      navigate('/vehicles')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete')
    }
  }

  if (loading) return <p className="muted">Loading…</p>
  if (error) return <p className="form-error">{error}</p>
  if (!vehicle) return <p className="muted">That vehicle no longer exists.</p>

  return (
    <div className="page">
      <Link to="/vehicles" className="back">
        ‹ Vehicles
      </Link>

      <div className="detail-head">
        <div>
          <h1 className="plate-lg">{vehicle.license_plate}</h1>
          <p className="muted">{vehicle.customer_name}</p>
        </div>
        <StatusBadge status={vehicle.status} />
      </div>

      <div className="detail-actions">
        <Link to={`/vehicles/${vehicle.id}/edit`} className="btn btn-primary btn-sm">
          Edit
        </Link>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => setConfirming(true)}
        >
          Delete
        </button>
      </div>

      {confirming && (
        <div className="confirm">
          <p>Delete this record permanently?</p>
          <div className="confirm-actions">
            <button className="btn btn-danger btn-sm" onClick={() => void handleDelete()}>
              Yes, delete
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <dl className="detail-grid">
        <div>
          <dt>Customer phone</dt>
          <dd>
            {vehicle.customer_phone ? (
              <a href={`tel:${vehicle.customer_phone}`}>{vehicle.customer_phone}</a>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt>VIN</dt>
          <dd className="mono">{vehicle.vin || '—'}</dd>
        </div>
        <div>
          <dt>Engine number</dt>
          <dd className="mono">{vehicle.engine_number || '—'}</dd>
        </div>
        <div>
          <dt>Kilometers</dt>
          <dd>{formatKm(vehicle.odometer_km)}</dd>
        </div>
        <div>
          <dt>Vehicle year</dt>
          <dd>{formatDate(vehicle.vehicle_date)}</dd>
        </div>
        <div>
          <dt>Cost</dt>
          <dd>{formatMoney(vehicle.cost)}</dd>
        </div>
        <div>
          <dt>Registered</dt>
          <dd>{formatDate(vehicle.registered_at)}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatDate(vehicle.updated_at)}</dd>
        </div>
      </dl>

      <section className="detail-block">
        <h2>Restored parts</h2>
        {vehicle.restored_parts.length === 0 ? (
          <p className="muted">None recorded.</p>
        ) : (
          <div className="chips">
            {vehicle.restored_parts.map((part) => (
              <span key={part} className="chip static">
                {part}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="detail-block">
        <h2>Notes</h2>
        {vehicle.notes ? (
          <p className="notes">{vehicle.notes}</p>
        ) : (
          <p className="muted">No notes.</p>
        )}
      </section>
    </div>
  )
}
