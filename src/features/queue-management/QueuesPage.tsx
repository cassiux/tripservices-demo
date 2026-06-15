import { useTranslation } from 'react-i18next'

export function QueuesPage() {
  const { t } = useTranslation()

  return (
    <section className="p-6">
      <h1 className="text-lg font-semibold text-fg-primary">{t('pages.queues.title')}</h1>
      <p className="mt-1 text-sm text-fg-muted">{t('pages.queues.subtitle')}</p>
    </section>
  )
}
