/**
 * Formula Registry Tests
 */

import { describe, expect, it } from 'vitest'
import {
  createFormulaRegistry,
  formulaCategories,
  getFormulaById,
  getFormulasByCategory,
  searchFormulas,
  standardFormulas,
} from './formula-registry'

describe('FormulaRegistry', () => {
  describe('standardFormulas', () => {
    it('should include heat input formula', () => {
      const formula = standardFormulas.find((f) => f.id === 'heat-input-appendix-f')

      expect(formula).toBeDefined()
      expect(formula?.name).toBe('Heat Input (Appendix F)')
      expect(formula?.regulatoryBasis).toContain('40 CFR 75')
    })

    it('should include SO2 mass emission formula', () => {
      const formula = standardFormulas.find((f) => f.id === 'so2-mass-emission')

      expect(formula).toBeDefined()
      expect(formula?.outputParameter.units).toBe('lb/hr')
    })

    it('should include NOx emission rate formula', () => {
      const formula = standardFormulas.find((f) => f.id === 'nox-emission-rate')

      expect(formula).toBeDefined()
      expect(formula?.expression).toContain('NOX_mass')
      expect(formula?.expression).toContain('HI')
    })

    it('should include LME NOx rate formula', () => {
      const formula = standardFormulas.find((f) => f.id === 'lme-nox-rate-quarterly')

      expect(formula).toBeDefined()
      expect(formula?.regulatoryBasis).toContain('Appendix E')
    })

    it('should have valid parameter definitions', () => {
      for (const formula of standardFormulas) {
        expect(formula.inputParameters).toBeDefined()
        expect(formula.outputParameter).toBeDefined()
        expect(formula.inputParameters.length).toBeGreaterThan(0)

        // All parameters should have required fields
        for (const param of formula.inputParameters) {
          expect(param.name).toBeDefined()
          expect(param.description).toBeDefined()
          expect(param.type).toBeDefined()
          expect(param.units).toBeDefined()
        }
      }
    })

    it('should have validation rules', () => {
      const heatInputFormula = standardFormulas.find((f) => f.id === 'heat-input-appendix-f')

      expect(heatInputFormula?.validationRules).toBeDefined()
      expect(heatInputFormula?.validationRules.length).toBeGreaterThan(0)
    })

    it('should have examples where provided', () => {
      const heatInputFormula = standardFormulas.find((f) => f.id === 'heat-input-appendix-f')

      expect(heatInputFormula?.examples).toBeDefined()
      expect(heatInputFormula?.examples?.length).toBeGreaterThan(0)

      const example = heatInputFormula?.examples?.[0]
      expect(example?.name).toBeDefined()
      expect(example?.inputs).toBeDefined()
      expect(example?.expectedOutput).toBeDefined()
    })
  })

  describe('formulaCategories', () => {
    it('should have heat input category', () => {
      const category = formulaCategories.find((c) => c.id === 'heat-input')

      expect(category).toBeDefined()
      expect(category?.formulaIds).toContain('heat-input-appendix-f')
    })

    it('should have mass emissions category', () => {
      const category = formulaCategories.find((c) => c.id === 'mass-emissions')

      expect(category).toBeDefined()
      expect(category?.formulaIds.length).toBeGreaterThan(0)
    })

    it('should have emission rates category', () => {
      const category = formulaCategories.find((c) => c.id === 'emission-rates')

      expect(category).toBeDefined()
      expect(category?.formulaIds).toContain('nox-emission-rate')
    })

    it('should have Appendix D category', () => {
      const category = formulaCategories.find((c) => c.id === 'appendix-d')

      expect(category).toBeDefined()
      expect(category?.regulatoryContext).toContain('Appendix D')
    })

    it('should reference only existing formulas', () => {
      const allFormulaIds = standardFormulas.map((f) => f.id)

      for (const category of formulaCategories) {
        for (const formulaId of category.formulaIds) {
          expect(allFormulaIds).toContain(formulaId)
        }
      }
    })
  })

  describe('createFormulaRegistry', () => {
    it('should create a complete registry', () => {
      const registry = createFormulaRegistry()

      expect(registry.name).toBeDefined()
      expect(registry.description).toBeDefined()
      expect(registry.formulas).toBe(standardFormulas)
      expect(registry.categories).toBe(formulaCategories)
      expect(registry.lastUpdated).toBeDefined()
    })

    it('should have valid timestamp', () => {
      const registry = createFormulaRegistry()
      const timestamp = new Date(registry.lastUpdated)

      expect(timestamp.getTime()).not.toBeNaN()
    })
  })

  describe('getFormulaById', () => {
    it('should return formula by ID', () => {
      const formula = getFormulaById('heat-input-appendix-f')

      expect(formula).toBeDefined()
      expect(formula?.id).toBe('heat-input-appendix-f')
    })

    it('should return undefined for non-existent ID', () => {
      const formula = getFormulaById('non-existent-formula')

      expect(formula).toBeUndefined()
    })

    it('should return correct formula for each standard formula', () => {
      for (const expectedFormula of standardFormulas) {
        const formula = getFormulaById(expectedFormula.id)
        expect(formula).toBe(expectedFormula)
      }
    })
  })

  describe('getFormulasByCategory', () => {
    it('should return formulas for heat input category', () => {
      const formulas = getFormulasByCategory('heat-input')

      expect(formulas.length).toBeGreaterThan(0)
      expect(formulas.some((f) => f.id === 'heat-input-appendix-f')).toBe(true)
    })

    it('should return formulas for mass emissions category', () => {
      const formulas = getFormulasByCategory('mass-emissions')

      expect(formulas.length).toBeGreaterThan(0)
      expect(formulas.some((f) => f.id === 'so2-mass-emission')).toBe(true)
      expect(formulas.some((f) => f.id === 'nox-mass-emission')).toBe(true)
    })

    it('should return empty array for non-existent category', () => {
      const formulas = getFormulasByCategory('non-existent-category')

      expect(formulas).toEqual([])
    })

    it('should return correct count for each category', () => {
      for (const category of formulaCategories) {
        const formulas = getFormulasByCategory(category.id)
        expect(formulas.length).toBe(category.formulaIds.length)
      }
    })
  })

  describe('searchFormulas', () => {
    it('should find formulas by name', () => {
      const results = searchFormulas('Heat Input')

      expect(results.length).toBeGreaterThan(0)
      expect(results.some((f) => f.name.includes('Heat Input'))).toBe(true)
    })

    it('should find formulas by description', () => {
      const results = searchFormulas('mass emission')

      expect(results.length).toBeGreaterThan(0)
    })

    it('should find formulas by regulatory basis', () => {
      const results = searchFormulas('Appendix F')

      expect(results.length).toBeGreaterThan(0)
      expect(results.every((f) => f.regulatoryBasis.includes('Appendix F'))).toBe(true)
    })

    it('should be case insensitive', () => {
      const results1 = searchFormulas('NOx')
      const results2 = searchFormulas('nox')

      expect(results1.length).toBe(results2.length)
      expect(results1.length).toBeGreaterThan(0)
    })

    it('should return empty array for no matches', () => {
      const results = searchFormulas('xyzabc123nonexistent')

      expect(results).toEqual([])
    })

    it('should handle partial matches', () => {
      const results = searchFormulas('emission')

      expect(results.length).toBeGreaterThan(0)
      expect(results.some((f) => f.name.includes('Emission'))).toBe(true)
    })
  })

  describe('formula integrity', () => {
    it('should have unique formula IDs', () => {
      const ids = standardFormulas.map((f) => f.id)
      const uniqueIds = new Set(ids)

      expect(ids.length).toBe(uniqueIds.size)
    })

    it('should have valid version strings', () => {
      for (const formula of standardFormulas) {
        expect(formula.version).toMatch(/^\d+\.\d+\.\d+$/)
      }
    })

    it('should have non-empty expressions', () => {
      for (const formula of standardFormulas) {
        expect(formula.expression).toBeTruthy()
        expect(formula.expression.length).toBeGreaterThan(0)
      }
    })

    it('should have valid regulatory basis', () => {
      for (const formula of standardFormulas) {
        expect(formula.regulatoryBasis).toBeTruthy()
        expect(formula.regulatoryBasis).toContain('40 CFR')
      }
    })

    it('should have parameter ranges where appropriate', () => {
      const heatInputFormula = standardFormulas.find((f) => f.id === 'heat-input-appendix-f')
      const o2Param = heatInputFormula?.inputParameters.find((p) => p.name === 'O2')

      expect(o2Param?.range).toBeDefined()
      expect(o2Param?.range?.min).toBeDefined()
      expect(o2Param?.range?.max).toBeDefined()
    })
  })
})
