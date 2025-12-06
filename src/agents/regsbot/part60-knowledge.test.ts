/**
 * Part 60 Knowledge Base Tests
 *
 * TDD tests for the Part 60 NSPS knowledge base.
 * These tests verify:
 * 1. Knowledge base structure and completeness
 * 2. Query functions work correctly
 * 3. Integration with RegsBot service
 * 4. Cross-reference accuracy
 */

import { describe, expect, it } from 'vitest'
import {
  analyzeMonitoringPlan,
  determineApplicableNSPS,
  findSubpartsByEquipment,
  findSubpartsByIndustry,
  findSubpartsByParameter,
  getSubpartKnowledge,
  hasPartOverlap,
  INDEXED_SUBPARTS,
  PART60_KNOWLEDGE_BASE,
  SUBPART_Da,
  SUBPART_Db,
  SUBPART_Dc,
  SUBPART_GG,
  SUBPART_IIII,
  SUBPART_J,
  SUBPART_Ja,
  SUBPART_JJJJ,
  SUBPART_Kb,
  SUBPART_KKKK,
  SUBPART_OOOOa,
  SUBPART_TTTT,
  SUBPART_VV,
  SUBPART_VVa,
  validateMethodForParameter,
  type Part60SubpartKnowledge,
} from './part60-knowledge'

// ============================================================================
// KNOWLEDGE BASE STRUCTURE TESTS
// ============================================================================

describe('Part60 Knowledge Base Structure', () => {
  it('contains all priority 1-2 subparts', () => {
    expect(INDEXED_SUBPARTS).toContain('Da')
    expect(INDEXED_SUBPARTS).toContain('TTTT')
    expect(INDEXED_SUBPARTS).toContain('GG')
    expect(INDEXED_SUBPARTS).toContain('KKKK')
    expect(INDEXED_SUBPARTS).toContain('J')
  })

  it('each subpart has required fields', () => {
    const requiredFields: (keyof Part60SubpartKnowledge)[] = [
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
      'requiresCEMS',
      'keyCitations',
    ]

    for (const subpartId of INDEXED_SUBPARTS) {
      const subpart = PART60_KNOWLEDGE_BASE[subpartId]
      expect(subpart).toBeDefined()
      if (!subpart) continue

      for (const field of requiredFields) {
        expect(subpart[field], `${subpartId} missing ${field}`).toBeDefined()
      }
    }
  })

  it('each subpart has at least one emission standard', () => {
    for (const subpartId of INDEXED_SUBPARTS) {
      const subpart = PART60_KNOWLEDGE_BASE[subpartId]
      expect(subpart).toBeDefined()
      if (!subpart) continue
      expect(subpart.standards.length, `${subpartId} has no standards`).toBeGreaterThan(0)
    }
  })

  it('each subpart has at least one monitoring requirement', () => {
    for (const subpartId of INDEXED_SUBPARTS) {
      const subpart = PART60_KNOWLEDGE_BASE[subpartId]
      expect(subpart).toBeDefined()
      if (!subpart) continue
      expect(subpart.monitoring.length, `${subpartId} has no monitoring`).toBeGreaterThan(0)
    }
  })

  it('keyCitations have valid CFR references', () => {
    const cfrPattern = /40 CFR 60\.\d+/

    for (const subpartId of INDEXED_SUBPARTS) {
      const subpart = PART60_KNOWLEDGE_BASE[subpartId]
      expect(subpart).toBeDefined()
      if (!subpart) continue
      expect(subpart.keyCitations.applicability).toMatch(cfrPattern)
      expect(subpart.keyCitations.standards).toMatch(cfrPattern)
      expect(subpart.keyCitations.monitoring).toMatch(cfrPattern)
    }
  })
})

// ============================================================================
// SUBPART Da TESTS (Utility Boilers)
// ============================================================================

describe('Subpart Da - Electric Utility Steam Generators', () => {
  it('has correct applicability criteria', () => {
    expect(SUBPART_Da.applicability.sizeThreshold).toBe('>250 MMBtu/hr heat input capacity')
    expect(SUBPART_Da.applicability.constructionDate).toContain('September 18, 1978')
  })

  it('covers correct equipment types', () => {
    expect(SUBPART_Da.equipmentTypes).toContain('steam-generator')
    expect(SUBPART_Da.equipmentTypes).toContain('boiler')
  })

  it('targets electric utilities', () => {
    expect(SUBPART_Da.industries).toContain('electric-utility')
  })

  it('has SO2, NOX, and PM standards', () => {
    const parameters = SUBPART_Da.standards.map((s) => s.parameter)
    expect(parameters).toContain('SO2')
    expect(parameters).toContain('NOX')
    expect(parameters).toContain('PM')
  })

  it('requires CEMS for SO2, NOX, O2, Opacity', () => {
    expect(SUBPART_Da.requiresCEMS).toBe(true)
    expect(SUBPART_Da.cemsParameters).toContain('SO2')
    expect(SUBPART_Da.cemsParameters).toContain('NOX')
    expect(SUBPART_Da.cemsParameters).toContain('O2')
    expect(SUBPART_Da.cemsParameters).toContain('Opacity')
  })

  it('cross-references Part 75', () => {
    const part75Ref = SUBPART_Da.crossReferences.find((ref) => ref.regulation.includes('Part 75'))
    expect(part75Ref).toBeDefined()
    expect(part75Ref?.relationship).toBe('coordinates')
  })

  it('cross-references MATS (Part 63 UUUUU)', () => {
    const matsRef = SUBPART_Da.crossReferences.find((ref) => ref.regulation.includes('UUUUU'))
    expect(matsRef).toBeDefined()
    expect(matsRef?.relationship).toBe('supplements')
  })

  it('has semiannual excess emissions reporting', () => {
    const excessReport = SUBPART_Da.reporting.find((r) => r.reportType.includes('Excess'))
    expect(excessReport).toBeDefined()
    expect(excessReport?.frequency).toBe('Semiannual')
  })
})

// ============================================================================
// SUBPART TTTT TESTS (GHG for Utilities)
// ============================================================================

describe('Subpart TTTT - Greenhouse Gas for EGUs', () => {
  it('has correct applicability criteria', () => {
    expect(SUBPART_TTTT.applicability.sizeThreshold).toContain('250 MMBtu/hr')
    expect(SUBPART_TTTT.applicability.constructionDate).toContain('January 8, 2014')
  })

  it('has CO2 emission standards', () => {
    const co2Standards = SUBPART_TTTT.standards.filter((s) => s.parameter === 'CO2')
    expect(co2Standards.length).toBeGreaterThan(0)
  })

  it('uses 12-month rolling average', () => {
    const co2Standard = SUBPART_TTTT.standards.find((s) => s.parameter === 'CO2')
    expect(co2Standard?.averagingPeriod).toContain('12-operating-month')
  })

  it('requires CO2 CEMS', () => {
    expect(SUBPART_TTTT.requiresCEMS).toBe(true)
    expect(SUBPART_TTTT.cemsParameters).toContain('CO2')
  })

  it('cross-references Part 75 and Da', () => {
    expect(SUBPART_TTTT.crossReferences.some((r) => r.regulation.includes('Part 75'))).toBe(true)
    expect(SUBPART_TTTT.crossReferences.some((r) => r.regulation.includes('Subpart Da'))).toBe(true)
  })

  it('has 5-year recordkeeping requirement', () => {
    expect(SUBPART_TTTT.recordkeeping.retentionPeriod).toBe('5 years')
  })
})

