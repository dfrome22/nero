/**
 * RequirementsBot Page Tests
 *
 * Tests for the RequirementsBot page including:
 * - Basic rendering
 * - Receiving context from RegsBot via location state
 * - Running gap analysis on received ComplianceReport
 * - Displaying gap analysis results
 */

import type { ComplianceReport, RegsBotToRequirementsBotContext } from '@/types/orchestration'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RequirementsBot from './RequirementsBot'

// Mock the RequirementsBotService
const mockAnalyzeAllObligations = vi.fn().mockReturnValue([
  {
    id: 'gap-1',
    obligation: {
      id: 'obl-1',
      obligationType: 'monitoring',
      summary: 'SO2 monitoring using CEMS',
      regulatoryBasis: '40 CFR 75.10',
    },
    status: 'fully-supported',
    matchingCapabilityId: 'cap-cem-so2',
    notes: ['Fully supported by existing DAHS capability'],
  },
  {
    id: 'gap-2',
    obligation: {
      id: 'obl-2',
      obligationType: 'calculation',
      summary: 'Calculate hourly SO2 mass emissions',
      regulatoryBasis: '40 CFR 75 App F',
    },
    status: 'config-required',
    recommendedSolution: 'Configure F-1 calculation',
    notes: ['Capability exists but requires configuration'],
  },
  {
    id: 'gap-3',
    obligation: {
      id: 'obl-3',
      obligationType: 'reporting',
      summary: 'Custom report format',
      regulatoryBasis: '40 CFR 75.64',
    },
    status: 'not-supported',
    gapDescription: 'Custom report format not supported',
    recommendedSolution: 'Develop custom report generator',
    developmentEffort: 'moderate',
  },
])

vi.mock('@/agents/requirementsbot', () => ({
  RequirementsBotService: class MockRequirementsBotService {
    analyzeAllObligations = mockAnalyzeAllObligations
    generateProposal = vi.fn().mockReturnValue({
      permitId: 'FAC-001',
      dahsProfileId: 'default-profile',
      summary: {
        fullySupported: 1,
        configRequired: 1,
        partialSupport: 0,
        notSupported: 1,
        manualProcess: 0,
        needsReview: 0,
      },
    })
  },
}))

// Create a mock ComplianceReport
const mockComplianceReport: ComplianceReport = {
  facilityId: 'FAC-001',
  facilityName: 'Test Power Plant',
  orisCode: 12345,
  generatedAt: '2024-01-15T10:00:00Z',
  summary: {
    totalRegulations: 3,
    totalMonitoringParameters: 2,
    totalQATests: 2,
    totalCalculations: 1,
    totalReports: 1,
    totalLimits: 1,
    programs: ['ARP', 'MATS'],
    highlights: ['SO2 and NOx monitoring required'],
  },
  applicableRegulations: [],
  monitoringByParameter: [
    {
      parameter: 'SO2',
      displayName: 'Sulfur Dioxide',
      methods: [
        {
          methodCode: 'CEM',
          description: 'CEMS Monitoring',
          frequency: 'Hourly',
          dataQualityRequirements: '±2.5%',
          regulatoryBasis: '40 CFR 75.10',
          citationId: 'cite-1',
        },
      ],
    },
  ],
  qaTestMatrix: [],
  calculations: [
    {
      name: 'SO2 Mass Rate',
      description: 'Calculate hourly SO2 mass emissions',
      formula: 'K × Cs × Q',
      formulaCode: 'F-1',
      inputParameters: ['SO2', 'Flow'],
      outputParameter: 'SO2 Mass',
      outputUnits: 'lb/hr',
      frequency: 'Hourly',
      appendix: 'Appendix F',
      regulatoryBasis: '40 CFR 75 App F',
      citationId: 'cite-3',
    },
  ],
  reportingSchedule: [
    {
      reportType: 'Custom Format',
      description: 'Custom report format',
      frequency: 'Quarterly',
      deadline: '30 days after quarter end',
      dataElements: ['SO2'],
      submissionMethod: 'Custom',
      regulatoryBasis: '40 CFR 75.64',
      citationId: 'cite-4',
    },
  ],
  limits: [],
  missingDataProcedures: [],
  recordkeeping: [],
  citations: [],
  suggestedQuestions: [],
}

