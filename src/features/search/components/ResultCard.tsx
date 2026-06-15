import { ChevronDown, Clock, Plane } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { BookingIntent } from '@/store/bookingStore'

import { formatDuration, formatPrice, formatTime } from '../format'
import type { FareFamily, FlightOffer } from '../types'
import { ContentTypeBadge } from './ContentTypeBadge'
import { FareFamilyOption } from './FareFamilyOption'

interface ResultCardProps {
  offer: FlightOffer
  passengerCount: number
  onSelect: (offer: FlightOffer, fareFamily: FareFamily, intent: BookingIntent) => void
}

/** Calendar-day offset between two ISO datetimes (for the `+1` arrival indicator). */
function dayOffset(from: string, to: string): number {
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((endDay - startDay) / 86_400_000)
}

/**
 * One air offer. Summary row is always visible; when the offer carries more than one
 * fare family, an expandable region lists each bookable fare with its ancillaries.
 */
export function ResultCard({ offer, passengerCount, onSelect }: ResultCardProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [expanded, setExpanded] = useState(false)
  const headingId = useId()
  const faresId = `${headingId}-fares`

  const hasMultipleFares = offer.fareFamilies.length > 1
  const arrivalOffset = dayOffset(offer.departure, offer.arrival)

  const stopsLabel =
    offer.stops === 0
      ? t('search.results.nonstop')
      : t('search.results.stops', { count: offer.stops })

  const flightNumbers = offer.segments
    .map((segment) => `${segment.marketingCarrier} ${segment.marketingFlightNumber}`.trim())
    .filter(Boolean)
    .join(', ')

  function handleSelect(fareFamily: FareFamily, intent: BookingIntent) {
    onSelect(offer, fareFamily, intent)
  }

  return (
    <article
      aria-labelledby={headingId}
      className="rounded-lg border border-border bg-canvas transition-colors hover:bg-hover/40"
    >
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        {/* Carrier + content type */}
        <div className="flex min-w-0 items-center gap-3 md:w-48">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-fg-muted">
            <Plane className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 id={headingId} className="truncate text-sm font-semibold text-fg-primary">
              {offer.airline}
            </h3>
            <p className="truncate text-xs text-fg-subtle">{flightNumbers}</p>
          </div>
        </div>

        {/* Times + route */}
        <div className="flex flex-1 items-center gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-fg-primary">
              {formatTime(offer.departure, locale)}
            </span>
            <span className="text-xs text-fg-subtle">{offer.origin}</span>
          </div>
          <div className="flex flex-1 flex-col items-center text-xs text-fg-subtle">
            <span>{formatDuration(offer.durationMinutes, locale)}</span>
            <span className="my-0.5 h-px w-full max-w-32 bg-border" aria-hidden="true" />
            <span>{stopsLabel}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-fg-primary">
              {formatTime(offer.arrival, locale)}
              {arrivalOffset > 0 && (
                <sup className="ml-0.5 text-[10px] font-medium text-accent">+{arrivalOffset}</sup>
              )}
            </span>
            <span className="text-xs text-fg-subtle">{offer.destination}</span>
          </div>
        </div>

        {/* Badge + price + action */}
        <div className="flex items-center justify-between gap-4 md:w-64 md:justify-end">
          <ContentTypeBadge type={offer.contentType} />
          <div className="text-right">
            <div className="text-base font-semibold text-fg-primary">
              {formatPrice(offer.price.total, offer.price.currency, locale)}
            </div>
            {passengerCount > 1 && (
              <div className="text-xs text-fg-subtle">
                {formatPrice(offer.price.perPassenger, offer.price.currency, locale)}{' '}
                {t('search.results.perPassenger')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fare selection */}
      <div className="border-t border-border px-4 py-3">
        {hasMultipleFares ? (
          <>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={faresId}
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {expanded ? t('search.results.hideFares') : t('search.results.viewFares')}
              <span className="text-fg-subtle">
                ({t('search.results.fareFamilies', { count: offer.fareFamilies.length })})
              </span>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
            {expanded && (
              <div id={faresId} className="mt-3 flex flex-col gap-2">
                {offer.fareFamilies.map((fareFamily) => (
                  <FareFamilyOption
                    key={fareFamily.id}
                    fareFamily={fareFamily}
                    passengerCount={passengerCount}
                    onSelect={(intent) => handleSelect(fareFamily, intent)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <FareFamilyOption
            fareFamily={offer.fareFamilies[0]}
            passengerCount={passengerCount}
            onSelect={(intent) => handleSelect(offer.fareFamilies[0], intent)}
          />
        )}
      </div>
    </article>
  )
}
