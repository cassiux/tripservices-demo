import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { formatDateShort } from '../format'
import type { CabinClass, SearchCriteria } from '../types'

interface RecentSearchesProps {
  items: SearchCriteria[]
  onRun: (criteria: SearchCriteria) => void
  onClear: () => void
}

const CABIN_LABEL_KEY: Record<CabinClass, string> = {
  Economy: 'search.form.cabin.economy',
  PremiumEconomy: 'search.form.cabin.premiumEconomy',
  Business: 'search.form.cabin.business',
  First: 'search.form.cabin.first',
}

/** Compact one-line summary for a recent search chip. */
function useSummary() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  return (criteria: SearchCriteria): string => {
    const first = criteria.segments[0]
    const last = criteria.segments[criteria.segments.length - 1]
    const partySize = criteria.passengers.ADT + criteria.passengers.CHD + criteria.passengers.INF

    const route =
      criteria.tripType === 'return'
        ? `${first.origin} ⇄ ${first.destination}`
        : `${first.origin} → ${last.destination}`

    const dates =
      criteria.tripType === 'return'
        ? `${formatDateShort(first.date, locale)}–${formatDateShort(criteria.segments[1].date, locale)}`
        : formatDateShort(first.date, locale)

    return [
      route,
      dates,
      t('search.form.pax.summary', { count: partySize }),
      t(CABIN_LABEL_KEY[criteria.cabinClass]),
    ].join(' · ')
  }
}

/** Last 5 searches for this session, shown below the form on load. */
export function RecentSearches({ items, onRun, onClear }: RecentSearchesProps) {
  const { t } = useTranslation()
  const summarise = useSummary()

  if (items.length === 0) return null

  return (
    <section aria-labelledby="recent-searches-heading" className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2
          id="recent-searches-heading"
          className="text-xs font-semibold uppercase tracking-wider text-fg-subtle"
        >
          {t('search.recent.title')}
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2 py-1 text-xs font-medium text-fg-muted hover:bg-hover hover:text-fg-secondary focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {t('search.recent.clear')}
        </button>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((criteria, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => onRun(criteria)}
              className="flex w-full items-center gap-2 rounded-md border border-border bg-canvas px-3 py-2 text-left text-sm text-fg-secondary transition-colors hover:bg-hover focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <Clock className="h-3.5 w-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="truncate">{summarise(criteria)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
