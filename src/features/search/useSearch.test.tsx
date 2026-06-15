import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TripServicesApiError, tripServicesClient } from '@/lib/api/client'

import { catalogResponseFixture } from './__fixtures__/catalogResponse'
import type { SearchCriteria } from './types'
import { useSearch } from './useSearch'

// Mock the API client so the hook exercises the real normalisation path against a
// controlled raw response, without touching the network or auth.
vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client')
  return {
    ...actual,
    tripServicesClient: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  }
})

const postMock = vi.mocked(tripServicesClient.post)

const criteria: SearchCriteria = {
  tripType: 'oneWay',
  segments: [{ origin: 'LHR', destination: 'JFK', date: '2026-07-01' }],
  passengers: { ADT: 2, CHD: 0, INF: 0 },
  cabinClass: 'Economy',
}

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  postMock.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useSearch', () => {
  it('stays idle until criteria is provided', () => {
    const { result } = renderHook(() => useSearch(null), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
    expect(postMock).not.toHaveBeenCalled()
  })

  it('resolves ReferenceList entities into normalised offers (price, segments, fare, baggage)', async () => {
    postMock.mockResolvedValue(catalogResponseFixture)

    const { result } = renderHook(() => useSearch(criteria), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(postMock).toHaveBeenCalledWith(
      '11/air/catalog/search/catalogproductofferings',
      expect.anything(),
      expect.anything(),
    )

    const offers = result.current.data
    // One FlightOffer per ProductBrandOptions (one each here).
    expect(offers).toHaveLength(2)

    const first = offers![0]
    expect(first.id).toBe('pbo-1')
    expect(first.contentType).toBe('NDC')
    // Resolved from the flight in the ReferenceList (carrier BA == operating BA).
    expect(first.airline).toBe('British Airways')
    expect(first.airlineCode).toBe('BA')
    // Price from BestCombinablePrice.TotalPrice, divided across 2 passengers.
    expect(first.price.total).toBe(1000)
    expect(first.price.perPassenger).toBe(500)
    expect(first.price.base).toBe(800)
    expect(first.price.taxes).toBe(200)
    // Total duration parsed from the product's ISO 8601 PT3H.
    expect(first.durationMinutes).toBe(180)
    // Hold availability is not in the sandbox response.
    expect(first.holdAvailable).toBe(false)

    // Segments are resolved from flightRefs into the flight lookup.
    expect(first.segments).toHaveLength(1)
    const segment = first.segments[0]
    expect(segment.origin).toBe('LHR')
    expect(segment.destination).toBe('JFK')
    expect(segment.departure).toBe('2026-07-01T09:00:00')
    expect(segment.arrival).toBe('2026-07-01T12:00:00')
    expect(segment.marketingFlightNumber).toBe('178')
    expect(segment.operatingCarrierName).toBe('British Airways')
    expect(segment.durationMinutes).toBe(180)

    // One brand-derived fare family, with baggage + penalty terms resolved.
    expect(first.fareFamilies).toHaveLength(1)
    const fare = first.fareFamilies[0]
    expect(fare.name).toBe('Economy Light')
    expect(fare.ancillaries).toContainEqual({
      code: 'FirstCheckedBag',
      label: 'FirstCheckedBag',
      included: false,
    })
    expect(fare.baggage).toEqual({
      firstCheckedBagIncluded: false,
      firstCheckedBagFee: { amount: 60, currency: 'USD' },
    })
    expect(fare.changeable).toBe(true)
    expect(fare.refundable).toBe(false)
    expect(fare.penalties?.change?.amount).toBe(250)

    // GDS source normalises to EDIFACT content; its first checked bag is included.
    const second = offers![1]
    expect(second.contentType).toBe('EDIFACT')
    expect(second.airline).toBe('American Airlines')
    expect(second.durationMinutes).toBe(270)
    expect(second.fareFamilies[0].baggage?.firstCheckedBagIncluded).toBe(true)
    expect(second.fareFamilies[0].refundable).toBe(true)
  })

  it('returns an empty array when no offerings come back', async () => {
    postMock.mockResolvedValue({
      CatalogProductOfferingsResponse: { CatalogProductOfferings: { CatalogProductOffering: [] } },
    })

    const { result } = renderHook(() => useSearch(criteria), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('surfaces a TripServicesApiError with its agent-facing message', async () => {
    postMock.mockRejectedValue(
      new TripServicesApiError('Shopping is temporarily unavailable.', { status: 503 }),
    )

    const { result } = renderHook(() => useSearch(criteria), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(TripServicesApiError)
    expect((result.current.error as Error).message).toBe('Shopping is temporarily unavailable.')
  })
})
