import { useCallback, useState } from 'react'

import type { SearchCriteria } from './types'

/** Recent searches persist for the agent's session only (cleared on browser close). */
const STORAGE_KEY = 'spc.search.recent'
const MAX_RECENT = 5

function readStored(): SearchCriteria[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SearchCriteria[]) : []
  } catch {
    // Corrupt JSON or sessionStorage unavailable — start empty.
    return []
  }
}

function writeStored(items: SearchCriteria[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Quota or availability error — recent searches are best-effort, so ignore.
  }
}

function isSameCriteria(a: SearchCriteria, b: SearchCriteria): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export interface UseRecentSearches {
  recent: SearchCriteria[]
  add: (criteria: SearchCriteria) => void
  clear: () => void
}

/**
 * Persists the last 5 searches in `sessionStorage`, most-recent first.
 * Re-running an identical search moves it to the top rather than duplicating it.
 */
export function useRecentSearches(): UseRecentSearches {
  const [recent, setRecent] = useState<SearchCriteria[]>(() => readStored())

  const add = useCallback((criteria: SearchCriteria) => {
    setRecent((prev) => {
      const next = [criteria, ...prev.filter((item) => !isSameCriteria(item, criteria))].slice(
        0,
        MAX_RECENT,
      )
      writeStored(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setRecent([])
    writeStored([])
  }, [])

  return { recent, add, clear }
}
