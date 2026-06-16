# Air Search — API Reference

**Endpoint:** `POST /11/air/catalog/search/catalogproductofferings`
**Versions required:** `Accept-Version: 11`, `Content-Version: 11`
**Status:** Verified working (GDS and NDC)

---

## Required headers

```
Authorization: Bearer {token}
XAUTH_TRAVELPORT_ACCESSGROUP: {accessGroup}
Accept: application/json
Accept-Version: 11
Content-Version: 11
Content-Type: application/json
```

Optional headers (both default to false):
```
isJourney: true        — journey representation vs next-leg search
taxBreakDown: true     — include itemised tax breakdown in response
```

---

## GDS search — verified request

Use `contentSourceList: ["GDS"]` for EDIFACT content. Requires `CarrierPreference` with the carriers provisioned on your account.

```json
{
  "@type": "CatalogProductOfferingsQueryRequest",
  "CatalogProductOfferingsRequest": {
    "@type": "CatalogProductOfferingsRequestAir",
    "offersPerPage": 15,
    "maxNumberOfUpsellsToReturn": 4,
    "contentSourceList": ["GDS"],
    "PassengerCriteria": [
      {
        "@type": "PassengerCriteria",
        "number": 1,
        "passengerTypeCode": "ADT"
      }
    ],
    "SearchCriteriaFlight": [
      {
        "@type": "SearchCriteriaFlight",
        "departureDate": "YYYY-MM-DD",
        "From": { "value": "LHR" },
        "To": { "value": "JFK" }
      }
    ],
    "SearchModifiersAir": {
      "@type": "SearchModifiersAir",
      "CabinPreference": [
        {
          "@type": "CabinPreference",
          "cabins": ["Economy"]
        }
      ],
      "CarrierPreference": [
        {
          "@type": "CarrierPreference",
          "preferenceType": "Preferred",
          "carriers": ["AA","AC","AS","BA","BG","DL","EB","GQ","IZ","KE","KF","KG","LF","LH","UA"]
        }
      ]
    }
  }
}
```

---

## NDC search — verified request

Use `contentSourceList: ["NDC"]` for NDC content. Provisioned carriers for this sandbox: **AA, UA, QF, SQ**.

NDC notes from the DevKit:
- `maxNumberOfUpsellsToReturn` is **not supported for NDC** — omit it or set to 0
- NDC offer IDs include an airline prefix (e.g. `AA_CPO0`) — use the full ID in subsequent price/book calls
- NDC responses include an `Identifier` block on each offer with an `authority` (airline code) and encoded `value` — both required for AirPrice
- NDC prices are returned in the traveller's billing currency, not necessarily USD

```json
{
  "@type": "CatalogProductOfferingsQueryRequest",
  "CatalogProductOfferingsRequest": {
    "@type": "CatalogProductOfferingsRequestAir",
    "offersPerPage": 15,
    "contentSourceList": ["NDC"],
    "PassengerCriteria": [
      {
        "@type": "PassengerCriteria",
        "number": 1,
        "passengerTypeCode": "ADT"
      }
    ],
    "SearchCriteriaFlight": [
      {
        "@type": "SearchCriteriaFlight",
        "departureDate": "YYYY-MM-DD",
        "From": { "value": "LHR" },
        "To": { "value": "JFK" }
      }
    ],
    "SearchModifiersAir": {
      "@type": "SearchModifiersAir",
      "CarrierPreference": [
        {
          "@type": "CarrierPreference",
          "preferenceType": "Preferred",
          "carriers": ["AA", "UA", "QF", "SQ"]
        }
      ]
    }
  }
}
```

---

## Mixed GDS + NDC search

To search both simultaneously, include both in `contentSourceList`. The response intermixes GDS and NDC offers — each offer's `ContentSource` field identifies which it is.

```json
"contentSourceList": ["GDS", "NDC"]
```

Put **all** carriers (GDS ∪ NDC, de-duplicated) in a single `Preferred` `CarrierPreference`. `preferenceType: "Preferred"` is a soft preference, not a filter — GDS content for unprovisioned-as-preferred carriers still returns. Using the combined list gives broader GDS carrier coverage than the GDS-only list (verified: AA, AC, DL, EN, LH, UA vs AA, AC, LH, UA on LHR→JFK).

NDC carriers: `AA`, `UA`, `QF`, `SQ`.
GDS carriers: `AA`, `AC`, `AS`, `BA`, `BG`, `DL`, `EB`, `GQ`, `IZ`, `KE`, `KF`, `KG`, `LF`, `LH`, `UA`.

