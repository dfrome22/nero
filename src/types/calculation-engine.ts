/**
 * Enhanced Calculation Engine Types
 *
 * Provides comprehensive types for calculation configuration, validation,
 * auditing, and dependency tracking based on ECMPS and Title V requirements.
 */

// ============================================================================
// FORMULA DEFINITION & VALIDATION
// ============================================================================

/** Supported formula syntax types */
export type FormulaSyntax = 'algebraic' | 'javascript' | 'ecmps-standard'

/** Parameter types used in formulas */
export type ParameterType = 'number' | 'string' | 'boolean' | 'datetime'

/** Units for calculation parameters */
export type Unit =
  | 'ppm' // parts per million
  | 'percent' // percentage
  | 'scfh' // standard cubic feet per hour
  | 'lb' // pounds
  | 'lb/hr' // pounds per hour
  | 'lb/MMBtu' // pounds per million BTU
  | 'MMBtu' // million BTU
  | 'MMBtu/hr' // million BTU per hour
  | 'tons' // tons
  | 'tons/hr' // tons per hour
  | 'µg/dscm' // micrograms per dry standard cubic meter (EPA standard)
  | 'dimensionless' // no units

/** Formula parameter definition */
export interface FormulaParameter {
  /** Parameter name used in formula */
  name: string
  /** Human-readable description */
  description: string
  /** Data type */
  type: ParameterType
  /** Units of measurement */
  units: Unit
  /** Whether parameter is required */
  required: boolean
  /** Valid range for numeric parameters */
  range?: {
    min?: number
    max?: number
  }
  /** Default value if not provided */
  defaultValue?: string | number | boolean
}

/** Formula validation rule */
export interface FormulaValidationRule {
  /** Rule identifier */
  id: string
  /** Rule description */
  description: string
  /** Rule type */
  type: 'syntax' | 'semantic' | 'regulatory' | 'units'
  /** Validation function or pattern */
  validator: string
  /** Severity if validation fails */
  severity: 'error' | 'warning' | 'info'
}

/** Formula definition */
export interface Formula {
  /** Unique formula identifier */
  id: string
  /** Formula name */
  name: string
  /** Formula version */
  version: string
  /** Formula expression */
  expression: string
  /** Syntax type */
  syntax: FormulaSyntax
  /** Input parameters */
  inputParameters: FormulaParameter[]
  /** Output parameter */
  outputParameter: FormulaParameter
  /** Validation rules */
  validationRules: FormulaValidationRule[]
  /** Regulatory basis (e.g., "40 CFR 75 Appendix F") */
  regulatoryBasis: string
  /** Formula description and usage notes */
  description: string
  /** Example calculations */
  examples?: FormulaExample[]
}

/** Example calculation for documentation */
export interface FormulaExample {
  /** Example name */
  name: string
  /** Input values */
  inputs: Record<string, number | string | boolean>
  /** Expected output */
  expectedOutput: number | string | boolean
  /** Context or explanation */
  description?: string
}

// ============================================================================
// CALCULATION CONFIGURATION
// ============================================================================

/** Calculation execution frequency */
export type CalculationFrequency =
  | 'continuous'
  | 'hourly'
  | 'daily'
  | 'monthly'
  | 'quarterly'
  | 'on-demand'

/** Calculation status */
export type CalculationStatus = 'active' | 'inactive' | 'deprecated' | 'testing'

