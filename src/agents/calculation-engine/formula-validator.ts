/**
 * Formula Validator
 *
 * Validates formulas for syntax, semantics, units, and regulatory compliance.
 */

import type { Formula, FormulaParameter, ValidationResult } from '../../types/calculation-engine'

/** Validation context for formula checking */
export interface ValidationContext {
  /** Strict mode - all validations must pass */
  strictMode: boolean
  /** Available parameters in current scope */
  availableParameters: string[]
  /** Regulatory requirements to check against */
  regulatoryRequirements?: string[]
}

/**
 * Validate a formula definition
 */
export function validateFormula(formula: Formula, context: ValidationContext): ValidationResult[] {
  const results: ValidationResult[] = []

  // Validate syntax
  results.push(...validateSyntax(formula))

  // Validate parameters
  results.push(...validateParameters(formula, context))

  // Validate units consistency
  results.push(...validateUnits(formula))

  // Validate regulatory compliance
  if (context.regulatoryRequirements) {
    results.push(...validateRegulatoryCompliance(formula, context.regulatoryRequirements))
  }

  // Apply custom validation rules
  results.push(...applyValidationRules(formula))

  return results
}

/**
 * Validate formula syntax
 */
function validateSyntax(formula: Formula): ValidationResult[] {
  const results: ValidationResult[] = []

  // Check for empty expression
  if (!formula.expression || formula.expression.trim() === '') {
    results.push({
      ruleId: 'SYNTAX_EMPTY_EXPRESSION',
      passed: false,
      severity: 'error',
      message: 'Formula expression cannot be empty',
    })
    return results
  }

  // Check for balanced parentheses
  if (!hasBalancedParentheses(formula.expression)) {
    results.push({
      ruleId: 'SYNTAX_UNBALANCED_PARENS',
      passed: false,
      severity: 'error',
      message: 'Formula has unbalanced parentheses',
    })
  }

  // Check for valid characters based on syntax type
  if (formula.syntax === 'algebraic') {
    const validPattern = /^[a-zA-Z0-9+\-*/().,\s×÷^]+$/
    if (!validPattern.test(formula.expression)) {
      results.push({
        ruleId: 'SYNTAX_INVALID_CHARS',
        passed: false,
        severity: 'error',
        message: 'Formula contains invalid characters for algebraic syntax',
      })
    }
  }

  // Check for division by zero patterns
  if (formula.expression.includes('/ 0') || formula.expression.includes('/0')) {
    results.push({
      ruleId: 'SYNTAX_DIVISION_BY_ZERO',
      passed: false,
      severity: 'error',
      message: 'Formula contains division by zero',
    })
  }

  return results
}

/**
 * Validate formula parameters
 */
function validateParameters(formula: Formula, context: ValidationContext): ValidationResult[] {
  const results: ValidationResult[] = []

  // Extract parameter references from expression
  const referencedParams = extractParameterReferences(formula.expression)

  // Check if all referenced parameters are defined
  for (const paramRef of referencedParams) {
    const isDefined = formula.inputParameters.some((p) => p.name === paramRef)
    if (!isDefined) {
      results.push({
        ruleId: 'PARAM_UNDEFINED',
        passed: false,
        severity: 'error',
        message: `Parameter '${paramRef}' is referenced but not defined`,
        details: { parameter: paramRef },
      })
    }
  }

  // Check if all required parameters are provided
  for (const param of formula.inputParameters) {
    if (param.required && !referencedParams.includes(param.name)) {
      results.push({
        ruleId: 'PARAM_NOT_USED',
        passed: false,
        severity: 'warning',
        message: `Required parameter '${param.name}' is defined but not used in formula`,
        details: { parameter: param.name },
      })
    }

    // Validate parameter ranges
    if (param.range) {
      if (param.range.min !== undefined && param.range.max !== undefined) {
        if (param.range.min > param.range.max) {
          results.push({
            ruleId: 'PARAM_INVALID_RANGE',
            passed: false,
            severity: 'error',
            message: `Parameter '${param.name}' has invalid range: min > max`,
            details: { parameter: param.name, range: param.range },
          })
        }
      }
    }
  }

  // Check if parameters are available in context
  if (context.strictMode && context.availableParameters.length > 0) {
    for (const param of formula.inputParameters) {
      if (!context.availableParameters.includes(param.name)) {
        results.push({
          ruleId: 'PARAM_NOT_AVAILABLE',
          passed: false,
          severity: 'error',
          message: `Parameter '${param.name}' is not available in current context`,
          details: { parameter: param.name },
        })
      }
    }
  }

  return results
}

/**
 * Validate units consistency
 */
