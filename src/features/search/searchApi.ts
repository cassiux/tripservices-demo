/**
 * TripServices air-shopping transport layer for the Search feature.
 *
 * Endpoint: `POST /11/air/catalog/search/catalogproductofferings` (TripServices unified
 * shopping across EDIFACT, NDC and LCC content).
 *
 * NOTE ON TYPES — the TripServices OpenAPI spec is not yet checked into this repo,
 * so `npm run gen:api` cannot emit generated types for the catalog-offerings shape.
 * The request and raw-response interfaces below are therefore hand-modelled as an
 * interim contract and MUST be replaced with the generated `TripServices*` types
 * (and these field names reconciled against the spec) once it lands. The normaliser
 * is intentionally defensive so an imperfect raw shape degrades gracefully rather
 * than throwing. This is the data-transformation seam the unit tests exercise.
 */

import { AIR_API_PREFIX, tripServicesClient } from '@/lib/api/client'

import type {
  BaggageAllowance,
  CabinClass,
  ContentType,
  FareAncillary,
  FareFamily,
  FarePenalties,
  FarePenalty,
  FlightOffer,
  OfferPrice,
  OfferSegment,
  PassengerCounts,
  SearchCriteria,
} from './types'

/* ------------------------------------------------------------------ */
/* Request                                                             */
/* ------------------------------------------------------------------ */

interface CatalogPassengerCriteria {
  '@type': 'PassengerCriteria'
  number: number
  passengerTypeCode: string
}

interface CatalogSearchCriteriaFlight {
  '@type': 'SearchCriteriaFlight'
  departureDate: string
  From: { value: string }
  To: { value: string }
}

export interface CatalogOfferingsQueryRequest {
  CatalogProductOfferingsQueryRequest: {
    CatalogProductOfferingsRequest: {
      '@type': 'CatalogProductOfferingsRequestAir'
      offersPerPage: number
      contentSourceList: string[]
      PassengerCriteria: CatalogPassengerCriteria[]
      SearchCriteriaFlight: CatalogSearchCriteriaFlight[]
      SearchModifiersAir: {
        '@type': 'SearchModifiersAir'
        CabinPreference: { '@type': 'CabinPreference'; cabins: string[] }[]
        CarrierPreference: {
          '@type': 'CarrierPreference'
          preferenceType: string
          carriers: string[]
        }[]
        FareBasisCode?: string
      }
    }
  }
}

const PASSENGER_ORDER: (keyof PassengerCounts)[] = ['ADT', 'CHD', 'INF']

// Carriers provisioned on the sandbox GDS (EDIFACT) account.
const GDS_CARRIERS = [
  'AA', 'AC', 'AS', 'BA', 'BG', 'DL', 'EB', 'GQ', 'IZ',
  'KE', 'KF', 'KG', 'LF', 'LH', 'UA',
]

// Carriers provisioned for NDC content on the sandbox. Searched alongside GDS.
// LCC requires separate provisioning — do not add here until confirmed.
const NDC_CARRIERS = ['AA', 'UA', 'QF', 'SQ']

// Combined preferred-carrier list for a mixed GDS + NDC search. De-duplicated
// because AA and UA are provisioned on both content sources.
const PREFERRED_CARRIERS = [...new Set([...GDS_CARRIERS, ...NDC_CARRIERS])]

/** TripServices expects its own cabin tokens; today they match our enum 1:1. */
function toApiCabin(cabin: CabinClass): string {
  return cabin
}

export function totalPassengers(counts: PassengerCounts): number {
  return counts.ADT + counts.CHD + counts.INF
}