// Helper to render RequirementsBot with router context
function renderWithRouter(
  initialEntries: string[] = ['/agents/requirements'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  locationState?: any
) {
  const entries = initialEntries.map((path, i) => {
    if (i === initialEntries.length - 1 && locationState) {
      return { pathname: path, state: locationState }
    }
    return path
  })

  return render(
    <MemoryRouter initialEntries={entries}>
      <Routes>
        <Route path="/agents/requirements" element={<RequirementsBot />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequirementsBot Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders the page header', () => {
      renderWithRouter()

      expect(screen.getByText('RequirementsBot')).toBeInTheDocument()
      expect(screen.getByText('Requirements Engineering Specialist')).toBeInTheDocument()
    })

    it('shows placeholder when no context is provided', () => {
      renderWithRouter()

      expect(
        screen.getByText(/no compliance report loaded/i) ||
          screen.getByText(/requirements workspace coming soon/i) ||
          screen.getByText(/integration with regsbot/i)
      ).toBeInTheDocument()
    })

    it('renders capabilities section', () => {
      renderWithRouter()

      expect(screen.getByText('Capabilities')).toBeInTheDocument()
    })
  })

  describe('Context from RegsBot', () => {
    it('accepts ComplianceReport via location state', async () => {
      const context: RegsBotToRequirementsBotContext = {
        complianceReport: mockComplianceReport,
        extractedObligations: [],
      }

      renderWithRouter(['/agents/requirements'], context)

      await waitFor(() => {
        expect(screen.getByText('Test Power Plant')).toBeInTheDocument()
      })
    })

    it('displays facility info from received context', async () => {
      const context: RegsBotToRequirementsBotContext = {
        complianceReport: mockComplianceReport,
        extractedObligations: [],
      }

      renderWithRouter(['/agents/requirements'], context)

      await waitFor(() => {
        expect(screen.getByText(/12345/)).toBeInTheDocument() // ORIS code
      })
    })

    it('shows gap analysis section when context is provided', async () => {
      const context: RegsBotToRequirementsBotContext = {
        complianceReport: mockComplianceReport,
        extractedObligations: [],
      }

      renderWithRouter(['/agents/requirements'], context)

      await waitFor(() => {
        expect(screen.getByText(/gap analysis/i)).toBeInTheDocument()
      })
    })
  })

  describe('Gap Analysis Display', () => {
    it('shows summary statistics', async () => {
      const context: RegsBotToRequirementsBotContext = {
        complianceReport: mockComplianceReport,
        extractedObligations: [],
      }

      renderWithRouter(['/agents/requirements'], context)

      await waitFor(() => {
        // Check for status categories - use getAllBy since there may be multiple matches
        expect(screen.getAllByText(/fully supported/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/config required/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/not supported/i).length).toBeGreaterThan(0)
      })
    })

    it('displays individual gap analysis items', async () => {
      const context: RegsBotToRequirementsBotContext = {
        complianceReport: mockComplianceReport,
        extractedObligations: [],
      }

      renderWithRouter(['/agents/requirements'], context)

      await waitFor(() => {
        expect(screen.getByText(/SO2 monitoring/i)).toBeInTheDocument()
      })
    })

    it('shows recommended solutions for gaps', async () => {
      const context: RegsBotToRequirementsBotContext = {
        complianceReport: mockComplianceReport,
        extractedObligations: [],
      }

      renderWithRouter(['/agents/requirements'], context)

      await waitFor(() => {
        expect(screen.getByText(/configure f-1 calculation/i)).toBeInTheDocument()
      })
    })

    it('indicates development effort for unsupported items', async () => {
      const context: RegsBotToRequirementsBotContext = {
        complianceReport: mockComplianceReport,
        extractedObligations: [],
      }

      renderWithRouter(['/agents/requirements'], context)

      await waitFor(() => {
        expect(screen.getByText(/moderate/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation and Actions', () => {
    it('has a back to RegsBot link', async () => {
      const context: RegsBotToRequirementsBotContext = {
        complianceReport: mockComplianceReport,
        extractedObligations: [],
      }

      renderWithRouter(['/agents/requirements'], context)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /back to regsbot/i })).toBeInTheDocument()
      })
    })

    it('has export options for gap analysis', async () => {
      const context: RegsBotToRequirementsBotContext = {
        complianceReport: mockComplianceReport,
        extractedObligations: [],
      }

      renderWithRouter(['/agents/requirements'], context)

      await waitFor(() => {
        // Check for any export button
        const exportButtons = screen.getAllByRole('button', { name: /export/i })
        expect(exportButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Status Filtering', () => {
    it('can filter by gap status', async () => {
      const user = userEvent.setup()
      const context: RegsBotToRequirementsBotContext = {
        complianceReport: mockComplianceReport,
        extractedObligations: [],
      }

      renderWithRouter(['/agents/requirements'], context)

      await waitFor(() => {
        expect(screen.getByText(/gap analysis/i)).toBeInTheDocument()
      })

      // Find the Not Supported summary card and click it
      const notSupportedCards = screen.getAllByText(/not supported/i)
      // The summary card should be the first one (in the stats grid)
      const filterButton = notSupportedCards[0]?.closest('button')
      if (filterButton) {
        await user.click(filterButton)
        // After filtering, should show custom report format (the not-supported item)
        await waitFor(() => {
          const customReportElements = screen.getAllByText(/custom report format/i)
          expect(customReportElements.length).toBeGreaterThan(0)
        })
      }
    })
  })
})
