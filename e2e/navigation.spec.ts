import { expect, test } from '@playwright/test'

test.describe('Navigation', () => {
  test('sidebar navigation works correctly', async ({ page }) => {
    await page.goto('/')

    // Check sidebar is visible
    const sidebar = page.getByRole('navigation')
    await expect(sidebar).toBeVisible()

    // Navigate to each agent page
    await page.getByRole('link', { name: /regsbot/i }).click()
    await expect(page).toHaveURL(/\/agents\/regs/)

    await page.getByRole('link', { name: /requirementsbot/i }).click()
    await expect(page).toHaveURL(/\/agents\/requirements/)

    await page.getByRole('link', { name: /figmabot/i }).click()
    await expect(page).toHaveURL(/\/agents\/figma/)

    await page.getByRole('link', { name: /testingbot/i }).click()
    await expect(page).toHaveURL(/\/agents\/testing/)

    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('NERO branding is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('NERO', { exact: true })).toBeVisible()
  })

  test('system status indicator is shown', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('System Online')).toBeVisible()
  })
})
