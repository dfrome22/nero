/**
 * RegBrainAgent Tests
 *
 * Tests for the regulatory brain that infers DAHS requirements from monitoring plans.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { MonitoringPlan } from '../../types/ecmps-api'
import { RegBrainAgent } from './regbrain-agent'

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockMonitoringPlan = (): MonitoringPlan => ({
  monitorPlanId: 'MP-TEST-001',
  facilityId: 1234,
  facilityName: 'Test Power Plant',
  orisCode: 5678,
  stateCode: 'PA',
  unitStackConfigurations: [{ unitId: 'U1', stackPipeId: 'CS1', beginDate: '2020-01-01' }],
  locations: [{ locationId: 'CS1', locationType: 'stack', stackPipeId: 'CS1' }],
  methods: [
    {
      methodId: 'MTH-SO2',
      locationId: 'CS1',
      parameterCode: 'SO2',
      methodCode: 'CEM',
      substituteDataCode: 'SUBS75',
      beginDate: '2020-01-01',
    },
    {
      methodId: 'MTH-NOX',
      locationId: 'CS1',
      parameterCode: 'NOX',
      methodCode: 'CEM',
      beginDate: '2020-01-01',
    },
    {
      methodId: 'MTH-FLOW',
      locationId: 'CS1',
      parameterCode: 'FLOW',
      methodCode: 'CEM',
      beginDate: '2020-01-01',
    },
    {
      methodId: 'MTH-O2',
      locationId: 'CS1',
      parameterCode: 'O2',
      methodCode: 'CEM',
      beginDate: '2020-01-01',
    },
  ],
  systems: [
    {
      systemId: 'SYS-SO2',
      locationId: 'CS1',
      systemTypeCode: 'SO2',
      beginDate: '2020-01-01',
    },
    {
      systemId: 'SYS-NOX',
      locationId: 'CS1',
      systemTypeCode: 'NOX',
      beginDate: '2020-01-01',
    },
    {
      systemId: 'SYS-FLOW',
      locationId: 'CS1',
      systemTypeCode: 'FLOW',
      beginDate: '2020-01-01',
    },
  ],
  spans: [],
  qualifications: [],
})

// ============================================================================
// TESTS
// ============================================================================

describe('RegBrainAgent', () => {
  let agent: RegBrainAgent

  beforeEach(() => {
    agent = new RegBrainAgent()
  })

  describe('analyzeMonitoringPlan', () => {
    it('should analyze a basic monitoring plan', () => {
      const plan = createMockMonitoringPlan()
      const result = agent.analyze({ monitoringPlan: plan })

      expect(result).toBeDefined()
      expect(result.facilityInfo.orisCode).toBe(5678)
      expect(result.facilityInfo.facilityName).toBe('Test Power Plant')
      expect(result.locations).toHaveLength(1)
      expect(result.locations.length).toBeGreaterThan(0)
      expect(result.locations[0]?.locationId).toBe('CS1')
    })

    it('should infer monitoring requirements from CEM methods', () => {
      const plan = createMockMonitoringPlan()
      const result = agent.analyze({ monitoringPlan: plan })

      expect(result.monitoringRequirements).toBeDefined()
      expect(result.monitoringRequirements.length).toBeGreaterThan(0)

      // Should have SO2, NOX, FLOW monitoring requirements
      expect(result.monitoringRequirements).toBeDefined()
      const params = result.monitoringRequirements.map((r) => r.parameter)
      expect(params).toContain('Sulfur Dioxide')
      expect(params).toContain('Nitrogen Oxides')
      expect(params).toContain('Stack Gas Flow')
    })

    it('should identify applicable Part 75 regulations', () => {
      const plan = createMockMonitoringPlan()
      const result = agent.analyze({ monitoringPlan: plan })

      expect(result.applicableRegulations).toBeDefined()
      expect(result.applicableRegulations.length).toBeGreaterThan(0)

      // Should include core Part 75 regulations
      expect(result.applicableRegulations).toBeDefined()
      const cfrs = result.applicableRegulations.map((r) => r.cfr)
      expect(cfrs.some((c) => c.includes('75'))).toBe(true)
    })

    it('should infer QA requirements based on system types', () => {
      const plan = createMockMonitoringPlan()
      const result = agent.analyze({ monitoringPlan: plan })

      expect(result.qaRequirements).toBeDefined()
      expect(result.qaRequirements.length).toBeGreaterThan(0)

      // Should have daily calibration requirements
      expect(result.qaRequirements).toBeDefined()
      const testTypes = result.qaRequirements.map((q) => q.testType)
      expect(testTypes).toContain('daily_calibration')
    })

    it('should set high confidence for complete monitoring plans', () => {
      const plan = createMockMonitoringPlan()
      const result = agent.analyze({ monitoringPlan: plan })

      expect(result.confidence).toBe('high')
    })

    it('should filter to specific location when requested', () => {
      const plan = createMockMonitoringPlan()
      const result = agent.analyze({
        monitoringPlan: plan,
        locationId: 'CS1',
      })

      expect(result.locations).toHaveLength(1)
      expect(result.locations.length).toBeGreaterThan(0)
      expect(result.locations[0]?.locationId).toBe('CS1')
    })

    it('should handle monitoring plan with no systems', () => {
      const plan = createMockMonitoringPlan()
      plan.systems = []

      const result = agent.analyze({ monitoringPlan: plan })

      expect(result).toBeDefined()
      expect(result.confidence).toBe('medium')
    })
  })

  describe('inferProgramsFromPlan', () => {
    it('should infer ARP from SO2/NOX monitoring', () => {
      const plan = createMockMonitoringPlan()
      const result = agent.analyze({ monitoringPlan: plan })

      expect(result.facilityInfo.programs).toContain('ARP')
    })

    it('should infer programs from method codes', () => {
      const plan = createMockMonitoringPlan()
      // Add MATS-related parameter
      plan.methods.push({
        methodId: 'MTH-HG',
        locationId: 'CS1',
        parameterCode: 'HG',
        methodCode: 'CEM',
        beginDate: '2020-01-01',
      })

      const result = agent.analyze({ monitoringPlan: plan })

      expect(result.facilityInfo.programs.length).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should throw error when no monitoring plan provided', () => {
      expect(() => agent.analyze({})).toThrow()
    })

    it('should handle empty monitoring plan gracefully', () => {
      const emptyPlan: MonitoringPlan = {
        monitorPlanId: 'EMPTY',
        facilityId: 0,
        facilityName: 'Empty Facility',
        orisCode: 0,
        stateCode: 'XX',
        unitStackConfigurations: [],
        locations: [],
        methods: [],
        systems: [],
        spans: [],
        qualifications: [],
      }

      const result = agent.analyze({ monitoringPlan: emptyPlan })

      expect(result).toBeDefined()
      expect(result.confidence).toBe('low')
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })
})
