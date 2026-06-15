import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { FlightOffer } from '../types'
import { SearchResults } from './SearchResults'

function makeOffer(overrides: Partial<FlightOffer> & { id: string; airline: string }): FlightOffer {
  return {
    contentType: 'EDIFACT',
    airlineCode: 'XX',
    segments: [
      {
        origin: 'LHR',
        destination: 'JFK',
        departure: overrides.departure ?? '2026-07-01T08:00:00',
        arrival: '2026-07-01T12:00:00',
        marketingCarrier: 'XX',
        marketingCarrierName: overrides.airline,
        marketingFlightNumber: '1',
        cabinClass: 'Economy',
      },
    ],
    origin: 'LHR',
    destination: 'JFK',
    cabinClass: 'Economy',
    price: { currency: 'USD', total: 0, perPassenger: 0 },
    fareFamilies: [
      {
        id: `${overrides.id}-ff`,
        name: 'Standard',
        price: { currency: 'USD', total: overrides.price?.total ?? 0, perPassenger: 0 },
        ancillaries: [],
        holdAvailable: false,
      },
    ],
    holdAvailable: false,
    stops: 0,
    durationMinutes: 0,
    departure: '2026-07-01T08:00:00',
    arrival: '2026-07-01T12:00:00',
    ...overrides,
  }
}

const offers: FlightOffer[] = [
  makeOffer({
    id: 'a',
    airline: 'Alpha',
    price: { currency: 'USD', total: 300, perPassenger: 300 },
    durationMinutes: 600,
    departure: '2026-07-01T10:00:00',
  }),
  makeOffer({
    id: 'b',
    airline: 'Bravo',
    price: { currency: 'USD', total: 100, perPassenger: 100 },
    durationMinutes: 500,
    departure: '2026-07-01T08:00:00',
  }),
  makeOffer({
    id: 'c',
    airline: 'Charlie',
    price: { currency: 'USD', total: 200, perPassenger: 200 },
    durationMinutes: 700,
    departure: '2026-07-01T06:00:00',
  }),
]

function airlineOrder(): string[] {
  return screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
}

describe('SearchResults', () => {
  it('renders sorted by price ascending by default', () => {
    render(
      <SearchResults
        offers={offers}
        passengerCount={1}
        onRetry={vi.fn()}
        onSelectOffer={vi.fn()}
      />,
    )
    expect(airlineOrder()).toEqual(['Bravo', 'Charlie', 'Alpha'])
  })

  it('re-sorts by duration when the Duration sort is selected', async () => {
    const user = userEvent.setup()
    render(
      <SearchResults
        offers={offers}
        passengerCount={1}
        onRetry={vi.fn()}
        onSelectOffer={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Duration' }))
    expect(airlineOrder()).toEqual(['Bravo', 'Alpha', 'Charlie'])
  })

  it('re-sorts by departure time when the Departure sort is selected', async () => {
    const user = userEvent.setup()
    render(
      <SearchResults
        offers={offers}
        passengerCount={1}
        onRetry={vi.fn()}
        onSelectOffer={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Departure' }))
    expect(airlineOrder()).toEqual(['Charlie', 'Bravo', 'Alpha'])
  })

  it('shows the empty state when there are no offers', () => {
    render(
      <SearchResults offers={[]} passengerCount={1} onRetry={vi.fn()} onSelectOffer={vi.fn()} />,
    )
    expect(screen.getByText('No offers found')).toBeInTheDocument()
  })

  it('shows the error state with a retry action', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <SearchResults
        offers={[]}
        passengerCount={1}
        errorMessage="Shopping is temporarily unavailable."
        onRetry={onRetry}
        onSelectOffer={vi.fn()}
      />,
    )

    expect(screen.getByText('Shopping is temporarily unavailable.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
