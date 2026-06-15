# Search

Air shopping across EDIFACT, NDC and LCC content via TripServices. Status: **built**.

The agent assembles a search (one-way, return or multi-city), SPC shops TripServices,
and the sortable results list hands a selected offer to the booking flow.

- **Route:** `/search`

## TripServices endpoints

| Operation | Endpoint | Notes |
|---|---|---|
| Air shopping | `POST /catalog-offerings-query` | Live call via `tripServicesClient.post`. Request built by `buildCatalogRequest`, response mapped by `normaliseOffers`. |
| Airport autocomplete | _none_ | **MOCK** — see limitations. |

## Files

### Data / logic
- `types.ts` — search domain model (`SearchCriteria`, `FlightOffer`, `FareFamily`, `SortState`, …).
- `searchApi.ts` — request builder, raw-response contract, `normaliseOffers`, and `searchOffers` (the TripServices call).
- `sortOffers.ts` — pure sort comparators (price / duration / stops / departure).
- `format.ts` — `Intl`-based price, time, date and duration formatters.
- `airports.ts` — **MOCK** static IATA dataset + `searchAirports` / `findAirport`.
- `useSearch.ts` — React Query hook wrapping `searchOffers` (loading / empty / error / retry).
- `useAirportSearch.ts` — **MOCK** debounced (250 ms) typeahead hook.
- `useRecentSearches.ts` — last 5 searches persisted in `sessionStorage`.

### UI
- `SearchPage.tsx` — composition: form, recent searches (on load), results states, offer → store → `/booking`.
- `components/SearchForm.tsx` — trip type, airport typeahead, dates, passengers, cabin, fare basis, validation.
- `components/TripTypeToggle.tsx`, `AirportField.tsx`, `PassengerSelector.tsx`, `CabinClassSelect.tsx` — form controls.
- `components/RecentSearches.tsx` — recent-search chips.
- `components/SearchResults.tsx` — sortable list with empty / error states.
- `components/ResultCard.tsx` — one offer; expandable fare families when >1 fare exists.
- `components/FareFamilyOption.tsx` — a bookable fare: ancillaries + Book / Hold.
- `components/ContentTypeBadge.tsx` — NDC / EDIFACT / LCC badge (design-system tokens).
- `components/SortControl.tsx`, `ResultsSkeleton.tsx` — sort toolbar and loading skeleton.

### Cross-cutting
- `src/store/bookingStore.ts` — Zustand store holding the selected offer for the booking flow.

## State & data flow

1. `SearchForm` validates input and emits a `SearchCriteria`.
2. `SearchPage` sets it as state; `useSearch(criteria)` shops TripServices (React Query, cached by criteria).
3. Loading → skeleton rows; error → message + retry (`refetch`); empty → broaden-search prompt; success → `SearchResults`.
4. Selecting **Book**/**Hold** writes `{ offer, fareFamily, intent, criteria }` to `bookingStore` and routes to `/booking`.

## Tests

- `useSearch.test.tsx` — success (normalisation, lead price, per-passenger, hold), empty, error.
- `components/SearchForm.test.tsx` — required-field validation, valid one-way submission, return-date reveal.
- `components/SearchResults.test.tsx` — default price sort + re-sort by duration/departure, empty + error states.
- `components/ResultCard.test.tsx` — fare-family expand/collapse, Book/Hold selection intent.
- `components/ContentTypeBadge.test.tsx` — NDC/EDIFACT/LCC token classes and labels.

## Known limitations / sandbox notes

- **Airport autocomplete is mocked.** The sandbox exposes no reference/location lookup, so the
  typeahead filters a static dataset (`airports.ts`, `useAirportSearch.ts`). Both carry a
  `// MOCK:` flag; swap `searchAirports()` for the real call when the endpoint lands — the hook
  contract `{ results, isLoading }` should not need to change.
- **`catalog-offerings-query` request/response types are hand-modelled (interim).** The TripServices
  OpenAPI spec is not yet in the repo, so `npm run gen:api` cannot emit generated types. The
  request and raw-response shapes in `searchApi.ts` are a best-effort interim contract and must be
  reconciled with the spec and replaced by generated `TripServices*` types once available.
  `normaliseOffers` is intentionally defensive so an imperfect raw shape degrades gracefully.
- **Date picker uses native `<input type="date">`** (browser calendar UI), with paired
  outbound/inbound inputs for return trips rather than a single unified two-month range calendar.
  A shadcn `Calendar` / `react-day-picker` range view is the intended enhancement — deferred here to
  avoid adding an unapproved dependency. Native inputs remain accessible and locale-correct.
- **`/booking` route** is consumed by the Booking flow (feature #4), which is not yet built; the
  store hand-off (`bookingStore`) is in place and ready for it.