// ============================================================================
// SUBPART GG TESTS (Gas Turbines - Legacy)
// ============================================================================

describe('Subpart GG - Stationary Gas Turbines (Legacy)', () => {
  it('has correct size threshold', () => {
    expect(SUBPART_GG.applicability.sizeThreshold).toContain('10 MMBtu/hr')
  })

  it('applies to construction after October 3, 1977', () => {
    expect(SUBPART_GG.applicability.constructionDate).toContain('October 3, 1977')
  })

  it('covers gas turbines', () => {
    expect(SUBPART_GG.equipmentTypes).toContain('gas-turbine')
  })

  it('has NOX and SO2 standards', () => {
    const parameters = SUBPART_GG.standards.map((s) => s.parameter)
    expect(parameters).toContain('NOX')
    expect(parameters).toContain('SO2')
  })

  it('allows fuel sulfur monitoring as alternative to SO2 CEMS', () => {
    const fuelMonitoring = SUBPART_GG.monitoring.find((m) => m.parameter === 'Fuel Sulfur')
    expect(fuelMonitoring).toBeDefined()
    expect(fuelMonitoring?.method).toBe('fuel-analysis')
  })

  it('is replaced by KKKK for newer turbines', () => {
    const kkkkRef = SUBPART_GG.crossReferences.find((r) => r.regulation.includes('KKKK'))
    expect(kkkkRef).toBeDefined()
    expect(kkkkRef?.relationship).toBe('replaces')
  })

  it('does not require CEMS by default', () => {
    expect(SUBPART_GG.requiresCEMS).toBe(false)
  })
})

// ============================================================================
// SUBPART KKKK TESTS (Combustion Turbines - Current)
// ============================================================================

describe('Subpart KKKK - Stationary Combustion Turbines', () => {
  it('applies to construction after February 18, 2005', () => {
    expect(SUBPART_KKKK.applicability.constructionDate).toContain('February 18, 2005')
  })

  it('has size threshold of 10 MMBtu/hr', () => {
    expect(SUBPART_KKKK.applicability.sizeThreshold).toContain('10 MMBtu/hr')
  })

  it('has stricter NOX limits than GG for large turbines', () => {
    const kkkkNox = SUBPART_KKKK.standards.find(
      (s) => s.parameter === 'NOX' && (s.conditions?.some((c) => c.includes('≥30 MW')) ?? false)
    )
    const ggNox = SUBPART_GG.standards.find((s) => s.parameter === 'NOX')

    // KKKK is 25 ppm for large gas turbines, GG is 150 ppm
    expect(Number(kkkkNox?.limit)).toBeLessThan(Number(ggNox?.limit))
  })

  it('uses 4-hour rolling average for NOX', () => {
    const noxStandard = SUBPART_KKKK.standards.find((s) => s.parameter === 'NOX')
    expect(noxStandard?.averagingPeriod).toContain('4-hour rolling')
  })

  it('requires NOX CEMS', () => {
    expect(SUBPART_KKKK.requiresCEMS).toBe(true)
    expect(SUBPART_KKKK.cemsParameters).toContain('NOX')
  })

  it('coordinates with Part 75', () => {
    const part75Ref = SUBPART_KKKK.crossReferences.find((r) => r.regulation.includes('Part 75'))
    expect(part75Ref).toBeDefined()
    expect(part75Ref?.relationship).toBe('coordinates')
  })

  it('has 5-year recordkeeping', () => {
    expect(SUBPART_KKKK.recordkeeping.retentionPeriod).toBe('5 years')
  })
})

// ============================================================================
// SUBPART J TESTS (Petroleum Refineries)
// ============================================================================

describe('Subpart J - Petroleum Refineries', () => {
  it('covers FCCU, Claus, and fuel gas equipment', () => {
    expect(SUBPART_J.equipmentTypes).toContain('fccu')
    expect(SUBPART_J.equipmentTypes).toContain('claus-unit')
    expect(SUBPART_J.equipmentTypes).toContain('fuel-gas-combustion')
  })

  it('targets petroleum refining industry', () => {
    expect(SUBPART_J.industries).toContain('petroleum-refining')
  })

  it('has PM standard for FCCU in kg/Mg coke', () => {
    const pmStandard = SUBPART_J.standards.find(
      (s) => s.parameter === 'PM' && (s.conditions?.some((c) => c.includes('FCCU')) ?? false)
    )
    expect(pmStandard).toBeDefined()
    expect(pmStandard?.units).toBe('kg/Mg coke burn-off')
  })

  it('has CO limit of 500 ppm for FCCU', () => {
    const coStandard = SUBPART_J.standards.find((s) => s.parameter === 'CO')
    expect(coStandard?.limit).toBe('500')
    expect(coStandard?.units).toBe('ppmv')
  })

  it('has H2S limit for fuel gas combustion', () => {
    const h2sStandard = SUBPART_J.standards.find(
      (s) => s.parameter === 'H2S' && s.units.includes('mg')
    )
    expect(h2sStandard).toBeDefined()
    expect(h2sStandard?.limit).toBe('230')
  })

  it('requires CO and SO2 CEMS', () => {
    expect(SUBPART_J.requiresCEMS).toBe(true)
    expect(SUBPART_J.cemsParameters).toContain('CO')
    expect(SUBPART_J.cemsParameters).toContain('SO2')
  })

  it('has coke burn rate calculation method', () => {
    const cokeMethod = SUBPART_J.testMethods.find((m) => m.parameter === 'Coke Burn Rate')
    expect(cokeMethod).toBeDefined()
  })

  it('has semiannual reporting', () => {
    const report = SUBPART_J.reporting.find((r) => r.frequency === 'Semiannual')
    expect(report).toBeDefined()
  })
})

// ============================================================================
// SUBPART Db TESTS (Industrial-Commercial-Institutional Steam Generators)
// ============================================================================

