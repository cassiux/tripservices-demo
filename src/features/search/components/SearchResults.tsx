import { AlertTriangle, RotateCw, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { BookingIntent } from '@/store/bookingStore'

import { sortOffers } from '../sortOffers'
import type { FareFamily, FlightOffer, SortState } from '../types'
import { ResultCard } from './ResultCard'
import { SortControl } from './SortControl'

interface SearchResultsProps {
  offers: FlightOffer[]
  passengerCount: number
  errorMessage?: string
  onRetry: () => void
  onSelectOffer: (offer: FlightOffer, fareFamily: FareFamily, intent: BookingIntent) => void
}

/** Empty state: clear message + suggestion to broaden the search. */
function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-canvas px-6 py-12 text-center">
      <SearchX className="h-6 w-6 text-fg-subtle" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-fg-primary">{t('search.results.empty.title')}</h3>
      <p className="max-w-sm text-sm text-fg-muted">{t('search.results.empty.body')}</p>
    </div>
  )
}

/** Error state: meaningful message to the agent + retry. */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-border bg-urgent px-6 py-10 text-center"
    >
      <AlertTriangle className="h-6 w-6 text-urgent-text" aria-hidden="true" />
      <div>
        <h3 className="text-sm font-semibold text-urgent-text">
          {t('search.results.error.title')}
        </h3>
        <p className="mt-1 max-w-md text-sm text-fg-secondary">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-fg-secondary hover:bg-hover focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
        {t('search.results.error.retry')}
      </button>
    </div>
  )
}

/**
 * Sortable offer list with empty and error states. Sort defaults to price ascending.
 * `errorMessage` (when present) takes precedence; otherwise an empty `offers` array
 * renders the empty state.
 */
export function SearchResults({
  offers,
  passengerCount,
  errorMessage,
  onRetry,
  onSelectOffer,
}: SearchResultsProps) {
  const { t } = useTranslation()
  const [sort, setSort] = useState<SortState>({ key: 'price', direction: 'asc' })

  const sorted = useMemo(() => sortOffers(offers, sort), [offers, sort])

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />
  }

  if (offers.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted" aria-live="polite">
          {t('search.results.summary', { count: offers.length })}
        </p>
        <SortControl value={sort} onChange={setSort} />
      </div>
      <ul className="flex flex-col gap-2">
        {sorted.map((offer) => (
          <li key={offer.id}>
            <ResultCard offer={offer} passengerCount={passengerCount} onSelect={onSelectOffer} />
          </li>
        ))}
      </ul>
    </div>
  )
}
