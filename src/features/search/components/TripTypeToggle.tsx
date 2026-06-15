import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { TripType } from '../types'

interface TripTypeToggleProps {
  value: TripType
  onChange: (value: TripType) => void
}

const OPTIONS: { value: TripType; labelKey: string }[] = [
  { value: 'oneWay', labelKey: 'search.form.tripType.oneWay' },
  { value: 'return', labelKey: 'search.form.tripType.return' },
  { value: 'multiCity', labelKey: 'search.form.tripType.multiCity' },
]

/**
 * Segmented trip-type control. Built on native radios for full keyboard support
 * (Tab into the group, arrow keys to move) with the active option styled in brand.
 */
export function TripTypeToggle({ value, onChange }: TripTypeToggleProps) {
  const { t } = useTranslation()

  return (
    <fieldset>
      <legend className="sr-only">{t('search.form.tripType.label')}</legend>
      <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
        {OPTIONS.map((option) => {
          const checked = value === option.value
          return (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="trip-type"
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'block rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-1',
                  checked ? 'bg-brand text-white' : 'text-fg-muted hover:text-fg-secondary',
                )}
              >
                {t(option.labelKey)}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
