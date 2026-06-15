import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SearchForm } from './SearchForm'

/** A date safely in the future regardless of the machine clock. */
function futureIso(days = 30): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
}

describe('SearchForm', () => {
  it('blocks submission and shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchForm onSearch={onSearch} />)

    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(onSearch).not.toHaveBeenCalled()
    expect(screen.getByText('Select an origin airport.')).toBeInTheDocument()
    expect(screen.getByText('Select a destination airport.')).toBeInTheDocument()
    expect(screen.getByText('Select a date.')).toBeInTheDocument()
  })

  it('emits a one-way SearchCriteria once origin, destination and date are valid', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchForm onSearch={onSearch} />)

    // Origin typeahead.
    await user.type(screen.getByRole('combobox', { name: 'Origin' }), 'LHR')
    await user.click(await screen.findByRole('option', { name: /Heathrow/ }))

    // Destination typeahead.
    await user.type(screen.getByRole('combobox', { name: 'Destination' }), 'JFK')
    await user.click(await screen.findByRole('option', { name: /Kennedy/ }))

    // Departure date (native calendar input). fireEvent is reliable for date inputs.
    const departure = futureIso()
    fireEvent.change(screen.getByLabelText('Departure'), { target: { value: departure } })

    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(onSearch).toHaveBeenCalledTimes(1)
    const criteria = onSearch.mock.calls[0][0]
    expect(criteria.tripType).toBe('oneWay')
    expect(criteria.segments).toEqual([{ origin: 'LHR', destination: 'JFK', date: departure }])
    expect(criteria.passengers).toEqual({ ADT: 1, CHD: 0, INF: 0 })
    expect(criteria.cabinClass).toBe('Economy')
  })

  it('reveals the inbound date field when switching to a return trip', async () => {
    const user = userEvent.setup()
    render(<SearchForm onSearch={vi.fn()} />)

    const dateSelector = { selector: 'input[type="date"]' }
    expect(screen.queryByLabelText('Return', dateSelector)).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Return' }))
    expect(screen.getByLabelText('Return', dateSelector)).toBeInTheDocument()
  })
})
