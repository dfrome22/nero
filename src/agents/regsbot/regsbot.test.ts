/**
 * RegsBot Agent Tests
 *
 * Tests for the EPA regulatory knowledge oracle.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CAMDFacility, MonitoringPlan } from '../../types/ecmps-api'
import { RegsBotService } from './index'

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockFacility = (): CAMDFacility => ({
  facilityId: 1234,
  orisCode: 5678,
  facilityName: 'Test Power Plant',
  stateCode: 'PA',
  programCodes: ['ARP', 'CSAPR'],
})

const createMockMonitoringPlan = (): MonitoringPlan => ({
  monitorPlanId: 'MP-001',
  facilityId: 1234,
  facilityName: 'Test Power Plant',
  orisCode: 5678,
  stateCode: 'PA',
  unitStackConfigurations: [{ unitId: 'U1', stackPipeId: 'CS1', beginDate: '2020-01-01' }],
  locations: [{ locationId: 'LOC1', locationType: 'stack', stackPipeId: 'CS1' }],
  methods: [
    {
      methodId: 'MTH-SO2',
      locationId: 'LOC1',
      parameterCode: 'SO2',
      methodCode: 'CEM',
      substituteDataCode: 'SUBS75',
      beginDate: '2020-01-01',
    },
    {
      methodId: 'MTH-NOX',
      locationId: 'LOC1',
      parameterCode: 'NOX',
      methodCode: 'CEM',
      beginDate: '2020-01-01',
    },
    {
      methodId: 'MTH-FLOW',
      locationId: 'LOC1',
      parameterCode: 'FLOW',
      methodCode: 'CEM',
      beginDate: '2020-01-01',
    },
    {
      methodId: 'MTH-O2',
      locationId: 'LOC1',
      parameterCode: 'O2',
      methodCode: 'CEM',
      beginDate: '2020-01-01',
    },
  ],
  systems: [
    {
      systemId: 'SYS-SO2',
      locationId: 'LOC1',
      systemTypeCode: 'SO2',
      beginDate: '2020-01-01',
    },
    {
      systemId: 'SYS-NOX',
      locationId: 'LOC1',
      systemTypeCode: 'NOX',
      beginDate: '2020-01-01',
    },
    {
      systemId: 'SYS-FLOW',
      locationId: 'LOC1',
      systemTypeCode: 'FLOW',
      beginDate: '2020-01-01',
    },
    {
      systemId: 'SYS-O2',
      locationId: 'LOC1',
      systemTypeCode: 'O2',
      beginDate: '2020-01-01',
    },
  ],
  spans: [],
  qualifications: [],
})

describe('RegsBotService', () => {
  let regsBot: RegsBotService

  beforeEach(() => {
    regsBot = new RegsBotService()
  })

  describe('scanForRegulatoryLanguage', () => {
    it('detects monitoring language', () => {
      const text = 'The facility shall monitor SO2 emissions using CEMS.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(results['monitoring']).toBeDefined()
      expect(results['monitoring']).toContain('CEMS')
    })

    it('detects reporting language', () => {
      const text = 'Submit quarterly reports to EPA Region 4.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(results['reporting']).toBeDefined()
      expect(results['reporting']).toContain('quarterly report')
    })

    it('detects limit language', () => {
      const text = 'Emissions shall not exceed 50 ppm SO2.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(results['limits']).toBeDefined()
      expect(results['limits']).toContain('shall not exceed')
    })

    it('detects QA language', () => {
      const text = 'Perform RATA testing annually and calibration drift checks daily.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(results['qa']).toBeDefined()
      expect(results['qa']).toContain('RATA')
    })

    it('detects program references', () => {
      const text = 'This unit is subject to Part 75 and the Acid Rain Program.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(results['programs']).toBeDefined()
      expect(results['programs']).toContain('Part 75')
      expect(results['programs']).toContain('Acid Rain Program')
    })

    it('returns empty object for text without regulatory language', () => {
      const text = 'The weather is nice today.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(Object.keys(results)).toHaveLength(0)
    })
  })

  describe('extractCitations', () => {
    it('extracts CFR citations with part and section', () => {
      const text = 'As required by 40 CFR 75.11, the facility must...'
      const citations = regsBot.extractCitations(text)

      expect(citations).toHaveLength(1)
      expect(citations[0]?.location).toBe('40 CFR 75.11')
    })

    it('extracts CFR citations with only part', () => {
      const text = 'Pursuant to 40 CFR Part 60, the following applies...'
      const citations = regsBot.extractCitations(text)

      expect(citations).toHaveLength(1)
      expect(citations[0]?.location).toBe('40 CFR 60')
    })

    it('extracts multiple citations', () => {
      const text = 'See 40 CFR 75.11 and 40 CFR 60.4 for requirements.'
      const citations = regsBot.extractCitations(text)

      expect(citations).toHaveLength(2)
    })

    it('handles citations with subpart letters', () => {
      const text = 'Under 40 CFR 60.4a, monitoring is required.'
      const citations = regsBot.extractCitations(text)

      expect(citations).toHaveLength(1)
      expect(citations[0]?.location).toBe('40 CFR 60.4a')
    })

    it('returns empty array for text without citations', () => {
      const text = 'No regulatory citations here.'
      const citations = regsBot.extractCitations(text)

      expect(citations).toHaveLength(0)
    })
  })

  describe('classifyObligationType', () => {
    it('classifies monitoring obligations', () => {
      expect(regsBot.classifyObligationType('The owner shall monitor SO2 continuously.')).toBe(
        'monitoring'
      )
      expect(regsBot.classifyObligationType('Install and operate a CEMS.')).toBe('monitoring')
    })

    it('classifies reporting obligations', () => {
      expect(regsBot.classifyObligationType('Submit quarterly reports.')).toBe('reporting')
      expect(regsBot.classifyObligationType('Notify the agency within 24 hours.')).toBe('reporting')
    })

    it('classifies recordkeeping obligations', () => {
      expect(regsBot.classifyObligationType('Maintain records for 5 years.')).toBe('recordkeeping')
    })

    it('classifies limit obligations', () => {
      expect(regsBot.classifyObligationType('Emissions shall not exceed 0.5 lb/MMBtu.')).toBe(
        'limit'
      )
      expect(regsBot.classifyObligationType('The emission limit is 100 ppm.')).toBe('limit')
    })

    it('classifies calculation obligations', () => {
      expect(regsBot.classifyObligationType('Calculate hourly average emissions.')).toBe(
        'calculation'
      )
    })

    it('classifies calibration/QA obligations', () => {
      expect(regsBot.classifyObligationType('Perform calibration drift checks daily.')).toBe(
        'calibration'
      )
      expect(regsBot.classifyObligationType('Conduct RATA testing annually.')).toBe('calibration')
    })

    it('classifies testing obligations', () => {
      expect(regsBot.classifyObligationType('Conduct performance test within 60 days.')).toBe(
        'testing'
      )
    })

    it('returns other for unclassified text', () => {
      expect(regsBot.classifyObligationType('General provision applies.')).toBe('other')
    })
  })

  describe('extractObligations', () => {
    it('extracts obligations from permit text', () => {
      const text = `
        The owner or operator shall monitor SO2 emissions continuously using CEMS.
        The facility shall not exceed 50 ppm NOx on a rolling 30-day average.
        Quarterly reports shall be submitted to EPA Region 4.
      `
      const obligations = regsBot.extractObligations('permit-123', text, 'Page 5')

      expect(obligations.length).toBeGreaterThan(0)
      expect(obligations[0]?.permitId).toBe('permit-123')
      expect(obligations[0]?.pageReference).toBe('Page 5')
    })

    it('assigns appropriate obligation types', () => {
      const text = 'The owner shall monitor SO2 emissions continuously.'
      const obligations = regsBot.extractObligations('permit-123', text, 'Page 1')

      expect(obligations[0]?.obligationType).toBe('monitoring')
    })

    it('extracts parameters from obligations', () => {
      const text = 'The facility shall monitor SO2, NOx, and CO2 emissions.'
      const obligations = regsBot.extractObligations('permit-123', text, 'Page 1')

      expect(obligations[0]?.parameters).toContain('SO2')
      expect(obligations[0]?.parameters).toContain('NOX')
      expect(obligations[0]?.parameters).toContain('CO2')
    })

    it('extracts frequency from obligations', () => {
      const text = 'The owner shall submit quarterly reports to the agency.'
      const obligations = regsBot.extractObligations('permit-123', text, 'Page 1')

      expect(obligations[0]?.frequency).toBe('quarterly')
    })
  })

  describe('buildEvidenceLibrary', () => {
    it('creates evidence library from items', () => {
      const items = [
        {
          id: 'item-1',
          sourceType: 'eCFR' as const,
          title: 'Part 75 Requirements',
          content: 'Sample content',
          citations: [],
          confirmedByHuman: false,
          createdAt: new Date().toISOString(),
        },
      ]

      const library = regsBot.buildEvidenceLibrary(items)

      expect(library.items).toHaveLength(1)
      expect(library.scope).toBe('project')
    })
  })

  // ============================================================================
  // MONITORING PLAN ANALYSIS TESTS
  // ============================================================================

  describe('analyzeMonitoringPlan', () => {
    it('analyzes a monitoring plan and returns DAHS requirements', async () => {
      const mockFacility = createMockFacility()
      const mockPlan = createMockMonitoringPlan()
      const mockPrograms = ['ARP', 'CSAPR']

      // Create service with mocked clients
      const mockEcmpsClient = {
        getFacility: vi.fn().mockResolvedValue(mockFacility),
        getMonitoringPlan: vi.fn().mockResolvedValue(mockPlan),
        getFacilityPrograms: vi.fn().mockResolvedValue(mockPrograms),
        getMonitorMethods: vi.fn(),
      }

      const service = new RegsBotService({
        ecmpsClient: mockEcmpsClient as never,
      })

      const requirements = await service.analyzeMonitoringPlan(5678)

      // Verify structure
      expect(requirements.facilityName).toBe('Test Power Plant')
      expect(requirements.orisCode).toBe(5678)
      expect(requirements.programs).toEqual(['ARP', 'CSAPR'])

      // Verify monitoring requirements derived
      expect(requirements.monitoringRequirements.length).toBeGreaterThan(0)
      const so2Mon = requirements.monitoringRequirements.find(
        (r) => r.parameter === 'Sulfur Dioxide'
      )
      expect(so2Mon).toBeDefined()
      expect(so2Mon?.methodCode).toBe('CEM')
      expect(so2Mon?.frequency).toBe('continuous')

      // Verify calculation requirements
      expect(requirements.calculationRequirements.length).toBeGreaterThan(0)
      const hourlyAvg = requirements.calculationRequirements.find(
        (r) => r.calculationType === 'hourly_average'
      )
      expect(hourlyAvg).toBeDefined()

      // Should have heat input calculation (has Flow and O2)
      const heatInput = requirements.calculationRequirements.find(
        (r) => r.calculationType === 'heat_input'
      )
      expect(heatInput).toBeDefined()

      // Should have mass emission calculations
      const so2Mass = requirements.calculationRequirements.find(
        (r) => r.name === 'SO2 Mass Emissions'
      )
      expect(so2Mass).toBeDefined()

      // Verify QA requirements
      expect(requirements.qaRequirements.length).toBeGreaterThan(0)
      const dailyCal = requirements.qaRequirements.filter((r) => r.testType === 'daily_calibration')
      expect(dailyCal.length).toBe(4) // One for each system

      const rata = requirements.qaRequirements.filter((r) => r.testType === 'rata')
      expect(rata.length).toBe(4) // One for each system

      // Verify reporting requirements
      expect(requirements.reportingRequirements.length).toBeGreaterThan(0)
      const quarterlyEdr = requirements.reportingRequirements.find((r) =>
        r.reportType.includes('Quarterly')
      )
      expect(quarterlyEdr).toBeDefined()

      // Verify substitution requirements (SO2 has SUBS75)
      const subReqs = requirements.substitutionRequirements.filter((r) => r.parameter === 'SO2')
      expect(subReqs.length).toBeGreaterThan(0)

      // Verify recordkeeping requirements
      expect(requirements.recordkeepingRequirements.length).toBeGreaterThan(0)
    })

    it('includes linearity tests for gas analyzers', async () => {
      const mockFacility = createMockFacility()
      const mockPlan = createMockMonitoringPlan()

      const mockEcmpsClient = {
        getFacility: vi.fn().mockResolvedValue(mockFacility),
        getMonitoringPlan: vi.fn().mockResolvedValue(mockPlan),
        getFacilityPrograms: vi.fn().mockResolvedValue(['ARP']),
        getMonitorMethods: vi.fn(),
      }

      const service = new RegsBotService({
        ecmpsClient: mockEcmpsClient as never,
      })

      const requirements = await service.analyzeMonitoringPlan(5678)

      const linearityTests = requirements.qaRequirements.filter((r) => r.testType === 'linearity')
      // Should have linearity for SO2, NOX, O2 (gas analyzers)
      expect(linearityTests.length).toBeGreaterThanOrEqual(3)
    })

    it('includes flow-to-load check when FLOW system present', async () => {
      const mockFacility = createMockFacility()
      const mockPlan = createMockMonitoringPlan()

      const mockEcmpsClient = {
        getFacility: vi.fn().mockResolvedValue(mockFacility),
        getMonitoringPlan: vi.fn().mockResolvedValue(mockPlan),
        getFacilityPrograms: vi.fn().mockResolvedValue(['ARP']),
        getMonitorMethods: vi.fn(),
      }

      const service = new RegsBotService({
        ecmpsClient: mockEcmpsClient as never,
      })

      const requirements = await service.analyzeMonitoringPlan(5678)

      const flowToLoad = requirements.qaRequirements.find((r) => r.testType === 'flow_to_load')
      expect(flowToLoad).toBeDefined()
      expect(flowToLoad?.frequency).toBe('quarterly')
    })
  })

  // ============================================================================
  // ask() - Universal Query Interface
  // ============================================================================

  describe('ask()', () => {
    it('answers natural language question about QA requirements', async () => {
      const response = await regsBot.ask({
        question: 'What QA tests are required for SO2?',
      })

      expect(response.answer).toBeTruthy()
      expect(response.answer).toContain('QA')
      expect(response.data.qaRequirements).toBeDefined()
      expect(response.data.qaRequirements?.length).toBeGreaterThan(0)
      expect(response.confidence).toBe('low') // No specific context provided
      expect(response.relatedQuestions).toBeDefined()
    })

    it('infers query type from natural language', async () => {
      const response = await regsBot.ask({
        question: 'What do I need to monitor under Part 75?',
      })

      expect(response.data.monitoringRequirements).toBeDefined()
      expect(response.answer).toContain('monitor')
    })

    it('accepts structured query type', async () => {
      const response = await regsBot.ask({
        queryType: 'what-to-calculate',
      })

      expect(response.data.calculationRequirements).toBeDefined()
      expect(response.answer).toContain('calculation')
    })

    it('has higher confidence with ORIS code context', async () => {
      const mockEcmpsClient = {
        getFacility: vi.fn().mockResolvedValue(createMockFacility()),
        getMonitoringPlan: vi.fn().mockResolvedValue(createMockMonitoringPlan()),
        getFacilityPrograms: vi.fn().mockResolvedValue(['ARP']),
        getMonitorMethods: vi.fn(),
      }

      const service = new RegsBotService({ ecmpsClient: mockEcmpsClient as never })

      const response = await service.ask({
        question: 'What QA tests do I need?',
        context: { orisCode: 5678 },
      })

      expect(response.confidence).toBe('high') // Has monitoring plan
    })

    it('has higher confidence with provided monitoring plan', async () => {
      const response = await regsBot.ask({
        queryType: 'qa-requirements',
        context: { monitoringPlan: createMockMonitoringPlan() },
      })

      expect(response.confidence).toBe('high')
      expect(response.data.qaRequirements).toBeDefined()
    })

    it('returns applicable regulations', async () => {
      const response = await regsBot.ask({
        queryType: 'applicable-regulations',
      })

      expect(response.data.regulations).toBeDefined()
      const regulations = response.data.regulations ?? []
      expect(regulations.length).toBeGreaterThan(0)
      expect(regulations[0]?.cfr).toContain('CFR')
    })

    it('returns citations for the answer', async () => {
      const response = await regsBot.ask({
        queryType: 'qa-requirements',
      })

      expect(response.citations).toBeDefined()
      expect(response.citations.length).toBeGreaterThan(0)
      const firstCitation = response.citations[0]
      expect(firstCitation).toBeDefined()
      expect(firstCitation?.source).toBeDefined()
      expect(firstCitation?.reference).toBeDefined()
    })

    it('suggests related questions', async () => {
      const response = await regsBot.ask({
        question: 'What parameters need monitoring?',
      })

      expect(response.relatedQuestions).toBeDefined()
      expect(response.relatedQuestions?.length).toBeGreaterThan(0)
    })

    it('includes warnings when context is missing', async () => {
      const response = await regsBot.ask({
        question: 'What are my emission limits?',
      })

      expect(response.warnings).toBeDefined()
      expect(response.warnings?.length).toBeGreaterThan(0)
      expect(response.warnings?.[0]).toContain('monitoring plan')
    })

    it('answers emission limit questions', async () => {
      const response = await regsBot.ask({
        queryType: 'emission-limits',
        context: { programs: ['ARP'] },
      })

      expect(response.answer).toContain('limit')
      expect(response.data.regulations).toBeDefined()
    })

    it('answers missing data questions', async () => {
      const response = await regsBot.ask({
        queryType: 'missing-data',
      })

      expect(response.data.substitutionRequirements).toBeDefined()
      expect(response.answer).toContain('substitut')
    })

    it('answers recordkeeping questions', async () => {
      const response = await regsBot.ask({
        queryType: 'what-to-record',
      })

      expect(response.data.recordkeepingRequirements).toBeDefined()
      expect(response.answer).toContain('record')
    })

    it('answers reporting questions', async () => {
      const response = await regsBot.ask({
        queryType: 'reporting-requirements',
      })

      expect(response.data.reportingRequirements).toBeDefined()
      expect(response.answer.toLowerCase()).toContain('report')
    })

    it('uses monitoring plan data when provided in context', async () => {
      const plan = createMockMonitoringPlan()

      const response = await regsBot.ask({
        queryType: 'what-to-monitor',
        context: { monitoringPlan: plan },
      })

      // Should include monitoring requirements derived from the plan
      expect(response.data.monitoringRequirements).toBeDefined()
      const params = response.data.monitoringRequirements?.map((r) => r.parameter)
      // Plan has SO2, NOX, FLOW, O2
      expect(params?.some((p) => p.includes('SO2') || p.includes('Sulfur'))).toBe(true)
    })

    it('includes location ID in answer when provided', async () => {
      const response = await regsBot.ask({
        question: 'What monitoring is required?',
        context: { orisCode: 3, locationId: '7B' },
      })

      expect(response.answer).toContain('7B')
    })
  })
})
