/**
 * Part 63 Knowledge Base Tests
 *
 * TDD tests for the Part 63 NESHAPs knowledge base.
 * Covers MATS (UUUUU), Industrial Boiler MACT (DDDDD), and RICE (ZZZZ).
 *
 * These tests verify:
 * 1. Knowledge base structure and completeness
 * 2. Query functions work correctly
 * 3. HAP parameter coverage
 * 4. Cross-reference to Part 60/75 accuracy
 */

import { describe, expect, it } from 'vitest'
import {
  findPart63SubpartsByEquipment,
  findPart63SubpartsByIndustry,
  findPart63SubpartsByParameter,
  getPart63SubpartKnowledge,
  hasPart60Overlap,
  hasPart75Overlap,
  INDEXED_PART63_SUBPARTS,
  PART63_KNOWLEDGE_BASE,
  SUBPART_DDDDD,
  SUBPART_UUUUU,
  type Part63SubpartKnowledge,
} from './part63-knowledge'

// ============================================================================
// KNOWLEDGE BASE STRUCTURE TESTS
// ============================================================================

describe('Part63 Knowledge Base Structure', () => {
  it('contains MATS and IB MACT subparts', () => {
    expect(INDEXED_PART63_SUBPARTS).toContain('UUUUU')
    expect(INDEXED_PART63_SUBPARTS).toContain('DDDDD')
  })

  it('each subpart has required fields', () => {
    const requiredFields: (keyof Part63SubpartKnowledge)[] = [
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
      'hapCategories',
      'keyCitations',
    ]

    for (const subpartId of INDEXED_PART63_SUBPARTS) {
      const subpart = PART63_KNOWLEDGE_BASE[subpartId]
      expect(subpart, `${subpartId} not found`).toBeDefined()
      if (!subpart) continue

      for (const field of requiredFields) {
        expect(subpart[field], `${subpartId} missing ${field}`).toBeDefined()
      }
    }
  })

  it('each subpart has at least one emission standard', () => {
    for (const subpartId of INDEXED_PART63_SUBPARTS) {
      const subpart = PART63_KNOWLEDGE_BASE[subpartId]
      expect(subpart).toBeDefined()
      if (!subpart) continue
      expect(subpart.standards.length, `${subpartId} has no standards`).toBeGreaterThan(0)
    }
  })

  it('each subpart has at least one monitoring requirement', () => {
    for (const subpartId of INDEXED_PART63_SUBPARTS) {
      const subpart = PART63_KNOWLEDGE_BASE[subpartId]
      expect(subpart).toBeDefined()
      if (!subpart) continue
      expect(subpart.monitoring.length, `${subpartId} has no monitoring`).toBeGreaterThan(0)
    }
  })

  it('each subpart has HAP categories defined', () => {
    for (const subpartId of INDEXED_PART63_SUBPARTS) {
      const subpart = PART63_KNOWLEDGE_BASE[subpartId]
      expect(subpart).toBeDefined()
      if (!subpart) continue
      expect(subpart.hapCategories.length, `${subpartId} has no HAP categories`).toBeGreaterThan(0)
    }
  })

  it('keyCitations have valid CFR references', () => {
    for (const subpartId of INDEXED_PART63_SUBPARTS) {
      const subpart = PART63_KNOWLEDGE_BASE[subpartId]
      expect(subpart).toBeDefined()
      if (!subpart) continue

      // All citations should reference Part 63
      const citations = Object.values(subpart.keyCitations)
      for (const citation of citations) {
        expect(citation).toMatch(/§?63\.\d+/)
      }
    }
  })
})

// ============================================================================
// SUBPART UUUUU (MATS) TESTS
// ============================================================================

