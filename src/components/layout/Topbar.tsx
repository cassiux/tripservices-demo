import { useTranslation } from 'react-i18next'

import logoUrl from '@/assets/travelport-logo.svg'

/** White 44px topbar with the Travelport logo in the top-left (no background tint). */
export function Topbar() {
  const { t } = useTranslation()

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-canvas px-4">
      <img src={logoUrl} alt={t('topbar.logoAlt')} className="h-6 w-6 select-none" />
      <span className="text-sm font-semibold text-fg-primary">{t('app.name')}</span>
    </header>
  )
}
