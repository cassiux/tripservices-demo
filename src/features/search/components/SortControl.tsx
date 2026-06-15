import { ArrowDown, ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { SortKey, SortState } from '../types'

interface SortControlProps {
  value: SortState
  onChange: (value: SortState) => void
}

const KEYS: { key: SortKey; labelKey: string }[] = [
  { key: 'price', labelKey: 'search.results.sort.price' },
  { key: 'duration', labelKey: 'search.results.sort.duration' },
  { key: 'stops', labelKey: 'search.results.sort.stops' },
  { key: 'departure', labelKey: 'search.results.sort.departure' },
]

/** Sort toolbar. Clicking the active key flips direction; another key selects it ascending. */
export function SortControl({ value, onChange }: SortControlProps) {
  const { t } = useTranslation()

  function handleClick(key: SortKey) {
    if (key === value.key) {
      onChange({ key, direction: value.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      onChange({ key, direction: 'asc' })
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
        {t('search.results.sort.label')}
      </span>
      <div
        className="flex items-center gap-0.5"
        role="group"
        aria-label={t('search.results.sort.label')}
      >
        {KEYS.map(({ key, labelKey }) => {
          const active = key === value.key
          const Arrow = value.direction === 'asc' ? ArrowUp : ArrowDown
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => handleClick(key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand',
                active
                  ? 'bg-selected text-fg-primary'
                  : 'text-fg-muted hover:bg-hover hover:text-fg-secondary',
              )}
            >
              {t(labelKey)}
              {active && <Arrow className="h-3 w-3" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
