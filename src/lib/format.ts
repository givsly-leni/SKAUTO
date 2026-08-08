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
