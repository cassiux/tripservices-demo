import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** App frame: topbar + sidebar + routed main content area. */
export function AppShell() {
  const { t } = useTranslation()

  return (
    <div className="flex h-screen flex-col bg-canvas text-fg-secondary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-canvas focus:px-3 focus:py-1.5 focus:text-sm focus:ring-2 focus:ring-brand"
      >
        {t('common.skipToContent')}
      </a>
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 overflow-auto bg-canvas focus:outline-none"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
