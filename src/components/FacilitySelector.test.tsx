/**
 * FacilitySelector Component Tests
 *
 * Tests the 3-step EPA API flow:
 * 1. State selection → GET /facilities-mgmt/facilities?stateCode=XX
 * 2. Facility selection → GET /monitor-plan-mgmt/configurations?orisCodes=N
 * 3. Plan selection → GET /plans/export?planId=XXX&reportedValuesOnly=true
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FacilitySelector } from './FacilitySelector'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Sample API responses based on real EPA API structure
const mockFacilitiesResponse = {
  items: [
    { facilityId: 3, facilityName: 'Barry', stateCode: 'AL' },
    { facilityId: 5, facilityName: 'Chickasaw', stateCode: 'AL' },
    { facilityId: 7, facilityName: 'Gadsden', stateCode: 'AL' },
  ],
}

const mockConfigurationsResponse = {
  items: [
    {
      id: 'MDC-0AD77532C61345C6B50CBC80ADA1A3E1',
      facilityName: 'Barry',
      orisCode: 3,
      name: '1, 2, 3, CS0AAN',
      active: true,
    },
    {
      id: 'TWCORNEL5-C0E3879920A14159BAA98E03F1980A7A',
      facilityName: 'Barry',
      orisCode: 3,
      name: '4, 5',
      active: true,
    },
    {
      id: 'INACTIVE-PLAN-123',
      facilityName: 'Barry',
      orisCode: 3,
      name: 'Old Plan',
      active: false, // Should be filtered out
    },
  ],
}

const mockPlanExportResponse = {
  id: 'MDC-0AD77532C61345C6B50CBC80ADA1A3E1',
  orisCode: 3,
  facilityName: 'Barry',
  monitoringLocationData: [
    { id: 'loc1', unitId: '1', name: 'Unit 1' },
    { id: 'loc2', unitId: '2', name: 'Unit 2' },
  ],
  monitoringMethodData: [
    { parameterCode: 'SO2', methodCode: 'CEM' },
    { parameterCode: 'NOX', methodCode: 'CEM' },
    { parameterCode: 'CO2', methodCode: 'CEM' },
    { parameterCode: 'FLOW', methodCode: 'CEM' },
  ],
  monitoringSystemData: [
    { systemTypeCode: 'SO2', systemDesignationCode: 'P' },
    { systemTypeCode: 'NOX', systemDesignationCode: 'P' },
    { systemTypeCode: 'FLOW', systemDesignationCode: 'P' },
  ],
}

const mockFacilityAttributesResponse = {
  items: [
    {
      unitId: '1',
      programCodeInfo: 'ARP, CSNOX',
      primaryFuelInfo: 'Pipeline Natural Gas',
      secondaryFuelInfo: null,
      unitType: 'Combined cycle',
      so2ControlInfo: null,
      noxControlInfo: 'Low NOx Burner',
      pmControlInfo: null,
      hgControlInfo: null,
      maxHourlyHIRate: 2000,
      operatingStatus: 'Operating',
      epaRegion: 4,
      sourceCategory: 'Electric Utility',
    },
  ],
}

describe('FacilitySelector', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let onSelectionChange: any

  beforeEach(() => {
    onSelectionChange = vi.fn()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Helper to set up mocks for tests that go past state selection
  // When facility is selected, we make 2 parallel calls: configurations + attributes
  const setupFacilitySelectMocks = (): void => {
    mockFetch.mockImplementation((url: string) => {
      // Facilities list by state - URL includes pagination params
      if (url.includes('/facilities-mgmt/facilities') && url.includes('stateCode=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFacilitiesResponse),
        })
      }
      if (url.includes('configurations?orisCodes=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockConfigurationsResponse),
        })
      }
      if (url.includes('facilities/attributes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFacilityAttributesResponse),
        })
      }
      if (url.includes('plans/export')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPlanExportResponse),
        })
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`))
    })
  }

  describe('Initial Render', () => {
    it('renders all steps', () => {
      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      expect(screen.getByText('Select Facility')).toBeInTheDocument()
      expect(screen.getByText('EPA API Key')).toBeInTheDocument()
      expect(screen.getByText('Select State')).toBeInTheDocument()
    })

    it('disables state select until API key is entered', () => {
      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      const stateSelect = screen.getByTitle('Select a US state')
      expect(stateSelect).toBeDisabled()
    })

    it('enables state select when API key is entered', () => {
      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } })

      const stateSelect = screen.getByTitle('Select a US state')
      expect(stateSelect).not.toBeDisabled()
    })
  })

  describe('Step 1: Load Facilities by State', () => {
    it('fetches facilities when state is selected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilitiesResponse,
      })

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      // Enter API key
      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } })

      // Select state
      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('facilities-mgmt/facilities'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'x-api-key': 'test-api-key',
            }),
          })
        )
      })
    })

    it('displays facilities in dropdown after loading', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilitiesResponse,
      })

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } })

      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      await waitFor(() => {
        expect(screen.getByText(/Barry \(ORIS: 3\)/)).toBeInTheDocument()
        expect(screen.getByText(/Chickasaw \(ORIS: 5\)/)).toBeInTheDocument()
        expect(screen.getByText(/Gadsden \(ORIS: 7\)/)).toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      })

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'bad-api-key' } })

      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      // Use getAllByText since error appears in both the error display and log
      await waitFor(() => {
        expect(screen.getAllByText(/API error: 403/).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Step 2: Load Plan Configurations', () => {
    it('fetches configurations when facility is selected', async () => {
      setupFacilitySelectMocks()

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      // Enter API key and select state
      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } })

      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      // Wait for facilities to load, then select one
      await waitFor(() => {
        expect(screen.getByTitle('Select a facility')).toBeInTheDocument()
      })

      const facilitySelect = screen.getByTitle('Select a facility')
      fireEvent.change(facilitySelect, { target: { value: '3' } })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('configurations?orisCodes=3'),
          expect.any(Object)
        )
      })
    })

    it('only shows active monitoring plans', async () => {
      setupFacilitySelectMocks()

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } })

      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      await waitFor(() => {
        expect(screen.getByTitle('Select a facility')).toBeInTheDocument()
      })

      const facilitySelect = screen.getByTitle('Select a facility')
      fireEvent.change(facilitySelect, { target: { value: '3' } })

      await waitFor(() => {
        // Active plans should be shown
        expect(screen.getByText('1, 2, 3, CS0AAN')).toBeInTheDocument()
        expect(screen.getByText('4, 5')).toBeInTheDocument()
        // Inactive plan should NOT be shown
        expect(screen.queryByText('Old Plan')).not.toBeInTheDocument()
      })
    })

    it('includes API key in configurations request', async () => {
      setupFacilitySelectMocks()

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'my-secret-key' } })

      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      await waitFor(() => {
        expect(screen.getByTitle('Select a facility')).toBeInTheDocument()
      })

      const facilitySelect = screen.getByTitle('Select a facility')
      fireEvent.change(facilitySelect, { target: { value: '3' } })

      await waitFor(() => {
        // Check that a call was made with the API key
        const configsCall = mockFetch.mock.calls.find(
          (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('configurations')
        )
        expect(configsCall).toBeDefined()
        expect(
          (configsCall?.[1] as { headers: Record<string, string> })?.headers?.['x-api-key']
        ).toBe('my-secret-key')
      })
    })
  })

  describe('Step 3: Export Full Plan', () => {
    it('fetches full plan when plan is selected', async () => {
      setupFacilitySelectMocks()

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      // Step 1: API key + state
      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } })
      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      // Step 2: Select facility
      await waitFor(() => {
        expect(screen.getByTitle('Select a facility')).toBeInTheDocument()
      })
      const facilitySelect = screen.getByTitle('Select a facility')
      fireEvent.change(facilitySelect, { target: { value: '3' } })

      // Step 3: Select plan
      await waitFor(() => {
        expect(screen.getByText('1, 2, 3, CS0AAN')).toBeInTheDocument()
      })
      const planButton = screen.getByText('1, 2, 3, CS0AAN')
      fireEvent.click(planButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('plans/export'),
          expect.any(Object)
        )
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('reportedValuesOnly=true'),
          expect.any(Object)
        )
      })
    })

    it('calls onSelectionChange with full plan data', async () => {
      setupFacilitySelectMocks()

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      // Complete all steps
      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } })
      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      await waitFor(() => {
        expect(screen.getByTitle('Select a facility')).toBeInTheDocument()
      })
      const facilitySelect = screen.getByTitle('Select a facility')
      fireEvent.change(facilitySelect, { target: { value: '3' } })

      await waitFor(() => {
        expect(screen.getByText('1, 2, 3, CS0AAN')).toBeInTheDocument()
      })
      const planButton = screen.getByText('1, 2, 3, CS0AAN')
      fireEvent.click(planButton)

      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const lastCall = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1][0]
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(lastCall.fullPlan).not.toBeNull()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(lastCall.fullPlan.data).toEqual(mockPlanExportResponse)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(lastCall.orisCode).toBe(3)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(lastCall.facilityName).toBe('Barry')
      })
    })

    it('shows success summary when plan is loaded', async () => {
      setupFacilitySelectMocks()

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } })
      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      await waitFor(() => {
        expect(screen.getByTitle('Select a facility')).toBeInTheDocument()
      })
      const facilitySelect = screen.getByTitle('Select a facility')
      fireEvent.change(facilitySelect, { target: { value: '3' } })

      await waitFor(() => {
        expect(screen.getByText('1, 2, 3, CS0AAN')).toBeInTheDocument()
      })
      const planButton = screen.getByText('1, 2, 3, CS0AAN')
      fireEvent.click(planButton)

      // Wait for loading to complete and summary to appear
      await waitFor(
        () => {
          expect(screen.getByText(/Ready:/)).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
      // Check summary shows facility name and plan name in context
      const summary = screen.getByText(/Ready:/)
      expect(summary.parentElement?.textContent).toContain('Barry')
      expect(summary.parentElement?.textContent).toContain('bytes')
    })
  })

  describe('Start Over', () => {
    it('clears all state when Start Over is clicked', async () => {
      // First call: facilities for state
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilitiesResponse,
      })
      // When facility is selected, setupFacilitySelectMocks handles parallel calls
      setupFacilitySelectMocks()

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } })
      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      await waitFor(() => {
        expect(screen.getByTitle('Select a facility')).toBeInTheDocument()
      })
      const facilitySelect = screen.getByTitle('Select a facility')
      fireEvent.change(facilitySelect, { target: { value: '3' } })

      await waitFor(() => {
        expect(screen.getByText('1, 2, 3, CS0AAN')).toBeInTheDocument()
      })

      // Click Start Over
      const startOverBtn = screen.getByText('↩ Start Over')
      fireEvent.click(startOverBtn)

      // Plans should be gone
      expect(screen.queryByText('1, 2, 3, CS0AAN')).not.toBeInTheDocument()
      // Facility dropdown should be gone (no facilities loaded)
      expect(screen.queryByTitle('Select a facility')).not.toBeInTheDocument()
    })
  })

  describe('Activity Log', () => {
    it('logs API activity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilitiesResponse,
      })

      render(<FacilitySelector onSelectionChange={onSelectionChange} />)

      const apiKeyInput = screen.getByPlaceholderText('Enter your EPA API key')
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } })

      const stateSelect = screen.getByTitle('Select a US state')
      fireEvent.change(stateSelect, { target: { value: 'AL' } })

      await waitFor(() => {
        expect(screen.getByText(/Loading facilities for AL/)).toBeInTheDocument()
        expect(screen.getByText(/Found 3 facilities in AL/)).toBeInTheDocument()
      })
    })
  })
})
