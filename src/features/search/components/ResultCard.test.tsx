import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { FlightOffer } from '../types'
import { ResultCard } from './ResultCard'

const offer: FlightOffer = {
  id: 'off-1',
  contentType: 'NDC',
  airline: 'British Airways',
  airlineCode: 'BA',
  segments: [
    {
      origin: 'LHR',
      destination: 'JFK',
      departure: '2026-07-01T09:00:00',
      arrival: '2026-07-01T12:00:00',
      marketingCarrier: 'BA',
      marketingCarrierName: 'British Airways',
      marketingFlightNumber: '178',
      cabinClass: 'Economy',
    },
  ],
  stops: 0,
  durationMinutes: 180,
  departure: '2026-07-01T09:00:00',
  arrival: '2026-07-01T12:00:00',
  origin: 'LHR',
  destination: 'JFK',
  cabinClass: 'Economy',
  price: { currency: 'USD', total: 1000, perPassenger: 1000 },
  fareFamilies: [
    {
      id: 'ff-light',
      name: 'Economy Light',
      price: { currency: 'USD', total: 1000, perPassenger: 1000 },
      ancillaries: [{ code: 'BAG', label: 'Checked bag', included: false }],
      holdAvailable: false,
    },
    {
      id: 'ff-flex',
      name: 'Economy Flex',
      price: { currency: 'USD', total: 1400, perPassenger: 1400 },
      ancillaries: [{ code: 'BAG', label: 'Checked bag', included: true }],
      holdAvailable: true,
    },
  ],
  holdAvailable: true,
}

describe('ResultCard', () => {
  it('keeps fare families collapsed until expanded, then hides them again', async () => {
    const user = userEvent.setup()
    render(<ResultCard offer={offer} passengerCount={1} onSelect={vi.fn()} />)

    const toggle = screen.getByRole('button', { name: /View fares/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Economy Light')).not.toBeInTheDocument()

    await user.click(toggle)
    expect(screen.getByRole('button', { name: /Hide fares/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('Economy Light')).toBeInTheDocument()
    expect(screen.getByText('Economy Flex')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Hide fares/ }))
    expect(screen.queryByText('Economy Light')).not.toBeInTheDocument()
  })

  it('selects the chosen fare family with the right intent', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ResultCard offer={offer} passengerCount={1} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /View fares/ }))

    // Book the first (Light) fare.
    await user.click(screen.getAllByRole('button', { name: 'Book' })[0])
    expect(onSelect).toHaveBeenLastCalledWith(offer, offer.fareFamilies[0], 'book')

    // Hold is only offered on the Flex fare.
    await user.click(screen.getByRole('button', { name: 'Hold' }))
    expect(onSelect).toHaveBeenLastCalledWith(offer, offer.fareFamilies[1], 'hold')
  })

  it('renders the content-type badge', () => {
    render(<ResultCard offer={offer} passengerCount={1} onSelect={vi.fn()} />)
    expect(screen.getByText('NDC')).toBeInTheDocument()
  })
})