/** Maps validated SearchCriteria into the catalogproductofferings request payload. */
export function buildCatalogRequest(criteria: SearchCriteria): CatalogOfferingsQueryRequest {
  const passengerCriteria: CatalogPassengerCriteria[] = PASSENGER_ORDER.filter(
    (code) => criteria.passengers[code] > 0,
  ).map((code) => ({
    '@type': 'PassengerCriteria',
    number: criteria.passengers[code],
    passengerTypeCode: code,
  }))

  const flights: CatalogSearchCriteriaFlight[] = criteria.segments.map((segment) => ({
    '@type': 'SearchCriteriaFlight',
    departureDate: segment.date,
    From: { value: segment.origin },
    To: { value: segment.destination },
  }))

  const fareBasis = criteria.fareBasis?.trim()

  return {
    CatalogProductOfferingsQueryRequest: {
      CatalogProductOfferingsRequest: {
        '@type': 'CatalogProductOfferingsRequestAir',
        // NDC offerings rank below GDS in the response. With a small page the GDS offerings
        // fill every slot and NDC never surfaces (verified against the sandbox: at 15 a
        // mixed search returns 0 NDC; at 50 it returns the full GDS + NDC result set).
        offersPerPage: 50,
        // Search GDS (EDIFACT) and NDC content simultaneously. LCC pending provisioning.
        // Note: `maxNumberOfUpsellsToReturn` is deliberately omitted — it is not supported
        // for NDC and must not be present in a mixed search.
        contentSourceList: ['GDS', 'NDC'],
        PassengerCriteria: passengerCriteria,
        SearchCriteriaFlight: flights,
        SearchModifiersAir: {
          '@type': 'SearchModifiersAir',
          CabinPreference: [{
            '@type': 'CabinPreference',
            cabins: [toApiCabin(criteria.cabinClass)],
          }],
          CarrierPreference: [{
            '@type': 'CarrierPreference',
            preferenceType: 'Preferred',
            carriers: PREFERRED_CARRIERS,
          }],
          ...(fareBasis ? { FareBasisCode: fareBasis } : {}),
        },
      },
    },
  }
}

/* ------------------------------------------------------------------ */
/* Raw response (interim — replace with generated types)              */
/* ------------------------------------------------------------------ */

// Hand-modelled against the real (sandbox) catalogproductofferings response shape.
// The OpenAPI spec is not yet in the repo, so `npm run gen:api` cannot emit the
// generated `TripServices*` types — replace these once it lands. Field names below
// mirror the live response exactly. The normaliser is intentionally defensive so an
// imperfect raw shape degrades gracefully rather than throwing.
//
// Shape: CatalogProductOfferingsResponse holds the offerings plus a ReferenceList of
// shared, de-duplicated entities (flights, products, brands, terms) keyed by id. Each
// CatalogProductOffering references those entities by id; the normaliser resolves them.

/** `{ value: 'USD' }` — currency is nested throughout the catalog response. */
interface RawCurrencyCode {
  value?: string
}

interface RawBestCombinablePrice {
  '@type'?: string
  CurrencyCode?: RawCurrencyCode
  Base?: number
  TotalTaxes?: number
  TotalPrice?: number
}

/** Reference to a shared Product in the ReferenceList. */
interface RawProductRef {
  '@type'?: string
  productRef?: string
}

/**
 * Reference to a shared TermsAndConditions entry in the ReferenceList. The live API
 * returns this as a single object with a lowercase `termsAndConditionsRef`; the uppercase
 * variant is kept for defensiveness against the interim hand-modelled shape.
 */
interface RawTermsRef {
  '@type'?: string
  termsAndConditionsRef?: string
  TermsAndConditionsRef?: string
}

/**
 * NDC-only offer identifier carried on each ProductBrandOffering. Both fields are
 * required, alongside the full offer id, when calling AirPrice for NDC content.
 * GDS offers do not carry this block.
 */
interface RawIdentifier {
  '@type'?: string
  /** Airline authority that issued the offer, e.g. `AA`. */
  authority?: string
  /** Encoded, opaque offer value — passed through verbatim to AirPrice. */
  value?: string
}

interface RawProductBrandOffering {
  '@type'?: string
  /** Absent on the live API (GDS `o1`/NDC `AA_CPO0` ids live on the parent offering). */
  id?: string
  /** Live API nests the brand ref in an object; the parent offering also carries it. */
  Brand?: RawBrandRef
  Product?: RawProductRef[]
  BestCombinablePrice?: RawBestCombinablePrice
  /** `GDS` | `NDC` | `LCC` (anything not NDC/LCC surfaces as EDIFACT). */
  ContentSource?: string
  /** Present on NDC offers only; required for the downstream AirPrice call. */
  Identifier?: RawIdentifier
  /** Live API returns a single object; an array is tolerated for the interim shape. */
  TermsAndConditions?: RawTermsRef | RawTermsRef[]
}

interface RawProductBrandOptions {
  '@type'?: string
  /** Flight ids into the ReferenceListFlight entry, in itinerary order. */
  flightRefs?: string[]
  ProductBrandOffering?: RawProductBrandOffering[]
}

