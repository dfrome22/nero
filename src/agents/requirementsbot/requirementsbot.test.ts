import { beforeEach, describe, expect, it } from 'vitest'
import type { DAHSProfile, GapStatus, PermitObligation } from '../../types/orchestration'
import { RequirementsBotService } from './index'

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createMockDAHSProfile = (): DAHSProfile => ({
  id: 'dahs-profile-001',
  name: 'Standard EPA DAHS',
  version: '2.0.0',
  capabilities: [
    {
      id: 'cap-001',
      category: 'monitoring',
      name: 'Continuous SO2 Monitoring',
      description: 'Hourly SO2 monitoring with data logging',
      parameters: ['SO2'],
      configurable: true,
    },
    {
      id: 'cap-002',
      category: 'monitoring',
      name: 'NOx Monitoring',
      description: 'Continuous NOx measurement',
      parameters: ['NOx'],
      configurable: true,
    },
    {
      id: 'cap-003',
      category: 'calculation',
      name: 'Hourly Average Calculation',
      description: 'Calculate hourly averages for any parameter',
      parameters: ['SO2', 'NOx', 'CO', 'O2'],
      configurable: true,
    },
    {
      id: 'cap-004',
      category: 'reporting',
      name: 'Quarterly Excess Emissions Report',
      description: 'Generate quarterly excess emissions reports',
      configurable: true,
    },
    {
      id: 'cap-005',
      category: 'qa',
      name: 'Daily Calibration Drift Check',
      description: 'Automated daily calibration drift checks',
      configurable: true,
    },
  ],
  supportedParameters: ['SO2', 'NOx', 'CO', 'O2', 'Flow', 'Temperature'],
  supportedCalculations: [
    'hourly_average',
    'daily_average',
    'rolling_average',
    'heat_input',
    'emission_rate',
  ],
  supportedReports: ['quarterly_excess', 'annual_compliance', 'deviation_report'],
})

const createMockObligation = (overrides: Partial<PermitObligation> = {}): PermitObligation => ({
  id: 'obl-001',
  permitId: 'permit-001',
  pageReference: 'Page 5, Section 3.2',
  originalText:
    'The facility shall continuously monitor SO2 emissions and calculate hourly averages.',
  obligationType: 'monitoring',
  summary: 'Continuous SO2 monitoring with hourly averages',
  regulatoryBasis: '40 CFR 60.4',
  frequency: 'hourly',
  parameters: ['SO2'],
  confidence: 0.95,
  confirmedByHuman: true,
  ...overrides,
})

// ============================================================================
// GAP ANALYSIS TESTS
// ============================================================================

