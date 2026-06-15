import { useTranslation } from 'react-i18next'

interface ResultsSkeletonProps {
  rows?: number
}

/** Skeleton placeholder rows shown while offers are loading (not a spinner). */
export function ResultsSkeleton({ rows = 5 }: ResultsSkeletonProps) {
  const { t } = useTranslation()
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-2">
      <span className="sr-only">{t('search.results.loading')}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-canvas p-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 animate-pulse rounded-full bg-hover" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-40 animate-pulse rounded bg-hover" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-hover" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-4 w-20 animate-pulse rounded bg-hover" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-hover" />
          </div>
        </div>
      ))}
    </div>
  )
}
