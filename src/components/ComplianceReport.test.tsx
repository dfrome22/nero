import type { ComplianceReport } from '@/types/orchestration'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ComplianceReportDisplay } from './ComplianceReport'

// Mock compliance report for testing
const mockReport: ComplianceReport = {
  facilityId: 'FAC-001',
  facilityName: 'Test Power Plant',
  orisCode: 3,
  generatedAt: '2024-01-15T10:30:00Z',

  summary: {
    totalRegulations: 3,
    totalMonitoringParameters: 4,
    totalQATests: 5,
    totalCalculations: 2,
    totalReports: 2,
    totalLimits: 3,
    programs: ['ARP', 'CSAPR'],
    highlights: [
      'Requires continuous SO2 and NOx monitoring',
      'Quarterly EDR submissions required',
      'Daily calibration checks mandatory',
    ],
  },

  applicableRegulations: [
    {
      id: 'reg-1',
      cfr: '40 CFR 75',
      title: 'Continuous Emission Monitoring',
      program: 'ARP',
      applicabilityReason: 'Affected unit under Acid Rain Program',
      keyRequirements: [
        'Install and certify CEMS',
        'Monitor SO2, NOx, CO2, and flow',
        'Submit quarterly reports',
      ],
      citationId: 'cite-1',
    },
    {
      id: 'reg-2',
      cfr: '40 CFR 97',
      title: 'Cross-State Air Pollution Rule',
      program: 'CSAPR',
      applicabilityReason: 'Unit in CSAPR Group 2 state',
      keyRequirements: ['NOx and SO2 allowance tracking'],
      citationId: 'cite-2',
    },
  ],

  monitoringByParameter: [
    {
      parameter: 'SO2',
      displayName: 'Sulfur Dioxide',
      methods: [
        {
          methodCode: 'CEM',
          description: 'Continuous emission monitoring system',
          frequency: 'Continuous (hourly average)',
          dataQualityRequirements: '95% data availability',
          regulatoryBasis: '40 CFR 75.11',
          citationId: 'cite-3',
        },
      ],
    },
    {
      parameter: 'NOX',
      displayName: 'Nitrogen Oxides',
      methods: [
        {
          methodCode: 'CEM',
          description: 'Continuous emission monitoring system',
          frequency: 'Continuous (hourly average)',
          dataQualityRequirements: '95% data availability',
          regulatoryBasis: '40 CFR 75.12',
          citationId: 'cite-4',
        },
      ],
    },
  ],

  qaTestMatrix: [
    {
      testType: 'Daily Calibration Error',
      testCode: 'DAYCAL',
      applicableParameters: ['SO2', 'NOX', 'CO2'],
      frequency: 'Daily',
      passCriteria: '±2.5% of span',
      failureConsequence: 'Use substitute data until passing calibration',
      regulatoryBasis: '40 CFR 75 Appendix B §2.1',
      citationId: 'cite-5',
    },
    {
      testType: 'Relative Accuracy Test Audit',
      testCode: 'RATA',
      applicableParameters: ['SO2', 'NOX'],
      frequency: 'Semi-annual',
      passCriteria: '≤10% relative accuracy or ≤7.5% with bias adjustment',
      failureConsequence: 'Out-of-control period, corrective action required',
      gracePeroid: '168 hours',
      performanceSpec: 'PS-2',
      regulatoryBasis: '40 CFR 75 Appendix A',
      citationId: 'cite-6',
    },
  ],

  calculations: [
    {
      name: 'SO2 Mass Emissions',
      description: 'Calculate hourly SO2 mass from concentration and flow',
      formula: 'SO2 (lb/hr) = K × SO2c × Q',
      formulaCode: 'F-1',
      inputParameters: ['SO2 concentration', 'Stack flow', 'K factor'],
      outputParameter: 'SO2 mass',
      outputUnits: 'lb/hr',
      frequency: 'Hourly',
      appendix: 'Appendix F',
      regulatoryBasis: '40 CFR 75 Appendix F §3.1',
      citationId: 'cite-7',
    },
  ],

  reportingSchedule: [
    {
      reportType: 'Quarterly EDR',
      description: 'Electronic Data Report with all hourly emissions data',
      frequency: 'Quarterly',
      deadline: '30 days after quarter end',
      dataElements: ['Hourly emissions', 'Operating time', 'QA test results'],
      submissionMethod: 'ECMPS',
      regulatoryBasis: '40 CFR 75.64',
      citationId: 'cite-8',
    },
  ],

  limits: [
    {
      parameter: 'SO2',
      limitValue: '1.2 lb/mmBtu',
      averagingPeriod: '30-day rolling average',
      limitType: 'Emission rate limit',
      program: 'ARP',
      exceedanceConsequence: 'Excess emissions penalty',
      regulatoryBasis: '40 CFR 72.43',
      citationId: 'cite-9',
    },
  ],

  missingDataProcedures: [
    {
      parameter: 'SO2',
      scenario: 'Monitor outage < 24 hours',
      substitutionMethod: 'Standard missing data',
      substitutionValue: '90th percentile lookback',
      regulatoryBasis: '40 CFR 75.33',
      citationId: 'cite-10',
    },
  ],

  recordkeeping: [
    {
      category: 'Monitoring Data',
      requirements: [
        'Retain all hourly emissions data',
        'Maintain QA test records',
        'Keep calibration logs',
      ],
      retentionPeriod: '3 years',
      format: 'Electronic',
      regulatoryBasis: '40 CFR 75.57',
      citationId: 'cite-11',
    },
  ],

  citations: [
    {
      id: 'cite-1',
      cfr: '40 CFR 75',
      title: 'Continuous Emission Monitoring',
      description: 'Requirements for CEMS under Part 75',
      source: 'eCFR',
      url: 'https://www.ecfr.gov/current/title-40/part-75',
    },
  ],

  suggestedQuestions: [
    'What happens if I fail a RATA?',
    'How do I calculate substitute data?',
    'When is my next EDR due?',
  ],
}

