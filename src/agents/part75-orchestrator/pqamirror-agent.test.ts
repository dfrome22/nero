/**
 * PQAMirrorAgent Tests
 *
 * Tests for the compliance check rule generator.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { MonitoringRequirement, QARequirement } from '../../types/orchestration'
import type { CalculationPlanItem } from '../../types/part75-orchestrator'
import { PQAMirrorAgent } from './pqamirror-agent'

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockQARequirements = (): QARequirement[] => [
  {
    id: 'qa-cal-so2',
    testType: 'daily_calibration',
    parameterCode: 'SO2',
    frequency: 'daily',
    toleranceCriteria: '±2.5% of span',
    regulatoryBasis: '40 CFR 75 Appendix B',
    consequenceOfFailure: 'Data invalidation',
    notes: [],
  },
  {
    id: 'qa-rata-so2',
    testType: 'rata',
    parameterCode: 'SO2',
    frequency: 'semi-annual',
    toleranceCriteria: '≤10% RA',
    regulatoryBasis: '40 CFR 75 Appendix B',
    consequenceOfFailure: 'Loss of certification',
    notes: [],
  },
]

const createMockMonitoringRequirements = (): MonitoringRequirement[] => [
  {
    id: 'mon-so2',
    parameter: 'Sulfur Dioxide',
    methodCode: 'CEM',
    systemType: 'SO2',
    frequency: 'continuous',
    regulatoryBasis: '40 CFR 75.10',
    applicablePrograms: ['ARP'],
    notes: [],
  },
]

const createMockCalculationPlan = (): CalculationPlanItem[] => [
  {
    id: 'calc-so2-avg',
    name: 'SO2 Hourly Average',
    calculationType: 'hourly_average',
    inputs: ['SO2'],
    output: 'SO2_AVG',
    units: 'ppm',
    frequency: 'hourly',
    regulatoryBasis: '40 CFR 75',
    dependencies: [],
    executionOrder: 1,
  },
]

// ============================================================================
// TESTS
// ============================================================================

describe('PQAMirrorAgent', () => {
  let agent: PQAMirrorAgent

  beforeEach(() => {
    agent = new PQAMirrorAgent()
  })

  describe('generateRules', () => {
    it('should generate compliance rules from QA requirements', () => {
      const result = agent.generateRules({
        qaRequirements: createMockQARequirements(),
        monitoringRequirements: createMockMonitoringRequirements(),
        calculationPlan: createMockCalculationPlan(),
        programs: ['ARP'],
      })

      expect(result).toBeDefined()
      expect(result.rules).toBeDefined()
      expect(result.rules.length).toBeGreaterThan(0)
    })

    it('should create rules for daily calibration checks', () => {
      const result = agent.generateRules({
        qaRequirements: createMockQARequirements(),
        monitoringRequirements: createMockMonitoringRequirements(),
        calculationPlan: createMockCalculationPlan(),
        programs: ['ARP'],
      })

      const calRules = result.rules.filter((r) => r.category === 'qa_result')
      expect(calRules.length).toBeGreaterThan(0)
    })

    it('should create data quality rules', () => {
      const result = agent.generateRules({
        qaRequirements: createMockQARequirements(),
        monitoringRequirements: createMockMonitoringRequirements(),
        calculationPlan: createMockCalculationPlan(),
        programs: ['ARP'],
      })

      const dataQualityRules = result.rules.filter((r) => r.category === 'data_quality')
      expect(dataQualityRules.length).toBeGreaterThan(0)
    })

    it('should group rules by category', () => {
      const result = agent.generateRules({
        qaRequirements: createMockQARequirements(),
        monitoringRequirements: createMockMonitoringRequirements(),
        calculationPlan: createMockCalculationPlan(),
        programs: ['ARP'],
      })

      expect(result.rulesByCategory).toBeDefined()
      expect(typeof result.rulesByCategory).toBe('object')
    })

    it('should identify critical rules', () => {
      const result = agent.generateRules({
        qaRequirements: createMockQARequirements(),
        monitoringRequirements: createMockMonitoringRequirements(),
        calculationPlan: createMockCalculationPlan(),
        programs: ['ARP'],
      })

      expect(result.criticalRules).toBeDefined()
      expect(result.criticalRules.length).toBeGreaterThan(0)
    })

    it('should provide summary with rule counts', () => {
      const result = agent.generateRules({
        qaRequirements: createMockQARequirements(),
        monitoringRequirements: createMockMonitoringRequirements(),
        calculationPlan: createMockCalculationPlan(),
        programs: ['ARP'],
      })

      expect(result.summary).toBeDefined()
      expect(result.summary.totalRules).toBeGreaterThan(0)
      expect(result.summary.criticalRules).toBeGreaterThanOrEqual(0)
    })

    it('should set data quality thresholds', () => {
      const result = agent.generateRules({
        qaRequirements: createMockQARequirements(),
        monitoringRequirements: createMockMonitoringRequirements(),
        calculationPlan: createMockCalculationPlan(),
        programs: ['ARP'],
      })

      expect(result.dataQualityThresholds).toBeDefined()
      expect(result.dataQualityThresholds.minimumDataAvailability).toBe(0.9)
      expect(result.dataQualityThresholds.calibrationErrorTolerance).toBe(0.025)
    })
  })

  describe('rule severity', () => {
    it('should mark calibration errors as critical', () => {
      const result = agent.generateRules({
        qaRequirements: createMockQARequirements(),
        monitoringRequirements: createMockMonitoringRequirements(),
        calculationPlan: createMockCalculationPlan(),
        programs: ['ARP'],
      })

      const calRules = result.rules.filter((r) => r.name.toLowerCase().includes('calibration'))
      expect(calRules.some((r) => r.severity === 'critical')).toBe(true)
    })

    it('should mark missing data as warning', () => {
      const result = agent.generateRules({
        qaRequirements: createMockQARequirements(),
        monitoringRequirements: createMockMonitoringRequirements(),
        calculationPlan: createMockCalculationPlan(),
        programs: ['ARP'],
      })

      const missingDataRules = result.rules.filter((r) => r.category === 'missing_data')
      if (missingDataRules.length > 0) {
        expect(missingDataRules.some((r) => r.severity === 'warning')).toBe(true)
      }
    })
  })
})