**`offersPerPage` must be large enough or NDC disappears (verified, critical).** NDC offerings rank *below* GDS in the response. With `offersPerPage: 15` a mixed LHR→JFK search returns **0 NDC** offers — GDS fills every offering slot. At `offersPerPage: 50` the same search returns the full set (27 offerings: 48 GDS + 18 NDC offers). Use a generous page size for mixed searches. This is not documented anywhere on the developer portal.

---

## Optional search modifiers

**Departure time filter:**
```json
"departureTime": "08:00:00"
```

**Departure time range:**
```json
"DepartureTimeRange": {
  "start": "08:00:00",
  "end": "12:00:00"
}
```

**Arrival date (instead of departure date):**
```json
"arrivalDate": "YYYY-MM-DD"
```

**Arrival time range:**
```json
"ArrivalTimeRange": {
  "start": "11:00:00",
  "end": "13:00:00"
}
```

**City vs airport disambiguation:**
```json
"From": {
  "value": "NYC",
  "cityOrAirport": "City Only"
},
"To": {
  "value": "ORD",
  "cityOrAirport": "Airport Only"
}
```

**Leg sequence (multi-city):**
```json
"SearchCriteriaFlight": [
  {
    "@type": "SearchCriteriaFlight",
    "legSequence": 1,
    "departureDate": "YYYY-MM-DD",
    "From": { "value": "LHR" },
    "To": { "value": "JFK" }
  },
  {
    "@type": "SearchCriteriaFlight",
    "legSequence": 2,
    "departureDate": "YYYY-MM-DD",
    "From": { "value": "JFK" },
    "To": { "value": "LAX" }
  }
]
```

---

## Response structure

The response is reference-based. Do not assume data is embedded in each offer.

```
CatalogProductOfferingsResponse
  CatalogProductOfferings
    CatalogProductOffering[]     — one per offer (id, Departure, Arrival, Brand[], ProductBrandOptions[])
      ProductBrandOptions[]      — one per flight option for this fare
        flightRefs[]             — IDs into ReferenceListFlight
        ProductBrandOffering[]
          BestCombinablePrice    — Base, TotalTaxes, TotalPrice, CurrencyCode.value
          ContentSource          — "GDS" | "NDC" | "LCC"
          Identifier             — NDC only: authority (airline) + encoded value (required for AirPrice)
  ReferenceList[]
    ReferenceListFlight          — Flight[] by id: carrier, number, duration, Departure, Arrival
    ReferenceListProduct         — Product[] by id: totalDuration, FlightSegment[], cabin, fareBasisCode
    ReferenceListBrand           — Brand[] by id: name, tier, code, BrandAttribute[], AdditionalBrandAttribute[]
    ReferenceListTermsAndConditions — TermsAndConditions[] by id: BaggageAllowance[], Penalties
```

**Always build ID lookup maps from ReferenceList before processing offers.**

**Flight references differ by content source (verified, critical).** GDS lists its flight ids on `ProductBrandOptions.flightRefs`. **NDC leaves `flightRefs` empty/absent** and references its flights through the offering's Product instead:

```
ProductBrandOffering.Product[].productRef
  → ReferenceListProduct.Product (by id, e.g. "AAp0")
    → Product.FlightSegment[].Flight.FlightRef (e.g. "AAs1", ordered by `sequence`)
      → ReferenceListFlight.Flight (by id)
```

A normaliser that only reads `ProductBrandOptions.flightRefs` will silently drop **every** NDC offer (zero flights resolved). Fall back to the Product → FlightSegment path when `flightRefs` is empty.

---

## NDC vs GDS differences in the response

| Field | GDS | NDC |
|---|---|---|
| Offer ID (on `CatalogProductOffering`) | `o1`, `o2` (sequential) | `AA_CPO0` (airline prefix + ID) |
| `id` on `ProductBrandOffering` | Absent | Absent (id lives on the parent offering) |
| `ProductBrandOptions.flightRefs` | Populated | **Empty** — flights are on `Product.FlightSegment` |
| `Identifier` block on `ProductBrandOffering` | Not present | Present — `{ authority, value }`, both required for AirPrice |
| `TermsAndConditions` | Single object, `termsAndConditionsRef` (lowercase) | Same — single object, lowercase ref (not an array) |
| `Price` on ProductBrandOffering | Not present | Present (full price detail) |
| `BestCombinablePrice` (`@type: BestCombinablePriceDetail`) | Present | Present |
| Currency | Always per account default | Billing currency of traveller |
| `maxNumberOfUpsellsToReturn` | Supported | Not supported — omit from mixed searches |
