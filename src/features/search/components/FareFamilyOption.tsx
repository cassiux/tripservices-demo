import { Check, Lock, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { BookingIntent } from '@/store/bookingStore'

import { formatPrice } from '../format'
import type { FareFamily } from '../types'

interface FareFamilyOptionProps {
  fareFamily: FareFamily
  passengerCount: number
  onSelect: (intent: BookingIntent) => void
}

/** A single bookable fare brand: price, included/excluded ancillaries, Book / Hold. */
export function FareFamilyOption({ fareFamily, passengerCount, onSelect }: FareFamilyOptionProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const { price } = fareFamily

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-fg-primary">{fareFamily.name}</span>
          {fareFamily.refundable !== undefined && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                fareFamily.refundable
                  ? 'bg-confirmed text-confirmed-text'
                  : 'bg-edifact text-edifact-text',
              )}
            >
              {fareFamily.refundable
                ? t('search.results.refundable')
                : t('search.results.nonRefundable')}
            </span>
          )}
          {fareFamily.changeable !== undefined && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                fareFamily.changeable
                  ? 'bg-confirmed text-confirmed-text'
                  : 'bg-edifact text-edifact-text',
              )}
            >
              {fareFamily.changeable
                ? t('search.results.changeable')
                : t('search.results.nonChangeable')}
            </span>
          )}
        </div>

        {fareFamily.ancillaries.length > 0 && (
          <ul className="flex flex-col gap-1">
            {fareFamily.ancillaries.map((ancillary) => (
              <li key={ancillary.code} className="flex items-center gap-1.5 text-xs">
                {ancillary.included ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-confirmed-text" aria-hidden="true" />
                ) : (
                  <X className="h-3.5 w-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                )}
                <span
                  className={
                    ancillary.included ? 'text-fg-secondary' : 'text-fg-subtle line-through'
                  }
                >
                  {ancillary.label}
                </span>
                <span className="sr-only">
                  {ancillary.included ? t('search.results.included') : t('search.results.excluded')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="text-right">
          <div className="text-base font-semibold text-fg-primary">
            {formatPrice(price.total, price.currency, locale)}
          </div>
          {passengerCount > 1 && (
            <div className="text-xs text-fg-subtle">
              {formatPrice(price.perPassenger, price.currency, locale)}{' '}
              {t('search.results.perPassenger')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {fareFamily.holdAvailable && (
            <button
              type="button"
              onClick={() => onSelect('hold')}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-fg-secondary hover:bg-hover focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {t('search.results.hold')}
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelect('book')}
            className="inline-flex h-8 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-pressed focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
          >
            {t('search.results.book')}
          </button>
        </div>
      </div>
    </div>
  )
}