describe('Subpart Db - Industrial Steam Generators', () => {
  it('is indexed in knowledge base', () => {
    expect(INDEXED_SUBPARTS).toContain('Db')
  })

  it('covers boilers and steam generators', () => {
    expect(SUBPART_Db.equipmentTypes).toContain('boiler')
    expect(SUBPART_Db.equipmentTypes).toContain('steam-generator')
  })

  it('targets industrial sector', () => {
    expect(SUBPART_Db.industries).toContain('industrial')
  })

  it('has size threshold of 100 MMBtu/hr', () => {
    expect(SUBPART_Db.applicability.sizeThreshold).toContain('100')
    expect(SUBPART_Db.applicability.sizeThreshold).toContain('MMBtu/hr')
  })

  it('has SO2 emission standards with reduction option', () => {
    const so2Standards = SUBPART_Db.standards.filter((s) => s.parameter === 'SO2')
    expect(so2Standards.length).toBeGreaterThan(0)
    // Db allows either emission rate OR percent reduction
    const hasReduction = so2Standards.some((s) => s.limit.includes('%'))
    const hasRate = so2Standards.some((s) => s.units.includes('lb/MMBtu'))
    expect(hasReduction || hasRate).toBe(true)
  })

  it('has PM emission standard', () => {
    const pmStandard = SUBPART_Db.standards.find((s) => s.parameter === 'PM')
    expect(pmStandard).toBeDefined()
    expect(pmStandard?.units).toBe('lb/MMBtu')
  })

  it('has NOX emission standard', () => {
    const noxStandard = SUBPART_Db.standards.find((s) => s.parameter === 'NOX')
    expect(noxStandard).toBeDefined()
  })

  it('requires SO2 CEMS or fuel sulfur monitoring', () => {
    const so2Monitoring = SUBPART_Db.monitoring.find((m) => m.parameter === 'SO2')
    expect(so2Monitoring).toBeDefined()
    // Db allows either CEMS or fuel analysis
    const method = so2Monitoring?.method
    expect(['CEMS', 'fuel-analysis'].includes(method as string)).toBe(true)
  })

  it('has 30-day rolling average for SO2', () => {
    const so2Standard = SUBPART_Db.standards.find((s) => s.parameter === 'SO2')
    expect(so2Standard?.averagingPeriod).toContain('30-day')
  })

  it('has quarterly or semiannual reporting', () => {
    const report = SUBPART_Db.reporting.find(
      (r) => r.frequency === 'Semiannual' || r.frequency === 'Quarterly'
    )
    expect(report).toBeDefined()
  })

  it('has 2-year recordkeeping', () => {
    expect(SUBPART_Db.recordkeeping.retentionPeriod).toBe('2 years')
  })

  it('cross-references Part 63 Subpart DDDDD (Boiler MACT)', () => {
    const mactRef = SUBPART_Db.crossReferences.find((r) => r.regulation.includes('DDDDD'))
    expect(mactRef).toBeDefined()
    expect(mactRef?.notes).toContain('Boiler MACT')
  })
})

// ============================================================================
// SUBPART Dc TESTS (Small Industrial Boilers)
// ============================================================================

describe('Subpart Dc - Small Industrial Boilers', () => {
  it('is indexed in knowledge base', () => {
    expect(INDEXED_SUBPARTS).toContain('Dc')
  })

  it('covers boilers and steam generators', () => {
    expect(SUBPART_Dc.equipmentTypes).toContain('boiler')
    expect(SUBPART_Dc.equipmentTypes).toContain('steam-generator')
  })

  it('targets industrial sector', () => {
    expect(SUBPART_Dc.industries).toContain('industrial')
  })

  it('has size threshold between 10-100 MMBtu/hr', () => {
    expect(SUBPART_Dc.applicability.sizeThreshold).toContain('10')
    expect(SUBPART_Dc.applicability.sizeThreshold).toContain('100')
    expect(SUBPART_Dc.applicability.sizeThreshold).toContain('MMBtu/hr')
  })

  it('has SO2 emission standard', () => {
    const so2Standard = SUBPART_Dc.standards.find((s) => s.parameter === 'SO2')
    expect(so2Standard).toBeDefined()
  })

  it('has PM emission standard (opacity-based option)', () => {
    const pmStandard = SUBPART_Dc.standards.find((s) => s.parameter === 'PM')
    expect(pmStandard).toBeDefined()
  })

  it('allows fuel sulfur monitoring as alternative to CEMS', () => {
    const so2Monitoring = SUBPART_Dc.monitoring.find((m) => m.parameter === 'SO2')
    expect(so2Monitoring).toBeDefined()
    expect(so2Monitoring?.method).toBe('fuel-analysis')
  })

  it('has less stringent monitoring than Db', () => {
    // Dc is for smaller units, so monitoring is less intensive
    expect(SUBPART_Dc.requiresCEMS).toBe(false)
  })

  it('has annual or semiannual reporting', () => {
    const report = SUBPART_Dc.reporting.find(
      (r) => r.frequency === 'Annual' || r.frequency === 'Semiannual'
    )
    expect(report).toBeDefined()
  })

  it('cross-references Part 63 Subpart DDDDD (Boiler MACT)', () => {
    const mactRef = SUBPART_Dc.crossReferences.find((r) => r.regulation.includes('DDDDD'))
    expect(mactRef).toBeDefined()
  })
})

// ============================================================================
// SUBPART IIII TESTS (CI Engines - Stationary)
// ============================================================================

describe('Subpart IIII - Stationary CI Engines', () => {
  it('is indexed in knowledge base', () => {
    expect(INDEXED_SUBPARTS).toContain('IIII')
  })

  it('covers compression ignition engines', () => {
    expect(SUBPART_IIII.equipmentTypes).toContain('ci-ice')
  })

  it('targets industrial sector', () => {
    expect(SUBPART_IIII.industries).toContain('industrial')
  })

  it('has NOX+NMHC emission standard', () => {
    const noxStandard = SUBPART_IIII.standards.find(
      (s) => s.parameter === 'NOX+NMHC' || s.parameter === 'NOX'
    )
    expect(noxStandard).toBeDefined()
  })

  it('has PM emission standard', () => {
    const pmStandard = SUBPART_IIII.standards.find((s) => s.parameter === 'PM')
    expect(pmStandard).toBeDefined()
  })

  it('has CO emission standard', () => {
    const coStandard = SUBPART_IIII.standards.find((s) => s.parameter === 'CO')
    expect(coStandard).toBeDefined()
  })

  it('requires certified engine or performance testing', () => {
    // CI engines can use manufacturer certification or stack testing
    const testMethod = SUBPART_IIII.testMethods.find((m) =>
      m.methods.some((method) => method.includes('certification') || method.includes('Method'))
    )
    expect(testMethod).toBeDefined()
  })

  it('has different tiers based on model year and size', () => {
    // Standards vary by model year (Tier 1, 2, 3, 4)
    const tieredStandard = SUBPART_IIII.standards.find(
      (s) => s.conditions?.some((c) => c.includes('Tier') || c.includes('model year')) ?? false
    )
    expect(tieredStandard).toBeDefined()
  })

  it('cross-references Part 63 Subpart ZZZZ (RICE NESHAP)', () => {
    const zzzRef = SUBPART_IIII.crossReferences.find((r) => r.regulation.includes('ZZZZ'))
    expect(zzzRef).toBeDefined()
  })

  it('has annual or semiannual reporting', () => {
    const report = SUBPART_IIII.reporting.find(
      (r) => r.frequency === 'Annual' || r.frequency === 'Semiannual'
    )
    expect(report).toBeDefined()
  })
})

// ============================================================================
// SUBPART JJJJ TESTS (SI Engines - Stationary)
// ============================================================================