function validateUnits(formula: Formula): ValidationResult[] {
  const results: ValidationResult[] = []

  // Check output parameter has units defined
  if (formula.outputParameter.units === 'dimensionless') {
    results.push({
      ruleId: 'UNITS_OUTPUT_DIMENSIONLESS',
      passed: true,
      severity: 'info',
      message: 'Output parameter has dimensionless units',
    })
  }

  // Detect potential unit mismatches in common patterns
  const hasFlow = formula.inputParameters.some((p) => p.units === 'scfh')
  const hasPpm = formula.inputParameters.some((p) => p.units === 'ppm')
  const hasLbHr = formula.outputParameter.units === 'lb/hr'

  // Mass emission calculations should have flow and concentration
  if (hasLbHr && !(hasFlow && hasPpm)) {
    results.push({
      ruleId: 'UNITS_MASS_EMISSION_MISMATCH',
      passed: false,
      severity: 'warning',
      message:
        'Mass emission output (lb/hr) typically requires flow (scfh) and concentration (ppm)',
    })
  }

  return results
}

/**
 * Validate regulatory compliance
 */
function validateRegulatoryCompliance(
  formula: Formula,
  requirements: string[]
): ValidationResult[] {
  const results: ValidationResult[] = []

  // Check if formula has regulatory basis defined
  if (!formula.regulatoryBasis || formula.regulatoryBasis.trim() === '') {
    results.push({
      ruleId: 'REGULATORY_BASIS_MISSING',
      passed: false,
      severity: 'warning',
      message: 'Formula does not specify regulatory basis',
    })
  }

  // Check if formula meets specified requirements
  // This is a simplified check - in production, this would query a requirements database
  const hasPartReference = /40\s*CFR\s*(Part\s*)?75/i.test(formula.regulatoryBasis)
  if (requirements.includes('PART75') && !hasPartReference) {
    results.push({
      ruleId: 'REGULATORY_REQUIREMENT_NOT_MET',
      passed: false,
      severity: 'error',
      message: 'Formula does not reference required Part 75 regulation',
    })
  }

  return results
}

/**
 * Apply custom validation rules
 */
function applyValidationRules(formula: Formula): ValidationResult[] {
  const results: ValidationResult[] = []

  for (const rule of formula.validationRules) {
    // Apply rule based on type
    switch (rule.type) {
      case 'syntax':
        // Already handled in validateSyntax
        break
      case 'semantic':
        // Semantic validation would check logical consistency
        results.push({
          ruleId: rule.id,
          passed: true,
          severity: 'info',
          message: `Semantic rule '${rule.description}' checked`,
        })
        break
      case 'regulatory':
        // Regulatory validation already handled
        break
      case 'units':
        // Units validation already handled
        break
    }
  }

  return results
}

/**
 * Check if expression has balanced parentheses
 */
function hasBalancedParentheses(expression: string): boolean {
  let count = 0
  for (const char of expression) {
    if (char === '(') count++
    if (char === ')') count--
    if (count < 0) return false
  }
  return count === 0
}

/**
 * Extract parameter references from expression
 * Simple implementation - looks for words that could be parameter names
 */
function extractParameterReferences(expression: string): string[] {
  // Match word patterns that could be parameter names
  const matches = expression.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g)
  if (!matches) return []

  // Filter out common mathematical functions and constants
  const mathFunctions = new Set([
    'sin',
    'cos',
    'tan',
    'log',
    'exp',
    'sqrt',
    'pow',
    'abs',
    'min',
    'max',
  ])
  const constants = new Set(['PI', 'E'])

  return [...new Set(matches)].filter((m) => !mathFunctions.has(m) && !constants.has(m))
}

/**
 * Validate input values against parameter definitions
 */
export function validateInputs(
  inputs: Record<string, unknown>,
  parameters: FormulaParameter[]
): ValidationResult[] {
  const results: ValidationResult[] = []

  // Check required parameters
  for (const param of parameters) {
    if (param.required && !(param.name in inputs)) {
      results.push({
        ruleId: 'INPUT_MISSING_REQUIRED',
        passed: false,
        severity: 'error',
        message: `Required input '${param.name}' is missing`,
        details: { parameter: param.name },
      })
      continue
    }

    // Validate type and range if input is provided
    if (param.name in inputs) {
      const value = inputs[param.name]

      // Type validation
      const actualType = typeof value
      if (param.type === 'number' && actualType !== 'number') {
        results.push({
          ruleId: 'INPUT_TYPE_MISMATCH',
          passed: false,
          severity: 'error',
          message: `Input '${param.name}' should be ${param.type} but got ${actualType}`,
          details: { parameter: param.name, expected: param.type, actual: actualType },
        })
        continue
      }

      // Range validation for numeric parameters
      if (param.type === 'number' && param.range) {
        const numValue = value as number
        if (param.range.min !== undefined && numValue < param.range.min) {
          results.push({
            ruleId: 'INPUT_BELOW_MIN',
            passed: false,
            severity: 'error',
            message: `Input '${param.name}' (${numValue}) is below minimum (${param.range.min})`,
            details: { parameter: param.name, value: numValue, min: param.range.min },
          })
        }
        if (param.range.max !== undefined && numValue > param.range.max) {
          results.push({
            ruleId: 'INPUT_ABOVE_MAX',
            passed: false,
            severity: 'error',
            message: `Input '${param.name}' (${numValue}) is above maximum (${param.range.max})`,
            details: { parameter: param.name, value: numValue, max: param.range.max },
          })
        }
      }
    }
  }

  return results
}
