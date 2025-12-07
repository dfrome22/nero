/**
 * Calculation Engine
 *
 * Enhanced calculation service with formula validation, configuration management,
 * audit trails, and dependency tracking for ECMPS and Title V permit calculations.
 *
 * @module agents/calculation-engine
 */

// Formula validation
export { validateFormula, validateInputs, type ValidationContext } from './formula-validator'

// Configuration management
export {
  createCalculationConfig,
  updateCalculationConfig,
  changeConfigStatus,
  approveConfig,
  getAuditHistory,
  getAuditEntriesByAction,
  getFieldHistory,
  analyzeImpact,
  exportConfig,
} from './configuration-service'

// Dependency tracking
export {
  buildDependencyGraph,
  getUpstreamDependencies,
  getDownstreamDependents,
  findDependencyPath,
  calculateCriticalPath,
  validateDependencyGraph,
} from './dependency-tracker'

// Formula registry
export {
  standardFormulas,
  formulaCategories,
  createFormulaRegistry,
  getFormulaById,
  getFormulasByCategory,
  searchFormulas,
  getFormulaVersions,
} from './formula-registry'

// Re-export types
export type {
  Formula,
  FormulaParameter,
  FormulaValidationRule,
  FormulaExample,
  FormulaSyntax,
  ParameterType,
  Unit,
  CalculationConfig,
  CalculationFrequency,
  CalculationStatus,
  AuditTrail,
  AuditLogEntry,
  AuditAction,
  CalculationDependency,
  DependencyGraph,
  DependencyNode,
  DependencyType,
  CalculationResult,
  ValidationResult,
  ImpactAnalysis,
  ImpactedCalculation,
  FormulaRegistry,
  FormulaCategory,
} from '../../types/calculation-engine'
