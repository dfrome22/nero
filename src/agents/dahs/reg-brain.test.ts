import { describe, it, expect } from 'vitest'
import { inferRegulatoryRequirements } from './reg-brain'
import type { MonitoringPlan } from '../../types/dahs-domain'

describe('RegBrainAgent', () => {
  describe('inferRegulatoryRequirements', () => {
    it('should return empty arrays for empty monitoring plan', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [],
        methods: [],
        programs: [],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.requiredParameters).toEqual([])
      expect(result.requiredObjects).toEqual([])
      expect(result.qaRequirements).toEqual([])
      expect(result.notes).toEqual([])
    })

    it('should identify ARP program requirements in notes', () => {
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

      const result = inferRegulatoryRequirements(plan)

      expect(result.notes).toContain(
        'ARP program: SO2M, NOXM/NOXR, CO2M, HI, OPTIME, OPHOURS summaries required.'
      )
    })

    it('should identify CSAPR NOx Ozone Season requirements', () => {
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
        programs: ['CSAPR_NOX_OS'],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.notes.some((note) => note.includes('CSAPR NOx Ozone Season'))).toBe(true)
      expect(result.notes.some((note) => note.includes('DAILY_BACKSTOP'))).toBe(true)
    })

    it('should infer SO2M requirement for ARP with CEM method', () => {
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
        methods: [
          {
            locationId: 'U1',
            parameter: 'SO2M',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP'],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.requiredParameters).toContainEqual(
        expect.objectContaining({
          locationId: 'U1',
          parameter: 'SO2M',
          method: 'CEM',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          requiredBy: expect.arrayContaining(['ARP']),
        })
      )
    })

    it('should require HOURLY object for CEM parameters', () => {
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
        methods: [
          {
            locationId: 'U1',
            parameter: 'SO2M',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP'],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.requiredObjects).toContainEqual(
        expect.objectContaining({
          objectType: 'HOURLY',
          parameter: 'SO2M',
          locationId: 'U1',
        })
      )
    })

    it('should require SUMMARY object for ARP programs', () => {
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
        methods: [
          {
            locationId: 'U1',
            parameter: 'SO2M',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP'],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.requiredObjects).toContainEqual(
        expect.objectContaining({
          objectType: 'SUMMARY',
        })
      )
    })

    it('should require RATA for CEM systems', () => {
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
        methods: [
          {
            locationId: 'U1',
            parameter: 'SO2M',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP'],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.qaRequirements).toContainEqual(
        expect.objectContaining({
          locationId: 'U1',
          parameter: 'SO2M',
          testType: 'RATA',
        })
      )
    })

    it('should require LINEARITY for CEM systems', () => {
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
        methods: [
          {
            locationId: 'U1',
            parameter: 'NOXM',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP'],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.qaRequirements).toContainEqual(
        expect.objectContaining({
          locationId: 'U1',
          parameter: 'NOXM',
          testType: 'LINEARITY',
        })
      )
    })

    it('should handle LME (Low Mass Emissions) exemption', () => {
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
        methods: [
          {
            locationId: 'U1',
            parameter: 'SO2M',
            methodCode: 'LME',
            isLME: true,
          },
        ],
        programs: ['ARP'],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.requiredParameters).toContainEqual(
        expect.objectContaining({
          locationId: 'U1',
          parameter: 'SO2M',
          method: 'LME',
        })
      )

      const hasLowMass = result.notes.some((note: string) => note.includes('Low Mass'))
      expect(hasLowMass).toBe(true)
    })

    it('should handle Appendix D fuel flow methodology', () => {
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
        methods: [
          {
            locationId: 'U1',
            parameter: 'SO2M',
            methodCode: 'AD',
          },
        ],
        programs: ['ARP'],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.requiredParameters).toContainEqual(
        expect.objectContaining({
          locationId: 'U1',
          parameter: 'SO2M',
          method: 'AD',
        })
      )
      expect(result.qaRequirements).toContainEqual(
        expect.objectContaining({
          locationId: 'U1',
          testType: 'FUEL_FLOW_ACCURACY',
        })
      )
    })

    it('should handle multiple programs with overlapping requirements', () => {
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
        methods: [
          {
            locationId: 'U1',
            parameter: 'NOXM',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP', 'CSAPR_NOX_ANN'],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.requiredParameters).toContainEqual(
        expect.objectContaining({
          locationId: 'U1',
          parameter: 'NOXM',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          requiredBy: expect.arrayContaining(['ARP', 'CSAPR_NOX_ANN']),
        })
      )
    })

    it('should handle common stack configuration', () => {
      const plan: MonitoringPlan = {
        facilityId: 'TEST-001',
        locations: [
          {
            id: 'U1',
            type: 'UNIT',
            configurationType: 'COMMON_STACK',
            connectedTo: ['CS1'],
          },
          {
            id: 'U2',
            type: 'UNIT',
            configurationType: 'COMMON_STACK',
            connectedTo: ['CS1'],
          },
          {
            id: 'CS1',
            type: 'STACK',
            configurationType: 'COMMON_STACK',
            connectedTo: ['U1', 'U2'],
          },
        ],
        methods: [
          {
            locationId: 'CS1',
            parameter: 'SO2M',
            methodCode: 'CEM',
          },
        ],
        programs: ['ARP'],
      }

      const result = inferRegulatoryRequirements(plan)

      const hasCommonStack = result.notes.some((note: string) => note.includes('common stack'))
      expect(hasCommonStack).toBe(true)
      expect(result.requiredParameters).toContainEqual(
        expect.objectContaining({
          locationId: 'CS1',
          parameter: 'SO2M',
        })
      )
    })

    it('should require DAILY_CO2 for CSAPR programs', () => {
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
        methods: [
          {
            locationId: 'U1',
            parameter: 'CO2M',
            methodCode: 'CEM',
          },
        ],
        programs: ['CSAPR_SO2'],
      }

      const result = inferRegulatoryRequirements(plan)

      expect(result.requiredObjects).toContainEqual(
        expect.objectContaining({
          objectType: 'DAILY_CO2',
        })
      )
    })
  })
})
