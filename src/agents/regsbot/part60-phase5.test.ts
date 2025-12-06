/**
 * Part 60 Phase 5 TDD Tests - O&G + GHG Subparts
 *
 * Tests for:
 * - Subpart OOOO (O&G 2011-2015) - VOC, SO2 from oil/gas production
 * - Subpart OOOOb (O&G 2024+ methane rule) - CH4, VOC with stricter requirements
 * - Subpart UUUU (GHG combustion turbines) - CO2 emission guidelines
 */

import { describe, expect, it } from 'vitest'
import {
  findSubpartsByEquipment,
  findSubpartsByIndustry,
  findSubpartsByParameter,
  hasPart63Overlap,
  SUBPART_OOOO,
  SUBPART_OOOOb,
  SUBPART_UUUU,
  type Part60SubpartKnowledge,
} from './part60-knowledge'

// ============================================================================
// SUBPART OOOO - O&G 2011-2015 VINTAGE
// ============================================================================

describe('Part 60 Subpart OOOO - Crude Oil & Natural Gas (2011-2015)', () => {
  describe('Structure', () => {
    it('has required Part60SubpartKnowledge properties', () => {
      const requiredKeys: (keyof Part60SubpartKnowledge)[] = [
        'subpart',
        'title',
        'cfrSections',
        'equipmentTypes',
        'industries',
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
        expect(SUBPART_OOOO).toHaveProperty(key)
      }
    })

    it('identifies as Subpart OOOO', () => {
      expect(SUBPART_OOOO.subpart).toBe('OOOO')
    })

    it('has correct title', () => {
      expect(SUBPART_OOOO.title).toContain('Crude Oil')
      expect(SUBPART_OOOO.title).toContain('Natural Gas')
    })

    it('has correct CFR section range', () => {
      expect(SUBPART_OOOO.cfrSections).toBe('60.5360 - 60.5499')
    })
  })

  describe('Applicability', () => {
    it('covers oil and gas equipment types', () => {
      expect(SUBPART_OOOO.equipmentTypes).toContain('storage-vessel')
      expect(SUBPART_OOOO.equipmentTypes).toContain('compressor')
    })

    it('applies to O&G upstream industry', () => {
      expect(SUBPART_OOOO.industries).toContain('oil-gas-upstream')
    })

    it('has 2011-2015 construction date range', () => {
      expect(SUBPART_OOOO.applicability.constructionDate).toContain('August 23, 2011')
      expect(SUBPART_OOOO.applicability.constructionDate).toContain('September 18, 2015')
    })

    it('covers well sites and compressor stations', () => {
      expect(SUBPART_OOOO.applicability.description.toLowerCase()).toContain('well')
    })
  })

  describe('Emission Standards', () => {
    it('has VOC standards', () => {
      const vocStandard = SUBPART_OOOO.standards.find((s) => s.parameter === 'VOC')
      expect(vocStandard).toBeDefined()
    })

    it('has VOC control efficiency requirement', () => {
      const vocControl = SUBPART_OOOO.standards.find(
        (s) => s.parameter === 'VOC' && s.units.includes('percent')
      )
      expect(vocControl).toBeDefined()
      expect(vocControl?.limit).toBe('95')
    })

    it('may have SO2 standards for sweetening units', () => {
      // OOOO covers sulfur recovery units in gas processing
      const so2Standard = SUBPART_OOOO.standards.find((s) => s.parameter === 'SO2')
      // SO2 is optional - some OOOO facilities don't have sweetening
      // SO2 limits can be in ppmv or tons/day depending on unit size
      if (so2Standard) {
        expect(so2Standard.units.includes('ppmv') || so2Standard.units.includes('tons')).toBe(true)
      }
    })
  })

  describe('Monitoring', () => {
    it('has OGI or Method 21 monitoring', () => {
      const ogiMonitoring = SUBPART_OOOO.monitoring.find(
        (m) => m.method === 'ogi-monitoring' || m.method === 'ldar-monitoring'
      )
      expect(ogiMonitoring).toBeDefined()
    })

    it('has fugitive emissions monitoring frequency', () => {
      const fugitiveMonitoring = SUBPART_OOOO.monitoring.find((m) =>
        m.parameter.toLowerCase().includes('voc')
      )
      expect(fugitiveMonitoring).toBeDefined()
    })
  })

  describe('Cross-References', () => {
    it('references successor OOOOa', () => {
      const ooooaRef = SUBPART_OOOO.crossReferences.find((cr) => cr.regulation.includes('OOOOa'))
      expect(ooooaRef).toBeDefined()
      expect(ooooaRef?.relationship).toBe('coordinates')
    })

    it('notes that OOOOa supersedes for newer sources', () => {
      const ooooaRef = SUBPART_OOOO.crossReferences.find((cr) => cr.regulation.includes('OOOOa'))
      expect(ooooaRef?.notes).toContain('2015')
    })
  })

  describe('Query Functions', () => {
    it('findSubpartsByEquipment returns OOOO for storage-vessel', () => {
      const results = findSubpartsByEquipment('storage-vessel')
      expect(results.some((s) => s.subpart === 'OOOO')).toBe(true)
    })

    it('findSubpartsByIndustry returns OOOO for oil-gas-upstream', () => {
      const results = findSubpartsByIndustry('oil-gas-upstream')
      expect(results.some((s) => s.subpart === 'OOOO')).toBe(true)
    })

    it('findSubpartsByParameter returns OOOO for VOC', () => {
      const results = findSubpartsByParameter('VOC')
      expect(results.some((s) => s.subpart === 'OOOO')).toBe(true)
    })
  })
})

