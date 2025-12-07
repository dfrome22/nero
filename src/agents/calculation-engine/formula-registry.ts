/**
 * Formula Registry
 *
 * Registry of standard ECMPS and Part 75 calculation formulas.
 */

import type { Formula, FormulaCategory, FormulaRegistry } from '../../types/calculation-engine'

/**
 * Standard ECMPS/Part 75 formulas
 */
export const standardFormulas: Formula[] = [
  // Heat Input Calculation (Appendix F)
  {
    id: 'heat-input-appendix-f',
    name: 'Heat Input (Appendix F)',
    version: '1.0.0',
    expression: 'Qh * Fd * (20.9 / (20.9 - O2)) * 1e-6',
    syntax: 'algebraic',
    inputParameters: [
      {
        name: 'Qh',
        description: 'Stack gas flow rate',
        type: 'number',
        units: 'scfh',
        required: true,
        range: { min: 0 },
      },
      {
        name: 'Fd',
        description: 'F-factor for fuel type',
        type: 'number',
        units: 'dimensionless',
        required: true,
        range: { min: 1000, max: 2000 },
        defaultValue: 1040, // Natural gas
      },
      {
        name: 'O2',
        description: 'Oxygen concentration',
        type: 'number',
        units: 'percent',
        required: true,
        range: { min: 0, max: 20.9 },
      },
    ],
    outputParameter: {
      name: 'HI',
      description: 'Heat input',
      type: 'number',
      units: 'MMBtu',
      required: true,
    },
    validationRules: [
      {
        id: 'hi-appendix-f-o2-range',
        description: 'O2 must be less than 20.9%',
        type: 'semantic',
        validator: 'O2 < 20.9',
        severity: 'error',
      },
      {
        id: 'hi-appendix-f-positive',
        description: 'Heat input must be positive',
        type: 'semantic',
        validator: 'HI > 0',
        severity: 'error',
      },
    ],
    regulatoryBasis: '40 CFR 75 Appendix F, Section 3.3.6',
    description:
      'Calculates heat input using flow rate, F-factor, and oxygen concentration per Appendix F methodology',
    examples: [
      {
        name: 'Natural gas unit',
        inputs: { Qh: 100000, Fd: 1040, O2: 3.0 },
        expectedOutput: 121.4,
        description: 'Typical natural gas-fired unit',
      },
    ],
  },

  // SO2 Mass Emissions
  {
    id: 'so2-mass-emission',
    name: 'SO2 Mass Emission',
    version: '1.0.0',
    expression: 'SO2_conc * Qh * K',
    syntax: 'algebraic',
    inputParameters: [
      {
        name: 'SO2_conc',
        description: 'SO2 concentration',
        type: 'number',
        units: 'ppm',
        required: true,
        range: { min: 0 },
      },
      {
        name: 'Qh',
        description: 'Stack gas flow rate',
        type: 'number',
        units: 'scfh',
        required: true,
        range: { min: 0 },
      },
      {
        name: 'K',
        description: 'Conversion factor',
        type: 'number',
        units: 'dimensionless',
        required: true,
        defaultValue: 1.66e-7,
      },
    ],
    outputParameter: {
      name: 'SO2_mass',
      description: 'SO2 mass emission rate',
      type: 'number',
      units: 'lb/hr',
      required: true,
    },
    validationRules: [
      {
        id: 'so2-mass-positive',
        description: 'SO2 mass must be non-negative',
        type: 'semantic',
        validator: 'SO2_mass >= 0',
        severity: 'error',
      },
    ],
    regulatoryBasis: '40 CFR 75 Appendix F, Equation F-2',
    description: 'Calculates SO2 mass emission rate from concentration and flow',
    examples: [
      {
        name: 'Typical SO2 emission',
        inputs: { SO2_conc: 50, Qh: 100000, K: 1.66e-7 },
        expectedOutput: 0.83,
      },
    ],
  },

  // NOx Mass Emissions
  {
    id: 'nox-mass-emission',
    name: 'NOx Mass Emission',
    version: '1.0.0',
    expression: 'NOX_conc * Qh * K',
    syntax: 'algebraic',
    inputParameters: [
      {
        name: 'NOX_conc',
        description: 'NOx concentration',
        type: 'number',
        units: 'ppm',
        required: true,
        range: { min: 0 },
      },
      {
        name: 'Qh',
        description: 'Stack gas flow rate',
        type: 'number',
        units: 'scfh',
        required: true,
        range: { min: 0 },
      },
      {
        name: 'K',
        description: 'Conversion factor',
        type: 'number',
        units: 'dimensionless',
        required: true,
        defaultValue: 1.194e-7,
      },
    ],
    outputParameter: {
      name: 'NOX_mass',
      description: 'NOx mass emission rate',
      type: 'number',
      units: 'lb/hr',
      required: true,
    },
    validationRules: [
      {
        id: 'nox-mass-positive',
        description: 'NOx mass must be non-negative',
        type: 'semantic',
        validator: 'NOX_mass >= 0',
        severity: 'error',
      },
    ],
    regulatoryBasis: '40 CFR 75 Appendix F, Equation F-2',
    description: 'Calculates NOx mass emission rate from concentration and flow',
  },

  // NOx Emission Rate
  {
    id: 'nox-emission-rate',
    name: 'NOx Emission Rate',
    version: '1.0.0',
    expression: 'NOX_mass / HI',
    syntax: 'algebraic',
    inputParameters: [
      {
        name: 'NOX_mass',
        description: 'NOx mass emission',
        type: 'number',
        units: 'lb',
        required: true,
        range: { min: 0 },
      },
      {
        name: 'HI',
        description: 'Heat input',
        type: 'number',
        units: 'MMBtu',
        required: true,
        range: { min: 0.001 },
      },
    ],
    outputParameter: {
      name: 'NOX_rate',
      description: 'NOx emission rate',
      type: 'number',
      units: 'lb/MMBtu',
      required: true,
    },
    validationRules: [
      {
        id: 'nox-rate-hi-nonzero',
        description: 'Heat input must be greater than zero',
        type: 'semantic',
        validator: 'HI > 0',
        severity: 'error',
      },
      {
        id: 'nox-rate-reasonable',
        description: 'NOx rate should be within reasonable range',
        type: 'semantic',
        validator: 'NOX_rate < 10',
        severity: 'warning',
      },
    ],
    regulatoryBasis: '40 CFR 75.10(d)',
    description: 'Calculates NOx emission rate in lb/MMBtu',
    examples: [
      {
        name: 'Standard calculation',
        inputs: { NOX_mass: 50, HI: 1000 },
        expectedOutput: 0.05,
      },
    ],
  },

  // CO2 Mass Emissions
  {
    id: 'co2-mass-emission',
    name: 'CO2 Mass Emission',
    version: '1.0.0',
    expression: 'CO2_conc * Qh * K',
    syntax: 'algebraic',
    inputParameters: [
      {
        name: 'CO2_conc',
        description: 'CO2 concentration',
        type: 'number',
        units: 'percent',
        required: true,
        range: { min: 0, max: 20 },
      },
      {
        name: 'Qh',
        description: 'Stack gas flow rate',
        type: 'number',
        units: 'scfh',
        required: true,
        range: { min: 0 },
      },
      {
        name: 'K',
        description: 'Conversion factor',
        type: 'number',
        units: 'dimensionless',
        required: true,
        defaultValue: 1.146e-5,
      },
    ],
    outputParameter: {
      name: 'CO2_mass',
      description: 'CO2 mass emission rate',
      type: 'number',
      units: 'tons/hr',
      required: true,
    },
    validationRules: [
      {
        id: 'co2-mass-positive',
        description: 'CO2 mass must be non-negative',
        type: 'semantic',
        validator: 'CO2_mass >= 0',
        severity: 'error',
      },
    ],
    regulatoryBasis: '40 CFR 75 Appendix F, Equation F-3',
    description: 'Calculates CO2 mass emission rate from concentration and flow',
  },

  // LME NOx Rate (Quarterly)
  {
    id: 'lme-nox-rate-quarterly',
    name: 'LME NOx Rate (Quarterly)',
    version: '1.0.0',
    expression: 'sum_NOX_mass / sum_HI',
    syntax: 'algebraic',
    inputParameters: [
      {
        name: 'sum_NOX_mass',
        description: 'Sum of NOx mass for quarter',
        type: 'number',
        units: 'lb',
        required: true,
        range: { min: 0 },
      },
      {
        name: 'sum_HI',
        description: 'Sum of heat input for quarter',
        type: 'number',
        units: 'MMBtu',
        required: true,
        range: { min: 0.001 },
      },
    ],
    outputParameter: {
      name: 'NOX_rate_quarterly',
      description: 'Quarterly average NOx emission rate',
      type: 'number',
      units: 'lb/MMBtu',
      required: true,
    },
    validationRules: [
      {
        id: 'lme-nox-rate-hi-nonzero',
        description: 'Sum of heat input must be greater than zero',
        type: 'semantic',
        validator: 'sum_HI > 0',
        severity: 'error',
      },
    ],
    regulatoryBasis: '40 CFR 75 Appendix E',
    description: 'Calculates quarterly average NOx rate for Low Mass Emissions methodology',
    examples: [
      {
        name: 'LME quarterly calculation',
        inputs: { sum_NOX_mass: 1000, sum_HI: 50000 },
        expectedOutput: 0.02,
      },
    ],
  },

  // Appendix D SO2 Mass
  {
    id: 'appendix-d-so2-mass',
    name: 'Appendix D SO2 Mass',
    version: '1.0.0',
    expression: 'fuel_flow * sulfur_content * K',
    syntax: 'algebraic',
    inputParameters: [
      {
        name: 'fuel_flow',
        description: 'Fuel flow rate',
        type: 'number',
        units: 'lb',
        required: true,
        range: { min: 0 },
      },
      {
        name: 'sulfur_content',
        description: 'Sulfur content of fuel',
        type: 'number',
        units: 'percent',
        required: true,
        range: { min: 0, max: 100 },
      },
      {
        name: 'K',
        description: 'Fuel-specific conversion factor',
        type: 'number',
        units: 'dimensionless',
        required: true,
        defaultValue: 0.02,
      },
    ],
    outputParameter: {
      name: 'SO2_mass_appendix_d',
      description: 'SO2 mass calculated per Appendix D',
      type: 'number',
      units: 'lb',
      required: true,
    },
    validationRules: [
      {
        id: 'appendix-d-so2-positive',
        description: 'SO2 mass must be non-negative',
        type: 'semantic',
        validator: 'SO2_mass_appendix_d >= 0',
        severity: 'error',
      },
    ],
    regulatoryBasis: '40 CFR 75 Appendix D',
    description: 'Calculates SO2 mass from fuel flow and sulfur content per Appendix D',
  },
]

