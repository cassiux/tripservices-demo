import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client. Conservative defaults for an agent desktop that
 * stays open all day: short stale time, single retry, no refetch on window focus
 * (agents switch windows constantly and should not trigger noisy refetches).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
