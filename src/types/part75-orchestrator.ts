/**
 * Part 75/ECMPS Regulatory Orchestrator Types
 *
 * Types for the four-agent orchestrator that analyzes monitoring plans
 * and generates comprehensive DAHS requirements.
 */

import type {
  ApplicableRegulation,
  CalculationRequirement,
  MonitoringRequirement,
  QARequirement,
} from './orchestration'

// ============================================================================
// REGULATORY BRAIN AGENT (RegBrainAgent)
// ============================================================================

/**
 * RegBrainAgent - Infers regulatory requirements from monitoring plans
 *
 * PURPOSE: Acts as the "regulatory brain" that understands Part 75 rules
 * and can infer what a DAHS must do based on a facility's monitoring plan.
 */

/** Input to RegBrainAgent */
export interface RegBrainInput {
  /** ORIS code to fetch monitoring plan from ECMPS */
  orisCode?: number
  /** Or provide monitoring plan directly */
  monitoringPlan?: import('./ecmps-api').MonitoringPlan
  /** Specific location to analyze (optional, defaults to all) */
  locationId?: string
  /** Analysis depth */
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive'
}

/** Output from RegBrainAgent - Inferred regulatory requirements */
export interface RegBrainOutput {
  /** Facility information */
  facilityInfo: {
    orisCode: number
    facilityName: string
    stateCode: string
    programs: string[]
  }
  /** Locations analyzed */
  locations: {
    locationId: string
    locationType: 'unit' | 'stack' | 'pipe' | 'common'
    parameters: string[]
  }[]
  /** Inferred monitoring requirements */
  monitoringRequirements: MonitoringRequirement[]
  /** Applicable regulations */
  applicableRegulations: ApplicableRegulation[]
  /** Inferred QA requirements */
  qaRequirements: QARequirement[]
  /** Confidence in the inference */
  confidence: 'high' | 'medium' | 'low'
  /** Any warnings or caveats */
  warnings: string[]
  /** Timestamp of analysis */
  analyzedAt: string
}

// ============================================================================
// CALCULATION PLANNER AGENT (CalcPlannerAgent)
// ============================================================================

/**
 * CalcPlannerAgent - Generates calculation plans for DAHS
 *
 * PURPOSE: Given monitoring requirements, determines what calculations
 * the DAHS must perform (hourly averages, heat input, mass emissions, etc.)
 */

/** Input to CalcPlannerAgent */
export interface CalcPlannerInput {
  /** Monitoring requirements from RegBrainAgent */
  monitoringRequirements: MonitoringRequirement[]
  /** Programs to consider (e.g., ["ARP", "CSAPR"]) */
  programs: string[]
  /** Parameters being monitored */
  parameters: string[]
}

/** A single calculation in the plan */
export interface CalculationPlanItem {
  /** Unique ID for this calculation */
  id: string
  /** Calculation name */
  name: string
  /** Calculation type */
  calculationType:
    | 'hourly_average'
    | 'heat_input'
    | 'mass_emission'
    | 'emission_rate'
    | 'missing_data_substitution'
    | 'qa_calculation'
    | 'custom'
  /** Input parameters/data needed */
  inputs: string[]
  /** Output parameter */
  output: string
  /** Output units */
  units: string
  /** When to perform calculation */
  frequency: 'continuous' | 'hourly' | 'daily' | 'on_demand'
  /** Formula or algorithm description */
  formula?: string
  /** Regulatory basis */
  regulatoryBasis: string
  /** Dependencies (other calculations that must run first) */
  dependencies: string[]
  /** Priority/order */
  executionOrder: number
}

/** Output from CalcPlannerAgent - Complete calculation plan */
export interface CalcPlannerOutput {
  /** All calculations required */
  calculations: CalculationPlanItem[]
  /** Calculation dependency graph */
  dependencyGraph: Record<string, string[]>
  /** Execution sequence */
  executionSequence: string[]
  /** Total calculation count by type */
  summary: {
    hourlyAverages: number
    heatInputCalcs: number
    massEmissionCalcs: number
    emissionRateCalcs: number
    qaCalcs: number
    other: number
  }
  /** Regulatory requirements satisfied */
  requirements: CalculationRequirement[]
}

// ============================================================================
// PQA MIRROR AGENT (PQAMirrorAgent)
// ============================================================================

/**
 * PQAMirrorAgent - Generates compliance check rules (PQA = Post-QA)
 *
 * PURPOSE: Creates validation rules that mirror EPA's compliance checking.
 * These rules ensure data quality and regulatory compliance before submission.
 */

/** Input to PQAMirrorAgent */
export interface PQAMirrorInput {
  /** QA requirements from RegBrainAgent */
  qaRequirements: QARequirement[]
  /** Monitoring requirements */
  monitoringRequirements: MonitoringRequirement[]
  /** Calculation plan */
  calculationPlan: CalculationPlanItem[]
  /** Programs */
  programs: string[]
}

