import { expect, test } from '@playwright/test'

test.describe('RegsBot Compliance Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents/regs')
  })

  test('displays RegsBot page with facility selector', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /regsbot/i })).toBeVisible()
    // Use more specific selector - look for the step label
    await expect(page.getByText('Select State')).toBeVisible()
  })

  test('shows state dropdown with options', async ({ page }) => {
    const stateSelect = page.getByLabel('Select a US state')
    await expect(stateSelect).toBeVisible()

    // Wait for states to load (may need API key)
    // Skip click test since dropdown may be disabled without API key
  })

  test.describe('Facility Selection Flow', () => {
    test.skip('three-step selection: state → facility → plan', async ({ page }) => {
      // Skip this test - requires API key and live ECMPS access
      // Will be enabled once we have proper test fixtures
      const stateSelect = page.getByLabel('Select a US state')
      await stateSelect.selectOption('TX')
      await expect(page.getByText(/facility/i)).toBeVisible()
    })
  })
})

test.describe('Compliance Report Display', () => {
  // These tests assume we have a way to inject a mock report
  // or navigate to a state with a pre-generated report

  test.describe('Report Sections', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to RegsBot with a test facility
      await page.goto('/agents/regs')
      // TODO: Select a test facility and generate report
      // For now, these are placeholder tests for the structure
    })

    test.skip('displays summary statistics', async ({ page }) => {
      // After generating a report, verify stats
      await expect(page.getByText(/parameters/i)).toBeVisible()
      await expect(page.getByText(/methods/i)).toBeVisible()
      await expect(page.getByText(/calculations/i)).toBeVisible()
    })

    test.skip('shows applicable regulations section', async ({ page }) => {
      await expect(page.getByText(/applicable regulations/i)).toBeVisible()
      // Check for regulation badges (ARP, CSAPR, MATS, etc.)
    })

    test.skip('shows monitoring requirements section', async ({ page }) => {
      await expect(page.getByText(/monitoring requirements/i)).toBeVisible()
    })

    test.skip('shows QA test matrix section', async ({ page }) => {
      await expect(page.getByText(/qa.*test/i)).toBeVisible()
    })

    test.skip('shows calculation requirements section', async ({ page }) => {
      await expect(page.getByText(/calculation/i)).toBeVisible()
    })

    test.skip('sections are collapsible', async ({ page }) => {
      // Find a section header and click to collapse
      const sectionButton = page.getByRole('button', { name: /applicable regulations/i })
      await sectionButton.click()
      // Verify content is hidden
    })
  })
})

test.describe('RegsBot to RequirementsBot Handoff', () => {
  test('navigates to RequirementsBot page', async ({ page }) => {
    await page.goto('/agents/requirements')
    await expect(page.getByRole('heading', { name: /requirementsbot/i })).toBeVisible()
  })

  test.skip('Send to RequirementsBot button appears after report generation', async ({ page }) => {
    await page.goto('/agents/regs')
    // Generate a report first
    // Then check for the button
    await expect(page.getByRole('button', { name: /send to requirementsbot/i })).toBeVisible()
  })

  test.skip('clicking Send to RequirementsBot navigates with context', async ({ page }) => {
    await page.goto('/agents/regs')
    // Generate report, then click button
    await page.getByRole('button', { name: /send to requirementsbot/i }).click()

    // Should navigate to RequirementsBot
    await expect(page).toHaveURL(/\/agents\/requirements/)

    // Should show gap analysis results
    await expect(page.getByText(/gap analysis/i)).toBeVisible()
  })
})

test.describe('RequirementsBot Gap Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents/requirements')
  })

  test('shows empty state without context', async ({ page }) => {
    await expect(page.getByText(/no compliance report/i)).toBeVisible()
  })

  test('displays link to RegsBot in empty state', async ({ page }) => {
    // When no context is provided, shows "Go to RegsBot" link
    await expect(page.getByRole('link', { name: /go to regsbot/i })).toBeVisible()
  })

  test.skip('with context, shows gap analysis summary', async ({ page }) => {
    // Would need to navigate from RegsBot with context
    await expect(page.getByText(/fully supported/i)).toBeVisible()
    await expect(page.getByText(/config required/i)).toBeVisible()
    await expect(page.getByText(/development needed/i)).toBeVisible()
  })

  test.skip('gap items can be filtered by status', async ({ page }) => {
    // Click on a status card to filter
    await page.getByText(/fully supported/i).click()
    // Verify filter is active
    await expect(page.getByText(/showing.*fully supported/i)).toBeVisible()
  })
})

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents/regs')
  })

  test('chat input is visible', async ({ page }) => {
    await expect(page.getByPlaceholder(/ask.*question/i)).toBeVisible()
  })

  test('can type in chat input', async ({ page }) => {
    const input = page.getByPlaceholder(/ask.*question/i)
    await input.fill('What regulations apply to this facility?')
    await expect(input).toHaveValue('What regulations apply to this facility?')
  })

  test.skip('suggested questions appear after facility selection', async ({ page }) => {
    // After selecting a facility, suggested questions should appear
    await expect(page.getByText(/what monitoring.*required/i)).toBeVisible()
  })
})
