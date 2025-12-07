import { expect, test } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/NERO/)
  })

  test('displays dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /NERO Agent Ecosystem/i })).toBeVisible()
  })

  test('shows all agent cards', async ({ page }) => {
    // Use more specific selectors to avoid matching both sidebar and card
    await expect(page.getByRole('heading', { name: 'RegsBot' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'RequirementsBot' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'FigmaBot' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'TestingBot' })).toBeVisible()
  })

  test('navigates to agent page on card click', async ({ page }) => {
    // Click the card heading, not just any text matching 'RegsBot'
    await page.getByRole('heading', { name: 'RegsBot' }).click()
    await expect(page).toHaveURL(/\/agents\/regs/)
    await expect(page.getByRole('heading', { name: /regsbot/i })).toBeVisible()
  })
})
