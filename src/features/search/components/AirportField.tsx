import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { useAirportSearch } from '../useAirportSearch'
import type { Airport } from '../airports'

interface AirportFieldProps {
  label: string
  placeholder: string
  value: Airport | null
  onChange: (value: Airport | null) => void
  error?: string
  /** Visually hide the label (still read by screen readers) for compact rows. */
  hideLabel?: boolean
}

function formatAirport(airport: Airport): string {
  return `${airport.iata} · ${airport.city}`
}

/**
 * Origin/destination typeahead. ARIA 1.2 combobox: debounced lookup, listbox of
 * options, full keyboard support (Arrow keys, Enter, Escape) and
 * `aria-activedescendant` tracking. Selecting an option commits a full `Airport`;
 * editing the text after selecting invalidates it (`onChange(null)`).
 */
export function AirportField({
  label,
  placeholder,
  value,
  onChange,
  error,
  hideLabel,
}: AirportFieldProps) {
  const { t } = useTranslation()
  const reactId = useId()
  const inputId = `${reactId}-input`
  const listId = `${reactId}-list`
  const errorId = `${reactId}-error`

  const [text, setText] = useState(() => (value ? formatAirport(value) : ''))
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)

  const { results, isLoading } = useAirportSearch(open ? text : '')

  // Sync the displayed text when the selected value changes from outside (e.g. swap).
  const appliedValueRef = useRef<Airport | null>(value)
  useEffect(() => {
    if (value && value !== appliedValueRef.current) {
      appliedValueRef.current = value
      setText(formatAirport(value))
    } else if (!value) {
      appliedValueRef.current = null
    }
  }, [value])

  function commit(airport: Airport) {
    setText(formatAirport(airport))
    onChange(airport)
    setOpen(false)
    setHighlighted(-1)
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setText(event.target.value)
    setOpen(true)
    setHighlighted(-1)
    if (value) onChange(null)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setOpen(true)
        setHighlighted((index) => Math.min(index + 1, results.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlighted((index) => Math.max(index - 1, 0))
        break
      case 'Enter':
        if (open && highlighted >= 0 && results[highlighted]) {
          event.preventDefault()
          commit(results[highlighted])
        }
        break
      case 'Escape':
        setOpen(false)
        setHighlighted(-1)
        break
      default:
        break
    }
  }

  const showList = open && text.trim().length >= 2
  const activeOptionId = highlighted >= 0 ? `${listId}-opt-${highlighted}` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={cn(
          'text-xs font-semibold uppercase tracking-wider text-fg-subtle',
          hideLabel && 'sr-only',
        )}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={activeOptionId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={text}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className={cn(
            'h-9 w-full rounded-md border bg-canvas px-3 text-sm text-fg-primary placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1',
            error ? 'border-destructive' : 'border-border',
          )}
        />
        {showList && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-canvas py-1 shadow-sm"
          >
            {isLoading && (
              <li className="px-3 py-2 text-sm text-fg-subtle" aria-disabled="true">
                {t('search.airport.searching')}
              </li>
            )}
            {!isLoading && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-fg-subtle" aria-disabled="true">
                {t('search.airport.noResults')}
              </li>
            )}
            {!isLoading &&
              results.map((airport, index) => (
                <li
                  key={airport.iata}
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={index === highlighted}
                  // Keep focus on the input so blur doesn't fire before the click.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(airport)}
                  onMouseEnter={() => setHighlighted(index)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-sm',
                    index === highlighted ? 'bg-hover' : 'bg-canvas',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-fg-primary">{airport.iata}</span>
                    <span className="text-fg-secondary">{airport.city}</span>
                  </span>
                  <span className="truncate text-xs text-fg-subtle">{airport.name}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
