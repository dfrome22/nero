/**
 * Compliance Data Service Tests
 */

import { describe, expect, it } from 'vitest'

import {
  getApplicableLimits,
  getApplicableRegulations,
  getCSAPRProgramsForState,
  getFacilityProgramSummary,
  getFormula,
  getGapCategories,
  getGapsBySeverity,
  getLimitsForRegulation,
  getSeverityColor,
  isMATSApplicable,
  isRGGIApplicable,
  listFormulas,
} from './compliance-data'

describe('Compliance Data Service', () => {
  describe('getApplicableRegulations', () => {
    it('returns regulations for Texas', () => {
      const regs = getApplicableRegulations('TX')
      expect(regs.length).toBeGreaterThan(0)

      // Texas should have CSAPR programs
      const csaprRegs = regs.filter((r) => r.id.startsWith('CSAPR'))
      expect(csaprRegs.length).toBeGreaterThan(0)
    })

    it('returns ALL-state regulations for any state', () => {
      const regs = getApplicableRegulations('AK') // Alaska - not in CSAPR
      // Should include regulations that apply to ALL states (like MATS, ARP, NSPS)
      expect(regs.length).toBeGreaterThan(0)
      // MATS should be included since it applies to ALL states
      const mats = regs.find((r) => r.id === 'MATS')
      expect(mats).toBeDefined()
    })

    it('includes MATS for all states', () => {
      const regs = getApplicableRegulations('TX')
      const mats = regs.find((r) => r.id === 'MATS')
      expect(mats).toBeDefined()
    })
  })

  describe('getCSAPRProgramsForState', () => {
    it('returns multiple CSAPR programs for affected states', () => {
      const programs = getCSAPRProgramsForState('TX')
      expect(programs.length).toBeGreaterThan(0)
      expect(programs.some((p) => p.includes('CSAPR'))).toBe(true)
    })

    it('returns empty array for non-CSAPR states', () => {
      const programs = getCSAPRProgramsForState('AK') // Alaska not in CSAPR
      expect(programs.length).toBe(0)
    })

    it('returns different programs for different state groups', () => {
      const txPrograms = getCSAPRProgramsForState('TX')
      const paPrograms = getCSAPRProgramsForState('PA')

      // Both should have CSAPR programs but potentially different ones
      expect(txPrograms.length).toBeGreaterThan(0)
      expect(paPrograms.length).toBeGreaterThan(0)
    })
  })

  describe('getApplicableLimits', () => {
    it('returns limits for coal-fired units', () => {
      const limits = getApplicableLimits({ fuelTypes: ['Coal'] })
      expect(limits.length).toBeGreaterThan(0)

      // Should include NSPS and MATS limits for coal
      const nspsLimits = limits.filter((l) => l.regulation.includes('NSPS'))
      const matsLimits = limits.filter((l) => l.regulation === 'MATS')
      expect(nspsLimits.length).toBeGreaterThan(0)
      expect(matsLimits.length).toBeGreaterThan(0)
    })

    it('returns limits for gas-fired units', () => {
      const limits = getApplicableLimits({ fuelTypes: ['Gas'] })
      expect(limits.length).toBeGreaterThan(0)
    })

    it('filters by pollutant', () => {
      const noxLimits = getApplicableLimits({ pollutants: ['NOx'] })
      expect(noxLimits.every((l) => l.pollutant === 'NOx')).toBe(true)
    })

    it('returns all limits when no filters applied', () => {
      const allLimits = getApplicableLimits({})
      expect(allLimits.length).toBeGreaterThan(30) // We have 55+ limits
    })
  })

  describe('getLimitsForRegulation', () => {
    it('returns MATS limits', () => {
      const matsLimits = getLimitsForRegulation('MATS')
      expect(matsLimits.length).toBeGreaterThan(0)
      expect(matsLimits.every((l) => l.regulation === 'MATS')).toBe(true)
    })

    it('returns NSPS_DA limits', () => {
      const nspsLimits = getLimitsForRegulation('NSPS_DA')
      expect(nspsLimits.length).toBeGreaterThan(0)
    })
  })

  describe('getFormula', () => {
    it('returns D-5 formula details', () => {
      const formula = getFormula('D-5')
      expect(formula).toBeDefined()
      expect(formula?.appendix).toContain('Appendix D')
    })

    it('returns F-14A formula details', () => {
      const formula = getFormula('F-14A')
      expect(formula).toBeDefined()
      expect(formula?.appendix).toContain('Appendix F')
    })

    it('returns undefined for unknown formula', () => {
      const formula = getFormula('UNKNOWN-99')
      expect(formula).toBeUndefined()
    })
  })

  describe('listFormulas', () => {
    it('returns all formulas when no filter', () => {
      const formulas = listFormulas()
      expect(formulas.length).toBeGreaterThan(40) // We have 50 formulas
    })

    it('filters by appendix', () => {
      const dFormulas = listFormulas({ appendix: 'Appendix D' })
      expect(dFormulas.length).toBeGreaterThan(0)
      expect(dFormulas.every((f) => f.appendix.includes('Appendix D'))).toBe(true)
    })

    it('filters by parameter', () => {
      const so2Formulas = listFormulas({ parameter: 'SO2' })
      expect(so2Formulas.length).toBeGreaterThan(0)
      expect(so2Formulas.every((f) => f.parameters.includes('SO2'))).toBe(true)
    })
  })

  describe('getGapCategories', () => {
    it('returns all gap categories', () => {
      const categories = getGapCategories()
      expect(Object.keys(categories).length).toBeGreaterThan(0)
      expect(categories['MONITORING']).toBeDefined()
      expect(categories['QAQC']).toBeDefined()
    })

    it('each category has gaps with severity', () => {
      const categories = getGapCategories()
      for (const category of Object.values(categories)) {
        expect(category.gaps.length).toBeGreaterThan(0)
        for (const gap of category.gaps) {
          expect(['HIGH', 'MEDIUM', 'LOW']).toContain(gap.severity)
        }
      }
    })
  })

  describe('getGapsBySeverity', () => {
    it('returns HIGH severity gaps', () => {
      const highGaps = getGapsBySeverity('HIGH')
      expect(highGaps.length).toBeGreaterThan(0)
      expect(highGaps.every((g) => g.severity === 'HIGH')).toBe(true)
    })

    it('includes category in returned gaps', () => {
      const highGaps = getGapsBySeverity('HIGH')
      expect(highGaps.length).toBeGreaterThan(0)
      // Verify category field exists on all items
      for (const gap of highGaps) {
        expect(gap.category).toBeTruthy()
      }
    })
  })

  describe('getSeverityColor', () => {
    it('returns red colors for HIGH severity', () => {
      const colors = getSeverityColor('HIGH')
      expect(colors.bg).toContain('red')
      expect(colors.text).toContain('red')
    })

    it('returns yellow colors for MEDIUM severity', () => {
      const colors = getSeverityColor('MEDIUM')
      expect(colors.bg).toContain('yellow')
    })

    it('returns green colors for LOW severity', () => {
      const colors = getSeverityColor('LOW')
      expect(colors.bg).toContain('green')
    })
  })

  describe('isMATSApplicable', () => {
    it('returns true for coal', () => {
      expect(isMATSApplicable(['Coal'])).toBe(true)
      expect(isMATSApplicable(['Bituminous Coal'])).toBe(true)
    })

    it('returns true for oil', () => {
      expect(isMATSApplicable(['Oil'])).toBe(true)
      expect(isMATSApplicable(['Petroleum'])).toBe(true)
    })

    it('returns false for gas only', () => {
      expect(isMATSApplicable(['Natural Gas'])).toBe(false)
      expect(isMATSApplicable(['Gas'])).toBe(false)
    })
  })

  describe('isRGGIApplicable', () => {
    it('returns true for RGGI states', () => {
      expect(isRGGIApplicable('NY')).toBe(true)
      expect(isRGGIApplicable('MA')).toBe(true)
      expect(isRGGIApplicable('PA')).toBe(true)
    })

    it('returns false for non-RGGI states', () => {
      expect(isRGGIApplicable('TX')).toBe(false)
      expect(isRGGIApplicable('OH')).toBe(false)
    })
  })

  describe('getFacilityProgramSummary', () => {
    it('returns complete summary for Texas coal plant', () => {
      const summary = getFacilityProgramSummary({
        stateCode: 'TX',
        fuelTypes: ['Coal'],
        capacityMW: 500,
      })

      expect(summary.programs).toContain('ARP')
      expect(summary.programs).toContain('MATS')
      expect(summary.csaprPrograms.length).toBeGreaterThan(0)
      expect(summary.hasMATS).toBe(true)
      expect(summary.hasRGGI).toBe(false) // TX not in RGGI
      expect(summary.limitCount).toBeGreaterThan(0)
    })

    it('returns RGGI for applicable states', () => {
      const summary = getFacilityProgramSummary({
        stateCode: 'NY',
        fuelTypes: ['Gas'],
        capacityMW: 100,
      })

      expect(summary.programs).toContain('RGGI')
      expect(summary.hasRGGI).toBe(true)
      expect(summary.hasMATS).toBe(false) // Gas only
    })
  })
})
