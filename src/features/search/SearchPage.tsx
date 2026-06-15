import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { TripServicesApiError } from '@/lib/api/client'
import { ROUTES } from '@/lib/constants'
import { useBookingStore } from '@/store/bookingStore'

import { RecentSearches } from './components/RecentSearches'
import { ResultsSkeleton } from './components/ResultsSkeleton'
import { SearchForm } from './components/SearchForm'
import { SearchResults } from './components/SearchResults'
import { totalPassengers } from './searchApi'
import type { BookingIntent } from '@/store/bookingStore'
import type { FareFamily, FlightOffer, SearchCriteria } from './types'
import { useRecentSearches } from './useRecentSearches'
import { useSearch } from './useSearch'

/** Maps an unknown query error to an agent-facing message. */
function useErrorMessage() {
  const { t } = useTranslation()
  return (error: unknown): string => {
    if (error instanceof TripServicesApiError || error instanceof Error) {
      return error.message
    }
    return t('search.results.error.generic')
  }
}

/**
 * Search workspace: air-shopping form, recent searches (on load), and the
 * sortable results list. Selecting an offer hands it to the booking store and
 * routes to the booking flow.
 */
export function SearchPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toMessage = useErrorMessage()
  const selectOffer = useBookingStore((state) => state.selectOffer)
  const { recent, add, clear } = useRecentSearches()

  const [criteria, setCriteria] = useState<SearchCriteria | null>(null)
  const [hydrateFrom, setHydrateFrom] = useState<SearchCriteria | null>(null)

  const query = useSearch(criteria)

  function runSearch(next: SearchCriteria) {
    setCriteria(next)
    add(next)
  }

  function handleRunRecent(next: SearchCriteria) {
    setHydrateFrom(next)
    runSearch(next)
  }

  function handleSelectOffer(offer: FlightOffer, fareFamily: FareFamily, intent: BookingIntent) {
    selectOffer({ offer, fareFamily, intent, criteria })
    navigate(ROUTES.BOOKING)
  }

  const passengerCount = criteria ? totalPassengers(criteria.passengers) : 1

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-lg font-semibold text-fg-primary">{t('search.page.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('search.page.subtitle')}</p>
      </header>

      <div className="rounded-lg border border-border bg-canvas p-4">
        <SearchForm
          onSearch={runSearch}
          initialCriteria={hydrateFrom}
          isSearching={criteria !== null && query.isFetching}
        />
      </div>

      {criteria === null ? (
        <RecentSearches items={recent} onRun={handleRunRecent} onClear={clear} />
      ) : (
        <div>
          {query.isLoading ? (
            <ResultsSkeleton />
          ) : (
            <SearchResults
              offers={query.data ?? []}
              passengerCount={passengerCount}
              errorMessage={query.isError ? toMessage(query.error) : undefined}
              onRetry={() => void query.refetch()}
              onSelectOffer={handleSelectOffer}
            />
          )}
        </div>
      )}
    </section>
  )
}