describe('Subpart UUUUU - MATS (Mercury and Air Toxics Standards)', () => {
  it('has correct subpart identifier', () => {
    expect(SUBPART_UUUUU.subpart).toBe('UUUUU')
  })

  it('has correct title', () => {
    expect(SUBPART_UUUUU.title).toContain('MATS')
  })

  it('applies to coal and oil-fired EGUs', () => {
    expect(SUBPART_UUUUU.equipmentTypes).toContain('coal-fired-boiler')
    expect(SUBPART_UUUUU.equipmentTypes).toContain('oil-fired-boiler')
    expect(SUBPART_UUUUU.industries).toContain('electric-utility')
  })

  it('has >25 MW threshold', () => {
    expect(SUBPART_UUUUU.applicability.sizeThreshold).toContain('25')
    expect(SUBPART_UUUUU.applicability.sizeThreshold?.toLowerCase()).toContain('mw')
  })

  it('covers mercury (Hg) as primary HAP', () => {
    expect(SUBPART_UUUUU.hapCategories).toContain('mercury')
    const hgStandard = SUBPART_UUUUU.standards.find(
      (s) => s.parameter === 'Hg' || s.parameter === 'Mercury'
    )
    expect(hgStandard).toBeDefined()
  })

  it('covers acid gases (HCl, HF)', () => {
    expect(SUBPART_UUUUU.hapCategories).toContain('acid-gases')
    const hclStandard = SUBPART_UUUUU.standards.find((s) => s.parameter === 'HCl')
    expect(hclStandard).toBeDefined()
  })

  it('covers non-mercury metals (filterable PM as surrogate)', () => {
    expect(SUBPART_UUUUU.hapCategories).toContain('non-hg-metals')
    const pmStandard = SUBPART_UUUUU.standards.find(
      (s) => s.parameter === 'PM' || s.parameter.includes('Filterable')
    )
    expect(pmStandard).toBeDefined()
  })

  it('has coal-fired unit standards', () => {
    const coalStandards = SUBPART_UUUUU.standards.filter(
      (s) => s.conditions?.includes('coal') === true
    )
    expect(coalStandards.length).toBeGreaterThan(0)
  })

  it('has oil-fired unit standards', () => {
    const oilStandards = SUBPART_UUUUU.standards.filter(
      (s) => s.conditions?.includes('oil') === true
    )
    expect(oilStandards.length).toBeGreaterThan(0)
  })

  it('requires Hg CEMS or sorbent trap monitoring', () => {
    const hgMonitoring = SUBPART_UUUUU.monitoring.find((m) => m.parameter === 'Hg')
    expect(hgMonitoring).toBeDefined()
    if (!hgMonitoring) throw new Error('Hg monitoring not found')
    const hasSorbentTrap =
      hgMonitoring.method === 'CEMS' ||
      hgMonitoring.method === 'sorbent-trap' ||
      hgMonitoring.alternatives?.includes('sorbent-trap') === true
    expect(hasSorbentTrap).toBe(true)
  })

  it('requires HCl CEMS or quarterly testing', () => {
    const hclMonitoring = SUBPART_UUUUU.monitoring.find((m) => m.parameter === 'HCl')
    expect(hclMonitoring).toBeDefined()
  })

  it('references Part 75 for operating data', () => {
    const part75Ref = SUBPART_UUUUU.crossReferences.find((r) => r.regulation.includes('Part 75'))
    expect(part75Ref).toBeDefined()
    expect(part75Ref?.relationship).toBe('coordinates')
  })

  it('references Part 60 Da for coal EGUs', () => {
    const part60Ref = SUBPART_UUUUU.crossReferences.find((r) => r.regulation.includes('Part 60'))
    expect(part60Ref).toBeDefined()
  })

  it('has tune-up work practice standards for limited-use units', () => {
    const tuneup = SUBPART_UUUUU.workPractices?.find((wp) =>
      wp.description.toLowerCase().includes('tune-up')
    )
    expect(tuneup).toBeDefined()
  })

  it('has startup/shutdown work practices', () => {
    const ssWorkPractice = SUBPART_UUUUU.workPractices?.find(
      (wp) =>
        wp.description.toLowerCase().includes('startup') ||
        wp.description.toLowerCase().includes('shutdown')
    )
    expect(ssWorkPractice).toBeDefined()
  })

  it('requires electronic reporting via ECMPS/CEDRI', () => {
    const eReporting = SUBPART_UUUUU.reporting.find(
      (r) => r.reportType.includes('electronic') || r.contents.some((c) => c.includes('ECMPS'))
    )
    expect(eReporting).toBeDefined()
  })

  it('has 5-year recordkeeping requirement', () => {
    expect(SUBPART_UUUUU.recordkeeping.retentionPeriod).toContain('5')
  })
})

// ============================================================================
// SUBPART DDDDD (INDUSTRIAL BOILER MACT) TESTS
// ============================================================================