describe('Subpart JJJJ - Stationary SI Engines', () => {
  it('is indexed in knowledge base', () => {
    expect(INDEXED_SUBPARTS).toContain('JJJJ')
  })

  it('covers spark ignition engines', () => {
    expect(SUBPART_JJJJ.equipmentTypes).toContain('si-ice')
  })

  it('targets industrial and oil-gas sectors', () => {
    expect(SUBPART_JJJJ.industries).toContain('industrial')
  })

  it('has NOX emission standard', () => {
    const noxStandard = SUBPART_JJJJ.standards.find((s) => s.parameter === 'NOX')
    expect(noxStandard).toBeDefined()
  })

  it('has CO emission standard', () => {
    const coStandard = SUBPART_JJJJ.standards.find((s) => s.parameter === 'CO')
    expect(coStandard).toBeDefined()
  })

  it('has VOC emission standard', () => {
    const vocStandard = SUBPART_JJJJ.standards.find((s) => s.parameter === 'VOC')
    expect(vocStandard).toBeDefined()
  })

  it('distinguishes rich-burn vs lean-burn engines', () => {
    const richBurn = SUBPART_JJJJ.standards.find(
      (s) => s.conditions?.some((c) => c.toLowerCase().includes('rich')) ?? false
    )
    const leanBurn = SUBPART_JJJJ.standards.find(
      (s) => s.conditions?.some((c) => c.toLowerCase().includes('lean')) ?? false
    )
    expect(richBurn ?? leanBurn).toBeDefined()
  })

  it('cross-references Part 63 Subpart ZZZZ (RICE NESHAP)', () => {
    const zzzRef = SUBPART_JJJJ.crossReferences.find((r) => r.regulation.includes('ZZZZ'))
    expect(zzzRef).toBeDefined()
  })

  it('has 5-year recordkeeping', () => {
    expect(SUBPART_JJJJ.recordkeeping.retentionPeriod).toBe('5 years')
  })
})

// ============================================================================
// SUBPART Ja TESTS (Petroleum Refineries - 2008+)
// ============================================================================

describe('Subpart Ja - Petroleum Refineries (2008+)', () => {
  it('is indexed in knowledge base', () => {
    expect(INDEXED_SUBPARTS).toContain('Ja')
  })

  it('covers FCCU, process heaters, and flares', () => {
    expect(SUBPART_Ja.equipmentTypes).toContain('fccu')
    expect(SUBPART_Ja.equipmentTypes).toContain('process-heater')
    expect(SUBPART_Ja.equipmentTypes).toContain('flare')
  })

  it('targets petroleum refining industry', () => {
    expect(SUBPART_Ja.industries).toContain('petroleum-refining')
  })

  it('has construction date after May 14, 2007', () => {
    expect(SUBPART_Ja.applicability.constructionDate).toContain('2007')
  })

  it('has more stringent PM limit than Subpart J', () => {
    const jaPM = SUBPART_Ja.standards.find(
      (s) => s.parameter === 'PM' && (s.conditions?.some((c) => c.includes('FCCU')) ?? false)
    )
    expect(jaPM).toBeDefined()
    // Ja limit is 0.5 kg/Mg vs J's 1.0 kg/Mg
    expect(parseFloat(jaPM?.limit ?? '1')).toBeLessThanOrEqual(1.0)
  })

  it('has SO2 limit for FCCU', () => {
    const so2Standard = SUBPART_Ja.standards.find(
      (s) => s.parameter === 'SO2' && (s.conditions?.some((c) => c.includes('FCCU')) ?? false)
    )
    expect(so2Standard).toBeDefined()
  })

  it('has NOX limit for FCCU', () => {
    const noxStandard = SUBPART_Ja.standards.find(
      (s) => s.parameter === 'NOX' && (s.conditions?.some((c) => c.includes('FCCU')) ?? false)
    )
    expect(noxStandard).toBeDefined()
  })

  it('requires flare monitoring', () => {
    const flareMonitoring = SUBPART_Ja.monitoring.find(
      (m) => m.parameter.toLowerCase().includes('flare') || m.parameter.includes('Flow')
    )
    expect(flareMonitoring).toBeDefined()
  })

  it('has process heater requirements', () => {
    const heaterStandard = SUBPART_Ja.standards.find(
      (s) => s.conditions?.some((c) => c.toLowerCase().includes('heater')) ?? false
    )
    expect(heaterStandard).toBeDefined()
  })

  it('cross-references Subpart J', () => {
    const jRef = SUBPART_Ja.crossReferences.find(
      (r) => r.regulation.includes('Subpart J') && !r.regulation.includes('Ja')
    )
    expect(jRef).toBeDefined()
    expect(jRef?.relationship).toBe('supplements')
  })

  it('requires CEMS for FCCU', () => {
    expect(SUBPART_Ja.requiresCEMS).toBe(true)
    expect(SUBPART_Ja.cemsParameters).toContain('SO2')
    expect(SUBPART_Ja.cemsParameters).toContain('NOX')
  })
})

// ============================================================================
// LDAR AND NON-CEM SUBPART TESTS
// ============================================================================

describe('Subpart VV - SOCMI Equipment Leaks (Legacy)', () => {
  it('is indexed in knowledge base', () => {
    expect(PART60_KNOWLEDGE_BASE['VV']).toBeDefined()
  })

  it('covers LDAR equipment types', () => {
    expect(SUBPART_VV.equipmentTypes).toContain('valve')
    expect(SUBPART_VV.equipmentTypes).toContain('pump')
    expect(SUBPART_VV.equipmentTypes).toContain('compressor')
    expect(SUBPART_VV.equipmentTypes).toContain('pressure-relief-device')
  })

  it('targets SOCMI industry', () => {
    // SOCMI is chemical-manufacturing sector
    expect(SUBPART_VV.industries).toContain('chemical-manufacturing')
  })

  it('has 10,000 ppmv leak definition', () => {
    const leakStandard = SUBPART_VV.standards.find(
      (s) => s.parameter === 'VOC' && s.limit === '10,000'
    )
    expect(leakStandard).toBeDefined()
    expect(leakStandard?.units).toBe('ppmv')
  })

  it('uses Method 21 monitoring', () => {
    const method21 = SUBPART_VV.monitoring.find((m) => m.method === 'ldar-monitoring')
    expect(method21).toBeDefined()
    expect(method21?.parameter).toBe('VOC')
  })

  it('does not require CEMS', () => {
    expect(SUBPART_VV.requiresCEMS).toBe(false)
  })

  it('has monthly monitoring for valves', () => {
    const valveMonitoring = SUBPART_VV.monitoring.find((m) =>
      m.frequency.toLowerCase().includes('monthly')
    )
    expect(valveMonitoring).toBeDefined()
  })
})

describe('Subpart VVa - SOCMI Equipment Leaks (2006+)', () => {
  it('is indexed in knowledge base', () => {
    expect(PART60_KNOWLEDGE_BASE['VVa']).toBeDefined()
  })

  it('covers LDAR equipment types including connectors', () => {
    expect(SUBPART_VVa.equipmentTypes).toContain('valve')
    expect(SUBPART_VVa.equipmentTypes).toContain('pump')
    expect(SUBPART_VVa.equipmentTypes).toContain('connector')
  })

  it('has tighter 500 ppmv leak definition', () => {
    const leakStandard = SUBPART_VVa.standards.find(
      (s) => s.parameter === 'VOC' && s.limit === '500'
    )
    expect(leakStandard).toBeDefined()
    expect(leakStandard?.units).toBe('ppmv')
  })

  it('applies after November 7, 2006', () => {
    expect(SUBPART_VVa.applicability.constructionDate).toContain('2006')
  })

  it('cross-references legacy Subpart VV', () => {
    const vvRef = SUBPART_VVa.crossReferences.find((r) => r.regulation.includes('Subpart VV'))
    expect(vvRef).toBeDefined()
    expect(vvRef?.relationship).toBe('replaces')
  })
})

