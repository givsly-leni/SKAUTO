import { useEffect, useMemo, useState } from 'react'
import { listVehicles } from '../lib/vehicles'
import type { JobStatus, Vehicle } from '../lib/types'
import { STATUS_META, STATUS_ORDER } from '../lib/types'
import { formatDate, formatMoney } from '../lib/format'
import { Link } from '../lib/router'
import StatusBadge from '../components/StatusBadge'

type Filter = 'all' | JobStatus

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    listVehicles()
      .then(setVehicles)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [])

  const visible = useMemo(() => {
    if (!vehicles) return []
    const q = query.trim().toLowerCase()
    return vehicles.filter((v) => {
      if (filter !== 'all' && v.status !== filter) return false
      if (!q) return true
      return (
        v.license_plate.toLowerCase().includes(q) ||
        v.customer_name.toLowerCase().includes(q) ||
        (v.vin ?? '').toLowerCase().includes(q) ||
        (v.engine_number ?? '').toLowerCase().includes(q) ||
        (v.customer_phone ?? '').toLowerCase().includes(q)
      )
    })
  }, [vehicles, query, filter])

  if (error) return <p className="form-error">{error}</p>

  return (
    <div className="page">
      <div className="page-head">
        <h1>Vehicles</h1>
        <Link to="/vehicles/new" className="btn btn-primary btn-sm">
          + Add
        </Link>
      </div>

      <input
        className="search"
        type="search"
        placeholder="Search plate, customer, VIN, engine no, phone…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="filters">
        <button
          className={filter === 'all' ? 'pill active' : 'pill'}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            className={filter === status ? 'pill active' : 'pill'}
            onClick={() => setFilter(status)}
          >
            {STATUS_META[status].label}
          </button>
        ))}
      </div>

      {!vehicles ? (
        <p className="muted">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p>
            {vehicles.length === 0
              ? 'No vehicles recorded yet.'
              : 'Nothing matches that search.'}
          </p>
          {vehicles.length === 0 && (
            <Link to="/vehicles/new" className="btn btn-primary">
              Add the first car
            </Link>
          )}
        </div>
      ) : (
        <ul className="list">
          {visible.map((v) => (
            <li key={v.id}>
              <Link to={`/vehicles/${v.id}`} className="row">
                <div className="row-main">
                  <span className="plate">{v.license_plate}</span>
                  <span className="row-sub">
                    {v.customer_name}
                    {v.customer_phone ? ` · ${v.customer_phone}` : ''}
                  </span>
                  <span className="muted small">
                    In {formatDate(v.registered_at)} · {formatMoney(v.cost)}
                  </span>
                </div>
                <div className="row-side">
                  <StatusBadge status={v.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