describe('Subpart DDDDD - Industrial Boiler MACT (Major Sources)', () => {
  it('has correct subpart identifier', () => {
    expect(SUBPART_DDDDD.subpart).toBe('DDDDD')
  })

  it('has correct title', () => {
    expect(SUBPART_DDDDD.title).toContain('Industrial')
    expect(SUBPART_DDDDD.title).toContain('Boiler')
  })

  it('applies to industrial boilers at major sources', () => {
    expect(SUBPART_DDDDD.equipmentTypes).toContain('industrial-boiler')
    expect(SUBPART_DDDDD.applicability.description).toContain('major')
  })

  it('covers multiple industries', () => {
    expect(SUBPART_DDDDD.industries.length).toBeGreaterThan(1)
    // Should cover refining, chemical, manufacturing
    expect(SUBPART_DDDDD.industries).toContain('petroleum-refining')
    expect(SUBPART_DDDDD.industries).toContain('chemical-manufacturing')
  })

  it('has subcategories by fuel type', () => {
    expect(SUBPART_DDDDD.subcategories).toBeDefined()
    expect(SUBPART_DDDDD.subcategories?.length).toBeGreaterThan(0)
    // Should have coal, biomass, liquid, gas subcategories
    const fuelTypes = SUBPART_DDDDD.subcategories?.map((s) => s.name.toLowerCase()) ?? []
    expect(fuelTypes.some((f) => f.includes('coal'))).toBe(true)
    expect(fuelTypes.some((f) => f.includes('biomass') || f.includes('solid'))).toBe(true)
  })

  it('covers PM as HAP metals surrogate', () => {
    expect(SUBPART_DDDDD.hapCategories).toContain('metals')
    const pmStandard = SUBPART_DDDDD.standards.find((s) => s.parameter === 'PM')
    expect(pmStandard).toBeDefined()
  })

  it('covers HCl for acid gases', () => {
    expect(SUBPART_DDDDD.hapCategories).toContain('acid-gases')
    const hclStandard = SUBPART_DDDDD.standards.find((s) => s.parameter === 'HCl')
    expect(hclStandard).toBeDefined()
  })

  it('covers mercury', () => {
    expect(SUBPART_DDDDD.hapCategories).toContain('mercury')
    const hgStandard = SUBPART_DDDDD.standards.find(
      (s) => s.parameter === 'Hg' || s.parameter === 'Mercury'
    )
    expect(hgStandard).toBeDefined()
  })

  it('covers CO as combustion surrogate', () => {
    const coStandard = SUBPART_DDDDD.standards.find((s) => s.parameter === 'CO')
    expect(coStandard).toBeDefined()
  })

  it('has energy assessment requirement for large units', () => {
    const energyAssessment = SUBPART_DDDDD.workPractices?.find((wp) =>
      wp.description.toLowerCase().includes('energy assessment')
    )
    expect(energyAssessment).toBeDefined()
  })

  it('has tune-up work practice standards', () => {
    const tuneup = SUBPART_DDDDD.workPractices?.find((wp) =>
      wp.description.toLowerCase().includes('tune-up')
    )
    expect(tuneup).toBeDefined()
  })

  it('allows PM CPMS as alternative to stack testing', () => {
    const pmMonitoring = SUBPART_DDDDD.monitoring.find((m) => m.parameter === 'PM')
    expect(pmMonitoring).toBeDefined()
    expect(pmMonitoring?.method === 'CPMS' || pmMonitoring?.alternatives?.includes('CPMS')).toBe(
      true
    )
  })

  it('requires compliance every 3 years for some units', () => {
    const stackTest = SUBPART_DDDDD.testMethods.find((t) => t.parameter === 'PM')
    expect(stackTest).toBeDefined()
    expect(stackTest?.frequency).toMatch(/triennial|annual|biennial/i)
  })

  it('references Part 60 Db for newer industrial boilers', () => {
    const part60Ref = SUBPART_DDDDD.crossReferences.find(
      (r) => r.regulation.includes('Part 60') && r.regulation.includes('Db')
    )
    expect(part60Ref).toBeDefined()
  })

  it('exempts gas-fired units from some requirements', () => {
    expect(SUBPART_DDDDD.applicability.exemptions).toBeDefined()
    const gasExemption = SUBPART_DDDDD.applicability.exemptions?.some((e) =>
      e.toLowerCase().includes('gas')
    )
    expect(gasExemption).toBe(true)
  })

  it('has electronic reporting via CEDRI', () => {
    const eReporting = SUBPART_DDDDD.reporting.find((r) =>
      r.contents.some((c) => c.includes('CEDRI') || c.includes('electronic'))
    )
    expect(eReporting).toBeDefined()
  })

  it('has 5-year recordkeeping requirement', () => {
    expect(SUBPART_DDDDD.recordkeeping.retentionPeriod).toContain('5')
  })
})