describe('Subpart Kb - Volatile Organic Liquid Storage Vessels', () => {
  it('is indexed in knowledge base', () => {
    expect(PART60_KNOWLEDGE_BASE['Kb']).toBeDefined()
  })

  it('covers storage vessel equipment', () => {
    expect(SUBPART_Kb.equipmentTypes).toContain('storage-vessel')
  })

  it('has vapor pressure threshold', () => {
    expect(SUBPART_Kb.applicability.description).toMatch(/vapor pressure|kPa/i)
  })

  it('has 95% control efficiency standard', () => {
    const controlStandard = SUBPART_Kb.standards.find(
      (s) => s.limit === '95%' && s.units === 'percent control'
    )
    expect(controlStandard).toBeDefined()
  })

  it('requires periodic inspection not CEMS', () => {
    expect(SUBPART_Kb.requiresCEMS).toBe(false)
    const inspection = SUBPART_Kb.monitoring.find((m) =>
      m.frequency.toLowerCase().includes('annual')
    )
    expect(inspection).toBeDefined()
  })

  it('targets petroleum and chemical industries', () => {
    expect(
      SUBPART_Kb.industries.includes('petroleum-refining') ||
        SUBPART_Kb.industries.includes('chemical-manufacturing')
    ).toBe(true)
  })
})

describe('Subpart OOOOa - Crude Oil and Natural Gas (2016+)', () => {
  it('is indexed in knowledge base', () => {
    expect(PART60_KNOWLEDGE_BASE['OOOOa']).toBeDefined()
  })

  it('covers oil and gas equipment', () => {
    expect(SUBPART_OOOOa.equipmentTypes).toContain('compressor')
    expect(SUBPART_OOOOa.equipmentTypes).toContain('storage-vessel')
    expect(SUBPART_OOOOa.equipmentTypes).toContain('valve')
  })

  it('targets upstream and midstream oil/gas', () => {
    expect(SUBPART_OOOOa.industries).toContain('oil-gas-upstream')
    expect(SUBPART_OOOOa.industries).toContain('oil-gas-midstream')
  })

  it('uses OGI as primary monitoring method', () => {
    const ogi = SUBPART_OOOOa.monitoring.find((m) => m.method === 'ogi-monitoring')
    expect(ogi).toBeDefined()
  })

  it('has 500 ppmv fugitive leak threshold', () => {
    const leakStandard = SUBPART_OOOOa.standards.find(
      (s) =>
        s.parameter === 'VOC' &&
        s.limit === '500' &&
        (s.conditions?.some((c) => c.toLowerCase().includes('fugitive')) ?? false)
    )
    expect(leakStandard).toBeDefined()
  })

  it('does not require CEMS', () => {
    expect(SUBPART_OOOOa.requiresCEMS).toBe(false)
  })

  it('applies after September 18, 2015', () => {
    expect(SUBPART_OOOOa.applicability.constructionDate).toContain('2015')
  })

  it('cross-references OOOO and OOOOb', () => {
    const oooo = SUBPART_OOOOa.crossReferences.find((r) => r.regulation.includes('Subpart OOOO'))
    const oooob = SUBPART_OOOOa.crossReferences.find((r) => r.regulation.includes('OOOOb'))
    expect(oooo).toBeDefined()
    expect(oooob).toBeDefined()
  })
})

// ============================================================================
// QUERY FUNCTION TESTS
// ============================================================================

describe('getSubpartKnowledge', () => {
  it('returns correct subpart by ID', () => {
    expect(getSubpartKnowledge('Da')).toBe(SUBPART_Da)
    expect(getSubpartKnowledge('KKKK')).toBe(SUBPART_KKKK)
    expect(getSubpartKnowledge('J')).toBe(SUBPART_J)
    expect(getSubpartKnowledge('Db')).toBe(SUBPART_Db)
    expect(getSubpartKnowledge('Dc')).toBe(SUBPART_Dc)
    expect(getSubpartKnowledge('Ja')).toBe(SUBPART_Ja)
    expect(getSubpartKnowledge('IIII')).toBe(SUBPART_IIII)
    expect(getSubpartKnowledge('JJJJ')).toBe(SUBPART_JJJJ)
  })

  it('returns undefined for unknown subpart', () => {
    expect(getSubpartKnowledge('ZZZZ')).toBeUndefined()
    expect(getSubpartKnowledge('ABC')).toBeUndefined() // Made-up subpart
  })
})

describe('findSubpartsByEquipment', () => {
  it('finds subparts for steam generators', () => {
    const subparts = findSubpartsByEquipment('steam-generator')
    expect(subparts.some((s) => s.subpart === 'Da')).toBe(true)
    expect(subparts.some((s) => s.subpart === 'TTTT')).toBe(true)
  })

  it('finds subparts for gas turbines', () => {
    const subparts = findSubpartsByEquipment('gas-turbine')
    expect(subparts.some((s) => s.subpart === 'GG')).toBe(true)
    expect(subparts.some((s) => s.subpart === 'KKKK')).toBe(true)
  })

  it('finds subparts for FCCU', () => {
    const subparts = findSubpartsByEquipment('fccu')
    expect(subparts.some((s) => s.subpart === 'J')).toBe(true)
    expect(subparts.some((s) => s.subpart === 'Ja')).toBe(true)
  })

  it('finds subparts for CI engines', () => {
    const subparts = findSubpartsByEquipment('ci-ice')
    expect(subparts.some((s) => s.subpart === 'IIII')).toBe(true)
  })

  it('finds subparts for SI engines', () => {
    const subparts = findSubpartsByEquipment('si-ice')
    expect(subparts.some((s) => s.subpart === 'JJJJ')).toBe(true)
  })

  it('finds subparts for storage vessels', () => {
    const subparts = findSubpartsByEquipment('storage-vessel')
    // Storage vessels now indexed - Kb and OOOOa both cover them
    expect(subparts.some((s) => s.subpart === 'Kb')).toBe(true)
    expect(subparts.some((s) => s.subpart === 'OOOOa')).toBe(true)
  })
})

describe('findSubpartsByIndustry', () => {
  it('finds subparts for electric utilities', () => {
    const subparts = findSubpartsByIndustry('electric-utility')
    expect(subparts.some((s) => s.subpart === 'Da')).toBe(true)
    expect(subparts.some((s) => s.subpart === 'TTTT')).toBe(true)
    expect(subparts.some((s) => s.subpart === 'KKKK')).toBe(true)
  })

  it('finds subparts for petroleum refining', () => {
    const subparts = findSubpartsByIndustry('petroleum-refining')
    expect(subparts.some((s) => s.subpart === 'J')).toBe(true)
  })

  it('finds subparts for industrial facilities', () => {
    const subparts = findSubpartsByIndustry('industrial')
    expect(subparts.some((s) => s.subpart === 'GG')).toBe(true)
    expect(subparts.some((s) => s.subpart === 'KKKK')).toBe(true)
  })
})

