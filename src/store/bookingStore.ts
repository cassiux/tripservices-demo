/**
 * Booking-flow global state (Zustand).
 *
 * The Search feature writes the agent's selected offer here, then routes to
 * `/booking`. The Booking flow (feature #4, not yet built) reads `selection`
 * to seed passenger entry, seat selection and ticketing. Kept deliberately
 * minimal — it holds the hand-off, not the whole booking model.
 */

import { create } from 'zustand'

import type { FareFamily, FlightOffer, SearchCriteria } from '@/features/search/types'

/** Whether the agent chose to ticket now (`book`) or hold / price-lock (`hold`). */
export type BookingIntent = 'book' | 'hold'

export interface BookingSelection {
  offer: FlightOffer
  fareFamily: FareFamily
  intent: BookingIntent
  /** The search that produced this offer, for context downstream. */
  criteria: SearchCriteria | null
}

interface BookingState {
  selection: BookingSelection | null
  /** Record the agent's choice and hand off to the booking flow. */
  selectOffer: (selection: BookingSelection) => void
  /** Clear the current selection (e.g. on booking completion or cancel). */
  reset: () => void
}

export const useBookingStore = create<BookingState>((set) => ({
  selection: null,
  selectOffer: (selection) => set({ selection }),
  reset: () => set({ selection: null }),
}))
