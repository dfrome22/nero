/**
 * Part 63 Subpart ZZZZ TDD Tests
 *
 * Tests for Stationary RICE (Reciprocating Internal Combustion Engines)
 * NESHAP knowledge base. This covers HAP emissions (CO, formaldehyde, NMHC)
 * from stationary engines and coordinates with Part 60 IIII (CI) and JJJJ (SI).
 */

import { describe, expect, it } from 'vitest'
import {
  findPart63SubpartsByEquipment,
  findPart63SubpartsByParameter,
  getZZZZRequirements,
  hasPart60Overlap,
  SUBPART_ZZZZ,
  type Part63SubpartKnowledge,
  type ZZZZEngineType,
  type ZZZZSourceCategory,
} from './part63-knowledge'

describe('Part 63 Subpart ZZZZ - Stationary RICE NESHAP', () => {
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
        expect(SUBPART_ZZZZ).toHaveProperty(key)
      }
    })

    it('identifies as Subpart ZZZZ', () => {
      expect(SUBPART_ZZZZ.subpart).toBe('ZZZZ')
    })

    it('has correct title for RICE NESHAP', () => {
      expect(SUBPART_ZZZZ.title).toContain('Reciprocating Internal Combustion Engines')
      expect(SUBPART_ZZZZ.title).toContain('RICE')
    })

    it('has correct CFR section range', () => {
      expect(SUBPART_ZZZZ.cfrSections).toBe('63.6580 - 63.6675')
    })
  })

  // ============================================================================
  // APPLICABILITY TESTS
  // ============================================================================

  describe('Applicability', () => {
    it('covers stationary RICE equipment', () => {
      expect(SUBPART_ZZZZ.equipmentTypes).toContain('stationary-rice')
    })

    it('distinguishes major vs area source requirements', () => {
      expect(SUBPART_ZZZZ.applicability).toHaveProperty('majorSource')
      expect(SUBPART_ZZZZ.applicability).toHaveProperty('areaSource')
    })

    it('has engine type distinctions', () => {
      // CI = compression ignition (diesel)
      // SI = spark ignition (natural gas, LPG)
      expect(SUBPART_ZZZZ.applicability.engineTypes).toContain('ci')
      expect(SUBPART_ZZZZ.applicability.engineTypes).toContain('si-rich-burn')
      expect(SUBPART_ZZZZ.applicability.engineTypes).toContain('si-lean-burn')
    })

    it('distinguishes emergency vs non-emergency engines', () => {
      expect(SUBPART_ZZZZ.applicability.useCategories).toContain('emergency')
      expect(SUBPART_ZZZZ.applicability.useCategories).toContain('non-emergency')
    })

    it('has size thresholds by horsepower', () => {
      expect(SUBPART_ZZZZ.applicability.sizeThresholds).toBeDefined()
      expect(SUBPART_ZZZZ.applicability.sizeThresholds).toContainEqual(
        expect.objectContaining({ threshold: '500 hp' })
      )
    })

    it('covers multiple industries', () => {
      expect(SUBPART_ZZZZ.industries).toContain('industrial')
      expect(SUBPART_ZZZZ.industries).toContain('oil-gas-upstream')
      expect(SUBPART_ZZZZ.industries).toContain('manufacturing')
    })
  })

  // ============================================================================
  // HAP STANDARDS TESTS
  // ============================================================================

  describe('HAP Categories', () => {
    it('covers organic HAPs', () => {
      expect(SUBPART_ZZZZ.hapCategories).toContain('organic-hap')
    })

    it('includes formaldehyde as key HAP', () => {
      const formaldehydeStandard = SUBPART_ZZZZ.standards.find((s) =>
        s.parameter.toLowerCase().includes('formaldehyde')
      )
      expect(formaldehydeStandard).toBeDefined()
    })

    it('includes CO as HAP surrogate', () => {
      const coStandard = SUBPART_ZZZZ.standards.find((s) => s.parameter === 'CO')
      expect(coStandard).toBeDefined()
    })
  })

  describe('Emission Standards', () => {
    it('has standards for major source CI engines', () => {
      const ciStandards = SUBPART_ZZZZ.standards.filter(
        (s) =>
          s.subcategory !== undefined &&
          s.subcategory.includes('CI') &&
          s.subcategory.includes('major')
      )
      expect(ciStandards.length).toBeGreaterThan(0)
    })

    it('has standards for major source SI engines', () => {
      const siStandards = SUBPART_ZZZZ.standards.filter(
        (s) =>
          s.subcategory !== undefined &&
          s.subcategory.includes('SI') &&
          s.subcategory.includes('major')
      )
      expect(siStandards.length).toBeGreaterThan(0)
    })

    it('has work practice standards for area sources', () => {
      const areaStandards = SUBPART_ZZZZ.standards.filter(
        (s) => s.subcategory?.includes('Area source') === true
      )
      expect(areaStandards.length).toBeGreaterThan(0)
    })

    it('has CO limit in ppmvd units', () => {
      const coStandard = SUBPART_ZZZZ.standards.find(
        (s) => s.parameter === 'CO' && s.units.includes('ppmvd')
      )
      expect(coStandard).toBeDefined()
    })

    it('has formaldehyde limit in ppmvd units', () => {
      const formaldehydeStandard = SUBPART_ZZZZ.standards.find(
        (s) => s.parameter.toLowerCase().includes('formaldehyde') && s.units.includes('ppmvd')
      )
      expect(formaldehydeStandard).toBeDefined()
    })
  })

  // ============================================================================
  // MONITORING TESTS
  // ============================================================================

  describe('Monitoring', () => {
    it('allows CEMS for CO compliance', () => {
      const coMonitoring = SUBPART_ZZZZ.monitoring.find((m) => m.parameter === 'CO')
      expect(coMonitoring).toBeDefined()
      expect(coMonitoring?.method).toBe('CEMS')
    })

    it('allows catalyst inlet temperature monitoring', () => {
      const catMonitoring = SUBPART_ZZZZ.monitoring.find((m) =>
        m.parameter.toLowerCase().includes('catalyst')
      )
      expect(catMonitoring).toBeDefined()
    })

    it('has performance testing option', () => {
      const stackTest = SUBPART_ZZZZ.monitoring.find((m) => m.method === 'stack-test')
      expect(stackTest).toBeDefined()
    })

    it('has operating limits monitoring', () => {
      const operatingMonitoring = SUBPART_ZZZZ.monitoring.find((m) =>
        m.parameter.toLowerCase().includes('operating')
      )
      expect(operatingMonitoring).toBeDefined()
    })
  })

  // ============================================================================
  // WORK PRACTICE TESTS
  // ============================================================================

  describe('Work Practices', () => {
    it('has tune-up requirements', () => {
      expect(SUBPART_ZZZZ.workPractices).toBeDefined()
      const tuneUp = SUBPART_ZZZZ.workPractices?.find((wp) =>
        wp.description.toLowerCase().includes('tune-up')
      )
      expect(tuneUp).toBeDefined()
    })

    it('has maintenance requirements', () => {
      const maintenance = SUBPART_ZZZZ.workPractices?.find(
        (wp) =>
          wp.description.toLowerCase().includes('maintenance') ||
          wp.description.toLowerCase().includes('oil') ||
          wp.requirements.some((r) => r.toLowerCase().includes('oil'))
      )
      expect(maintenance).toBeDefined()
    })

    it('has emergency engine operating limits', () => {
      const emergency = SUBPART_ZZZZ.workPractices?.find((wp) =>
        wp.description.toLowerCase().includes('emergency')
      )
      expect(emergency).toBeDefined()
      expect(emergency?.requirements).toContainEqual(expect.stringContaining('100 hours'))
    })

    it('has fuel requirements', () => {
      const fuel = SUBPART_ZZZZ.workPractices?.find((wp) =>
        wp.description.toLowerCase().includes('fuel')
      )
      expect(fuel).toBeDefined()
    })
  })

  // ============================================================================
  // TEST METHODS
  // ============================================================================

  describe('Test Methods', () => {
    it('references Method 10 for CO', () => {
      const coTest = SUBPART_ZZZZ.testMethods.find((tm) => tm.parameter === 'CO')
      expect(coTest).toBeDefined()
      expect(coTest?.methods).toContain('Method 10')
    })

    it('references Method 320 or 323 for formaldehyde', () => {
      const formaldehydeTest = SUBPART_ZZZZ.testMethods.find((tm) =>
        tm.parameter.toLowerCase().includes('formaldehyde')
      )
      expect(formaldehydeTest).toBeDefined()
      expect(formaldehydeTest?.methods.some((m) => m.includes('320') || m.includes('323'))).toBe(
        true
      )
    })

    it('has performance test frequency', () => {
      const periodicTest = SUBPART_ZZZZ.testMethods.find((tm) =>
        tm.frequency.toLowerCase().includes('year')
      )
      expect(periodicTest).toBeDefined()
    })
  })

  // ============================================================================
  // REPORTING TESTS
  // ============================================================================

  describe('Reporting', () => {
    it('requires initial notification', () => {
      const initial = SUBPART_ZZZZ.reporting.find((r) =>
        r.reportType.toLowerCase().includes('initial')
      )
      expect(initial).toBeDefined()
    })

    it('requires compliance reports', () => {
      const compliance = SUBPART_ZZZZ.reporting.find((r) =>
        r.reportType.toLowerCase().includes('compliance')
      )
      expect(compliance).toBeDefined()
    })

    it('has semiannual reporting frequency', () => {
      const semiannual = SUBPART_ZZZZ.reporting.find(
        (r) => r.frequency.toLowerCase() === 'semiannual'
      )
      expect(semiannual).toBeDefined()
    })
  })

  // ============================================================================
  // RECORDKEEPING TESTS
  // ============================================================================

  describe('Recordkeeping', () => {
    it('requires 5 year retention', () => {
      expect(SUBPART_ZZZZ.recordkeeping.retentionPeriod).toBe('5 years')
    })

    it('requires engine operating hours records', () => {
      const hasHours = SUBPART_ZZZZ.recordkeeping.records.some((r) =>
        r.toLowerCase().includes('operating hours')
      )
      expect(hasHours).toBe(true)
    })

    it('requires maintenance records', () => {
      const hasMaintenance = SUBPART_ZZZZ.recordkeeping.records.some((r) =>
        r.toLowerCase().includes('maintenance')
      )
      expect(hasMaintenance).toBe(true)
    })

    it('requires fuel records for CI engines', () => {
      const hasFuel = SUBPART_ZZZZ.recordkeeping.records.some((r) =>
        r.toLowerCase().includes('fuel')
      )
      expect(hasFuel).toBe(true)
    })
  })

  // ============================================================================
  // CROSS-REFERENCE TESTS
  // ============================================================================

  describe('Cross-References to Part 60', () => {
    it('references Part 60 Subpart IIII (CI engines)', () => {
      const iiiiRef = SUBPART_ZZZZ.crossReferences.find((cr) => cr.regulation.includes('IIII'))
      expect(iiiiRef).toBeDefined()
      expect(iiiiRef?.relationship).toBe('coordinates')
    })

    it('references Part 60 Subpart JJJJ (SI engines)', () => {
      const jjjjRef = SUBPART_ZZZZ.crossReferences.find((cr) => cr.regulation.includes('JJJJ'))
      expect(jjjjRef).toBeDefined()
      expect(jjjjRef?.relationship).toBe('coordinates')
    })

    it('hasPart60Overlap returns true for ZZZZ', () => {
      expect(hasPart60Overlap('ZZZZ')).toBe(true)
    })

    it('explains coordination with Part 60 engines', () => {
      const iiiiRef = SUBPART_ZZZZ.crossReferences.find((cr) => cr.regulation.includes('IIII'))
      expect(iiiiRef?.notes).toContain('criteria pollutant')
    })
  })

  // ============================================================================
  // QUERY FUNCTION TESTS
  // ============================================================================

  describe('Query Functions', () => {
    it('findPart63SubpartsByEquipment returns ZZZZ for stationary-rice', () => {
      const results = findPart63SubpartsByEquipment('stationary-rice')
      expect(results.some((s) => s.subpart === 'ZZZZ')).toBe(true)
    })

    it('findPart63SubpartsByParameter returns ZZZZ for CO', () => {
      const results = findPart63SubpartsByParameter('CO')
      expect(results.some((s) => s.subpart === 'ZZZZ')).toBe(true)
    })

    it('findPart63SubpartsByParameter returns ZZZZ for Formaldehyde', () => {
      const results = findPart63SubpartsByParameter('Formaldehyde')
      expect(results.some((s) => s.subpart === 'ZZZZ')).toBe(true)
    })
  })

  // ============================================================================
  // HELPER FUNCTION TESTS
  // ============================================================================

  describe('getZZZZRequirements Helper', () => {
    it('returns requirements for major source CI engine', () => {
      const reqs = getZZZZRequirements({
        sourceCategory: 'major',
        engineType: 'ci',
        useCategory: 'non-emergency',
        horsepower: 600,
      })
      expect(reqs).toBeDefined()
      expect(reqs.emissionStandards).toBeDefined()
      expect(reqs.monitoring).toBeDefined()
    })

    it('returns work practice for area source emergency engine', () => {
      const reqs = getZZZZRequirements({
        sourceCategory: 'area',
        engineType: 'si-rich-burn',
        useCategory: 'emergency',
        horsepower: 300,
      })
      expect(reqs.workPractice).toBeDefined()
      expect(reqs.workPractice?.includes('tune-up')).toBe(true)
    })

    it('handles existing engines differently', () => {
      const newReqs = getZZZZRequirements({
        sourceCategory: 'major',
        engineType: 'si-lean-burn',
        useCategory: 'non-emergency',
        horsepower: 1000,
        isExisting: false,
      })
      const existingReqs = getZZZZRequirements({
        sourceCategory: 'major',
        engineType: 'si-lean-burn',
        useCategory: 'non-emergency',
        horsepower: 1000,
        isExisting: true,
      })
      // Existing engines often have less stringent requirements
      expect(newReqs).not.toEqual(existingReqs)
    })
  })

  // ============================================================================
  // SOURCE CATEGORY TYPE TESTS
  // ============================================================================

  describe('Source Category Types', () => {
    it('ZZZZSourceCategory includes major and area', () => {
      const categories: ZZZZSourceCategory[] = ['major', 'area']
      expect(categories).toContain('major')
      expect(categories).toContain('area')
    })

    it('ZZZZEngineType includes all engine types', () => {
      const types: ZZZZEngineType[] = ['ci', 'si-rich-burn', 'si-lean-burn', 'si-other']
      expect(types).toContain('ci')
      expect(types).toContain('si-rich-burn')
      expect(types).toContain('si-lean-burn')
    })
  })

  // ============================================================================
  // KEY CITATIONS TESTS
  // ============================================================================

  describe('Key Citations', () => {
    it('has applicability citation', () => {
      expect(SUBPART_ZZZZ.keyCitations.applicability).toContain('63.6585')
    })

    it('has standards citation', () => {
      expect(SUBPART_ZZZZ.keyCitations.standards).toContain('63.6600')
    })

    it('has monitoring citation', () => {
      expect(SUBPART_ZZZZ.keyCitations.monitoring).toContain('63.6625')
    })

    it('has test methods citation', () => {
      expect(SUBPART_ZZZZ.keyCitations.testMethods).toContain('63.6620')
    })

    it('has reporting citation', () => {
      expect(SUBPART_ZZZZ.keyCitations.reporting).toContain('63.6650')
    })
  })
})