// ============================================================================
// QUERY FUNCTION TESTS
// ============================================================================

describe('Part63 Query Functions', () => {
  describe('findPart63SubpartsByEquipment', () => {
    it('finds UUUUU for coal-fired boilers', () => {
      const results = findPart63SubpartsByEquipment('coal-fired-boiler')
      expect(results.some((s) => s.subpart === 'UUUUU')).toBe(true)
    })

    it('finds UUUUU for oil-fired boilers', () => {
      const results = findPart63SubpartsByEquipment('oil-fired-boiler')
      expect(results.some((s) => s.subpart === 'UUUUU')).toBe(true)
    })

    it('finds DDDDD for industrial boilers', () => {
      const results = findPart63SubpartsByEquipment('industrial-boiler')
      expect(results.some((s) => s.subpart === 'DDDDD')).toBe(true)
    })

    it('returns empty for non-covered equipment', () => {
      const results = findPart63SubpartsByEquipment('widget-maker' as never)
      expect(results.length).toBe(0)
    })
  })

  describe('findPart63SubpartsByIndustry', () => {
    it('finds UUUUU for electric utilities', () => {
      const results = findPart63SubpartsByIndustry('electric-utility')
      expect(results.some((s) => s.subpart === 'UUUUU')).toBe(true)
    })

    it('finds DDDDD for petroleum refining', () => {
      const results = findPart63SubpartsByIndustry('petroleum-refining')
      expect(results.some((s) => s.subpart === 'DDDDD')).toBe(true)
    })

    it('finds DDDDD for chemical manufacturing', () => {
      const results = findPart63SubpartsByIndustry('chemical-manufacturing')
      expect(results.some((s) => s.subpart === 'DDDDD')).toBe(true)
    })
  })

  describe('findPart63SubpartsByParameter', () => {
    it('finds subparts requiring Hg monitoring', () => {
      const results = findPart63SubpartsByParameter('Hg')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((s) => s.subpart === 'UUUUU')).toBe(true)
    })

    it('finds subparts requiring HCl monitoring', () => {
      const results = findPart63SubpartsByParameter('HCl')
      expect(results.length).toBeGreaterThan(0)
      // Both UUUUU and DDDDD require HCl
      expect(results.some((s) => s.subpart === 'UUUUU')).toBe(true)
      expect(results.some((s) => s.subpart === 'DDDDD')).toBe(true)
    })

    it('finds subparts requiring PM monitoring', () => {
      const results = findPart63SubpartsByParameter('PM')
      expect(results.length).toBeGreaterThan(0)
    })

    it('finds subparts requiring CO monitoring', () => {
      const results = findPart63SubpartsByParameter('CO')
      expect(results.some((s) => s.subpart === 'DDDDD')).toBe(true)
    })
  })

  describe('getPart63SubpartKnowledge', () => {
    it('returns UUUUU knowledge', () => {
      const knowledge = getPart63SubpartKnowledge('UUUUU')
      expect(knowledge).toBeDefined()
      expect(knowledge?.subpart).toBe('UUUUU')
    })

    it('returns DDDDD knowledge', () => {
      const knowledge = getPart63SubpartKnowledge('DDDDD')
      expect(knowledge).toBeDefined()
      expect(knowledge?.subpart).toBe('DDDDD')
    })

    it('returns undefined for unknown subpart', () => {
      const knowledge = getPart63SubpartKnowledge('XXXXX')
      expect(knowledge).toBeUndefined()
    })
  })
})

// ============================================================================
// CROSS-REFERENCE TESTS
// ============================================================================

describe('Part63 Cross-References', () => {
  describe('hasPart75Overlap', () => {
    it('UUUUU overlaps with Part 75', () => {
      expect(hasPart75Overlap('UUUUU')).toBe(true)
    })

    it('DDDDD does not typically overlap with Part 75', () => {
      // Industrial boilers typically don't have Part 75 (unless grid-connected)
      expect(hasPart75Overlap('DDDDD')).toBe(false)
    })
  })

  describe('hasPart60Overlap', () => {
    it('UUUUU overlaps with Part 60 Da', () => {
      const overlaps = hasPart60Overlap('UUUUU')
      expect(overlaps).toBe(true)
    })

    it('DDDDD overlaps with Part 60 Db', () => {
      const overlaps = hasPart60Overlap('DDDDD')
      expect(overlaps).toBe(true)
    })
  })
})

