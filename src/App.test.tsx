import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/App'
import { queryClient } from '@/lib/query/queryClient'

describe('App shell', () => {
  it('renders the primary navigation and defaults to the Queues route', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('link', { name: 'Queues' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trips' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profiles' })).toBeInTheDocument()

    // The index route redirects to /queues, which renders the Queues page heading.
    expect(await screen.findByRole('heading', { name: 'Queues', level: 1 })).toBeInTheDocument()
  })
})
