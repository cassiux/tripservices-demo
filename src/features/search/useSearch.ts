import { useQuery } from '@tanstack/react-query'

import { searchOffers } from './searchApi'
import type { FlightOffer, SearchCriteria } from './types'

export const SEARCH_QUERY_KEY = 'catalog-offerings'

/**
 * Shops TripServices for air offers matching `criteria`.
 *
 * Pass `null` before the agent has submitted a search — the query stays idle
 * (`enabled: false`). Submitting new criteria re-keys and refetches. Results are
 * cached by criteria, so re-running a recent search is instant. Surfaces React
 * Query's `isLoading` / `isError` / `error` / `refetch` for the page's loading,
 * empty, and error states (retry = `refetch`).
 */
export function useSearch(criteria: SearchCriteria | null) {
  return useQuery<FlightOffer[]>({
    queryKey: [SEARCH_QUERY_KEY, criteria],
    enabled: criteria !== null,
    queryFn: ({ signal }) => searchOffers(criteria as SearchCriteria, signal),
  })
}
