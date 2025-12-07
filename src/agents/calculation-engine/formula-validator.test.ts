/**
 * Formula Validator Tests
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { Formula } from '../../types/calculation-engine'
import { validateFormula, validateInputs, type ValidationContext } from './formula-validator'

describe('FormulaValidator', () => {
  let context: ValidationContext

  beforeEach(() => {
    context = {
      strictMode: false,
      availableParameters: ['flow', 'concentration', 'temperature'],
    }
  })

  describe('validateFormula', () => {
    it('should pass validation for a valid formula', () => {
      const formula: Formula = {
        id: 'test-formula',
        name: 'Test Formula',
        version: '1.0.0',
        expression: 'flow * concentration',
        syntax: 'algebraic',
        inputParameters: [
          {
            name: 'flow',
            description: 'Flow rate',
            type: 'number',
            units: 'scfh',
            required: true,
          },
          {
            name: 'concentration',
            description: 'Concentration',
            type: 'number',
            units: 'ppm',
            required: true,
          },
        ],
        outputParameter: {
          name: 'result',
          description: 'Result',
          type: 'number',
          units: 'lb/hr',
          required: true,
        },
        validationRules: [],
        regulatoryBasis: '40 CFR 75',
        description: 'Test formula',
      }

      const results = validateFormula(formula, context)
      const errors = results.filter((r) => r.severity === 'error' && !r.passed)
      expect(errors).toHaveLength(0)
    })

    it('should detect empty expression', () => {
      const formula: Formula = {
        id: 'test-formula',
        name: 'Test Formula',
        version: '1.0.0',
        expression: '',
        syntax: 'algebraic',
        inputParameters: [],
        outputParameter: {
          name: 'result',
          description: 'Result',
          type: 'number',
          units: 'dimensionless',
          required: true,
        },
        validationRules: [],
        regulatoryBasis: '40 CFR 75',
        description: 'Test formula',
      }

      const results = validateFormula(formula, context)
      const emptyError = results.find((r) => r.ruleId === 'SYNTAX_EMPTY_EXPRESSION')
      expect(emptyError).toBeDefined()
      expect(emptyError?.passed).toBe(false)
      expect(emptyError?.severity).toBe('error')
    })

    it('should detect unbalanced parentheses', () => {
      const formula: Formula = {
        id: 'test-formula',
        name: 'Test Formula',
        version: '1.0.0',
        expression: '(flow * concentration',
        syntax: 'algebraic',
        inputParameters: [
          {
            name: 'flow',
            description: 'Flow',
            type: 'number',
            units: 'scfh',
            required: true,
          },
          {
            name: 'concentration',
            description: 'Concentration',
            type: 'number',
            units: 'ppm',
            required: true,
          },
        ],
        outputParameter: {
          name: 'result',
          description: 'Result',
          type: 'number',
          units: 'lb/hr',
          required: true,
        },
        validationRules: [],
        regulatoryBasis: '40 CFR 75',
        description: 'Test formula',
      }

      const results = validateFormula(formula, context)
      const parenError = results.find((r) => r.ruleId === 'SYNTAX_UNBALANCED_PARENS')
      expect(parenError).toBeDefined()
      expect(parenError?.passed).toBe(false)
    })

    it('should detect division by zero', () => {
      const formula: Formula = {
        id: 'test-formula',
        name: 'Test Formula',
        version: '1.0.0',
        expression: 'flow / 0',
        syntax: 'algebraic',
        inputParameters: [
          {
            name: 'flow',
            description: 'Flow',
            type: 'number',
            units: 'scfh',
            required: true,
          },
        ],
        outputParameter: {
          name: 'result',
          description: 'Result',
          type: 'number',
          units: 'dimensionless',
          required: true,
        },
        validationRules: [],
        regulatoryBasis: '40 CFR 75',
        description: 'Test formula',
      }

      const results = validateFormula(formula, context)
      const divError = results.find((r) => r.ruleId === 'SYNTAX_DIVISION_BY_ZERO')
      expect(divError).toBeDefined()
      expect(divError?.passed).toBe(false)
    })

    it('should detect undefined parameters', () => {
      const formula: Formula = {
        id: 'test-formula',
        name: 'Test Formula',
        version: '1.0.0',
        expression: 'flow * unknown_param',
        syntax: 'algebraic',
        inputParameters: [
          {
            name: 'flow',
            description: 'Flow',
            type: 'number',
            units: 'scfh',
            required: true,
          },
        ],
        outputParameter: {
          name: 'result',
          description: 'Result',
          type: 'number',
          units: 'lb/hr',
          required: true,
        },
        validationRules: [],
        regulatoryBasis: '40 CFR 75',
        description: 'Test formula',
      }

      const results = validateFormula(formula, context)
      const paramError = results.find((r) => r.ruleId === 'PARAM_UNDEFINED')
      expect(paramError).toBeDefined()
      expect(paramError?.passed).toBe(false)
      expect(paramError?.message).toContain('unknown_param')
    })

    it('should warn about unused required parameters', () => {
      const formula: Formula = {
        id: 'test-formula',
        name: 'Test Formula',
        version: '1.0.0',
        expression: 'flow * 2',
        syntax: 'algebraic',
        inputParameters: [
          {
            name: 'flow',
            description: 'Flow',
            type: 'number',
            units: 'scfh',
            required: true,
          },
          {
            name: 'unused_param',
            description: 'Unused',
            type: 'number',
            units: 'ppm',
            required: true,
          },
        ],
        outputParameter: {
          name: 'result',
          description: 'Result',
          type: 'number',
          units: 'lb/hr',
          required: true,
        },
        validationRules: [],
        regulatoryBasis: '40 CFR 75',
        description: 'Test formula',
      }

      const results = validateFormula(formula, context)
      const unusedWarning = results.find((r) => r.ruleId === 'PARAM_NOT_USED')
      expect(unusedWarning).toBeDefined()
      expect(unusedWarning?.severity).toBe('warning')
    })

    it('should detect invalid parameter range', () => {
      const formula: Formula = {
        id: 'test-formula',
        name: 'Test Formula',
        version: '1.0.0',
        expression: 'flow',
        syntax: 'algebraic',
        inputParameters: [
          {
            name: 'flow',
            description: 'Flow',
            type: 'number',
            units: 'scfh',
            required: true,
            range: { min: 100, max: 50 }, // Invalid: min > max
          },
        ],
        outputParameter: {
          name: 'result',
          description: 'Result',
          type: 'number',
          units: 'scfh',
          required: true,
        },
        validationRules: [],
        regulatoryBasis: '40 CFR 75',
        description: 'Test formula',
      }

      const results = validateFormula(formula, context)
      const rangeError = results.find((r) => r.ruleId === 'PARAM_INVALID_RANGE')
      expect(rangeError).toBeDefined()
      expect(rangeError?.passed).toBe(false)
    })

    it('should validate units for mass emission calculations', () => {
      const formula: Formula = {
        id: 'test-formula',
        name: 'Test Formula',
        version: '1.0.0',
        expression: 'flow * 2',
        syntax: 'algebraic',
        inputParameters: [
          {
            name: 'flow',
            description: 'Flow',
            type: 'number',
            units: 'scfh',
            required: true,
          },
        ],
        outputParameter: {
          name: 'mass',
          description: 'Mass',
          type: 'number',
          units: 'lb/hr',
          required: true,
        },
        validationRules: [],
        regulatoryBasis: '40 CFR 75',
        description: 'Test formula',
      }

      const results = validateFormula(formula, context)
      // Should warn about missing concentration for mass emission
      const unitWarning = results.find((r) => r.ruleId === 'UNITS_MASS_EMISSION_MISMATCH')
      expect(unitWarning).toBeDefined()
      expect(unitWarning?.severity).toBe('warning')
    })

    it('should warn about missing regulatory basis', () => {
      const formula: Formula = {
        id: 'test-formula',
        name: 'Test Formula',
        version: '1.0.0',
        expression: 'flow',
        syntax: 'algebraic',
        inputParameters: [
          {
            name: 'flow',
            description: 'Flow',
            type: 'number',
            units: 'scfh',
            required: true,
          },
        ],
        outputParameter: {
          name: 'result',
          description: 'Result',
          type: 'number',
          units: 'scfh',
          required: true,
        },
        validationRules: [],
        regulatoryBasis: '',
        description: 'Test formula',
      }

      const results = validateFormula(formula, { ...context, regulatoryRequirements: ['PART75'] })
      const regWarning = results.find((r) => r.ruleId === 'REGULATORY_BASIS_MISSING')
      expect(regWarning).toBeDefined()
      expect(regWarning?.severity).toBe('warning')
    })
  })

  describe('validateInputs', () => {
    const parameters = [
      {
        name: 'flow',
        description: 'Flow rate',
        type: 'number' as const,
        units: 'scfh' as const,
        required: true,
        range: { min: 0, max: 1000000 },
      },
      {
        name: 'concentration',
        description: 'Concentration',
        type: 'number' as const,
        units: 'ppm' as const,
        required: true,
        range: { min: 0, max: 10000 },
      },
      {
        name: 'optional_param',
        description: 'Optional',
        type: 'number' as const,
        units: 'dimensionless' as const,
        required: false,
      },
    ]

    it('should pass validation for valid inputs', () => {
      const inputs = {
        flow: 100000,
        concentration: 50,
      }

      const results = validateInputs(inputs, parameters)
      const errors = results.filter((r) => r.severity === 'error' && !r.passed)
      expect(errors).toHaveLength(0)
    })

    it('should detect missing required parameter', () => {
      const inputs = {
        flow: 100000,
        // Missing concentration
      }

      const results = validateInputs(inputs, parameters)
      const missingError = results.find((r) => r.ruleId === 'INPUT_MISSING_REQUIRED')
      expect(missingError).toBeDefined()
      expect(missingError?.passed).toBe(false)
      expect(missingError?.message).toContain('concentration')
    })

    it('should detect type mismatch', () => {
      const inputs = {
        flow: '100000', // Should be number
        concentration: 50,
      }

      const results = validateInputs(inputs, parameters)
      const typeError = results.find((r) => r.ruleId === 'INPUT_TYPE_MISMATCH')
      expect(typeError).toBeDefined()
      expect(typeError?.passed).toBe(false)
    })

    it('should detect value below minimum', () => {
      const inputs = {
        flow: -100, // Below minimum (0)
        concentration: 50,
      }

      const results = validateInputs(inputs, parameters)
      const minError = results.find((r) => r.ruleId === 'INPUT_BELOW_MIN')
      expect(minError).toBeDefined()
      expect(minError?.passed).toBe(false)
    })

    it('should detect value above maximum', () => {
      const inputs = {
        flow: 2000000, // Above maximum (1000000)
        concentration: 50,
      }

      const results = validateInputs(inputs, parameters)
      const maxError = results.find((r) => r.ruleId === 'INPUT_ABOVE_MAX')
      expect(maxError).toBeDefined()
      expect(maxError?.passed).toBe(false)
    })

    it('should allow optional parameters to be omitted', () => {
      const inputs = {
        flow: 100000,
        concentration: 50,
        // optional_param omitted
      }

      const results = validateInputs(inputs, parameters)
      const errors = results.filter((r) => r.severity === 'error' && !r.passed)
      expect(errors).toHaveLength(0)
    })
  })
})