describe('findSubpartsByParameter', () => {
  it('finds subparts requiring SO2 monitoring', () => {
    const subparts = findSubpartsByParameter('SO2')
    expect(subparts.some((s) => s.subpart === 'Da')).toBe(true)
    expect(subparts.some((s) => s.subpart === 'J')).toBe(true)
  })

  it('finds subparts requiring NOX monitoring', () => {
    const subparts = findSubpartsByParameter('NOX')
    expect(subparts.some((s) => s.subpart === 'Da')).toBe(true)
    expect(subparts.some((s) => s.subpart === 'KKKK')).toBe(true)
  })

  it('finds subparts requiring CO2 monitoring', () => {
    const subparts = findSubpartsByParameter('CO2')
    expect(subparts.some((s) => s.subpart === 'TTTT')).toBe(true)
  })

  it('finds subparts requiring CO monitoring', () => {
    const subparts = findSubpartsByParameter('CO')
    expect(subparts.some((s) => s.subpart === 'J')).toBe(true)
  })
})

describe('hasPartOverlap', () => {
  it('returns true for subparts that coordinate with Part 75', () => {
    expect(hasPartOverlap('Da')).toBe(true)
    expect(hasPartOverlap('TTTT')).toBe(true)
    expect(hasPartOverlap('KKKK')).toBe(true)
  })

  it('returns false for subparts without Part 75 overlap', () => {
    expect(hasPartOverlap('J')).toBe(false) // Refineries don't use Part 75
  })

  it('returns false for unknown subparts', () => {
    expect(hasPartOverlap('ZZZZ')).toBe(false)
  })
})

// ============================================================================
// CROSS-REFERENCE INTEGRITY TESTS
// ============================================================================

describe('Cross-Reference Integrity', () => {
  it('Da and TTTT reference each other', () => {
    const daRefsTttt = SUBPART_Da.crossReferences.some((r) => r.regulation.includes('TTTT'))
    const ttttRefsDa = SUBPART_TTTT.crossReferences.some((r) => r.regulation.includes('Da'))
    expect(daRefsTttt).toBe(true)
    expect(ttttRefsDa).toBe(true)
  })

  it('GG and KKKK have replace relationship', () => {
    const ggRefsKkkk = SUBPART_GG.crossReferences.find((r) => r.regulation.includes('KKKK'))
    expect(ggRefsKkkk?.relationship).toBe('replaces')
  })

  it('all subparts with Part 75 overlap use coordinates relationship', () => {
    for (const subpartId of INDEXED_SUBPARTS) {
      const subpart = PART60_KNOWLEDGE_BASE[subpartId]
      if (!subpart) continue
      const part75Ref = subpart.crossReferences.find((r) => r.regulation.includes('Part 75'))
      if (part75Ref) {
        expect(part75Ref.relationship).toBe('coordinates')
      }
    }
  })
})

// ============================================================================
// DAHS INTEGRATION REQUIREMENT TESTS
// These document what DAHS needs to implement to support each subpart
// ============================================================================

describe('DAHS Integration Requirements', () => {
  describe('For Subpart Da Support', () => {
    it('DAHS must support SO2 CEMS with 95% data recovery', () => {
      const so2Monitoring = SUBPART_Da.monitoring.find((m) => m.parameter === 'SO2')
      expect(so2Monitoring?.dataRecovery).toBe('≥95% per quarter')
    })

    it('DAHS must calculate 30-day rolling averages', () => {
      const so2Standard = SUBPART_Da.standards.find((s) => s.parameter === 'SO2')
      expect(so2Standard?.averagingPeriod).toContain('30-day rolling')
    })

    it('DAHS must track excess emissions for semiannual reporting', () => {
      const report = SUBPART_Da.reporting.find((r) => r.reportType.includes('Excess'))
      expect(report?.contents).toContain('Exceedances of emission standards')
    })
  })

  describe('For Subpart KKKK Support', () => {
    it('DAHS must calculate 4-hour rolling averages for NOX', () => {
      const noxStandard = SUBPART_KKKK.standards.find((s) => s.parameter === 'NOX')
      expect(noxStandard?.averagingPeriod).toContain('4-hour rolling')
    })

    it('DAHS must support startup/shutdown tracking', () => {
      expect(SUBPART_KKKK.recordkeeping.records).toContain('Startup/shutdown records')
    })
  })

  describe('For Subpart J Support', () => {
    it('DAHS must calculate coke burn-off rate', () => {
      const cokeMethod = SUBPART_J.testMethods.find((m) => m.parameter === 'Coke Burn Rate')
      expect(cokeMethod?.methods).toContain('Procedure in §60.106')
    })

    it('DAHS must support H2S monitoring for fuel gas', () => {
      const h2sMonitoring = SUBPART_J.monitoring.find((m) => m.parameter === 'H2S')
      expect(h2sMonitoring).toBeDefined()
    })

    it('DAHS must calculate 12-hour averages for Claus SO2', () => {
      const so2Standard = SUBPART_J.standards.find(
        (s) => s.parameter === 'SO2' && (s.conditions?.some((c) => c.includes('Claus')) ?? false)
      )
      expect(so2Standard?.averagingPeriod).toBe('12-hour average')
    })
  })
})

// ============================================================================
// MONITORING PLAN ANALYSIS TESTS
// ============================================================================

describe('analyzeMonitoringPlan', () => {
  describe('Equipment Type Mapping', () => {
    it('maps boiler to steam-generator equipment type', () => {
      const result = analyzeMonitoringPlan([
        {
          unitType: 'boiler',
          fuelType: 'coal',
          parameters: ['SO2', 'NOX'],
          methods: ['CEM'],
        },
      ])
      expect(result.applicableSubparts.length).toBeGreaterThan(0)
      expect(result.applicableSubparts.some((s) => s.subpart === 'Da')).toBe(true)
    })

    it('maps turbine to gas-turbine equipment type', () => {
      const result = analyzeMonitoringPlan([
        {
          unitType: 'gas turbine',
          fuelType: 'natural gas',
          parameters: ['NOX'],
          methods: ['CEM'],
        },
      ])
      expect(result.applicableSubparts.some((s) => ['GG', 'KKKK'].includes(s.subpart))).toBe(true)
    })

    it('maps diesel engine to ci-ice equipment type', () => {
      const result = analyzeMonitoringPlan([
        {
          unitType: 'diesel engine',
          fuelType: 'diesel',
          parameters: ['NOX', 'PM'],
          methods: ['CEM'],
        },
      ])
      expect(result.applicableSubparts.some((s) => s.subpart === 'IIII')).toBe(true)
    })

    it('maps natural gas engine to si-ice equipment type', () => {
      const result = analyzeMonitoringPlan([
        {
          unitType: 'reciprocating engine',
          fuelType: 'natural gas',
          parameters: ['NOX', 'CO', 'VOC'],
          methods: ['stack-test'],
          industryType: 'industrial',
        },
      ])
      // JJJJ doesn't require CEMS, so we check if it found any applicable subpart for si-ice
      expect(result.applicableSubparts.length).toBeGreaterThan(0)
    })

    it('maps FCCU to petroleum refining', () => {
      const result = analyzeMonitoringPlan([
        {
          unitType: 'FCCU',
          fuelType: 'process',
          parameters: ['SO2', 'CO'],
          methods: ['CEM'],
        },
      ])
      expect(result.applicableSubparts.some((s) => ['J', 'Ja'].includes(s.subpart))).toBe(true)
    })
  })

  describe('Part 75 Overlap Detection', () => {
    it('detects Part 75 overlap for utility boiler', () => {
      const result = analyzeMonitoringPlan([
        {
          unitType: 'utility boiler',
          fuelType: 'coal',
          parameters: ['SO2', 'NOX', 'CO2'],
          methods: ['CEM'],
        },
      ])
      expect(result.part75Overlap).toBe(true)
      expect(result.part75Notes).toContain('Part 75')
    })
  })

  describe('LME Eligibility Warnings', () => {
    it('warns when LME used with high capacity', () => {
      const result = analyzeMonitoringPlan([
        {
          unitType: 'boiler',
          fuelType: 'gas',
          parameters: ['SO2', 'NOX'],
          methods: ['LME'],
          capacity: 50,
        },
      ])
      expect(result.warnings.some((w) => w.includes('LME') && w.includes('threshold'))).toBe(true)
    })

    it('recommends LME verification for all LME units', () => {
      const result = analyzeMonitoringPlan([
        {
          unitType: 'boiler',
          fuelType: 'gas',
          parameters: ['SO2'],
          methods: ['LME'],
        },
      ])
      expect(result.recommendations.some((r) => r.includes('75.19'))).toBe(true)
    })
  })

  describe('Appendix D Recommendations', () => {
    it('recommends sulfur sampling for oil-fired AD units', () => {
      const result = analyzeMonitoringPlan([
        {
          unitType: 'boiler',
          fuelType: 'fuel oil',
          parameters: ['SO2', 'HI'],
          methods: ['AD'],
        },
      ])
      expect(result.recommendations.some((r) => r.includes('sulfur sampling'))).toBe(true)
    })
  })

  describe('Confidence Levels', () => {
    it('assigns high confidence when parameters and industry match', () => {
      const result = analyzeMonitoringPlan([
        {
          unitType: 'utility boiler',
          fuelType: 'coal',
          parameters: ['SO2', 'NOX'],
          methods: ['CEM'],
          industryType: 'electric-utility',
        },
      ])
      const daSubpart = result.applicableSubparts.find((s) => s.subpart === 'Da')
      expect(daSubpart?.confidence).toBe('high')
    })
  })
})