/**
 * Formula categories
 */
export const formulaCategories: FormulaCategory[] = [
  {
    id: 'heat-input',
    name: 'Heat Input Calculations',
    description: 'Formulas for calculating heat input using various methodologies',
    formulaIds: ['heat-input-appendix-f'],
    regulatoryContext: '40 CFR 75 Appendix F',
  },
  {
    id: 'mass-emissions',
    name: 'Mass Emissions',
    description: 'Formulas for calculating mass emissions (SO2, NOx, CO2)',
    formulaIds: ['so2-mass-emission', 'nox-mass-emission', 'co2-mass-emission'],
    regulatoryContext: '40 CFR 75 Appendix F',
  },
  {
    id: 'emission-rates',
    name: 'Emission Rates',
    description: 'Formulas for calculating emission rates (lb/MMBtu)',
    formulaIds: ['nox-emission-rate', 'lme-nox-rate-quarterly'],
    regulatoryContext: '40 CFR 75.10',
  },
  {
    id: 'appendix-d',
    name: 'Appendix D Calculations',
    description: 'Fuel-based calculation methodologies',
    formulaIds: ['appendix-d-so2-mass'],
    regulatoryContext: '40 CFR 75 Appendix D',
  },
]

/**
 * Create the formula registry
 */
export function createFormulaRegistry(): FormulaRegistry {
  return {
    name: 'ECMPS/Part 75 Standard Formula Registry',
    description: 'Standard calculation formulas for EPA Part 75 continuous emissions monitoring',
    formulas: standardFormulas,
    categories: formulaCategories,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get formula by ID
 */
export function getFormulaById(id: string): Formula | undefined {
  return standardFormulas.find((f) => f.id === id)
}

/**
 * Get formulas by category
 */
export function getFormulasByCategory(categoryId: string): Formula[] {
  const category = formulaCategories.find((c) => c.id === categoryId)
  if (!category) return []

  return standardFormulas.filter((f) => category.formulaIds.includes(f.id))
}

/**
 * Search formulas by name or description
 */
export function searchFormulas(query: string): Formula[] {
  const lowerQuery = query.toLowerCase()
  return standardFormulas.filter(
    (f) =>
      f.name.toLowerCase().includes(lowerQuery) ||
      f.description.toLowerCase().includes(lowerQuery) ||
      f.regulatoryBasis.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get all formula versions for a base formula ID
 */
export function getFormulaVersions(baseId: string): Formula[] {
  // In a real implementation, this would return all versions
  // For now, we just return the matching formula
  return standardFormulas.filter((f) => f.id === baseId || f.id.startsWith(`${baseId}-v`))
}
