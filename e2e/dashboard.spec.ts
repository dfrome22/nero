import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/NERO/)
  })

  test('displays dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('shows all agent cards', async ({ page }) => {
    await expect(page.getByText('RegsBot')).toBeVisible()
    await expect(page.getByText('RequirementsBot')).toBeVisible()
    await expect(page.getByText('FigmaBot')).toBeVisible()
    await expect(page.getByText('TestingBot')).toBeVisible()
  })

  test('navigates to agent page on card click', async ({ page }) => {
    await page.getByText('RegsBot').click()
    await expect(page).toHaveURL(/\/agents\/regs/)
    await expect(page.getByRole('heading', { name: /regsbot/i })).toBeVisible()
  })
})