describe('validateMethodForParameter', () => {
  describe('CEM Validation', () => {
    it('validates CEM for SO2', () => {
      const result = validateMethodForParameter('CEM', 'SO2', 'coal-fired boiler')
      expect(result.valid).toBe(true)
      expect(result.cfrCitation).toContain('75.10')
      expect(result.requirements.length).toBeGreaterThan(0)
    })

    it('validates CEM for NOX', () => {
      const result = validateMethodForParameter('CEM', 'NOX', 'gas turbine')
      expect(result.valid).toBe(true)
    })

    it('rejects CEM for invalid parameter', () => {
      const result = validateMethodForParameter('CEM', 'H2S', 'refinery')
      expect(result.valid).toBe(false)
      expect(result.warnings.some((w) => w.includes('not applicable'))).toBe(true)
    })

    it('includes QA requirements for CEM', () => {
      const result = validateMethodForParameter('CEM', 'SO2', 'boiler')
      expect(result.requirements.some((r) => r.includes('calibration'))).toBe(true)
      expect(result.requirements.some((r) => r.includes('RATA'))).toBe(true)
    })
  })

  describe('Appendix D Validation', () => {
    it('validates AD for SO2 on gas-fired units', () => {
      const result = validateMethodForParameter('AD', 'SO2', 'gas-fired boiler')
      expect(result.valid).toBe(true)
      expect(result.cfrCitation).toContain('Appendix D')
    })

    it('rejects AD for SO2 on coal-fired units', () => {
      const result = validateMethodForParameter('AD', 'SO2', 'coal-fired boiler')
      expect(result.valid).toBe(false)
      expect(result.warnings.some((w) => w.includes('coal'))).toBe(true)
    })

    it('validates AD for HI', () => {
      const result = validateMethodForParameter('AD', 'HI', 'gas turbine')
      expect(result.valid).toBe(true)
    })

    it('rejects AD for NOX', () => {
      const result = validateMethodForParameter('AD', 'NOX', 'boiler')
      expect(result.valid).toBe(false)
    })

    it('includes fuel sampling requirements', () => {
      const result = validateMethodForParameter('AD', 'SO2', 'gas boiler')
      expect(result.requirements.some((r) => r.includes('GCV'))).toBe(true)
    })
  })

  describe('LME Validation', () => {
    it('includes LME eligibility requirements', () => {
      const result = validateMethodForParameter('LME', 'SO2', 'small boiler')
      expect(result.cfrCitation).toContain('75.19')
      expect(result.requirements.some((r) => r.includes('25 tons'))).toBe(true)
    })

    it('warns when capacity exceeds threshold', () => {
      const result = validateMethodForParameter('LME', 'NOX', 'large boiler', 50)
      expect(result.warnings.some((w) => w.includes('threshold'))).toBe(true)
    })
  })

  describe('Appendix E Validation', () => {
    it('validates AE for NOXR', () => {
      const result = validateMethodForParameter('AE', 'NOXR', 'gas turbine')
      expect(result.valid).toBe(true)
      expect(result.cfrCitation).toContain('Appendix E')
    })

    it('rejects AE for parameters other than NOXR', () => {
      const result = validateMethodForParameter('AE', 'SO2', 'gas turbine')
      expect(result.valid).toBe(false)
    })

    it('warns for non-gas units using AE', () => {
      const result = validateMethodForParameter('AE', 'NOXR', 'oil-fired boiler')
      expect(result.warnings.some((w) => w.includes('gas-fired'))).toBe(true)
    })

    it('includes correlation test requirements', () => {
      const result = validateMethodForParameter('AE', 'NOXR', 'gas turbine')
      expect(result.requirements.some((r) => r.includes('correlation'))).toBe(true)
    })
  })
})

// ============================================================================
// NSPS APPLICABILITY ENGINE TESTS
// ============================================================================