describe('RequirementsBotService', () => {
  let service: RequirementsBotService
  let mockProfile: DAHSProfile

  beforeEach(() => {
    mockProfile = createMockDAHSProfile()
    service = new RequirementsBotService(mockProfile)
  })

  describe('analyzeObligation', () => {
    it('should return fully-supported for matching capability', () => {
      const obligation = createMockObligation({
        obligationType: 'monitoring',
        parameters: ['SO2'],
        summary: 'Continuous SO2 monitoring',
      })

      const result = service.analyzeObligation(obligation)

      expect(result.status).toBe('fully-supported')
      expect(result.dahsCapabilityId).toBe('cap-001')
      expect(result.developmentEffort).toBe('none')
    })

    it('should return config-required when capability exists but needs setup', () => {
      const obligation = createMockObligation({
        obligationType: 'calculation',
        parameters: ['SO2'],
        summary: 'Calculate 24-hour rolling average for SO2',
        originalText: 'Facility must calculate 24-hour rolling average',
        frequency: 'rolling',
      })

      const result = service.analyzeObligation(obligation)

      expect(result.status).toBe('config-required')
      expect(result.developmentEffort).toBe('configuration')
      expect(result.recommendedSolution).toBeDefined()
    })

    it('should return not-supported for unknown parameter', () => {
      const obligation = createMockObligation({
        obligationType: 'monitoring',
        parameters: ['Hg'], // Mercury not in supported parameters
        summary: 'Continuous mercury monitoring',
      })

      const result = service.analyzeObligation(obligation)

      expect(result.status).toBe('not-supported')
      expect(result.gapDescription).toContain('Hg')
      expect(result.developmentEffort).toBeOneOf(['minor', 'moderate', 'major'])
    })

    it('should return partial-support when capability partially matches', () => {
      const obligation = createMockObligation({
        obligationType: 'reporting',
        summary: 'Generate custom emissions summary with facility-specific format',
        originalText:
          'Facility shall prepare monthly emissions summary using custom format specified in Attachment A',
      })

      const result = service.analyzeObligation(obligation)

      expect(result.status).toBe('partial-support')
      expect(result.developmentEffort).toBeOneOf(['minor', 'moderate'])
    })

    it('should return manual-process for notification obligations', () => {
      const obligation = createMockObligation({
        obligationType: 'notification',
        summary: 'Notify EPA within 24 hours of excess emissions',
        originalText:
          'The facility shall notify the Regional Administrator within 24 hours of any excess emissions event.',
      })

      const result = service.analyzeObligation(obligation)

      expect(result.status).toBe('manual-process')
      expect(result.notes.some((note: string) => note.includes('human notification'))).toBe(true)
    })

    it('should return needs-review for ambiguous obligations', () => {
      const obligation = createMockObligation({
        obligationType: 'other',
        summary: 'Implement best management practices',
        originalText: 'Facility shall implement best management practices as deemed appropriate.',
        confidence: 0.5, // Low confidence
      })

      const result = service.analyzeObligation(obligation)

      expect(result.status).toBe('needs-review')
    })
  })

  describe('analyzeAllObligations', () => {
    it('should analyze multiple obligations and return array of gap analyses', () => {
      const obligations = [
        createMockObligation({ id: 'obl-001', parameters: ['SO2'] }),
        createMockObligation({ id: 'obl-002', parameters: ['NOx'] }),
        createMockObligation({
          id: 'obl-003',
          parameters: ['Hg'],
          summary: 'Mercury monitoring',
        }),
      ]

      const results = service.analyzeAllObligations(obligations)

      expect(results).toHaveLength(3)
      expect(results[0]?.obligationId).toBe('obl-001')
      expect(results[1]?.obligationId).toBe('obl-002')
      expect(results[2]?.obligationId).toBe('obl-003')
    })
  })

  describe('findMatchingCapability', () => {
    it('should find capability matching parameter and type', () => {
      const capability = service.findMatchingCapability('monitoring', ['SO2'])

      expect(capability).toBeDefined()
      expect(capability?.id).toBe('cap-001')
      expect(capability?.parameters).toContain('SO2')
    })

    it('should return undefined when no matching capability', () => {
      const capability = service.findMatchingCapability('monitoring', ['Hg'])

      expect(capability).toBeUndefined()
    })

    it('should find calculation capability', () => {
      const capability = service.findMatchingCapability('calculation', ['NOx'])

      expect(capability).toBeDefined()
      expect(capability?.category).toBe('calculation')
    })
  })

  describe('isParameterSupported', () => {
    it('should return true for supported parameters', () => {
      expect(service.isParameterSupported('SO2')).toBe(true)
      expect(service.isParameterSupported('NOx')).toBe(true)
      expect(service.isParameterSupported('CO')).toBe(true)
    })

    it('should return false for unsupported parameters', () => {
      expect(service.isParameterSupported('Hg')).toBe(false)
      expect(service.isParameterSupported('PM2.5')).toBe(false)
      expect(service.isParameterSupported('VOC')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(service.isParameterSupported('so2')).toBe(true)
      expect(service.isParameterSupported('nox')).toBe(true)
    })
  })

  describe('isCalculationSupported', () => {
    it('should return true for supported calculations', () => {
      expect(service.isCalculationSupported('hourly_average')).toBe(true)
      expect(service.isCalculationSupported('daily_average')).toBe(true)
      expect(service.isCalculationSupported('rolling_average')).toBe(true)
    })

    it('should return false for unsupported calculations', () => {
      expect(service.isCalculationSupported('custom')).toBe(false)
      expect(service.isCalculationSupported('f_factor')).toBe(false)
    })
  })

  // ============================================================================
  // DEVELOPMENT ITEM GENERATION
  // ============================================================================

  describe('generateDevelopmentItem', () => {
    it('should generate development item for unsupported obligation', () => {
      const obligation = createMockObligation({
        id: 'obl-hg-001',
        parameters: ['Hg'],
        summary: 'Continuous mercury monitoring required',
        obligationType: 'monitoring',
      })

      const gapAnalysis = service.analyzeObligation(obligation)
      const devItem = service.generateDevelopmentItem(gapAnalysis)

      expect(devItem).toBeDefined()
      expect(devItem?.title).toContain('Mercury')
      expect(devItem?.obligationLinks).toContain('obl-hg-001')
      expect(devItem?.effort).toBeOneOf(['minor', 'moderate', 'major'])
      expect(devItem?.priority).toBeOneOf(['critical', 'high', 'medium', 'low'])
    })

    it('should not generate development item for fully-supported obligation', () => {
      const obligation = createMockObligation({
        parameters: ['SO2'],
        obligationType: 'monitoring',
      })

      const gapAnalysis = service.analyzeObligation(obligation)
      const devItem = service.generateDevelopmentItem(gapAnalysis)

      expect(devItem).toBeUndefined()
    })

    it('should generate development item for partial-support with minor effort', () => {
      const obligation = createMockObligation({
        id: 'obl-custom-001',
        obligationType: 'reporting',
        summary: 'Custom format report',
        originalText: 'Prepare reports in facility-specific format',
      })

      const gapAnalysis = service.analyzeObligation(obligation)

      if (gapAnalysis.status === 'partial-support') {
        const devItem = service.generateDevelopmentItem(gapAnalysis)
        expect(devItem).toBeDefined()
        expect(devItem?.effort).toBeOneOf(['minor', 'moderate'])
      }
    })
  })

  // ============================================================================
  // CONFIGURATION GENERATION
  // ============================================================================

  describe('generateTagConfiguration', () => {
    it('should generate tag config for monitoring obligation', () => {
      const obligation = createMockObligation({
        parameters: ['SO2'],
        frequency: 'hourly',
        obligationType: 'monitoring',
      })

      const tagConfig = service.generateTagConfiguration(obligation)

      expect(tagConfig).toBeDefined()
      expect(tagConfig?.parameter).toBe('SO2')
      expect(tagConfig?.frequency).toBe('hourly')
      expect(tagConfig?.obligationLinks).toContain('obl-001')
    })

    it('should return undefined for non-monitoring obligations', () => {
      const obligation = createMockObligation({
        obligationType: 'notification',
      })

      const tagConfig = service.generateTagConfiguration(obligation)

      expect(tagConfig).toBeUndefined()
    })
  })

  describe('generateCalculationConfiguration', () => {
    it('should generate calculation config for calculation obligation', () => {
      const obligation = createMockObligation({
        obligationType: 'calculation',
        parameters: ['SO2'],
        summary: 'Calculate hourly average SO2',
        frequency: 'hourly',
      })

      const calcConfig = service.generateCalculationConfiguration(obligation)

      expect(calcConfig).toBeDefined()
      expect(calcConfig?.inputs).toContain('SO2')
      expect(calcConfig?.type).toBe('hourly_average')
      expect(calcConfig?.obligationLinks).toContain('obl-001')
    })

    it('should detect rolling average from text', () => {
      const obligation = createMockObligation({
        obligationType: 'calculation',
        parameters: ['NOx'],
        summary: 'Calculate 30-day rolling average',
        originalText: 'Calculate and maintain 30-day rolling average NOx concentration',
      })

      const calcConfig = service.generateCalculationConfiguration(obligation)

      expect(calcConfig?.type).toBe('rolling_average')
    })
  })

  // ============================================================================
  // PROPOSAL GENERATION
  // ============================================================================

  describe('generateDAHSProposal', () => {
    it('should generate complete DAHS proposal', () => {
      const obligations = [
        createMockObligation({
          id: 'obl-001',
          parameters: ['SO2'],
          obligationType: 'monitoring',
        }),
        createMockObligation({
          id: 'obl-002',
          parameters: ['NOx'],
          obligationType: 'calculation',
          summary: 'Calculate hourly average NOx',
        }),
        createMockObligation({
          id: 'obl-003',
          parameters: ['Hg'],
          obligationType: 'monitoring',
          summary: 'Mercury monitoring',
        }),
      ]

      const proposal = service.generateDAHSProposal('permit-001', obligations)

      expect(proposal.permitId).toBe('permit-001')
      expect(proposal.dahsProfileId).toBe('dahs-profile-001')
      expect(proposal.obligations).toHaveLength(3)
      expect(proposal.gapAnalysis).toHaveLength(3)
      expect(proposal.summary).toBeDefined()
      expect(
        proposal.summary.fullySupported +
          proposal.summary.configRequired +
          proposal.summary.partialSupport +
          proposal.summary.notSupported +
          proposal.summary.manualProcess +
          proposal.summary.needsReview
      ).toBe(3)
    })

    it('should include development items only for gaps', () => {
      const obligations = [
        createMockObligation({
          id: 'obl-001',
          parameters: ['SO2'],
          obligationType: 'monitoring',
        }), // Should be supported
        createMockObligation({
          id: 'obl-002',
          parameters: ['Hg'],
          obligationType: 'monitoring',
        }), // Should need development
      ]

      const proposal = service.generateDAHSProposal('permit-001', obligations)

      // Dev items should only be for unsupported/partial obligations
      expect(proposal.developmentItems.length).toBeLessThanOrEqual(2)
      proposal.developmentItems.forEach((item: { obligationLinks: string[] }) => {
        expect(item.obligationLinks).toBeDefined()
        expect(item.obligationLinks.length).toBeGreaterThan(0)
      })
    })

    it('should generate configuration for supported obligations', () => {
      const obligations = [
        createMockObligation({
          id: 'obl-001',
          parameters: ['SO2'],
          obligationType: 'monitoring',
          frequency: 'hourly',
        }),
        createMockObligation({
          id: 'obl-002',
          parameters: ['NOx'],
          obligationType: 'calculation',
          summary: 'Calculate daily average NOx',
          frequency: 'daily',
        }),
      ]

      const proposal = service.generateDAHSProposal('permit-001', obligations)

      expect(proposal.proposedConfiguration.tags.length).toBeGreaterThan(0)
      expect(proposal.proposedConfiguration.calculations.length).toBeGreaterThan(0)
    })

    it('should link all configurations back to obligations', () => {
      const obligations = [
        createMockObligation({
          id: 'obl-001',
          parameters: ['SO2'],
          obligationType: 'monitoring',
        }),
      ]

      const proposal = service.generateDAHSProposal('permit-001', obligations)

      proposal.proposedConfiguration.tags.forEach((tag: { obligationLinks: string[] }) => {
        expect(tag.obligationLinks.length).toBeGreaterThan(0)
      })
    })
  })

  // ============================================================================
  // SUMMARY STATISTICS
  // ============================================================================

  describe('calculateSummary', () => {
    it('should correctly count gap statuses', () => {
      const gapAnalyses = [
        { status: 'fully-supported' as GapStatus },
        { status: 'fully-supported' as GapStatus },
        { status: 'config-required' as GapStatus },
        { status: 'not-supported' as GapStatus },
        { status: 'needs-review' as GapStatus },
      ] as { status: GapStatus }[]

      const summary = service.calculateSummary(
        gapAnalyses as unknown as import('../../types/orchestration').GapAnalysis[]
      )

      expect(summary.fullySupported).toBe(2)
      expect(summary.configRequired).toBe(1)
      expect(summary.partialSupport).toBe(0)
      expect(summary.notSupported).toBe(1)
      expect(summary.manualProcess).toBe(0)
      expect(summary.needsReview).toBe(1)
    })
  })
})
