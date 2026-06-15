import type { FlightOffer, SortKey, SortState } from './types'

const COMPARATORS: Record<SortKey, (a: FlightOffer, b: FlightOffer) => number> = {
  price: (a, b) => a.price.total - b.price.total,
  duration: (a, b) => a.durationMinutes - b.durationMinutes,
  stops: (a, b) => a.stops - b.stops,
  departure: (a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime(),
}

/** Sorts a copy of `offers` by the active sort state without mutating the input. */
export function sortOffers(offers: FlightOffer[], sort: SortState): FlightOffer[] {
  const sorted = [...offers].sort(COMPARATORS[sort.key])
  return sort.direction === 'desc' ? sorted.reverse() : sorted
}