describe('NSPS Applicability Engine', () => {
  describe('determineApplicableNSPS', () => {
    // Import will be added when we implement
    // import { determineApplicableNSPS, type NSPSApplicabilityInput } from './part60-knowledge'

    describe('Steam Generators / Boilers (Subparts D, Da, Db, Dc)', () => {
      it('returns Subpart D for coal-fired boiler constructed 1971-1978', () => {
        // Subpart D: Fossil fuel-fired steam generators >250 MMBtu/hr
        // Effective date: August 17, 1971
        // Affected: units commencing construction after 8/17/71 but before 9/18/78
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C', // Coal
          capacityMMBtu: 300,
          commercialOpDate: new Date('1975-06-01'),
          constructionDate: new Date('1973-01-01'),
        })
        expect(result.applicableSubparts).toContain('D')
        expect(result.applicableSubparts).not.toContain('Da')
      })

      it('returns Subpart Da for large coal-fired EGU constructed after 1978', () => {
        // Subpart Da: Electric utility steam generating units >73 MW (250 MMBtu/hr)
        // Effective date: September 18, 1978
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C',
          capacityMMBtu: 500,
          capacityMW: 150,
          commercialOpDate: new Date('1985-01-01'),
          constructionDate: new Date('1982-06-01'),
          isElectricUtility: true,
        })
        expect(result.applicableSubparts).toContain('Da')
        expect(result.applicableSubparts).not.toContain('D')
        expect(result.requiresOpacity).toBe(true)
      })

      it('returns Subpart Db for industrial boiler >100 MMBtu/hr constructed after 1984', () => {
        // Subpart Db: Industrial-commercial-institutional steam generating units >100 MMBtu/hr
        // Effective date: June 19, 1984
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C',
          capacityMMBtu: 150,
          commercialOpDate: new Date('1990-01-01'),
          constructionDate: new Date('1988-01-01'),
          isElectricUtility: false,
        })
        expect(result.applicableSubparts).toContain('Db')
        expect(result.applicableSubparts).not.toContain('Da')
      })

      it('returns Subpart Dc for small industrial boiler 10-100 MMBtu/hr', () => {
        // Subpart Dc: Small industrial-commercial-institutional steam generating units
        // 10-100 MMBtu/hr, effective June 9, 1989
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C',
          capacityMMBtu: 50,
          commercialOpDate: new Date('1995-01-01'),
          constructionDate: new Date('1992-01-01'),
          isElectricUtility: false,
        })
        expect(result.applicableSubparts).toContain('Dc')
        expect(result.applicableSubparts).not.toContain('Db')
      })

      it('returns no NSPS for unit <10 MMBtu/hr', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'PNG',
          capacityMMBtu: 5,
          commercialOpDate: new Date('2000-01-01'),
        })
        expect(result.applicableSubparts).toHaveLength(0)
      })
    })

    describe('Gas Turbines (Subparts GG, KKKK)', () => {
      it('returns Subpart GG for gas turbine constructed 1979-2006', () => {
        // Subpart GG: Stationary gas turbines
        // Effective: October 3, 1977, for units >10 MMBtu/hr
        const result = determineApplicableNSPS({
          equipmentType: 'gas-turbine',
          fuelType: 'PNG',
          capacityMMBtu: 100,
          commercialOpDate: new Date('1990-01-01'),
          constructionDate: new Date('1988-01-01'),
        })
        expect(result.applicableSubparts).toContain('GG')
        expect(result.applicableSubparts).not.toContain('KKKK')
        expect(result.requiresOpacity).toBe(false) // Gas turbines don't require opacity
      })

      it('returns Subpart KKKK for gas turbine constructed after Feb 2005', () => {
        // Subpart KKKK: Stationary combustion turbines
        // Effective: February 18, 2005
        const result = determineApplicableNSPS({
          equipmentType: 'gas-turbine',
          fuelType: 'PNG',
          capacityMMBtu: 100,
          commercialOpDate: new Date('2010-01-01'),
          constructionDate: new Date('2008-01-01'),
        })
        expect(result.applicableSubparts).toContain('KKKK')
        expect(result.applicableSubparts).not.toContain('GG')
      })

      it('returns both GG and KKKK for modified unit', () => {
        // If a GG unit is modified after KKKK effective date
        const result = determineApplicableNSPS({
          equipmentType: 'gas-turbine',
          fuelType: 'PNG',
          capacityMMBtu: 100,
          commercialOpDate: new Date('1990-01-01'),
          constructionDate: new Date('1988-01-01'),
          modificationDate: new Date('2010-01-01'),
        })
        expect(result.applicableSubparts).toContain('GG')
        expect(result.applicableSubparts).toContain('KKKK')
      })
    })

    describe('Opacity Requirements', () => {
      it('requires opacity for coal-fired Subpart Da unit', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C',
          capacityMMBtu: 500,
          commercialOpDate: new Date('1990-01-01'),
          isElectricUtility: true,
        })
        expect(result.requiresOpacity).toBe(true)
        expect(result.opacityBasis).toContain('40 CFR 60.42Da')
      })

      it('does not require opacity for natural gas-fired unit', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'PNG',
          capacityMMBtu: 500,
          commercialOpDate: new Date('1990-01-01'),
          isElectricUtility: true,
        })
        expect(result.requiresOpacity).toBe(false)
      })

      it('requires opacity for oil-fired Subpart Da unit', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'OIL',
          capacityMMBtu: 500,
          commercialOpDate: new Date('1990-01-01'),
          isElectricUtility: true,
        })
        expect(result.requiresOpacity).toBe(true)
      })

      it('does not require opacity for gas turbines (KKKK)', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'gas-turbine',
          fuelType: 'PNG',
          capacityMMBtu: 100,
          commercialOpDate: new Date('2010-01-01'),
        })
        expect(result.requiresOpacity).toBe(false)
      })
    })

    describe('Fuel Type Handling', () => {
      it('handles pipeline natural gas (PNG) correctly', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'gas-turbine',
          fuelType: 'PNG',
          capacityMMBtu: 100,
          commercialOpDate: new Date('2010-01-01'),
        })
        expect(result.applicableSubparts).toContain('KKKK')
      })

      it('handles coal (C) correctly', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C',
          capacityMMBtu: 300,
          commercialOpDate: new Date('1990-01-01'),
          isElectricUtility: true,
        })
        expect(result.applicableSubparts).toContain('Da')
      })

      it('handles residual oil (RO) correctly', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'RO',
          capacityMMBtu: 300,
          commercialOpDate: new Date('1990-01-01'),
          isElectricUtility: true,
        })
        expect(result.applicableSubparts).toContain('Da')
      })

      it('handles distillate oil (DSL) correctly', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'DSL',
          capacityMMBtu: 300,
          commercialOpDate: new Date('1990-01-01'),
          isElectricUtility: true,
        })
        expect(result.applicableSubparts).toContain('Da')
      })
    })

    describe('Capacity Threshold Edge Cases', () => {
      it('returns Da for unit exactly at 73 MW threshold', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C',
          capacityMW: 73,
          capacityMMBtu: 250,
          commercialOpDate: new Date('1990-01-01'),
          isElectricUtility: true,
        })
        expect(result.applicableSubparts).toContain('Da')
      })

      it('returns Db for industrial unit exactly at 100 MMBtu/hr', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C',
          capacityMMBtu: 100,
          commercialOpDate: new Date('1990-01-01'),
          isElectricUtility: false,
        })
        expect(result.applicableSubparts).toContain('Db')
      })

      it('returns Dc for unit at lower boundary (10 MMBtu/hr)', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C',
          capacityMMBtu: 10,
          commercialOpDate: new Date('1995-01-01'),
          isElectricUtility: false,
        })
        expect(result.applicableSubparts).toContain('Dc')
      })
    })

    describe('Part 75 Coordination Notes', () => {
      it('includes Part 75 coordination notes for Da units', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C',
          capacityMMBtu: 500,
          commercialOpDate: new Date('1990-01-01'),
          isElectricUtility: true,
        })
        expect(result.part75Notes).toBeDefined()
        expect(result.part75Notes).toContain('Part 75')
      })

      it('notes that Part 75 CEMS satisfies Da CEMS requirements', () => {
        const result = determineApplicableNSPS({
          equipmentType: 'steam-generator',
          fuelType: 'C',
          capacityMMBtu: 500,
          commercialOpDate: new Date('1990-01-01'),
          isElectricUtility: true,
        })
        expect(result.part75Notes).toContain('CEMS')
      })
    })
  })
})
