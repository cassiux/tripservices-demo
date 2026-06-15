import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import type { CabinClass } from '../types'

interface CabinClassSelectProps {
  value: CabinClass
  onChange: (value: CabinClass) => void
}

const CABINS: { value: CabinClass; labelKey: string }[] = [
  { value: 'Economy', labelKey: 'search.form.cabin.economy' },
  { value: 'PremiumEconomy', labelKey: 'search.form.cabin.premiumEconomy' },
  { value: 'Business', labelKey: 'search.form.cabin.business' },
  { value: 'First', labelKey: 'search.form.cabin.first' },
]

/** Cabin-class picker. Native `<select>` for full accessibility and keyboard use. */
export function CabinClassSelect({ value, onChange }: CabinClassSelectProps) {
  const { t } = useTranslation()
  const id = useId()

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
        {t('search.form.cabin.label')}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as CabinClass)}
        className="h-9 rounded-md border border-border bg-canvas px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
      >
        {CABINS.map((cabin) => (
          <option key={cabin.value} value={cabin.value}>
            {t(cabin.labelKey)}
          </option>
        ))}
      </select>
    </div>
  )
}
