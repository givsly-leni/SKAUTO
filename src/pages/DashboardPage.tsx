import { useEffect, useState } from 'react'
import { listVehicles } from '../lib/vehicles'
import type { Vehicle } from '../lib/types'
import { STATUS_META, STATUS_ORDER } from '../lib/types'
import { formatMoney, formatDate } from '../lib/format'
import { Link } from '../lib/router'
import StatusBadge from '../components/StatusBadge'

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listVehicles()
      .then(setVehicles)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [])

  if (error) return <p className="form-error">{error}</p>
  if (!vehicles) return <p className="muted">Loading…</p>

  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: vehicles.filter((v) => v.status === status).length,
  }))

  const totalCost = vehicles
    .filter((v) => v.status === 'completed')
    .reduce((sum, v) => sum + Number(v.cost ?? 0), 0)

  const recent = vehicles.slice(0, 5)

  return (
    <div className="page">
      <div className="page-head">
        <h1>Overview</h1>
        <p className="muted">{vehicles.length} vehicles on record</p>
      </div>

      <div className="stat-grid">
        {counts.map(({ status, count }) => (
          <div key={status} className="stat-card">
            <span
              className="stat-dot"
              style={{ background: STATUS_META[status].color }}
            />
            <strong>{count}</strong>
            <span className="muted">{STATUS_META[status].label}</span>
          </div>
        ))}
        <div className="stat-card">
          <strong>{formatMoney(totalCost)}</strong>
          <span className="muted">Completed work</span>
        </div>
      </div>

      <div className="section-head">
        <h2>Recent</h2>
        <Link to="/vehicles" className="link">
          See all
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="empty">
          <p>No vehicles yet.</p>
          <Link to="/vehicles/new" className="btn btn-primary">
            Add the first car
          </Link>
        </div>
      ) : (
        <ul className="list">
          {recent.map((v) => (
            <li key={v.id}>
              <Link to={`/vehicles/${v.id}`} className="row">
                <div className="row-main">
                  <span className="plate">{v.license_plate}</span>
                  <span className="row-sub">{v.customer_name}</span>
                </div>
                <div className="row-side">
                  <StatusBadge status={v.status} />
                  <span className="muted small">
                    {formatDate(v.registered_at)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