/** A single compliance check rule */
export interface ComplianceCheckRule {
  /** Unique ID for this rule */
  id: string
  /** Rule name */
  name: string
  /** Rule category */
  category:
    | 'data_quality'
    | 'qa_result'
    | 'calculation_result'
    | 'missing_data'
    | 'exceedance'
    | 'reporting'
    | 'system_status'
  /** Description of what this rule checks */
  description: string
  /** When to run this check */
  frequency: 'real-time' | 'hourly' | 'daily' | 'quarterly' | 'on_demand'
  /** Severity if check fails */
  severity: 'critical' | 'error' | 'warning' | 'info'
  /** Parameters/data this rule checks */
  appliesTo: string[]
  /** Rule logic (as expression or description) */
  ruleLogic: string
  /** Regulatory basis */
  regulatoryBasis: string
  /** What happens if rule fails */
  consequence: string
  /** Remediation steps */
  remediation?: string
}

/** Output from PQAMirrorAgent - Complete compliance ruleset */
export interface PQAMirrorOutput {
  /** All compliance check rules */
  rules: ComplianceCheckRule[]
  /** Rules grouped by category */
  rulesByCategory: Record<string, ComplianceCheckRule[]>
  /** Critical rules that must pass */
  criticalRules: ComplianceCheckRule[]
  /** Summary */
  summary: {
    totalRules: number
    criticalRules: number
    errorRules: number
    warningRules: number
  }
  /** Data quality thresholds */
  dataQualityThresholds: {
    minimumDataAvailability: number // e.g., 0.90 for 90%
    calibrationErrorTolerance: number // e.g., 0.025 for 2.5%
    rataAccuracyTolerance: number // e.g., 0.10 for 10%
  }
}

// ============================================================================
// EXPLAINER AGENT (ExplainerAgent)
// ============================================================================

/**
 * ExplainerAgent - Generates human-readable explanations
 *
 * PURPOSE: Translates technical regulatory requirements into plain English
 * for business analysts and facility operators.
 */

/** Input to ExplainerAgent */
export interface ExplainerInput {
  /** What to explain */
  subject:
    | 'monitoring_requirement'
    | 'calculation'
    | 'qa_requirement'
    | 'compliance_rule'
    | 'regulation'
    | 'overall_requirements'
  /** The specific item to explain (ID or object) */
  item?: unknown
  /** Context for the explanation */
  context?: {
    facilityName?: string
    locationId?: string
    parameterCode?: string
    programs?: string[]
  }
  /** Detail level */
  detailLevel?: 'summary' | 'detailed' | 'technical'
}

/** An explanation section */
export interface ExplanationSection {
  /** Section heading */
  heading: string
  /** Content (markdown supported) */
  content: string
  /** Subsections */
  subsections?: ExplanationSection[]
}

/** Output from ExplainerAgent - Human-readable explanation */
export interface ExplainerOutput {
  /** Main explanation title */
  title: string
  /** Brief summary */
  summary: string
  /** Detailed explanation sections */
  sections: ExplanationSection[]
  /** Key takeaways */
  keyTakeaways: string[]
  /** Related regulatory citations */
  citations: {
    reference: string
    title: string
    url?: string
  }[]
  /** Examples or use cases */
  examples?: string[]
  /** Common pitfalls or gotchas */
  pitfalls?: string[]
}

// ============================================================================
// ORCHESTRATED OUTPUT - Combined result from all agents
// ============================================================================

/**
 * Complete orchestrated analysis from all four agents
 */
export interface Part75OrchestrationResult {
  /** Input context */
  input: {
    orisCode?: number
    facilityName: string
    locationId?: string
    analyzedAt: string
  }
  /** Output from RegBrainAgent */
  regulatoryAnalysis: RegBrainOutput
  /** Output from CalcPlannerAgent */
  calculationPlan: CalcPlannerOutput
  /** Output from PQAMirrorAgent */
  complianceRules: PQAMirrorOutput
  /** Output from ExplainerAgent */
  explanation: ExplainerOutput
  /** Overall confidence */
  overallConfidence: 'high' | 'medium' | 'low'
  /** Warnings or notes */
  notes: string[]
}

// ============================================================================
// AGENT ORCHESTRATOR
// ============================================================================

/**
 * Options for the orchestrator
 */
export interface OrchestratorOptions {
  /** Whether to include explanations */
  includeExplanations?: boolean
  /** Detail level for explanations */
  explanationDetail?: 'summary' | 'detailed' | 'technical'
  /** Whether to validate rules against monitoring plan */
  validateRules?: boolean
}
