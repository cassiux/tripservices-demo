import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { queryClient } from '@/lib/query/queryClient'

import '@/lib/i18n'
import '@/globals.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

console.log('user:', import.meta.env.VITE_TRIPSERVICES_USERNAME)
console.log('pw length:', import.meta.env.VITE_TRIPSERVICES_PASSWORD?.length)
console.log('pw start:', import.meta.env.VITE_TRIPSERVICES_PASSWORD?.slice(0, 3))

console.log({
  authUrl: import.meta.env.VITE_TRIPSERVICES_AUTH_URL,
  username: import.meta.env.VITE_TRIPSERVICES_USERNAME,
  pwLength: import.meta.env.VITE_TRIPSERVICES_PASSWORD?.length,
  clientId: import.meta.env.VITE_TRIPSERVICES_CLIENT_ID?.slice(0, 4),
  accessGroup: import.meta.env.VITE_TRIPSERVICES_ACCESS_GROUP?.slice(0, 4),
})