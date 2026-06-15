import '@testing-library/jest-dom/vitest'

// Initialise i18n once for the whole test run so components resolve translation keys.
import '@/lib/i18n'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Reset the DOM between tests.
afterEach(() => {
  cleanup()
})
