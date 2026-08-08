import { useEffect, useMemo, useState } from 'react'
import { listVehicles } from '../lib/vehicles'
import type { JobStatus, Vehicle } from '../lib/types'
import { STATUS_META, STATUS_ORDER } from '../lib/types'
import {
  formatCar,
  formatDate,
  formatDateTime,
  formatMoney,
  isPast,
} from '../lib/format'
import { Link } from '../lib/router'
import StatusBadge from '../components/StatusBadge'
import { normalizePlate } from '../lib/plate'

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
    // Plates are matched on the canonical form so a Greek plate is found by
    // typing it in English, and vice versa.
    const plateQuery = normalizePlate(query)
    const rows = vehicles.filter((v) => {
      if (filter !== 'all' && v.status !== filter) return false
      if (!q) return true
      return (
        (plateQuery !== '' &&
          normalizePlate(v.license_plate).includes(plateQuery)) ||
        v.customer_name.toLowerCase().includes(q) ||
        (v.vin ?? '').toLowerCase().includes(q) ||
        (v.engine_number ?? '').toLowerCase().includes(q) ||
        formatCar(v.make, v.model).toLowerCase().includes(q) ||
        (v.customer_phone ?? '').toLowerCase().includes(q)
      )
    })

    // Scheduled jobs are more useful ordered by when they're due.
    if (filter === 'scheduled') {
      rows.sort((a, b) => {
        if (!a.scheduled_at) return 1
        if (!b.scheduled_at) return -1
        return a.scheduled_at.localeCompare(b.scheduled_at)
      })
    }
    return rows
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
        placeholder="Search plate, car, customer, VIN, phone…"
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
                  <span className="plate">
                    {v.license_plate}
                    {formatCar(v.make, v.model) && (
                      <span className="row-car">
                        {formatCar(v.make, v.model)}
                      </span>
                    )}
                  </span>
                  <span className="row-sub">
                    {v.customer_name}
                    {v.customer_phone ? ` · ${v.customer_phone}` : ''}
                  </span>
                  {v.status === 'scheduled' && v.scheduled_at ? (
                    <span
                      className={isPast(v.scheduled_at) ? 'appt-inline overdue' : 'appt-inline'}
                    >
                      {formatDateTime(v.scheduled_at)}
                    </span>
                  ) : (
                    <span className="muted small">
                      In {formatDate(v.registered_at)} · {formatMoney(v.cost)}
                    </span>
                  )}
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
