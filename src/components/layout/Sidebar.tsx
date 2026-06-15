import { ListChecks, Plane, Search, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  labelKey: string
  icon: LucideIcon
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: ROUTES.QUEUES, labelKey: 'nav.queues', icon: ListChecks },
  { to: ROUTES.SEARCH, labelKey: 'nav.search', icon: Search },
  { to: ROUTES.TRIPS, labelKey: 'nav.trips', icon: Plane },
  { to: ROUTES.PROFILES, labelKey: 'nav.profiles', icon: Users },
]

/** Primary navigation. Active item: left brand border + selected tint (per design system). */
export function Sidebar() {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t('nav.primary')}
      className="w-56 shrink-0 border-r border-border bg-surface py-2"
    >
      <ul className="flex flex-col">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 border-l-2 px-4 py-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                  isActive
                    ? 'border-brand bg-selected text-fg-primary'
                    : 'border-transparent text-fg-muted hover:bg-hover',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
