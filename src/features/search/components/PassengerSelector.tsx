import { Minus, Plus, Users } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { PassengerCounts, PassengerTypeCode } from '../types'

interface PassengerSelectorProps {
  value: PassengerCounts
  onChange: (value: PassengerCounts) => void
}

const MAX_TOTAL = 9

const ROWS: {
  code: PassengerTypeCode
  labelKey: string
  hintKey: string
  min: number
}[] = [
  { code: 'ADT', labelKey: 'search.form.pax.adult', hintKey: 'search.form.pax.adultHint', min: 1 },
  { code: 'CHD', labelKey: 'search.form.pax.child', hintKey: 'search.form.pax.childHint', min: 0 },
  {
    code: 'INF',
    labelKey: 'search.form.pax.infant',
    hintKey: 'search.form.pax.infantHint',
    min: 0,
  },
]

function total(counts: PassengerCounts): number {
  return counts.ADT + counts.CHD + counts.INF
}

/**
 * Passenger-party selector. A button summarising the party opens a popover of
 * per-type steppers (ADT/CHD/INF). Enforces at least one adult, no more infants
 * than adults, and a 9-passenger party cap. Closes on outside click or Escape.
 */
export function PassengerSelector({ value, onChange }: PassengerSelectorProps) {
  const { t } = useTranslation()
  const id = useId()
  const panelId = `${id}-panel`
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointer(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function update(code: PassengerTypeCode, delta: number) {
    const next: PassengerCounts = { ...value, [code]: value[code] + delta }
    onChange(next)
  }

  function canIncrement(code: PassengerTypeCode): boolean {
    if (total(value) >= MAX_TOTAL) return false
    // Infants are lap-held: never more infants than adults.
    if (code === 'INF' && value.INF >= value.ADT) return false
    return true
  }

  function canDecrement(code: PassengerTypeCode, min: number): boolean {
    if (value[code] <= min) return false
    // Removing an adult can't leave more infants than adults.
    if (code === 'ADT' && value.ADT - 1 < value.INF) return false
    return true
  }

  const partySize = total(value)

  return (
    <div className="relative flex flex-col gap-1" ref={containerRef}>
      <span className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
        {t('search.form.passengers')}
      </span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-canvas px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
      >
        <Users className="h-4 w-4 text-fg-muted" aria-hidden="true" />
        <span>{t('search.form.pax.summary', { count: partySize })}</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('search.form.passengers')}
          className="absolute top-full z-20 mt-1 w-72 rounded-lg border border-border bg-canvas p-3 shadow-sm"
        >
          <ul className="flex flex-col gap-3">
            {ROWS.map((row) => (
              <li key={row.code} className="flex items-center justify-between">
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-fg-secondary">{t(row.labelKey)}</span>
                  <span className="text-xs text-fg-subtle">{t(row.hintKey)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={t('search.form.pax.decrease', { type: t(row.labelKey) })}
                    disabled={!canDecrement(row.code, row.min)}
                    onClick={() => update(row.code, -1)}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-md border border-border text-fg-secondary transition-colors hover:bg-hover focus:outline-none focus:ring-2 focus:ring-brand',
                      'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-canvas',
                    )}
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold tabular-nums text-fg-primary">
                    {value[row.code]}
                  </span>
                  <button
                    type="button"
                    aria-label={t('search.form.pax.increase', { type: t(row.labelKey) })}
                    disabled={!canIncrement(row.code)}
                    onClick={() => update(row.code, 1)}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-md border border-border text-fg-secondary transition-colors hover:bg-hover focus:outline-none focus:ring-2 focus:ring-brand',
                      'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-canvas',
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                triggerRef.current?.focus()
              }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-brand hover:bg-hover focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {t('search.form.pax.done')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
