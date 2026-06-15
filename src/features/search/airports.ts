/**
 * MOCK: TripServices reference / airport-autocomplete endpoint is not yet available
 * in the pre-production sandbox. This static IATA dataset backs the origin/destination
 * typeahead. Replace `searchAirports()` with a real lookup (e.g. a TripServices
 * `GET /reference/locations?query=` call) when the endpoint goes live; the expected
 * response shape is the `Airport` interface below.
 */

export interface Airport {
  /** IATA airport (or city) code, e.g. `LHR`. */
  iata: string
  city: string
  name: string
  country: string
}

/** A pragmatic subset of high-traffic airports for the sandbox typeahead. */
export const AIRPORTS: readonly Airport[] = [
  { iata: 'ATL', city: 'Atlanta', name: 'Hartsfield–Jackson', country: 'US' },
  { iata: 'AMS', city: 'Amsterdam', name: 'Schiphol', country: 'NL' },
  { iata: 'BCN', city: 'Barcelona', name: 'El Prat', country: 'ES' },
  { iata: 'BER', city: 'Berlin', name: 'Brandenburg', country: 'DE' },
  { iata: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi', country: 'TH' },
  { iata: 'BOS', city: 'Boston', name: 'Logan', country: 'US' },
  { iata: 'CDG', city: 'Paris', name: 'Charles de Gaulle', country: 'FR' },
  { iata: 'DEN', city: 'Denver', name: 'Denver International', country: 'US' },
  { iata: 'DFW', city: 'Dallas', name: 'Dallas/Fort Worth', country: 'US' },
  { iata: 'DXB', city: 'Dubai', name: 'Dubai International', country: 'AE' },
  { iata: 'EWR', city: 'Newark', name: 'Liberty International', country: 'US' },
  { iata: 'FRA', city: 'Frankfurt', name: 'Frankfurt am Main', country: 'DE' },
  { iata: 'GRU', city: 'São Paulo', name: 'Guarulhos', country: 'BR' },
  { iata: 'HKG', city: 'Hong Kong', name: 'Hong Kong International', country: 'HK' },
  { iata: 'HND', city: 'Tokyo', name: 'Haneda', country: 'JP' },
  { iata: 'IAD', city: 'Washington', name: 'Dulles International', country: 'US' },
  { iata: 'IST', city: 'Istanbul', name: 'Istanbul Airport', country: 'TR' },
  { iata: 'JFK', city: 'New York', name: 'John F. Kennedy', country: 'US' },
  { iata: 'LAX', city: 'Los Angeles', name: 'Los Angeles International', country: 'US' },
  { iata: 'LGA', city: 'New York', name: 'LaGuardia', country: 'US' },
  { iata: 'LHR', city: 'London', name: 'Heathrow', country: 'GB' },
  { iata: 'LGW', city: 'London', name: 'Gatwick', country: 'GB' },
  { iata: 'MAD', city: 'Madrid', name: 'Barajas', country: 'ES' },
  { iata: 'MEX', city: 'Mexico City', name: 'Benito Juárez', country: 'MX' },
  { iata: 'MIA', city: 'Miami', name: 'Miami International', country: 'US' },
  { iata: 'MUC', city: 'Munich', name: 'Franz Josef Strauss', country: 'DE' },
  { iata: 'ORD', city: 'Chicago', name: "O'Hare", country: 'US' },
  { iata: 'PHX', city: 'Phoenix', name: 'Sky Harbor', country: 'US' },
  { iata: 'SEA', city: 'Seattle', name: 'Seattle–Tacoma', country: 'US' },
  { iata: 'SFO', city: 'San Francisco', name: 'San Francisco International', country: 'US' },
  { iata: 'SIN', city: 'Singapore', name: 'Changi', country: 'SG' },
  { iata: 'SYD', city: 'Sydney', name: 'Kingsford Smith', country: 'AU' },
  { iata: 'YYZ', city: 'Toronto', name: 'Pearson', country: 'CA' },
  { iata: 'YVR', city: 'Vancouver', name: 'Vancouver International', country: 'CA' },
  { iata: 'ZRH', city: 'Zurich', name: 'Zurich Airport', country: 'CH' },
]

/** Case-insensitive typeahead over code, city and airport name. Min 2 chars. */
export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const matches = AIRPORTS.filter(
    (airport) =>
      airport.iata.toLowerCase().startsWith(q) ||
      airport.city.toLowerCase().includes(q) ||
      airport.name.toLowerCase().includes(q),
  )

  // Code-prefix matches first (agents usually type the IATA code).
  matches.sort((a, b) => {
    const aCode = a.iata.toLowerCase().startsWith(q) ? 0 : 1
    const bCode = b.iata.toLowerCase().startsWith(q) ? 0 : 1
    return aCode - bCode
  })

  return matches.slice(0, limit)
}

/** Resolves a full Airport from a stored IATA code. */
export function findAirport(iata: string): Airport | undefined {
  return AIRPORTS.find((airport) => airport.iata === iata.toUpperCase())
}
