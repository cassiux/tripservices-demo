/**
 * Search (air shopping) domain model.
 *
 * These are SPC's own, clean domain types — the normalised shape the UI renders.
 * The raw TripServices transport types live in `searchApi.ts` and are mapped into
 * these by `normaliseOffers()`. Keep UI components depending on this file only.
 */

/** Itinerary shape requested by the agent. */
export type TripType = 'oneWay' | 'return' | 'multiCity'

/** Cabin classes offered by SPC. Values match the TripServices cabin enum. */
export type CabinClass = 'Economy' | 'PremiumEconomy' | 'Business' | 'First'

/** Passenger type codes (IATA): adult, child, infant-in-arms. */
export type PassengerTypeCode = 'ADT' | 'CHD' | 'INF'

/** Content origin of an offer. Agents need this visible at all times. */
export type ContentType = 'NDC' | 'EDIFACT' | 'LCC'

/** How the results list is ordered. */
export type SortKey = 'price' | 'duration' | 'stops' | 'departure'
export type SortDirection = 'asc' | 'desc'
export interface SortState {
  key: SortKey
  direction: SortDirection
}

/** Passenger party. At least one adult is always required. */
export interface PassengerCounts {
  ADT: number
  CHD: number
  INF: number
}

/** One requested leg: origin → destination on a given date. */
export interface SearchSegment {
  /** IATA airport/city code, e.g. `LHR`. */
  origin: string
  /** IATA airport/city code, e.g. `JFK`. */
  destination: string
  /** ISO date (`YYYY-MM-DD`). */
  date: string
}

/** A fully-validated search request the UI submits and persists in recent searches. */
export interface SearchCriteria {
  tripType: TripType
  /** One segment for one-way, two for return, N for multi-city. */
  segments: SearchSegment[]
  passengers: PassengerCounts
  cabinClass: CabinClass
  /** Optional free-text fare basis filter. */
  fareBasis?: string
}

/** Price for an offer or a fare family. */
export interface OfferPrice {
  currency: string
  /** Total for the whole party. */
  total: number
  /** Total divided by the number of passengers, for the at-a-glance per-pax figure. */
  perPassenger: number
  base?: number
  taxes?: number
}

/** An included or excluded add-on within a fare family (bag, seat, meal, changes…). */
export interface FareAncillary {
  code: string
  label: string
  included: boolean
}

/** Checked-baggage terms for a fare, derived from TripServices TermsAndConditions. */
export interface BaggageAllowance {
  /** Whether the first checked bag is already included in the offer price. */
  firstCheckedBagIncluded: boolean
  /** Fee for the first checked bag when not included in the price. */
  firstCheckedBagFee?: { amount: number; currency: string }
}

/** A change or cancel penalty for a fare, derived from TripServices Penalties. */
export interface FarePenalty {
  /** Whether the action is permitted at all (undefined when the API does not state it). */
  permitted?: boolean
  /** Penalty fee when one applies. */
  amount?: number
  currency?: string
}

/** Change/cancel penalties for a fare. */
export interface FarePenalties {
  change?: FarePenalty
  cancel?: FarePenalty
}

/** A bookable fare option (brand) for a given flight. */
export interface FareFamily {
  id: string
  name: string
  price: OfferPrice
  ancillaries: FareAncillary[]
  refundable?: boolean
  changeable?: boolean
  /** Whether the offer can be held / price-locked rather than ticketed immediately. */
  holdAvailable: boolean
  /** First-checked-bag terms, when the offer carries TermsAndConditions. */
  baggage?: BaggageAllowance
  /** Change/cancel penalties, when the offer carries TermsAndConditions. */
  penalties?: FarePenalties
}

/** A single flight leg within an offer's itinerary. */
export interface OfferSegment {
  origin: string
  destination: string
  /** ISO datetime. */
  departure: string
  /** ISO datetime. */
  arrival: string
  marketingCarrier: string
  marketingCarrierName: string
  marketingFlightNumber: string
  operatingCarrier?: string
  operatingCarrierName?: string
  /** Elapsed flight time for this leg, in minutes (from the flight's ISO 8601 duration). */
  durationMinutes?: number
  cabinClass: CabinClass
}

/** A normalised, render-ready air offer. */
export interface FlightOffer {
  id: string
  contentType: ContentType
  /** Primary marketing carrier display name (falls back to the code). */
  airline: string
  airlineCode: string
  segments: OfferSegment[]
  /** Number of stops across the itinerary (segments − 1). */
  stops: number
  /** Total elapsed journey time, in minutes. */
  durationMinutes: number
  /** First-segment departure (ISO datetime). */
  departure: string
  /** Last-segment arrival (ISO datetime). */
  arrival: string
  origin: string
  destination: string
  cabinClass: CabinClass
  /** Lead price for the offer (cheapest fare family). */
  price: OfferPrice
  /** Available fare families. Always at least one. */
  fareFamilies: FareFamily[]
  /** True when any fare family supports hold / price-lock. */
  holdAvailable: boolean
}
