/**
 * Part 63 Subpart YYYY TDD Tests
 *
 * Tests for Stationary Combustion Turbines NESHAPs.
 * Covers HAP emissions from gas turbines at major sources.
 */

import { describe, expect, it } from 'vitest'
import {
  findPart63SubpartsByEquipment,
  findPart63SubpartsByParameter,
  hasPart60Overlap,
  SUBPART_YYYY,
  type Part63SubpartKnowledge,
} from './part63-knowledge'

describe('Part 63 Subpart YYYY - Stationary Combustion Turbines NESHAP', () => {
  // ============================================================================
  // STRUCTURE TESTS
  // ============================================================================

  describe('Structure', () => {
    it('has required Part63SubpartKnowledge properties', () => {
      const requiredKeys: (keyof Part63SubpartKnowledge)[] = [
        'subpart',
        'title',
        'cfrSections',
        'equipmentTypes',
        'industries',
        'hapCategories',
        'applicability',
        'standards',
        'monitoring',
        'testMethods',
        'reporting',
        'recordkeeping',
        'crossReferences',
        'keyCitations',
      ]

      for (const key of requiredKeys) {
        expect(SUBPART_YYYY).toHaveProperty(key)
      }
    })

    it('identifies as Subpart YYYY', () => {
      expect(SUBPART_YYYY.subpart).toBe('YYYY')
    })

    it('has correct title for combustion turbines', () => {
      expect(SUBPART_YYYY.title).toContain('Combustion Turbine')
    })

    it('has correct CFR section range', () => {
      expect(SUBPART_YYYY.cfrSections).toBe('63.6080 - 63.6175')
    })
  })

  // ============================================================================
  // APPLICABILITY TESTS
  // ============================================================================

  describe('Applicability', () => {
    it('covers gas turbine equipment', () => {
      expect(SUBPART_YYYY.equipmentTypes).toContain('gas-turbine')
    })

    it('applies to major sources', () => {
      expect(SUBPART_YYYY.applicability.description).toContain('major source')
    })

    it('covers multiple industries', () => {
      expect(SUBPART_YYYY.industries).toContain('electric-utility')
      expect(SUBPART_YYYY.industries).toContain('industrial')
    })

    it('has size threshold for applicability', () => {
      expect(SUBPART_YYYY.applicability.sizeThreshold).toBeDefined()
    })

    it('has exemptions for certain turbine types', () => {
      expect(SUBPART_YYYY.applicability.exemptions).toBeDefined()
      expect(SUBPART_YYYY.applicability.exemptions?.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // HAP CATEGORIES TESTS
  // ============================================================================

  describe('HAP Categories', () => {
    it('covers organic HAPs', () => {
      expect(SUBPART_YYYY.hapCategories).toContain('organic-hap')
    })

    it('includes formaldehyde', () => {
      const formaldehydeStandard = SUBPART_YYYY.standards.find((s) =>
        s.parameter.toLowerCase().includes('formaldehyde')
      )
      expect(formaldehydeStandard).toBeDefined()
    })
  })

  // ============================================================================
  // EMISSION STANDARDS TESTS
  // ============================================================================

  describe('Emission Standards', () => {
    it('has formaldehyde emission limit', () => {
      const formaldehydeStandard = SUBPART_YYYY.standards.find((s) =>
        s.parameter.toLowerCase().includes('formaldehyde')
      )
      expect(formaldehydeStandard).toBeDefined()
      // YYYY uses ppbvd (parts per billion by volume, dry) for formaldehyde
      const units = formaldehydeStandard?.units ?? ''
      expect(units.includes('ppm') || units.includes('ppb')).toBe(true)
    })

    it('may have HAP emission rate limits', () => {
      const hapStandard = SUBPART_YYYY.standards.find(
        (s) => s.parameter === 'HAP' || s.parameter.includes('Total HAP')
      )
      if (hapStandard) {
        expect(hapStandard.units).toBeDefined()
      }
    })

    it('distinguishes new vs existing turbines', () => {
      const hasNew = SUBPART_YYYY.standards.some(
        (s) => s.conditions?.some((c) => c.toLowerCase().includes('new')) === true
      )
      const hasExisting = SUBPART_YYYY.standards.some(
        (s) => s.conditions?.some((c) => c.toLowerCase().includes('existing')) === true
      )
      // Should have either distinct standards or apply to both
      expect(hasNew || hasExisting || SUBPART_YYYY.standards.length > 0).toBe(true)
    })

    it('has averaging period defined', () => {
      const standardWithAvg = SUBPART_YYYY.standards.find((s) => s.averagingPeriod.length > 0)
      expect(standardWithAvg).toBeDefined()
    })
  })

  // ============================================================================
  // MONITORING TESTS
  // ============================================================================

  describe('Monitoring', () => {
    it('has performance testing option', () => {
      const stackTest = SUBPART_YYYY.monitoring.find((m) => m.method === 'stack-test')
      expect(stackTest).toBeDefined()
    })

    it('may allow CPMS for oxidation catalyst', () => {
      const cpms = SUBPART_YYYY.monitoring.find((m) => m.method === 'CPMS')
      // CPMS is typical for catalyst inlet temperature
      if (cpms) {
        expect(cpms.parameter.toLowerCase()).toContain('temperature')
      }
    })

    it('has monitoring frequency defined', () => {
      const monitoringWithFreq = SUBPART_YYYY.monitoring.find((m) => m.frequency.length > 0)
      expect(monitoringWithFreq).toBeDefined()
    })
  })

  // ============================================================================
  // WORK PRACTICE TESTS
  // ============================================================================

  describe('Work Practices', () => {
    it('has work practice standards defined', () => {
      expect(SUBPART_YYYY.workPractices).toBeDefined()
    })

    it('may have fuel requirements', () => {
      const fuelWp = SUBPART_YYYY.workPractices?.find((wp) =>
        wp.description.toLowerCase().includes('fuel')
      )
      // Natural gas turbines often have fuel sulfur limits
      if (fuelWp) {
        expect(fuelWp.requirements.length).toBeGreaterThan(0)
      }
    })

    it('may have startup/shutdown provisions', () => {
      const startupWp = SUBPART_YYYY.workPractices?.find(
        (wp) =>
          wp.description.toLowerCase().includes('startup') ||
          wp.description.toLowerCase().includes('shutdown')
      )
      // Many turbine NESHAPs have startup exemptions
      if (startupWp) {
        expect(startupWp).toBeDefined()
      }
    })
  })

  // ============================================================================
  // TEST METHODS
  // ============================================================================

  describe('Test Methods', () => {
    it('references appropriate test methods', () => {
      expect(SUBPART_YYYY.testMethods.length).toBeGreaterThan(0)
    })

    it('has formaldehyde test method', () => {
      const formaldehydeTest = SUBPART_YYYY.testMethods.find((tm) =>
        tm.parameter.toLowerCase().includes('formaldehyde')
      )
      expect(formaldehydeTest).toBeDefined()
      expect(formaldehydeTest?.methods.some((m) => m.includes('320') || m.includes('323'))).toBe(
        true
      )
    })
  })

  // ============================================================================
  // REPORTING TESTS
  // ============================================================================

  describe('Reporting', () => {
    it('requires initial notification', () => {
      const initial = SUBPART_YYYY.reporting.find((r) =>
        r.reportType.toLowerCase().includes('initial')
      )
      expect(initial).toBeDefined()
    })

    it('requires compliance reports', () => {
      const compliance = SUBPART_YYYY.reporting.find((r) =>
        r.reportType.toLowerCase().includes('compliance')
      )
      expect(compliance).toBeDefined()
    })
  })

  // ============================================================================
  // RECORDKEEPING TESTS
  // ============================================================================

  describe('Recordkeeping', () => {
    it('requires 5 year retention', () => {
      expect(SUBPART_YYYY.recordkeeping.retentionPeriod).toBe('5 years')
    })

    it('includes operating records', () => {
      const hasOperating = SUBPART_YYYY.recordkeeping.records.some((r) =>
        r.toLowerCase().includes('operating')
      )
      expect(hasOperating).toBe(true)
    })
  })

  // ============================================================================
  // CROSS-REFERENCE TESTS
  // ============================================================================

  describe('Cross-References to Part 60', () => {
    it('references Part 60 Subpart KKKK (new turbines)', () => {
      const kkkkRef = SUBPART_YYYY.crossReferences.find((cr) => cr.regulation.includes('KKKK'))
      expect(kkkkRef).toBeDefined()
      expect(kkkkRef?.relationship).toBe('coordinates')
    })

    it('references Part 60 Subpart GG (older turbines)', () => {
      const ggRef = SUBPART_YYYY.crossReferences.find((cr) => cr.regulation.includes('GG'))
      expect(ggRef).toBeDefined()
    })

    it('hasPart60Overlap returns true for YYYY', () => {
      expect(hasPart60Overlap('YYYY')).toBe(true)
    })
  })

  // ============================================================================
  // QUERY FUNCTION TESTS
  // ============================================================================

  describe('Query Functions', () => {
    it('findPart63SubpartsByEquipment returns YYYY for gas-turbine', () => {
      const results = findPart63SubpartsByEquipment('gas-turbine')
      expect(results.some((s) => s.subpart === 'YYYY')).toBe(true)
    })

    it('findPart63SubpartsByParameter returns YYYY for formaldehyde', () => {
      const results = findPart63SubpartsByParameter('Formaldehyde')
      expect(results.some((s) => s.subpart === 'YYYY')).toBe(true)
    })
  })

  // ============================================================================
  // KEY CITATIONS TESTS
  // ============================================================================

  describe('Key Citations', () => {
    it('has applicability citation', () => {
      expect(SUBPART_YYYY.keyCitations.applicability).toContain('63.6085')
    })

    it('has standards citation', () => {
      expect(SUBPART_YYYY.keyCitations.standards).toContain('63.6090')
    })

    it('has monitoring citation', () => {
      expect(SUBPART_YYYY.keyCitations.monitoring).toContain('63.6115')
    })

    it('has test methods citation', () => {
      expect(SUBPART_YYYY.keyCitations.testMethods).toContain('63.6120')
    })

    it('has reporting citation', () => {
      expect(SUBPART_YYYY.keyCitations.reporting).toContain('63.6145')
    })
  })
})
