import { describe, it, expect } from 'vitest'
import { createCalculationPlan } from './calc-planner'
import type { MonitoringPlan, RequiredParameter } from '../../types/dahs-domain'

describe('CalcPlannerAgent', () => {
  describe('createCalculationPlan', () => {
    it('should return empty plan for empty inputs', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [],
        methods: [],
        programs: [],
      }
      const required: RequiredParameter[] = []

      const result = createCalculationPlan(plan, required)

      expect(result.methodPlans).toEqual([])
      expect(result.testCases).toBeInstanceOf(Array)
    })

    it('should create method plan for each required parameter', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [
          {
            id: 'U1',
            type: 'UNIT',
            configurationType: 'SINGLE',
            connectedTo: [],
          },
        ],
        methods: [],
        programs: ['ARP'],
      }
      const required: RequiredParameter[] = [
        {
          locationId: 'U1',
          parameter: 'SO2M',
          method: 'CEM',
          requiredBy: ['ARP'],
          reason: 'ARP requires SO2M monitoring',
        },
      ]

      const result = createCalculationPlan(plan, required)

      expect(result.methodPlans).toHaveLength(1)
      expect(result.methodPlans[0]).toMatchObject({
        locationId: 'U1',
        parameter: 'SO2M',
        method: 'CEM',
      })
    })

    it('should include regulatory basis in method plan notes', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [],
        methods: [],
        programs: ['ARP'],
      }
      const required: RequiredParameter[] = [
        {
          locationId: 'U1',
          parameter: 'NOXR',
          method: 'CEM',
          requiredBy: ['ARP'],
          reason: 'NOx rate required for ARP',
        },
      ]

      const result = createCalculationPlan(plan, required)

      expect(result.methodPlans[0]?.notes).toContain('Required by programs: ARP')
    })

    it('should generate test case for SO2M summary calculation', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [],
        methods: [
          {
            locationId: 'U1',
            parameter: 'SO2M',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP'],
      }
      const required: RequiredParameter[] = [
        {
          locationId: 'U1',
          parameter: 'SO2M',
          method: 'CEM',
          requiredBy: ['ARP'],
          reason: 'SO2M required',
        },
      ]

      const result = createCalculationPlan(plan, required)

      expect(result.testCases.some((tc) => tc.name.includes('so2'))).toBe(true)
    })

    it('should generate test case for heat input calculation', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [],
        methods: [
          {
            locationId: 'U1',
            parameter: 'HIT',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP'],
      }
      const required: RequiredParameter[] = [
        {
          locationId: 'U1',
          parameter: 'HIT',
          method: 'CEM',
          requiredBy: ['ARP'],
          reason: 'Heat input required',
        },
      ]

      const result = createCalculationPlan(plan, required)

      expect(
        result.testCases.some(
          (tc) => tc.name.includes('heat-input') || tc.description.includes('heat input')
        )
      ).toBe(true)
    })

    it('should generate test case for NOx rate calculation', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [],
        methods: [
          {
            locationId: 'U1',
            parameter: 'NOXR',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP'],
      }
      const required: RequiredParameter[] = [
        {
          locationId: 'U1',
          parameter: 'NOXR',
          method: 'CEM',
          requiredBy: ['ARP'],
          reason: 'NOx rate required',
        },
      ]

      const result = createCalculationPlan(plan, required)

      expect(
        result.testCases.some(
          (tc) => tc.description.includes('NOx') || tc.description.includes('rate')
        )
      ).toBe(true)
    })

    it('should generate test case for LME calculation', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [],
        methods: [
          {
            locationId: 'U1',
            parameter: 'NOXR',
            methodCode: 'LME',
            isLME: true,
          },
        ],
        programs: ['ARP'],
      }
      const required: RequiredParameter[] = [
        {
          locationId: 'U1',
          parameter: 'NOXR',
          method: 'LME',
          requiredBy: ['ARP'],
          reason: 'LME methodology',
        },
      ]

      const result = createCalculationPlan(plan, required)

      expect(
        result.testCases.some(
          (tc) => tc.name.includes('lme') || tc.description.toLowerCase().includes('low mass')
        )
      ).toBe(true)
    })

    it('should handle multiple parameters with different methods', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [],
        methods: [
          {
            locationId: 'U1',
            parameter: 'SO2M',
            methodCode: 'CEM',
          },
          {
            locationId: 'U1',
            parameter: 'NOXM',
            methodCode: 'AD',
          },
        ],
        programs: ['ARP'],
      }
      const required: RequiredParameter[] = [
        {
          locationId: 'U1',
          parameter: 'SO2M',
          method: 'CEM',
          requiredBy: ['ARP'],
          reason: 'CEM monitoring',
        },
        {
          locationId: 'U1',
          parameter: 'NOXM',
          method: 'AD',
          requiredBy: ['ARP'],
          reason: 'Appendix D',
        },
      ]

      const result = createCalculationPlan(plan, required)

      expect(result.methodPlans).toHaveLength(2)
      expect(result.methodPlans.find((mp) => mp.parameter === 'SO2M')?.method).toBe('CEM')
      expect(result.methodPlans.find((mp) => mp.parameter === 'NOXM')?.method).toBe('AD')
    })

    it('should generate appropriate test cases based on monitoring plan', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [],
        methods: [
          {
            locationId: 'U1',
            parameter: 'SO2M',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP', 'CSAPR_SO2'],
      }
      const required: RequiredParameter[] = [
        {
          locationId: 'U1',
          parameter: 'SO2M',
          method: 'CEM',
          requiredBy: ['ARP', 'CSAPR_SO2'],
          reason: 'Multiple programs',
        },
      ]

      const result = createCalculationPlan(plan, required)

      expect(result.testCases.length).toBeGreaterThan(0)
      // Should have test cases that verify calculations for both programs
      expect(result.testCases.some((tc) => tc.description.length > 0)).toBe(true)
    })

    it('should include notes about DAHS implementation', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [],
        methods: [],
        programs: ['ARP'],
      }
      const required: RequiredParameter[] = [
        {
          locationId: 'U1',
          parameter: 'SO2M',
          method: 'CEM',
          requiredBy: ['ARP'],
          reason: 'Test reason',
        },
      ]

      const result = createCalculationPlan(plan, required)

      expect(result.methodPlans[0]?.notes.length).toBeGreaterThan(0)
    })
  })
})
