/**
 * ExplainerAgent Tests
 *
 * Tests for the human-readable explanation generator.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { MonitoringRequirement } from '../../types/orchestration'
import { ExplainerAgent } from './explainer-agent'

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockMonitoringRequirement = (): MonitoringRequirement => ({
  id: 'mon-so2',
  parameter: 'Sulfur Dioxide',
  methodCode: 'CEM',
  systemType: 'SO2',
  frequency: 'continuous',
  regulatoryBasis: '40 CFR 75.10',
  applicablePrograms: ['ARP'],
  notes: ['Continuous emissions monitoring required'],
})

// ============================================================================
// TESTS
// ============================================================================

describe('ExplainerAgent', () => {
  let agent: ExplainerAgent

  beforeEach(() => {
    agent = new ExplainerAgent()
  })

  describe('explain', () => {
    it('should generate explanation for monitoring requirement', () => {
      const requirement = createMockMonitoringRequirement()
      const result = agent.explain({
        subject: 'monitoring_requirement',
        item: requirement,
        detailLevel: 'detailed',
      })

      expect(result).toBeDefined()
      expect(result.title).toBeDefined()
      expect(result.summary).toBeDefined()
    })

    it('should include sections in explanation', () => {
      const requirement = createMockMonitoringRequirement()
      const result = agent.explain({
        subject: 'monitoring_requirement',
        item: requirement,
        detailLevel: 'detailed',
      })

      expect(result.sections).toBeDefined()
      expect(result.sections.length).toBeGreaterThan(0)
    })

    it('should provide key takeaways', () => {
      const requirement = createMockMonitoringRequirement()
      const result = agent.explain({
        subject: 'monitoring_requirement',
        item: requirement,
        detailLevel: 'detailed',
      })

      expect(result.keyTakeaways).toBeDefined()
      expect(result.keyTakeaways.length).toBeGreaterThan(0)
    })

    it('should include regulatory citations', () => {
      const requirement = createMockMonitoringRequirement()
      const result = agent.explain({
        subject: 'monitoring_requirement',
        item: requirement,
        detailLevel: 'detailed',
      })

      expect(result.citations).toBeDefined()
      expect(result.citations.length).toBeGreaterThan(0)
    })

    it('should provide summary level explanation', () => {
      const requirement = createMockMonitoringRequirement()
      const result = agent.explain({
        subject: 'monitoring_requirement',
        item: requirement,
        detailLevel: 'summary',
      })

      expect(result.summary).toBeDefined()
      expect(result.sections.length).toBeLessThanOrEqual(3)
    })

    it('should provide technical level explanation', () => {
      const requirement = createMockMonitoringRequirement()
      const result = agent.explain({
        subject: 'monitoring_requirement',
        item: requirement,
        detailLevel: 'technical',
      })

      expect(result.sections.length).toBeGreaterThan(0)
      // Technical explanations should have more detail
      const hasSubsections = result.sections.some(
        (s) => s.subsections !== undefined && s.subsections.length > 0
      )
      expect(hasSubsections).toBe(true)
    })

    it('should explain QA requirements', () => {
      const qaReq = {
        id: 'qa-cal',
        testType: 'daily_calibration',
        parameterCode: 'SO2',
        frequency: 'daily',
        toleranceCriteria: '±2.5% of span',
        regulatoryBasis: '40 CFR 75 Appendix B',
        consequenceOfFailure: 'Data invalidation',
        notes: [],
      }

      const result = agent.explain({
        subject: 'qa_requirement',
        item: qaReq,
        detailLevel: 'detailed',
      })

      expect(result.title.toLowerCase()).toContain('calibration')
      expect(result.summary).toBeDefined()
    })

    it('should explain calculations', () => {
      const calc = {
        id: 'calc-hi',
        name: 'Heat Input',
        calculationType: 'heat_input',
        inputs: ['FLOW', 'O2'],
        output: 'HI',
        units: 'MMBtu',
        frequency: 'hourly',
        formula: 'HI = Qh × Fd × (20.9/(20.9 - %O2)) × 10^-6',
        regulatoryBasis: '40 CFR 75 Appendix F',
      }

      const result = agent.explain({
        subject: 'calculation',
        item: calc,
        detailLevel: 'detailed',
      })

      expect(result.title).toContain('Heat Input')
      expect(result.sections.some((s) => s.heading.includes('Formula'))).toBe(true)
    })
  })

  describe('context awareness', () => {
    it('should use context in explanation', () => {
      const requirement = createMockMonitoringRequirement()
      const result = agent.explain({
        subject: 'monitoring_requirement',
        item: requirement,
        context: {
          facilityName: 'Test Power Plant',
          locationId: 'CS1',
          parameterCode: 'SO2',
        },
        detailLevel: 'detailed',
      })

      expect(result.summary).toContain('Test Power Plant')
    })
  })
})
