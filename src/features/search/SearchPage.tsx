import { useTranslation } from 'react-i18next'

export function SearchPage() {
  const { t } = useTranslation()

  return (
    <section className="p-6">
      <h1 className="text-lg font-semibold text-fg-primary">{t('pages.search.title')}</h1>
      <p className="mt-1 text-sm text-fg-muted">{t('pages.search.subtitle')}</p>
    </section>
  )
}