/** Calculation configuration */
export interface CalculationConfig {
  /** Unique configuration identifier */
  id: string
  /** Configuration name */
  name: string
  /** Formula to use */
  formulaId: string
  /** Formula version */
  formulaVersion: string
  /** Execution frequency */
  frequency: CalculationFrequency
  /** Parameter mappings (formula param -> data source) */
  parameterMappings: Record<string, string>
  /** Configuration status */
  status: CalculationStatus
  /** Location/unit this applies to */
  locationId?: string
  /** Programs this calculation supports */
  programs: string[]
  /** Regulatory requirements satisfied */
  satisfiesRequirements: string[]
  /** Validation rules to apply */
  validationRuleIds: string[]
  /** Audit trail */
  audit: AuditTrail
  /** Configuration metadata */
  metadata: {
    description: string
    notes?: string[]
    tags?: string[]
  }
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

/** Audit action type */
export type AuditAction =
  | 'created'
  | 'updated'
  | 'activated'
  | 'deactivated'
  | 'deprecated'
  | 'validated'
  | 'executed'
  | 'failed'

/** Audit log entry */
export interface AuditLogEntry {
  /** Entry timestamp */
  timestamp: string
  /** Action performed */
  action: AuditAction
  /** User who performed action */
  userId: string
  /** User display name */
  userName: string
  /** Changes made (for updates) */
  changes?: Record<string, { old: unknown; new: unknown }>
  /** Additional context */
  context?: Record<string, unknown>
  /** Reason for change */
  reason?: string
  /** IP address or system identifier */
  source?: string
}

/** Complete audit trail for a configuration */
export interface AuditTrail {
  /** Creation information */
  createdAt: string
  createdBy: string
  createdByName: string
  /** Last modification */
  lastModifiedAt: string
  lastModifiedBy: string
  lastModifiedByName: string
  /** Approval information */
  approvedAt?: string
  approvedBy?: string
  approvedByName?: string
  approvalComment?: string
  /** Complete history */
  history: AuditLogEntry[]
}

// ============================================================================
// DEPENDENCY TRACKING
// ============================================================================

/** Dependency type */
export type DependencyType = 'input' | 'output' | 'conditional' | 'temporal'

/** Calculation dependency */
export interface CalculationDependency {
  /** Source calculation ID */
  sourceId: string
  /** Source calculation name */
  sourceName: string
  /** Target calculation ID */
  targetId: string
  /** Target calculation name */
  targetName: string
  /** Dependency type */
  type: DependencyType
  /** Parameter/data that flows between calculations */
  dataFlow: string
  /** Whether dependency is required or optional */
  required: boolean
  /** Description of dependency */
  description: string
}

/** Dependency graph for calculation analysis */
export interface DependencyGraph {
  /** All nodes (calculations) in the graph */
  nodes: DependencyNode[]
  /** All edges (dependencies) in the graph */
  edges: CalculationDependency[]
  /** Topologically sorted execution order */
  executionOrder: string[]
  /** Calculations with no dependencies (start nodes) */
  rootNodes: string[]
  /** Calculations with no dependents (end nodes) */
  leafNodes: string[]
  /** Detected circular dependencies */
  cycles: string[][]
}

/** Node in dependency graph */
export interface DependencyNode {
  /** Calculation ID */
  id: string
  /** Calculation name */
  name: string
  /** Formula used */
  formulaId: string
  /** Execution level (0 = root, higher = more dependencies) */
  level: number
  /** Upstream calculations this depends on */
  upstreamDependencies: string[]
  /** Downstream calculations that depend on this */
  downstreamDependents: string[]
  /** Metadata */
  metadata: {
    frequency: CalculationFrequency
    status: CalculationStatus
    programs: string[]
  }
}

// ============================================================================
// CALCULATION EXECUTION
// ============================================================================

/** Calculation execution result */
export interface CalculationResult {
  /** Calculation config ID */
  calculationId: string
  /** Execution timestamp */
  executedAt: string
  /** Execution status */
  status: 'success' | 'failure' | 'warning'
  /** Input values used */
  inputs: Record<string, unknown>
  /** Output value produced */
  output?: unknown
  /** Execution time in milliseconds */
  executionTimeMs: number
  /** Validation results */
  validationResults: ValidationResult[]
  /** Error information if failed */
  error?: {
    message: string
    code: string
    details?: Record<string, unknown>
  }
  /** Warnings generated */
  warnings?: string[]
}

/** Validation result */
export interface ValidationResult {
  /** Rule that was validated */
  ruleId: string
  /** Whether validation passed */
  passed: boolean
  /** Severity if failed */
  severity: 'error' | 'warning' | 'info'
  /** Validation message */
  message: string
  /** Additional details */
  details?: Record<string, unknown>
}

// ============================================================================
// IMPACT ANALYSIS
// ============================================================================

/** Impact analysis for configuration changes */
export interface ImpactAnalysis {
  /** Configuration being changed */
  configurationId: string
  /** Change description */
  changeDescription: string
  /** Directly impacted calculations */
  directImpacts: ImpactedCalculation[]
  /** Indirectly impacted calculations (downstream) */
  indirectImpacts: ImpactedCalculation[]
  /** Total count of impacted calculations */
  totalImpactCount: number
  /** Risk assessment */
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  /** Recommended actions */
  recommendations: string[]
  /** Required validations */
  requiredValidations: string[]
}

/** Impacted calculation details */
export interface ImpactedCalculation {
  /** Calculation ID */
  id: string
  /** Calculation name */
  name: string
  /** Type of impact */
  impactType: 'formula-change' | 'parameter-change' | 'dependency-change' | 'validation-change'
  /** Impact description */
  description: string
  /** Severity of impact */
  severity: 'low' | 'medium' | 'high'
  /** Affected programs */
  affectedPrograms: string[]
  /** Required actions */
  requiredActions: string[]
}

// ============================================================================
// FORMULA REGISTRY
// ============================================================================

/** Formula registry metadata */
export interface FormulaRegistry {
  /** Registry name */
  name: string
  /** Registry description */
  description: string
  /** All formulas in registry */
  formulas: Formula[]
  /** Formula categories */
  categories: FormulaCategory[]
  /** Last updated timestamp */
  lastUpdated: string
}

/** Formula category for organization */
export interface FormulaCategory {
  /** Category ID */
  id: string
  /** Category name */
  name: string
  /** Category description */
  description: string
  /** Formula IDs in this category */
  formulaIds: string[]
  /** Regulatory context */
  regulatoryContext?: string
}
