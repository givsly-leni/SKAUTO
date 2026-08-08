import { STATUS_META } from '../lib/types'
import type { JobStatus } from '../lib/types'

export default function StatusBadge({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className="badge"
      style={{ color: meta.color, borderColor: meta.color, background: `${meta.color}1a` }}
    >
      {meta.label}
    </span>
  )
}
