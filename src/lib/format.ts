export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatMoney(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  })
}

export function formatKm(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Number(value).toLocaleString()} km`
}

/** "BMW 323i", or whichever half is present. */
export function formatCar(
  make: string | null | undefined,
  model: string | null | undefined,
): string {
  return [make, model].filter(Boolean).join(' ').trim()
}

/** Readable appointment, e.g. "Fri 15 Aug, 09:00". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * A <input type="datetime-local"> needs local wall-clock time as
 * YYYY-MM-DDTHH:mm, while the database stores UTC. Convert between the two.
 */
export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

/** True when an appointment is in the past. */
export function isPast(value: string | null | undefined): boolean {
  if (!value) return false
  const d = new Date(value)
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now()
}
