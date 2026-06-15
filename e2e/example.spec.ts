import { expect, test } from '@playwright/test'

test('app shell renders the topbar and primary navigation', async ({ page }) => {
  await page.goto('/')

  // Primary nav is present and the index route lands on Queues.
  await expect(page.getByRole('link', { name: 'Queues' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Search' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Queues', level: 1 })).toBeVisible()
})
