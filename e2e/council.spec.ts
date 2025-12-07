import { expect, test } from '@playwright/test'

test.describe('War Council', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/council')
  })

  test('displays war council page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /War Council/i })).toBeVisible()
  })

  test('shows council preset options', async ({ page }) => {
    await expect(page.getByText('Compliance Review Council')).toBeVisible()
    await expect(page.getByText('Feature Design Council')).toBeVisible()
    await expect(page.getByText('Adversarial Audit')).toBeVisible()
    await expect(page.getByText('Full War Council')).toBeVisible()
  })

  test('loads demo session', async ({ page }) => {
    await page.getByRole('button', { name: /Load Demo Session/i }).click()

    // Should show session details
    await expect(page.getByText('CSAPR Unit Implementation Review')).toBeVisible()
    await expect(page.getByText('in-progress')).toBeVisible()
  })

  test('shows transcript after loading demo', async ({ page }) => {
    await page.getByRole('button', { name: /Load Demo Session/i }).click()

    // Should show messages in transcript
    await expect(page.getByText(/I have reviewed the applicable regulations/i)).toBeVisible()
  })

  test('starts new session from preset', async ({ page }) => {
    // Click the first preset card
    await page.getByRole('button', { name: /Compliance Review Council/i }).click()

    // Should show session with that preset name
    await expect(page.getByText('Compliance Review Council')).toBeVisible()
  })

  test('navigates back to dashboard', async ({ page }) => {
    await page.getByRole('link', { name: /Back to Dashboard/i }).click()
    await expect(page).toHaveURL('/')
  })
})
