import type { ServiceVisit } from '../lib/types'
import { formatDate, formatKm, formatMoney } from '../lib/format'

interface Props {
  visits: ServiceVisit[]
  /** Only the garage owner gets a delete control. */
  onDelete?: (id: string) => void
  emptyText?: string
}

export default function HistoryTimeline({
  visits,
  onDelete,
  emptyText = 'No previous visits recorded.',
}: Props) {
  if (visits.length === 0) return <p className="muted small">{emptyText}</p>

  const total = visits.reduce((sum, v) => sum + Number(v.cost ?? 0), 0)

  return (
    <>
      <ol className="timeline">
        {visits.map((v) => (
          <li key={v.id} className="tl-item">
            <span className="tl-marker" aria-hidden="true" />
            <div className="tl-body">
              <div className="tl-head">
                <strong>{formatDate(v.visited_at)}</strong>
                <span className="tl-cost">{formatMoney(v.cost)}</span>
              </div>

              {v.odometer_km != null && (
                <p className="muted small">{formatKm(v.odometer_km)}</p>
              )}

              {v.restored_parts.length > 0 && (
                <div className="chips">
                  {v.restored_parts.map((part) => (
                    <span key={part} className="chip static">
                      {part}
                    </span>
                  ))}
                </div>
              )}

              {v.notes && <p className="tl-notes">{v.notes}</p>}

              {onDelete && (
                <button
                  type="button"
                  className="tl-delete"
                  onClick={() => onDelete(v.id)}
                >
                  Delete entry
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      {visits.length > 1 && (
        <p className="tl-total">
          {visits.length} visits · {formatMoney(total)} total
        </p>
      )}
    </>
  )
}