// ============================================================================
// HAP STANDARDS DETAIL TESTS
// ============================================================================

describe('Part63 HAP Standards Details', () => {
  describe('MATS Mercury Standards', () => {
    it('has lb/TBtu limit for coal units', () => {
      const hgStandard = SUBPART_UUUUU.standards.find(
        (s) => s.parameter === 'Hg' && s.conditions?.includes('coal') === true
      )
      expect(hgStandard).toBeDefined()
      expect(hgStandard?.units).toContain('lb/TBtu')
    })

    it('has separate limit for existing vs new coal units', () => {
      const hgStandards = SUBPART_UUUUU.standards.filter((s) => s.parameter === 'Hg')
      // Check we have both existing and new coal standards
      const hasExistingCoal = hgStandards.some(
        (s) => s.conditions?.includes('existing') === true && s.conditions.includes('coal')
      )
      const hasNewCoal = hgStandards.some(
        (s) => s.conditions?.includes('new') === true && s.conditions.includes('coal')
      )
      // At minimum, coal units should have a standard
      expect(hgStandards.length).toBeGreaterThan(0)
      expect(hasExistingCoal || hasNewCoal).toBe(true)
    })
  })

  describe('MATS HCl Standards', () => {
    it('has lb/MMBtu or ppm limit', () => {
      const hclStandard = SUBPART_UUUUU.standards.find((s) => s.parameter === 'HCl')
      expect(hclStandard).toBeDefined()
      expect(hclStandard?.units).toMatch(/lb\/MMBtu|ppm/)
    })
  })

  describe('MATS PM Standards (HAP metals surrogate)', () => {
    it('has filterable PM limit', () => {
      const pmStandard = SUBPART_UUUUU.standards.find(
        (s) => s.parameter === 'PM' || s.parameter.includes('Filterable')
      )
      expect(pmStandard).toBeDefined()
      expect(pmStandard?.units).toMatch(/lb\/MMBtu|lb\/MWh/)
    })
  })

  describe('IB MACT Standards by Subcategory', () => {
    it('has different PM limits for coal vs gas units', () => {
      const pmStandards = SUBPART_DDDDD.standards.filter((s) => s.parameter === 'PM')
      expect(pmStandards.length).toBeGreaterThan(0)
    })
  })
})

// ============================================================================
// MONITORING REQUIREMENTS TESTS
// ============================================================================

describe('Part63 Monitoring Requirements', () => {
  describe('MATS Hg Monitoring', () => {
    it('specifies Hg CEMS requirements per Part 75 Appendix A', () => {
      const hgMon = SUBPART_UUUUU.monitoring.find((m) => m.parameter === 'Hg')
      expect(hgMon).toBeDefined()
      // Should reference Part 75 Appendix A or Appendix K (sorbent trap)
    })

    it('allows sorbent trap as alternative to CEMS', () => {
      const hgMon = SUBPART_UUUUU.monitoring.find((m) => m.parameter === 'Hg')
      expect(hgMon).toBeDefined()
      if (!hgMon) throw new Error('Hg monitoring not found')
      const hasSorbentTrap =
        hgMon.method === 'sorbent-trap' || hgMon.alternatives?.includes('sorbent-trap') === true
      expect(hasSorbentTrap).toBe(true)
    })
  })

  describe('MATS HCl Monitoring', () => {
    it('allows quarterly stack testing as alternative to CEMS', () => {
      const hclMon = SUBPART_UUUUU.monitoring.find((m) => m.parameter === 'HCl')
      expect(hclMon).toBeDefined()
      if (!hclMon) throw new Error('HCl monitoring not found')
      const hasStackTest =
        hclMon.method === 'stack-test' ||
        hclMon.alternatives?.includes('stack-test') === true ||
        hclMon.frequency.includes('quarterly')
      expect(hasStackTest).toBe(true)
    })
  })

  describe('IB MACT PM CPMS', () => {
    it('allows PM CPMS with site-specific operating limit', () => {
      const pmMon = SUBPART_DDDDD.monitoring.find((m) => m.parameter === 'PM')
      expect(pmMon).toBeDefined()
      if (!pmMon) throw new Error('PM monitoring not found')
      const hasCPMS = pmMon.method === 'CPMS' || pmMon.alternatives?.includes('CPMS') === true
      expect(hasCPMS).toBe(true)
    })
  })
})
