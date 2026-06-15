import { ArrowLeftRight, Plus, Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { findAirport, type Airport } from '../airports'
import type { CabinClass, PassengerCounts, SearchCriteria, TripType } from '../types'
import { AirportField } from './AirportField'
import { CabinClassSelect } from './CabinClassSelect'
import { PassengerSelector } from './PassengerSelector'
import { TripTypeToggle } from './TripTypeToggle'

interface SearchFormProps {
  onSearch: (criteria: SearchCriteria) => void
  /** When set (and changed by reference) the form hydrates from it, e.g. re-running a recent search. */
  initialCriteria?: SearchCriteria | null
  isSearching?: boolean
}

interface MultiRow {
  origin: Airport | null
  destination: Airport | null
  date: string
}

const MIN_MULTI_ROWS = 2
const MAX_MULTI_ROWS = 6

const DEFAULT_PASSENGERS: PassengerCounts = { ADT: 1, CHD: 0, INF: 0 }

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyRow(): MultiRow {
  return { origin: null, destination: null, date: '' }
}

/** Labelled native date input (browser calendar UI). */
function DateInput({
  label,
  value,
  min,
  error,
  onChange,
}: {
  label: string
  value: string
  min: string
  error?: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-9 rounded-md border bg-canvas px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1',
          error ? 'border-destructive' : 'border-border',
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Air-shopping criteria form. Supports one-way, return and multi-city itineraries
 * with airport typeahead, calendar date inputs, passenger party and cabin. Validates
 * on submit and emits a fully-formed `SearchCriteria`.
 */
export function SearchForm({ onSearch, initialCriteria, isSearching }: SearchFormProps) {
  const { t } = useTranslation()
  const today = useMemo(todayIso, [])

  const [tripType, setTripType] = useState<TripType>('oneWay')
  const [origin, setOrigin] = useState<Airport | null>(null)
  const [destination, setDestination] = useState<Airport | null>(null)
  const [departDate, setDepartDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [multi, setMulti] = useState<MultiRow[]>(() => [emptyRow(), emptyRow()])
  const [passengers, setPassengers] = useState<PassengerCounts>(DEFAULT_PASSENGERS)
  const [cabinClass, setCabinClass] = useState<CabinClass>('Economy')
  const [fareBasis, setFareBasis] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fareBasisId = useId()

  // Hydrate the form when an initial criteria is supplied (re-run a recent search).
  useEffect(() => {
    if (!initialCriteria) return
    setTripType(initialCriteria.tripType)
    setPassengers(initialCriteria.passengers)
    setCabinClass(initialCriteria.cabinClass)
    setFareBasis(initialCriteria.fareBasis ?? '')
    setErrors({})

    const segments = initialCriteria.segments
    if (initialCriteria.tripType === 'multiCity') {
      setMulti(
        segments.map((segment) => ({
          origin: findAirport(segment.origin) ?? null,
          destination: findAirport(segment.destination) ?? null,
          date: segment.date,
        })),
      )
    } else {
      const [outbound, inbound] = segments
      setOrigin(findAirport(outbound.origin) ?? null)
      setDestination(findAirport(outbound.destination) ?? null)
      setDepartDate(outbound.date)
      setReturnDate(inbound?.date ?? '')
    }
  }, [initialCriteria])

  function swap() {
    setOrigin(destination)
    setDestination(origin)
  }

  function updateRow(index: number, patch: Partial<MultiRow>) {
    setMulti((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function swapRow(index: number) {
    setMulti((rows) =>
      rows.map((row, i) =>
        i === index ? { ...row, origin: row.destination, destination: row.origin } : row,
      ),
    )
  }

  function addRow() {
    setMulti((rows) => (rows.length >= MAX_MULTI_ROWS ? rows : [...rows, emptyRow()]))
  }

  function removeRow(index: number) {
    setMulti((rows) => (rows.length <= MIN_MULTI_ROWS ? rows : rows.filter((_, i) => i !== index)))
  }

  function validate(): { criteria: SearchCriteria | null; errors: Record<string, string> } {
    const next: Record<string, string> = {}

    if (tripType === 'multiCity') {
      multi.forEach((row, index) => {
        if (!row.origin) next[`multi.${index}.origin`] = t('search.form.errors.originRequired')
        if (!row.destination)
          next[`multi.${index}.destination`] = t('search.form.errors.destinationRequired')
        if (row.origin && row.destination && row.origin.iata === row.destination.iata)
          next[`multi.${index}.destination`] = t('search.form.errors.sameAirport')
        if (!row.date) next[`multi.${index}.date`] = t('search.form.errors.dateRequired')
        else if (row.date < today) next[`multi.${index}.date`] = t('search.form.errors.datePast')
      })

      if (Object.keys(next).length > 0) return { criteria: null, errors: next }

      return {
        errors: next,
        criteria: {
          tripType,
          passengers,
          cabinClass,
          fareBasis: fareBasis.trim() || undefined,
          segments: multi.map((row) => ({
            origin: row.origin!.iata,
            destination: row.destination!.iata,
            date: row.date,
          })),
        },
      }
    }

    if (!origin) next.origin = t('search.form.errors.originRequired')
    if (!destination) next.destination = t('search.form.errors.destinationRequired')
    if (origin && destination && origin.iata === destination.iata)
      next.destination = t('search.form.errors.sameAirport')
    if (!departDate) next.departDate = t('search.form.errors.dateRequired')
    else if (departDate < today) next.departDate = t('search.form.errors.datePast')

    if (tripType === 'return') {
      if (!returnDate) next.returnDate = t('search.form.errors.dateRequired')
      else if (departDate && returnDate < departDate)
        next.returnDate = t('search.form.errors.returnBeforeDepart')
    }

    if (Object.keys(next).length > 0) return { criteria: null, errors: next }

    const segments = [{ origin: origin!.iata, destination: destination!.iata, date: departDate }]
    if (tripType === 'return') {
      segments.push({ origin: destination!.iata, destination: origin!.iata, date: returnDate })
    }

    return {
      errors: next,
      criteria: {
        tripType,
        passengers,
        cabinClass,
        fareBasis: fareBasis.trim() || undefined,
        segments,
      },
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const { criteria, errors: nextErrors } = validate()
    setErrors(nextErrors)
    if (criteria) onSearch(criteria)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <TripTypeToggle value={tripType} onChange={setTripType} />
      </div>

      {tripType === 'multiCity' ? (
        <div className="flex flex-col gap-3">
          {multi.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr_auto_auto]"
            >
              <AirportField
                label={t('search.form.origin')}
                placeholder={t('search.form.originPlaceholder')}
                value={row.origin}
                onChange={(airport) => updateRow(index, { origin: airport })}
                error={errors[`multi.${index}.origin`]}
              />
              <button
                type="button"
                aria-label={t('search.form.swap')}
                onClick={() => swapRow(index)}
                className="mb-0.5 hidden h-9 w-9 items-center justify-center self-end rounded-md border border-border text-fg-muted hover:bg-hover focus:outline-none focus:ring-2 focus:ring-brand md:flex"
              >
                <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <AirportField
                label={t('search.form.destination')}
                placeholder={t('search.form.destinationPlaceholder')}
                value={row.destination}
                onChange={(airport) => updateRow(index, { destination: airport })}
                error={errors[`multi.${index}.destination`]}
              />
              <DateInput
                label={t('search.form.segmentDate')}
                value={row.date}
                min={today}
                error={errors[`multi.${index}.date`]}
                onChange={(date) => updateRow(index, { date })}
              />
              <button
                type="button"
                aria-label={t('search.form.removeSegment')}
                disabled={multi.length <= MIN_MULTI_ROWS}
                onClick={() => removeRow(index)}
                className="mb-0.5 flex h-9 w-9 items-center justify-center self-end rounded-md border border-border text-fg-muted hover:bg-hover focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-canvas"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={addRow}
              disabled={multi.length >= MAX_MULTI_ROWS}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg-secondary hover:bg-hover focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('search.form.addSegment')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr_auto_auto]">
          <AirportField
            label={t('search.form.origin')}
            placeholder={t('search.form.originPlaceholder')}
            value={origin}
            onChange={setOrigin}
            error={errors.origin}
          />
          <button
            type="button"
            aria-label={t('search.form.swap')}
            onClick={swap}
            className="mb-0.5 hidden h-9 w-9 items-center justify-center self-end rounded-md border border-border text-fg-muted hover:bg-hover focus:outline-none focus:ring-2 focus:ring-brand md:flex"
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <AirportField
            label={t('search.form.destination')}
            placeholder={t('search.form.destinationPlaceholder')}
            value={destination}
            onChange={setDestination}
            error={errors.destination}
          />
          <DateInput
            label={t('search.form.departDate')}
            value={departDate}
            min={today}
            error={errors.departDate}
            onChange={setDepartDate}
          />
          {tripType === 'return' && (
            <DateInput
              label={t('search.form.returnDate')}
              value={returnDate}
              min={departDate || today}
              error={errors.returnDate}
              onChange={setReturnDate}
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <PassengerSelector value={passengers} onChange={setPassengers} />
        <CabinClassSelect value={cabinClass} onChange={setCabinClass} />
        <div className="flex flex-col gap-1">
          <label
            htmlFor={fareBasisId}
            className="text-xs font-semibold uppercase tracking-wider text-fg-subtle"
          >
            {t('search.form.fareBasis.label')}{' '}
            <span className="font-normal normal-case tracking-normal text-fg-subtle">
              ({t('search.form.fareBasis.optional')})
            </span>
          </label>
          <input
            id={fareBasisId}
            type="text"
            value={fareBasis}
            onChange={(event) => setFareBasis(event.target.value)}
            placeholder={t('search.form.fareBasis.placeholder')}
            className="h-9 w-36 rounded-md border border-border bg-canvas px-3 text-sm uppercase text-fg-primary placeholder:normal-case placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="ml-auto inline-flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-pressed focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-60"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {isSearching ? t('search.form.searching') : t('search.form.submit')}
        </button>
      </div>
    </form>
  )
}
