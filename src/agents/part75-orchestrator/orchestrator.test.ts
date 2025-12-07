/**
 * Part75Orchestrator Integration Tests
 *
 * Tests for the complete orchestration of all four agents.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { MonitoringPlan } from '../../types/ecmps-api'
import { Part75Orchestrator } from './index'

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockMonitoringPlan = (): MonitoringPlan => ({
  monitorPlanId: 'MP-ORCH-001',
  facilityId: 1234,
  facilityName: 'Orchestrator Test Plant',
  orisCode: 9999,
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

describe('Part75Orchestrator', () => {
  let orchestrator: Part75Orchestrator

  beforeEach(() => {
    orchestrator = new Part75Orchestrator()
  })

  describe('analyze', () => {
    it('should orchestrate all four agents', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({ monitoringPlan: plan })

      expect(result).toBeDefined()
      expect(result.regulatoryAnalysis).toBeDefined()
      expect(result.calculationPlan).toBeDefined()
      expect(result.complianceRules).toBeDefined()
      expect(result.explanation).toBeDefined()
    })

    it('should provide regulatory analysis from RegBrainAgent', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({ monitoringPlan: plan })

      expect(result.regulatoryAnalysis.facilityInfo.facilityName).toBe('Orchestrator Test Plant')
      expect(result.regulatoryAnalysis.monitoringRequirements.length).toBeGreaterThan(0)
      expect(result.regulatoryAnalysis.qaRequirements.length).toBeGreaterThan(0)
    })

    it('should provide calculation plan from CalcPlannerAgent', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({ monitoringPlan: plan })

      expect(result.calculationPlan.calculations.length).toBeGreaterThan(0)
      expect(result.calculationPlan.executionSequence.length).toBeGreaterThan(0)
      expect(result.calculationPlan.summary).toBeDefined()
    })

    it('should provide compliance rules from PQAMirrorAgent', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({ monitoringPlan: plan })

      expect(result.complianceRules.rules.length).toBeGreaterThan(0)
      expect(result.complianceRules.criticalRules.length).toBeGreaterThan(0)
      expect(result.complianceRules.dataQualityThresholds).toBeDefined()
    })

    it('should provide explanation from ExplainerAgent', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({ monitoringPlan: plan })

      expect(result.explanation.title).toBeDefined()
      expect(result.explanation.summary).toBeDefined()
      expect(result.explanation.sections.length).toBeGreaterThan(0)
    })

    it('should set overall confidence', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({ monitoringPlan: plan })

      expect(result.overallConfidence).toBeDefined()
      expect(['high', 'medium', 'low']).toContain(result.overallConfidence)
    })

    it('should include summary notes', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({ monitoringPlan: plan })

      expect(result.notes).toBeDefined()
      expect(result.notes.length).toBeGreaterThan(0)
    })

    it('should support disabling explanations', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({ monitoringPlan: plan }, { includeExplanations: false })

      expect(result.explanation.sections.length).toBe(0)
    })

    it('should support different explanation detail levels', () => {
      const plan = createMockMonitoringPlan()

      const summaryResult = orchestrator.analyze(
        { monitoringPlan: plan },
        { explanationDetail: 'summary' }
      )

      const detailedResult = orchestrator.analyze(
        { monitoringPlan: plan },
        { explanationDetail: 'detailed' }
      )

      expect(summaryResult.explanation.sections.length).toBeLessThanOrEqual(
        detailedResult.explanation.sections.length
      )
    })

    it('should filter to specific location when requested', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({
        monitoringPlan: plan,
        locationId: 'CS1',
      })

      expect(result.regulatoryAnalysis.locations).toHaveLength(1)
      expect(result.regulatoryAnalysis.locations.length).toBeGreaterThan(0)
      expect(result.regulatoryAnalysis.locations[0]?.locationId).toBe('CS1')
    })
  })

  describe('integration scenarios', () => {
    it('should handle coal-fired unit with ARP requirements', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({ monitoringPlan: plan })

      expect(result.regulatoryAnalysis.facilityInfo.programs).toContain('ARP')

      // Should have SO2 and NOX monitoring
      expect(result.regulatoryAnalysis).toBeDefined()
      expect(result.regulatoryAnalysis.monitoringRequirements).toBeDefined()
      const params = result.regulatoryAnalysis.monitoringRequirements.map((r) => r.parameter)
      expect(params).toContain('Sulfur Dioxide')
      expect(params).toContain('Nitrogen Oxides')

      // Should have mass emission calculations
      expect(result.calculationPlan).toBeDefined()
      const calcTypes = result.calculationPlan.calculations.map((c) => c.calculationType)
      expect(calcTypes).toContain('mass_emission')

      // Should have calibration rules
      const ruleNames = result.complianceRules.rules.map((r) => r.name)
      expect(ruleNames.some((n) => n.includes('Calibration'))).toBe(true)
    })

    it('should provide comprehensive output for facility analysis', () => {
      const plan = createMockMonitoringPlan()
      const result = orchestrator.analyze({ monitoringPlan: plan })

      // Verify completeness of analysis
      expect(result.regulatoryAnalysis.monitoringRequirements.length).toBeGreaterThanOrEqual(3)
      expect(result.regulatoryAnalysis.applicableRegulations.length).toBeGreaterThan(0)
      expect(result.calculationPlan.calculations.length).toBeGreaterThan(5)
      expect(result.complianceRules.rules.length).toBeGreaterThan(10)
      expect(result.explanation.keyTakeaways.length).toBeGreaterThan(0)
    })
  })
})
