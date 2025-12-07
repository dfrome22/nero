/**
 * CalcPlannerAgent Tests
 *
 * Tests for the calculation planning agent.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { MonitoringRequirement } from '../../types/orchestration'
import { CalcPlannerAgent } from './calcplanner-agent'

// ============================================================================
// MOCK DATA
// ============================================================================

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
  {
    id: 'mon-nox',
    parameter: 'Nitrogen Oxides',
    methodCode: 'CEM',
    systemType: 'NOX',
    frequency: 'continuous',
    regulatoryBasis: '40 CFR 75.10',
    applicablePrograms: ['ARP'],
    notes: [],
  },
  {
    id: 'mon-flow',
    parameter: 'Stack Gas Flow',
    methodCode: 'CEM',
    systemType: 'FLOW',
    frequency: 'continuous',
    regulatoryBasis: '40 CFR 75.10',
    applicablePrograms: ['ARP'],
    notes: [],
  },
  {
    id: 'mon-o2',
    parameter: 'Oxygen',
    methodCode: 'CEM',
    systemType: 'O2',
    frequency: 'continuous',
    regulatoryBasis: '40 CFR 75.10',
    applicablePrograms: ['ARP'],
    notes: [],
  },
]

// ============================================================================
// TESTS
// ============================================================================

describe('CalcPlannerAgent', () => {
  let agent: CalcPlannerAgent

  beforeEach(() => {
    agent = new CalcPlannerAgent()
  })

  describe('plan', () => {
    it('should generate calculation plan from monitoring requirements', () => {
      const requirements = createMockMonitoringRequirements()
      const result = agent.plan({
        monitoringRequirements: requirements,
        programs: ['ARP'],
        parameters: ['SO2', 'NOX', 'FLOW', 'O2'],
      })

      expect(result).toBeDefined()
      expect(result.calculations).toBeDefined()
      expect(result.calculations.length).toBeGreaterThan(0)
    })

    it('should include hourly average calculations for CEM parameters', () => {
      const requirements = createMockMonitoringRequirements()
      const result = agent.plan({
        monitoringRequirements: requirements,
        programs: ['ARP'],
        parameters: ['SO2', 'NOX', 'FLOW', 'O2'],
      })

      const hourlyAvgCalcs = result.calculations.filter(
        (c) => c.calculationType === 'hourly_average'
      )
      expect(hourlyAvgCalcs.length).toBeGreaterThan(0)
    })

    it('should include heat input calculation when flow and O2 are present', () => {
      const requirements = createMockMonitoringRequirements()
      const result = agent.plan({
        monitoringRequirements: requirements,
        programs: ['ARP'],
        parameters: ['SO2', 'NOX', 'FLOW', 'O2'],
      })

      const heatInputCalc = result.calculations.find((c) => c.calculationType === 'heat_input')
      expect(heatInputCalc).toBeDefined()
      expect(heatInputCalc?.output).toBe('HI')
    })

    it('should include mass emission calculations for SO2 and NOX', () => {
      const requirements = createMockMonitoringRequirements()
      const result = agent.plan({
        monitoringRequirements: requirements,
        programs: ['ARP'],
        parameters: ['SO2', 'NOX', 'FLOW', 'O2'],
      })

      const massCalcs = result.calculations.filter((c) => c.calculationType === 'mass_emission')
      expect(massCalcs.length).toBeGreaterThanOrEqual(2) // SO2 and NOX
    })

    it('should build dependency graph', () => {
      const requirements = createMockMonitoringRequirements()
      const result = agent.plan({
        monitoringRequirements: requirements,
        programs: ['ARP'],
        parameters: ['SO2', 'NOX', 'FLOW', 'O2'],
      })

      expect(result.dependencyGraph).toBeDefined()
      expect(typeof result.dependencyGraph).toBe('object')
    })

    it('should generate execution sequence', () => {
      const requirements = createMockMonitoringRequirements()
      const result = agent.plan({
        monitoringRequirements: requirements,
        programs: ['ARP'],
        parameters: ['SO2', 'NOX', 'FLOW', 'O2'],
      })

      expect(result.executionSequence).toBeDefined()
      expect(result.executionSequence.length).toBe(result.calculations.length)
    })

    it('should provide summary with calculation counts', () => {
      const requirements = createMockMonitoringRequirements()
      const result = agent.plan({
        monitoringRequirements: requirements,
        programs: ['ARP'],
        parameters: ['SO2', 'NOX', 'FLOW', 'O2'],
      })

      expect(result.summary).toBeDefined()
      expect(result.summary.hourlyAverages).toBeGreaterThan(0)
      expect(result.summary.heatInputCalcs).toBeGreaterThan(0)
      expect(result.summary.massEmissionCalcs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('dependency resolution', () => {
    it('should order hourly averages before mass emissions', () => {
      const requirements = createMockMonitoringRequirements()
      const result = agent.plan({
        monitoringRequirements: requirements,
        programs: ['ARP'],
        parameters: ['SO2', 'FLOW'],
      })

      const sequence = result.executionSequence
      const avgSO2Index = sequence.findIndex((id) => {
        const calc = result.calculations.find((c) => c.id === id)
        return calc?.calculationType === 'hourly_average' && calc.inputs.includes('SO2')
      })
      const massSO2Index = sequence.findIndex(
        (id) =>
          result.calculations.find((c) => c.id === id)?.calculationType === 'mass_emission' &&
          result.calculations.find((c) => c.id === id)?.output === 'SO2_MASS'
      )

      if (avgSO2Index !== -1 && massSO2Index !== -1) {
        expect(avgSO2Index).toBeLessThan(massSO2Index)
      }
    })

    it('should order heat input before emission rate', () => {
      const requirements = createMockMonitoringRequirements()
      const result = agent.plan({
        monitoringRequirements: requirements,
        programs: ['ARP'],
        parameters: ['NOX', 'FLOW', 'O2'],
      })

      const sequence = result.executionSequence
      const heatInputIndex = sequence.findIndex(
        (id) => result.calculations.find((c) => c.id === id)?.calculationType === 'heat_input'
      )
      const emissionRateIndex = sequence.findIndex(
        (id) => result.calculations.find((c) => c.id === id)?.calculationType === 'emission_rate'
      )

      if (heatInputIndex !== -1 && emissionRateIndex !== -1) {
        expect(heatInputIndex).toBeLessThan(emissionRateIndex)
      }
    })
  })
})
