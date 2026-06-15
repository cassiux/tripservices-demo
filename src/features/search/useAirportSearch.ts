// MOCK: TripServices reference / airport-autocomplete endpoint not yet available in
// the sandbox. This hook debounces the query and filters the static dataset in
// `airports.ts`. Replace `searchAirports()` with the real network call when live —
// the hook's public contract (`{ results, isLoading }`) should not need to change.

import { useEffect, useMemo, useState } from 'react'

import { searchAirports, type Airport } from './airports'

const DEBOUNCE_MS = 250
const MIN_CHARS = 2

interface AirportSearchState {
  results: Airport[]
  isLoading: boolean
}

/** Debounced (250ms) airport typeahead. Returns no results below 2 characters. */
export function useAirportSearch(query: string): AirportSearchState {
  const [debounced, setDebounced] = useState(query)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (query.trim().length < MIN_CHARS) {
      setDebounced(query)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(() => {
      setDebounced(query)
      setIsLoading(false)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  const results = useMemo(
    () => (debounced.trim().length >= MIN_CHARS ? searchAirports(debounced) : []),
    [debounced],
  )

  return { results, isLoading }
}
