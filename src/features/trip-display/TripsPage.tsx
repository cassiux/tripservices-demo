import { useTranslation } from 'react-i18next'

export function TripsPage() {
  const { t } = useTranslation()

  return (
    <section className="p-6">
      <h1 className="text-lg font-semibold text-fg-primary">{t('pages.trips.title')}</h1>
      <p className="mt-1 text-sm text-fg-muted">{t('pages.trips.subtitle')}</p>
    </section>
  )
}