describe('ComplianceReportDisplay', () => {
  describe('Header and Summary', () => {
    it('renders facility name and ORIS code', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('Test Power Plant')).toBeInTheDocument()
      expect(screen.getByText(/ORIS.*3/)).toBeInTheDocument()
    })

    it('renders generation timestamp', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      // Should show formatted date
      expect(screen.getByText(/Generated/)).toBeInTheDocument()
    })

    it('renders executive summary statistics', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      // Stats are in StatCard components - use getAllByText since labels can appear elsewhere
      expect(screen.getByText('Regulations')).toBeInTheDocument()
      const paramTexts = screen.getAllByText('Parameters')
      expect(paramTexts.length).toBeGreaterThan(0)
      expect(screen.getByText('QA Tests')).toBeInTheDocument()
    })

    it('renders program badges', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      // Programs appear multiple times (header and in regulations)
      const arpBadges = screen.getAllByText('ARP')
      expect(arpBadges.length).toBeGreaterThan(0)
      const csaprBadges = screen.getAllByText('CSAPR')
      expect(csaprBadges.length).toBeGreaterThan(0)
    })

    it('renders highlights', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/Requires continuous SO2 and NOx monitoring/)).toBeInTheDocument()
    })
  })

  describe('Applicable Regulations Section', () => {
    it('renders applicable regulations heading', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('Applicable Regulations')).toBeInTheDocument()
    })

    it('renders each regulation with CFR reference', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('40 CFR 75')).toBeInTheDocument()
      expect(screen.getByText('40 CFR 97')).toBeInTheDocument()
    })

    it('renders applicability reason', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/Affected unit under Acid Rain Program/)).toBeInTheDocument()
    })
  })

  describe('Monitoring Requirements Section', () => {
    it('renders monitoring section heading', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('Monitoring Requirements')).toBeInTheDocument()
    })

    it('renders parameters with display names', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('Sulfur Dioxide')).toBeInTheDocument()
      expect(screen.getByText('Nitrogen Oxides')).toBeInTheDocument()
    })

    it('renders method codes', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      // Should show CEM method
      const cemElements = screen.getAllByText('CEM')
      expect(cemElements.length).toBeGreaterThan(0)
    })
  })

  describe('QA Test Matrix Section', () => {
    it('renders QA test matrix heading', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('QA Test Requirements')).toBeInTheDocument()
    })

    it('renders test types', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('Daily Calibration Error')).toBeInTheDocument()
      expect(screen.getByText('Relative Accuracy Test Audit')).toBeInTheDocument()
    })

    it('renders pass criteria', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/±2.5% of span/)).toBeInTheDocument()
    })

    it('renders failure consequences', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/Use substitute data until passing calibration/)).toBeInTheDocument()
    })
  })

  describe('Calculations Section', () => {
    it('renders calculations heading', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      // Calculations appears in both stats and section heading
      const calcTexts = screen.getAllByText('Calculations')
      expect(calcTexts.length).toBeGreaterThanOrEqual(1)
    })

    it('renders calculation names', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('SO2 Mass Emissions')).toBeInTheDocument()
    })

    it('renders formula codes', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/F-1/)).toBeInTheDocument()
    })

    it('renders formula equations', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/SO2.*lb\/hr.*=.*K.*×.*SO2c.*×.*Q/)).toBeInTheDocument()
    })
  })

  describe('Reporting Schedule Section', () => {
    it('renders reporting section heading', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('Reporting Schedule')).toBeInTheDocument()
    })

    it('renders report types', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('Quarterly EDR')).toBeInTheDocument()
    })

    it('renders deadlines', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/30 days after quarter end/)).toBeInTheDocument()
    })

    it('renders submission method', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/ECMPS/)).toBeInTheDocument()
    })
  })

  describe('Emission Limits Section', () => {
    it('renders limits section heading', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('Emission Limits')).toBeInTheDocument()
    })

    it('renders limit values with units', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/1.2 lb\/mmBtu/)).toBeInTheDocument()
    })

    it('renders averaging period', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/30-day rolling average/)).toBeInTheDocument()
    })
  })

  describe('Missing Data Section', () => {
    it('renders missing data section heading', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('Missing Data Procedures')).toBeInTheDocument()
    })

    it('renders substitution methods', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/Standard missing data/)).toBeInTheDocument()
    })

    it('renders substitution values', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/90th percentile lookback/)).toBeInTheDocument()
    })
  })

  describe('Recordkeeping Section', () => {
    it('renders recordkeeping section heading', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('Recordkeeping')).toBeInTheDocument()
    })

    it('renders retention period', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/3 years/)).toBeInTheDocument()
    })

    it('renders requirements list', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText(/Retain all hourly emissions data/)).toBeInTheDocument()
    })
  })

  describe('Suggested Questions', () => {
    it('renders suggested questions', () => {
      render(<ComplianceReportDisplay report={mockReport} />)

      expect(screen.getByText('What happens if I fail a RATA?')).toBeInTheDocument()
    })

    it('calls onQuestionClick when suggested question is clicked', async () => {
      const user = userEvent.setup()
      const handleQuestionClick = vi.fn()

      render(<ComplianceReportDisplay report={mockReport} onQuestionClick={handleQuestionClick} />)

      const question = screen.getByText('What happens if I fail a RATA?')
      await user.click(question)

      expect(handleQuestionClick).toHaveBeenCalledWith('What happens if I fail a RATA?')
    })
  })

  describe('Interactivity', () => {
    it('sections are collapsible', async () => {
      const user = userEvent.setup()
      render(<ComplianceReportDisplay report={mockReport} />)

      // Find the Monitoring Requirements section header
      const monitoringHeader = screen.getByRole('button', {
        name: /Monitoring Requirements/,
      })

      // Click to collapse
      await user.click(monitoringHeader)

      // Content should be hidden (or have aria-expanded=false)
      expect(monitoringHeader).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Empty states', () => {
    it('handles report with no limits gracefully', () => {
      const reportWithNoLimits = { ...mockReport, limits: [] }
      render(<ComplianceReportDisplay report={reportWithNoLimits} />)

      expect(screen.getByText('Emission Limits')).toBeInTheDocument()
      expect(screen.getByText(/No emission limits/)).toBeInTheDocument()
    })

    it('handles report with no calculations gracefully', () => {
      const reportWithNoCalcs = { ...mockReport, calculations: [] }
      render(<ComplianceReportDisplay report={reportWithNoCalcs} />)

      // Calculations appears in both stats and section heading
      const calcTexts = screen.getAllByText('Calculations')
      expect(calcTexts.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/No calculations/)).toBeInTheDocument()
    })
  })
})

describe('ComplianceReportDisplay accessibility', () => {
  it('has proper heading hierarchy', () => {
    render(<ComplianceReportDisplay report={mockReport} />)

    // Main heading should be h2 (assuming h1 is page title)
    const mainHeading = screen.getByRole('heading', { level: 2 })
    expect(mainHeading).toBeInTheDocument()

    // Section headings should be h3
    const sectionHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(sectionHeadings.length).toBeGreaterThan(0)
  })

  it('tables have proper headers', () => {
    render(<ComplianceReportDisplay report={mockReport} />)

    // QA Test Matrix should be a table with headers
    const tables = screen.getAllByRole('table')
    expect(tables.length).toBeGreaterThan(0)

    // Each table should have th elements
    const columnHeaders = screen.getAllByRole('columnheader')
    expect(columnHeaders.length).toBeGreaterThan(0)
  })
})