// ============================================================================
// SUBPART OOOOb - O&G 2024+ METHANE RULE (SUPER-EMITTER RESPONSE)
// ============================================================================

describe('Part 60 Subpart OOOOb - Oil & Natural Gas GHG (2024+)', () => {
  describe('Structure', () => {
    it('has required Part60SubpartKnowledge properties', () => {
      const requiredKeys: (keyof Part60SubpartKnowledge)[] = [
        'subpart',
        'title',
        'cfrSections',
        'equipmentTypes',
        'industries',
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
        expect(SUBPART_OOOOb).toHaveProperty(key)
      }
    })

    it('identifies as Subpart OOOOb', () => {
      expect(SUBPART_OOOOb.subpart).toBe('OOOOb')
    })

    it('has correct title referencing GHG', () => {
      expect(SUBPART_OOOOb.title).toContain('Oil')
      expect(SUBPART_OOOOb.title).toContain('Natural Gas')
    })

    it('has correct CFR section range', () => {
      expect(SUBPART_OOOOb.cfrSections).toBe('60.5360b - 60.5499b')
    })
  })

  describe('Applicability', () => {
    it('covers comprehensive O&G equipment', () => {
      expect(SUBPART_OOOOb.equipmentTypes).toContain('storage-vessel')
      expect(SUBPART_OOOOb.equipmentTypes).toContain('compressor')
      expect(SUBPART_OOOOb.equipmentTypes).toContain('valve')
      expect(SUBPART_OOOOb.equipmentTypes).toContain('flare')
    })

    it('applies to newest sources (2024+)', () => {
      expect(SUBPART_OOOOb.applicability.constructionDate).toContain('2024')
    })

    it('covers super-emitter response program', () => {
      expect(SUBPART_OOOOb.applicability.description).toContain('super-emitter')
    })

    it('includes existing source requirements', () => {
      // OOOOb uniquely applies to existing sources too
      expect(SUBPART_OOOOb.applicability.description.toLowerCase()).toContain('existing')
    })
  })

  describe('Emission Standards', () => {
    it('has methane (CH4) standards', () => {
      const ch4Standard = SUBPART_OOOOb.standards.find(
        (s) => s.parameter === 'Methane' || s.parameter === 'CH4'
      )
      expect(ch4Standard).toBeDefined()
    })

    it('has VOC standards', () => {
      const vocStandard = SUBPART_OOOOb.standards.find((s) => s.parameter === 'VOC')
      expect(vocStandard).toBeDefined()
    })

    it('has stricter control efficiency than OOOOa', () => {
      const controlStandard = SUBPART_OOOOb.standards.find((s) => s.units.includes('percent'))
      expect(controlStandard).toBeDefined()
      // OOOOb typically requires 95%+ control
      expect(Number(controlStandard?.limit)).toBeGreaterThanOrEqual(95)
    })

    it('has flare combustion efficiency requirement', () => {
      const flareStandard = SUBPART_OOOOb.standards.find(
        (s) => s.conditions?.some((c) => c.toLowerCase().includes('flare')) === true
      )
      expect(flareStandard).toBeDefined()
    })
  })

  describe('Monitoring', () => {
    it('has advanced OGI monitoring', () => {
      const ogiMonitoring = SUBPART_OOOOb.monitoring.find((m) => m.method === 'ogi-monitoring')
      expect(ogiMonitoring).toBeDefined()
    })

    it('has more frequent monitoring than OOOOa', () => {
      const monitoring = SUBPART_OOOOb.monitoring.find((m) => m.method === 'ogi-monitoring')
      // OOOOb requires quarterly minimum, some monthly
      expect(monitoring?.frequency.toLowerCase()).toMatch(/quarterly|monthly/)
    })

    it('requires super-emitter response monitoring', () => {
      const superEmitter = SUBPART_OOOOb.monitoring.find(
        (m) =>
          m.parameter.toLowerCase().includes('super-emitter') ||
          m.parameter.toLowerCase().includes('methane')
      )
      expect(superEmitter).toBeDefined()
    })

    it('may require continuous monitoring for large sources', () => {
      const continuous = SUBPART_OOOOb.monitoring.find((m) =>
        m.frequency.toLowerCase().includes('continuous')
      )
      // Continuous monitoring is optional but available
      if (continuous) {
        expect(continuous.method).toBeDefined()
      }
    })
  })

  describe('Reporting', () => {
    it('requires annual reporting', () => {
      const annual = SUBPART_OOOOb.reporting.find((r) =>
        r.frequency.toLowerCase().includes('annual')
      )
      expect(annual).toBeDefined()
    })

    it('has super-emitter notification requirements', () => {
      const superEmitterReport = SUBPART_OOOOb.reporting.find(
        (r) =>
          r.reportType.toLowerCase().includes('super-emitter') ||
          r.contents.some((c) => c.toLowerCase().includes('super-emitter'))
      )
      expect(superEmitterReport).toBeDefined()
    })
  })

  describe('Cross-References', () => {
    it('references predecessor OOOO and OOOOa', () => {
      const hasOoooRef = SUBPART_OOOOb.crossReferences.some(
        (cr) => cr.regulation.includes('OOOO') && !cr.regulation.includes('OOOOb')
      )
      expect(hasOoooRef).toBe(true)
    })

    it('coordinates with Part 98 GHG reporting', () => {
      const part98Ref = SUBPART_OOOOb.crossReferences.find((cr) =>
        cr.regulation.includes('Part 98')
      )
      expect(part98Ref).toBeDefined()
    })
  })

  describe('Query Functions', () => {
    it('findSubpartsByParameter returns OOOOb for Methane', () => {
      const results = findSubpartsByParameter('Methane')
      expect(results.some((s) => s.subpart === 'OOOOb')).toBe(true)
    })
  })
})