/** Reference to a shared Brand in the ReferenceList. */
interface RawBrandRef {
  '@type'?: string
  BrandRef?: string
}

interface RawCatalogProductOffering {
  '@type'?: string
  id?: string
  Departure?: string
  Arrival?: string
  Brand?: RawBrandRef[]
  ProductBrandOptions?: RawProductBrandOptions[]
}

/* ReferenceList — Flight */

interface RawFlightEndpoint {
  location?: string
  /** `YYYY-MM-DD`. */
  date?: string
  /** `HH:MM:SS`. */
  time?: string
  terminal?: string
}

interface RawFlight {
  '@type'?: string
  id?: string
  carrier?: string
  number?: string
  /** ISO 8601 duration, e.g. `PT8H20M`. */
  duration?: string
  equipment?: string
  operatingCarrier?: string
  operatingCarrierName?: string
  Departure?: RawFlightEndpoint
  Arrival?: RawFlightEndpoint
}

/* ReferenceList — Product (ties flights together; carries cabin + fare basis) */

interface RawFlightProduct {
  '@type'?: string
  cabin?: string
  fareBasisCode?: string
}

interface RawPassengerFlight {
  '@type'?: string
  FlightProduct?: RawFlightProduct[]
}

interface RawFlightSegmentRef {
  '@type'?: string
  id?: string
  /** Itinerary order of this segment within the product. */
  sequence?: number
  Flight?: { '@type'?: string; FlightRef?: string }
}

interface RawProduct {
  '@type'?: string
  id?: string
  /** ISO 8601 total elapsed time across all segments, e.g. `PT11H05M`. */
  totalDuration?: string
  FlightSegment?: RawFlightSegmentRef[]
  PassengerFlight?: RawPassengerFlight[]
}

/* ReferenceList — Brand */

interface RawBrandAttribute {
  '@type'?: string
  classification?: string
  /** `Included` when bundled in the fare; otherwise chargeable / not offered. */
  inclusion?: string
}

interface RawBrandDetail {
  '@type'?: string
  id?: string
  name?: string
  tier?: string
  code?: string
  BrandAttribute?: RawBrandAttribute[]
  AdditionalBrandAttribute?: RawBrandAttribute[]
}

/* ReferenceList — TermsAndConditions (baggage + penalties) */

interface RawBaggageFee {
  value?: number
  CurrencyCode?: RawCurrencyCode
}

interface RawBaggageAllowance {
  '@type'?: string
  /** e.g. `FirstCheckedBag`, `CarryOn`. */
  baggageType?: string
  /** `true` / `"true"` / `"Yes"` when the bag is bundled in the offer price. */
  includedInOfferPrice?: boolean | string
  BaggageFee?: RawBaggageFee
}

interface RawPenaltyDetail {
  '@type'?: string
  /** `Before` | `After` (departure). */
  applicability?: string
  Amount?: { value?: number; CurrencyCode?: RawCurrencyCode }
  changeable?: boolean
  refundable?: boolean
}

interface RawPenalties {
  '@type'?: string
  Change?: RawPenaltyDetail[]
  Cancel?: RawPenaltyDetail[]
}

interface RawTermsAndConditions {
  '@type'?: string
  id?: string
  BaggageAllowance?: RawBaggageAllowance[]
  Penalties?: RawPenalties
}

/** A ReferenceList entry. Discriminated by `@type`; only its matching array is set. */
interface RawReferenceList {
  '@type'?: string
  Flight?: RawFlight[]
  Product?: RawProduct[]
  Brand?: RawBrandDetail[]
  TermsAndConditions?: RawTermsAndConditions[]
}

