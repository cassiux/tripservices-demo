/**
 * Locale-aware formatters for the Search feature. All date/time/currency
 * formatting goes through `Intl` (never manual), per CLAUDE.md. The active
 * locale is passed in from `i18n.language` at the call site.
 */

/** Currency total, e.g. `$1,240.00`. */
export function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/** Clock time for a segment, e.g. `14:05`. Accepts an ISO datetime. */
export function formatTime(iso: string, locale: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Short calendar date, e.g. `1 Jul`. Accepts an ISO date or datetime. */
export function formatDateShort(iso: string, locale: string): string {
  const date = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

/**
 * Compact elapsed-time label, e.g. `7h 30m`. Digits are localised via
 * `Intl.NumberFormat`; `Intl.DurationFormat` is not yet universally available,
 * so the unit composition is intentionally terse for the dense results list.
 */
export function formatDuration(minutes: number, locale: string): string {
  const safe = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  const nf = new Intl.NumberFormat(locale)
  if (hours === 0) return `${nf.format(mins)}m`
  if (mins === 0) return `${nf.format(hours)}h`
  return `${nf.format(hours)}h ${nf.format(mins)}m`
}
