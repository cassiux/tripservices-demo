/**
 * Trimmed real-shape `catalogproductofferings` response for normaliser tests.
 *
 * Mirrors the live TripServices sandbox structure exactly — offerings reference
 * shared entities (flights, products, brands, terms) by id in the ReferenceList,
 * discriminated by `@type`. Two offerings, two flights, two brands.
 *
 *   off-1 → flight f1 (BA 178, NDC), brand b1 (Economy Light), terms t1
 *   off-2 → flight f2 (AA 100, GDS), brand b2 (Main Cabin),     terms t2
 */

import type { CatalogOfferingsResponseRaw } from '../searchApi'

export const catalogResponseFixture: CatalogOfferingsResponseRaw = {
  CatalogProductOfferingsResponse: {
    CatalogProductOfferings: {
      CatalogProductOffering: [
        {
          '@type': 'CatalogProductOffering',
          id: 'off-1',
          Departure: 'LHR',
          Arrival: 'JFK',
          Brand: [{ '@type': 'CatalogProductOfferingBrand', BrandRef: 'b1' }],
          ProductBrandOptions: [
            {
              '@type': 'ProductBrandOptions',
              flightRefs: ['f1'],
              ProductBrandOffering: [
                {
                  '@type': 'ProductBrandOffering',
                  id: 'pbo-1',
                  BrandRef: 'b1',
                  Product: [{ productRef: 'p1' }],
                  BestCombinablePrice: {
                    '@type': 'BestCombinablePrice',
                    CurrencyCode: { value: 'USD' },
                    Base: 800,
                    TotalTaxes: 200,
                    TotalPrice: 1000,
                  },
                  ContentSource: 'NDC',
                  TermsAndConditions: [{ TermsAndConditionsRef: 't1' }],
                },
              ],
            },
          ],
        },
        {
          '@type': 'CatalogProductOffering',
          id: 'off-2',
          Departure: 'LHR',
          Arrival: 'JFK',
          Brand: [{ '@type': 'CatalogProductOfferingBrand', BrandRef: 'b2' }],
          ProductBrandOptions: [
            {
              '@type': 'ProductBrandOptions',
              flightRefs: ['f2'],
              ProductBrandOffering: [
                {
                  '@type': 'ProductBrandOffering',
                  id: 'pbo-2',
                  BrandRef: 'b2',
                  Product: [{ productRef: 'p2' }],
                  BestCombinablePrice: {
                    '@type': 'BestCombinablePrice',
                    CurrencyCode: { value: 'USD' },
                    Base: 980,
                    TotalTaxes: 220,
                    TotalPrice: 1200,
                  },
                  ContentSource: 'GDS',
                  TermsAndConditions: [{ TermsAndConditionsRef: 't2' }],
                },
              ],
            },
          ],
        },
      ],
    },
    ReferenceList: [
      {
        '@type': 'ReferenceListFlight',
        Flight: [
          {
            '@type': 'Flight',
            id: 'f1',
            carrier: 'BA',
            number: '178',
            duration: 'PT3H',
            equipment: '777',
            operatingCarrier: 'BA',
            operatingCarrierName: 'British Airways',
            Departure: { location: 'LHR', date: '2026-07-01', time: '09:00:00', terminal: '5' },
            Arrival: { location: 'JFK', date: '2026-07-01', time: '12:00:00', terminal: '7' },
          },
          {
            '@type': 'Flight',
            id: 'f2',
            carrier: 'AA',
            number: '100',
            duration: 'PT4H30M',
            equipment: '763',
            operatingCarrier: 'AA',
            operatingCarrierName: 'American Airlines',
            Departure: { location: 'LHR', date: '2026-07-01', time: '07:00:00', terminal: '3' },
            Arrival: { location: 'JFK', date: '2026-07-01', time: '11:30:00', terminal: '8' },
          },
        ],
      },
      {
        '@type': 'ReferenceListProduct',
        Product: [
          {
            '@type': 'Product',
            id: 'p1',
            totalDuration: 'PT3H',
            FlightSegment: [{ '@type': 'FlightSegment', Flight: { FlightRef: 'f1' } }],
            PassengerFlight: [
              {
                '@type': 'PassengerFlight',
                FlightProduct: [{ '@type': 'FlightProduct', cabin: 'Economy', fareBasisCode: 'OACONS' }],
              },
            ],
          },
          {
            '@type': 'Product',
            id: 'p2',
            totalDuration: 'PT4H30M',
            FlightSegment: [{ '@type': 'FlightSegment', Flight: { FlightRef: 'f2' } }],
            PassengerFlight: [
              {
                '@type': 'PassengerFlight',
                FlightProduct: [{ '@type': 'FlightProduct', cabin: 'Economy', fareBasisCode: 'KAA0OACO' }],
              },
            ],
          },
        ],
      },
      {
        '@type': 'ReferenceListBrand',
        Brand: [
          {
            '@type': 'Brand',
            id: 'b1',
            name: 'Economy Light',
            tier: '1',
            code: 'ECOLIGHT',
            BrandAttribute: [
              { '@type': 'BrandAttribute', classification: 'CarryOnAllowance', inclusion: 'Included' },
              { '@type': 'BrandAttribute', classification: 'FirstCheckedBag', inclusion: 'Chargeable' },
              { '@type': 'BrandAttribute', classification: 'SeatSelection', inclusion: 'Chargeable' },
            ],
            AdditionalBrandAttribute: [],
          },
          {
            '@type': 'Brand',
            id: 'b2',
            name: 'Main Cabin',
            tier: '2',
            code: 'MAIN',
            BrandAttribute: [
              { '@type': 'BrandAttribute', classification: 'CarryOnAllowance', inclusion: 'Included' },
              { '@type': 'BrandAttribute', classification: 'FirstCheckedBag', inclusion: 'Included' },
              { '@type': 'BrandAttribute', classification: 'SeatSelection', inclusion: 'Included' },
            ],
            AdditionalBrandAttribute: [],
          },
        ],
      },
      {
        '@type': 'ReferenceListTermsAndConditions',
        TermsAndConditions: [
          {
            '@type': 'TermsAndConditions',
            id: 't1',
            BaggageAllowance: [
              {
                '@type': 'BaggageAllowance',
                baggageType: 'FirstCheckedBag',
                includedInOfferPrice: false,
                BaggageFee: { value: 60, CurrencyCode: { value: 'USD' } },
              },
            ],
            Penalties: {
              '@type': 'Penalties',
              Change: [{ '@type': 'Penalty', applicability: 'Before', changeable: true, Amount: { value: 250, CurrencyCode: { value: 'USD' } } }],
              Cancel: [{ '@type': 'Penalty', applicability: 'Before', refundable: false }],
            },
          },
          {
            '@type': 'TermsAndConditions',
            id: 't2',
            BaggageAllowance: [
              {
                '@type': 'BaggageAllowance',
                baggageType: 'FirstCheckedBag',
                includedInOfferPrice: true,
              },
            ],
            Penalties: {
              '@type': 'Penalties',
              Change: [{ '@type': 'Penalty', applicability: 'Before', changeable: true, Amount: { value: 150, CurrencyCode: { value: 'USD' } } }],
              Cancel: [{ '@type': 'Penalty', applicability: 'Before', refundable: true, Amount: { value: 200, CurrencyCode: { value: 'USD' } } }],
            },
          },
        ],
      },
    ],
  },
}