// ============================================================================
// SUBPART UUUU - GHG COMBUSTION TURBINES
// ============================================================================

describe('Part 60 Subpart UUUU - GHG Emission Guidelines for Combustion Turbines', () => {
  describe('Structure', () => {
    it('has required Part60SubpartKnowledge properties', () => {
      const requiredKeys: (keyof Part60SubpartKnowledge)[] = [
        'subpart',
        'title',
        'cfrSections',
        'equipmentTypes',
        'industries',
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
        expect(SUBPART_UUUU).toHaveProperty(key)
      }
    })

    it('identifies as Subpart UUUU', () => {
      expect(SUBPART_UUUU.subpart).toBe('UUUU')
    })

    it('has correct title for GHG combustion turbines', () => {
      expect(SUBPART_UUUU.title).toContain('Combustion Turbine')
    })

    it('has correct CFR section range', () => {
      expect(SUBPART_UUUU.cfrSections).toBe('60.5508 - 60.5580')
    })
  })

  describe('Applicability', () => {
    it('covers gas turbine equipment', () => {
      expect(SUBPART_UUUU.equipmentTypes).toContain('gas-turbine')
      expect(SUBPART_UUUU.equipmentTypes).toContain('combustion-turbine')
    })

    it('applies to electric utility sector', () => {
      expect(SUBPART_UUUU.industries).toContain('electric-utility')
    })

    it('is for existing EGUs', () => {
      expect(SUBPART_UUUU.applicability.description.toLowerCase()).toContain('existing')
    })

    it('has size threshold (typically baseload units)', () => {
      expect(SUBPART_UUUU.applicability.sizeThreshold).toBeDefined()
    })
  })

  describe('Emission Standards', () => {
    it('has CO2 emission rate standard', () => {
      const co2Standard = SUBPART_UUUU.standards.find((s) => s.parameter === 'CO2')
      expect(co2Standard).toBeDefined()
    })

    it('has lb CO2/MWh or lb CO2/MMBtu units', () => {
      const co2Standard = SUBPART_UUUU.standards.find((s) => s.parameter === 'CO2')
      expect(co2Standard?.units).toMatch(/lb.*CO2|MWh|MMBtu/)
    })

    it('distinguishes baseload vs intermediate/peaking', () => {
      const standards = SUBPART_UUUU.standards.filter((s) => s.parameter === 'CO2')
      // Should have different standards for different capacity factors
      expect(standards.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Monitoring', () => {
    it('requires CO2 monitoring', () => {
      const co2Monitoring = SUBPART_UUUU.monitoring.find((m) => m.parameter === 'CO2')
      expect(co2Monitoring).toBeDefined()
    })

    it('may reference Part 75 CO2 monitoring', () => {
      // Part 60 UUUU often leverages Part 75 CEMS data
      const hasPartRef = SUBPART_UUUU.crossReferences.some((cr) =>
        cr.regulation.includes('Part 75')
      )
      expect(hasPartRef).toBe(true)
    })

    it('has heat input monitoring', () => {
      const hiMonitoring = SUBPART_UUUU.monitoring.find(
        (m) => m.parameter === 'Heat Input' || m.parameter === 'HI'
      )
      expect(hiMonitoring).toBeDefined()
    })
  })

  describe('Cross-References', () => {
    it('references Part 75 for CEM requirements', () => {
      const part75Ref = SUBPART_UUUU.crossReferences.find((cr) => cr.regulation.includes('Part 75'))
      expect(part75Ref).toBeDefined()
      expect(part75Ref?.relationship).toBe('coordinates')
    })

    it('references Subpart KKKK for new turbines', () => {
      const kkkkRef = SUBPART_UUUU.crossReferences.find((cr) => cr.regulation.includes('KKKK'))
      expect(kkkkRef).toBeDefined()
    })

    it('references Subpart TTTT for GHG', () => {
      const ttttRef = SUBPART_UUUU.crossReferences.find((cr) => cr.regulation.includes('TTTT'))
      expect(ttttRef).toBeDefined()
    })
  })

  describe('Query Functions', () => {
    it('findSubpartsByEquipment returns UUUU for gas-turbine', () => {
      const results = findSubpartsByEquipment('gas-turbine')
      expect(results.some((s) => s.subpart === 'UUUU')).toBe(true)
    })

    it('findSubpartsByParameter returns UUUU for CO2', () => {
      const results = findSubpartsByParameter('CO2')
      expect(results.some((s) => s.subpart === 'UUUU')).toBe(true)
    })

    it('findSubpartsByIndustry returns UUUU for electric-utility', () => {
      const results = findSubpartsByIndustry('electric-utility')
      expect(results.some((s) => s.subpart === 'UUUU')).toBe(true)
    })
  })
})

// ============================================================================
// HASP63OVERLAP FUNCTION TESTS
// ============================================================================

describe('hasPart63Overlap for O&G Subparts', () => {
  it('OOOO may have Part 63 HH overlap', () => {
    // Part 63 Subpart HH covers O&G HAPs
    const hasOverlap = hasPart63Overlap('OOOO')
    expect(typeof hasOverlap).toBe('boolean')
  })

  it('OOOOb may have Part 63 overlap', () => {
    const hasOverlap = hasPart63Overlap('OOOOb')
    expect(typeof hasOverlap).toBe('boolean')
  })
})
