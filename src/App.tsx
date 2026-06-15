import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { ProfilesPage } from '@/features/profiles/ProfilesPage'
import { QueuesPage } from '@/features/queue-management/QueuesPage'
import { SearchPage } from '@/features/search/SearchPage'
import { TripsPage } from '@/features/trip-display/TripsPage'
import { ROUTES } from '@/lib/constants'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to={ROUTES.QUEUES} replace />} />
          <Route path={ROUTES.QUEUES} element={<QueuesPage />} />
          <Route path={ROUTES.SEARCH} element={<SearchPage />} />
          <Route path={ROUTES.TRIPS} element={<TripsPage />} />
          <Route path={ROUTES.PROFILES} element={<ProfilesPage />} />
          <Route path="*" element={<Navigate to={ROUTES.QUEUES} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