export interface CatalogOfferingsResponseRaw {
  CatalogProductOfferingsResponse?: {
    CatalogProductOfferings?: {
      CatalogProductOffering?: RawCatalogProductOffering[]
    }
    ReferenceList?: RawReferenceList[]
  }
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

const KNOWN_CABINS: CabinClass[] = ['Economy', 'PremiumEconomy', 'Business', 'First']

/** ISO 8601 duration (date + time components), e.g. `P1DT2H30M`. */
const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/

/** Resolved ReferenceList lookups, keyed by entity id. */
interface ReferenceLookups {
  flights: Map<string, RawFlight>
  products: Map<string, RawProduct>
  brands: Map<string, RawBrandDetail>
  terms: Map<string, RawTermsAndConditions>
}

function toCabin(value: string | undefined, fallback: CabinClass): CabinClass {
  return KNOWN_CABINS.find((cabin) => cabin === value) ?? fallback
}

function toContentType(source: string | undefined): ContentType {
  switch ((source ?? '').toUpperCase()) {
    case 'NDC':
      return 'NDC'
    case 'LCC':
      return 'LCC'
    default:
      // GDS / EDIFACT / unknown all surface as EDIFACT content.
      return 'EDIFACT'
  }
}

/**
 * Captures the NDC offer identifier (authority + encoded value) for the downstream
 * AirPrice call. Returns undefined unless both fields are present — GDS offers carry
 * no Identifier block, and a partial one is unusable for pricing.
 */
function toNdcIdentifier(
  identifier: RawIdentifier | undefined,
): { authority: string; value: string } | undefined {
  if (!identifier?.authority || !identifier.value) return undefined
  return { authority: identifier.authority, value: identifier.value }
}

/** Indexes a ReferenceList array by its `id` field, skipping entries without one. */
function indexById<T extends { id?: string }>(items: T[] | undefined): Map<string, T> {
  const map = new Map<string, T>()
  for (const item of items ?? []) {
    if (item.id) map.set(item.id, item)
  }
  return map
}

/** Resolves the TermsAndConditions ref id, tolerating object-or-array and either ref casing. */
function firstTermsRef(terms: RawTermsRef | RawTermsRef[] | undefined): string | undefined {
  const entry = Array.isArray(terms) ? terms[0] : terms
  return entry?.termsAndConditionsRef ?? entry?.TermsAndConditionsRef
}

/** Finds the single ReferenceList entry of the given discriminator type. */
function findReferenceList(
  lists: RawReferenceList[],
  type: string,
): RawReferenceList | undefined {
  return lists.find((entry) => entry['@type'] === type)
}

function buildLookups(lists: RawReferenceList[]): ReferenceLookups {
  return {
    flights: indexById(findReferenceList(lists, 'ReferenceListFlight')?.Flight),
    products: indexById(findReferenceList(lists, 'ReferenceListProduct')?.Product),
    brands: indexById(findReferenceList(lists, 'ReferenceListBrand')?.Brand),
    terms: indexById(findReferenceList(lists, 'ReferenceListTermsAndConditions')?.TermsAndConditions),
  }
}

/** Parses an ISO 8601 duration (e.g. `PT8H20M`) into whole minutes. */
function durationToMinutes(iso: string | undefined): number {
  if (!iso) return 0
  const match = ISO_DURATION.exec(iso.trim())
  if (!match) return 0
  const [, days, hours, minutes] = match
  return Number(days ?? 0) * 1440 + Number(hours ?? 0) * 60 + Number(minutes ?? 0)
}

/** Joins a flight endpoint's `date` + `time` into an ISO datetime string. */
function toIsoDateTime(point: RawFlightEndpoint | undefined): string {
  if (!point?.date) return ''
  return `${point.date}T${point.time ?? '00:00:00'}`
}

function diffMinutes(from: string | undefined, to: string | undefined): number {
  if (!from || !to) return 0
  const start = new Date(from).getTime()
  const end = new Date(to).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0
  return Math.round((end - start) / 60_000)
}

function toPrice(raw: RawBestCombinablePrice | undefined, passengerCount: number): OfferPrice {
  const total = typeof raw?.TotalPrice === 'number' ? raw.TotalPrice : 0
  const divisor = passengerCount > 0 ? passengerCount : 1
  return {
    currency: raw?.CurrencyCode?.value ?? 'USD',
    total,
    perPassenger: Math.round((total / divisor) * 100) / 100,
    base: raw?.Base,
    taxes: raw?.TotalTaxes,
  }
}

/** Maps a brand's attributes into the included/excluded fare-ancillary shape. */
function toAncillaries(brand: RawBrandDetail | undefined): FareAncillary[] {
  return (brand?.BrandAttribute ?? [])
    .filter((attr): attr is RawBrandAttribute & { classification: string } =>
      Boolean(attr.classification),
    )
    .map((attr) => ({
      code: attr.classification,
      label: attr.classification,
      included: attr.inclusion === 'Included',
    }))
}

function isIncluded(value: boolean | string | undefined): boolean {
  if (typeof value === 'boolean') return value
  const normalised = (value ?? '').toLowerCase()
  return normalised === 'true' || normalised === 'yes'
}

/** First-checked-bag terms from the offer's TermsAndConditions. */
function toBaggage(
  terms: RawTermsAndConditions | undefined,
  fallbackCurrency: string,
): BaggageAllowance | undefined {
  const allowance = terms?.BaggageAllowance?.find((bag) => bag.baggageType === 'FirstCheckedBag')
  if (!allowance) return undefined

  const fee = allowance.BaggageFee?.value
  return {
    firstCheckedBagIncluded: isIncluded(allowance.includedInOfferPrice),
    firstCheckedBagFee:
      typeof fee === 'number'
        ? { amount: fee, currency: allowance.BaggageFee?.CurrencyCode?.value ?? fallbackCurrency }
        : undefined,
  }
}

function toPenalty(
  detail: RawPenaltyDetail | undefined,
  permitted: boolean | undefined,
  fallbackCurrency: string,
): FarePenalty | undefined {
  if (!detail) return undefined
  const amount = detail.Amount?.value
  return {
    permitted,
    amount: typeof amount === 'number' ? amount : undefined,
    currency: detail.Amount?.CurrencyCode?.value ?? fallbackCurrency,
  }
}

/** Change/cancel penalties from the offer's TermsAndConditions. */
function toPenalties(
  terms: RawTermsAndConditions | undefined,
  fallbackCurrency: string,
): FarePenalties | undefined {
  const penalties = terms?.Penalties
  if (!penalties) return undefined

  const changeDetail = penalties.Change?.[0]
  const cancelDetail = penalties.Cancel?.[0]
  const change = toPenalty(changeDetail, changeDetail?.changeable, fallbackCurrency)
  const cancel = toPenalty(cancelDetail, cancelDetail?.refundable, fallbackCurrency)
  if (!change && !cancel) return undefined
  return { change, cancel }
}

function toSegment(flight: RawFlight, cabin: CabinClass): OfferSegment {
  const carrier = flight.carrier ?? ''
  const operatingCarrier = flight.operatingCarrier
  const operatingCarrierName = flight.operatingCarrierName
  // The flight carries no marketing-carrier name; reuse the operating name only when the
  // operating carrier matches the marketing carrier, otherwise fall back to the code.
  const marketingCarrierName =
    operatingCarrier && operatingCarrier !== carrier
      ? carrier
      : operatingCarrierName ?? carrier

  return {
    origin: flight.Departure?.location ?? '',
    destination: flight.Arrival?.location ?? '',
    departure: toIsoDateTime(flight.Departure),
    arrival: toIsoDateTime(flight.Arrival),
    marketingCarrier: carrier,
    marketingCarrierName,
    marketingFlightNumber: flight.number ?? '',
    operatingCarrier,
    operatingCarrierName,
    durationMinutes: durationToMinutes(flight.duration),
    cabinClass: cabin,
  }
}

/** Cabin from the resolved Product (`PassengerFlight[0].FlightProduct[0].cabin`). */
function productCabin(product: RawProduct | undefined): string | undefined {
  return product?.PassengerFlight?.[0]?.FlightProduct?.[0]?.cabin
}

/**
 * Flight ids from a Product's FlightSegments, in itinerary (sequence) order. NDC offers
 * leave `ProductBrandOptions.flightRefs` empty and reference their flights here instead,
 * via the offering's Product. GDS offers populate `flightRefs` directly.
 */
function productFlightRefs(product: RawProduct | undefined): string[] {
  return [...(product?.FlightSegment ?? [])]
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((segment) => segment.Flight?.FlightRef)
    .filter((ref): ref is string => Boolean(ref))
}

/**
 * Builds one FlightOffer per ProductBrandOptions. Multiple options on a single
 * CatalogProductOffering are alternative flights for the same fare family — surfaced
 * as separate, comparable offers (each with a single brand-derived fare family).
 */
function toOffer(
  offering: RawCatalogProductOffering,
  options: RawProductBrandOptions,
  optionIndex: number,
  lookups: ReferenceLookups,
  fallbackCabin: CabinClass,
  passengerCount: number,
): FlightOffer | null {
  const offering0 = options.ProductBrandOffering?.[0]
  const product = lookups.products.get(offering0?.Product?.[0]?.productRef ?? '')

  // GDS lists its flights on the option (`flightRefs`); NDC leaves that empty and references
  // them on the offering's Product instead. Fall back to the product path so NDC resolves.
  const flightRefs =
    options.flightRefs && options.flightRefs.length > 0
      ? options.flightRefs
      : productFlightRefs(product)

  const flights = flightRefs
    .map((ref) => lookups.flights.get(ref))
    .filter((flight): flight is RawFlight => flight !== undefined)
  if (flights.length === 0) return null

  const price = toPrice(offering0?.BestCombinablePrice, passengerCount)
  const contentType = toContentType(offering0?.ContentSource)
  // NDC offers carry an Identifier required for AirPrice; GDS offers do not.
  const ndcIdentifier = toNdcIdentifier(offering0?.Identifier)

  const cabin = toCabin(productCabin(product), fallbackCabin)

  const segments = flights.map((flight) => toSegment(flight, cabin))
  const first = segments[0]
  const last = segments[segments.length - 1]

  const brand = lookups.brands.get(offering.Brand?.[0]?.BrandRef ?? '')
  const terms = lookups.terms.get(firstTermsRef(offering0?.TermsAndConditions) ?? '')
  const penalties = toPenalties(terms, price.currency)

  const fareFamily: FareFamily = {
    id: offering0?.id ?? `${offering.id ?? 'offer'}-${optionIndex}`,
    name: brand?.name ?? 'Fare',
    price,
    ancillaries: toAncillaries(brand),
    refundable: penalties?.cancel?.permitted,
    changeable: penalties?.change?.permitted,
    // Sandbox responses carry no hold availability — default off until it lands.
    holdAvailable: false,
    baggage: toBaggage(terms, price.currency),
    penalties,
  }

  // Prefer the product's total duration (includes connection time); fall back to the
  // elapsed time across segments, then to the sum of individual flight durations.
  const durationMinutes =
    durationToMinutes(product?.totalDuration) ||
    diffMinutes(first.departure, last.arrival) ||
    segments.reduce((sum, segment) => sum + (segment.durationMinutes ?? 0), 0)

  return {
    id: fareFamily.id,
    contentType,
    airline: first.marketingCarrierName,
    airlineCode: first.marketingCarrier,
    segments,
    stops: Math.max(segments.length - 1, 0),
    durationMinutes,
    departure: first.departure,
    arrival: last.arrival,
    origin: first.origin || offering.Departure || '',
    destination: last.destination || offering.Arrival || '',
    cabinClass: cabin,
    price,
    fareFamilies: [fareFamily],
    holdAvailable: false,
    // Full offer id (e.g. `AA_CPO0`) is preserved above; the prefix is never stripped.
    ...(ndcIdentifier ? { ndcIdentifier } : {}),
  }
}

/** Maps a raw catalog-offerings response into render-ready FlightOffer[]. */
export function normaliseOffers(
  response: CatalogOfferingsResponseRaw,
  passengerCount: number,
  fallbackCabin: CabinClass = 'Economy',
): FlightOffer[] {
  const root = response.CatalogProductOfferingsResponse
  const offerings = root?.CatalogProductOfferings?.CatalogProductOffering ?? []
  const lookups = buildLookups(root?.ReferenceList ?? [])

  const offers: FlightOffer[] = []
  for (const offering of offerings) {
    ;(offering.ProductBrandOptions ?? []).forEach((options, optionIndex) => {
      const offer = toOffer(
        offering,
        options,
        optionIndex,
        lookups,
        fallbackCabin,
        passengerCount,
      )
      if (offer) offers.push(offer)
    })
  }
  return offers
}

/* ------------------------------------------------------------------ */
/* Request orchestration                                               */
/* ------------------------------------------------------------------ */

/** Shops TripServices for offers matching `criteria` and returns normalised results. */
export async function searchOffers(
  criteria: SearchCriteria,
  signal?: AbortSignal,
): Promise<FlightOffer[]> {
  const body = buildCatalogRequest(criteria)
  const response = await tripServicesClient.post<CatalogOfferingsResponseRaw>(
    `${AIR_API_PREFIX}/catalog/search/catalogproductofferings`,
    body,
    {
      signal,
      // Air shopping requires explicit API + payload versioning headers.
      headers: { 'Accept-Version': '11', 'Content-Version': '11' },
    },
  )

  return normaliseOffers(response, totalPassengers(criteria.passengers), criteria.cabinClass)
}