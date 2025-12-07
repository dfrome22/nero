/**
 * DAHS Regulatory Domain Types
 *
 * Types for Part 75 / ECMPS monitoring plans and DAHS engine configuration.
 * This domain model complements the main NERO orchestration types by providing
 * specific structures for emissions monitoring system configuration.
 *
 * References:
 * - 40 CFR Part 75 (Acid Rain monitoring)
 * - ECMPS (EPA's Emissions Collection and Monitoring Plan System)
 * - DAHS (Data Acquisition and Handling System)
 */

// ============================================================================
// PARAMETER AND METHOD CODES
// ============================================================================

export type ParameterCode =
  | 'SO2M' // SO2 Mass
  | 'NOXM' // NOx Mass
  | 'NOXR' // NOx Rate
  | 'CO2M' // CO2 Mass
  | 'BCO2' // Biogenic CO2
  | 'HIT' // Heat Input
  | 'OPTIME' // Operating Time
  | 'OPHOURS' // Operating Hours

export type MonitoringMethodCode =
  | 'CEM' // Continuous Emissions Monitoring
  | 'AMS' // Alternative Monitoring System
  | 'AD' // Appendix D (fuel flow)
  | 'FSA' // Fuel Sampling and Analysis
  | 'LME' // Low Mass Emissions
  | 'LTFF' // Long Term Fuel Flow
  | 'CALC' // Calculation

export type ProgramCode =
  | 'ARP' // Acid Rain Program
  | 'CSAPR_SO2' // Cross-State Air Pollution Rule - SO2
  | 'CSAPR_NOX_ANN' // CSAPR NOx Annual
  | 'CSAPR_NOX_OS' // CSAPR NOx Ozone Season
  | 'MATS' // Mercury and Air Toxics Standards
  | 'STATE' // State-specific programs
  | 'NSPS' // New Source Performance Standards

// ============================================================================
// LOCATION CONFIGURATION
// ============================================================================

export type LocationType = 'UNIT' | 'STACK' | 'PIPE'

export type ConfigurationType =
  | 'SINGLE' // Single unit, single stack
  | 'COMMON_STACK' // Multiple units, common stack
  | 'MULTI_STACK' // Single unit, multiple stacks
  | 'MIXED' // Complex configuration

export interface Location {
  id: string
  type: LocationType
  configurationType: ConfigurationType
  connectedTo: string[]
}

// ============================================================================
// MONITORING PLAN
// ============================================================================

export interface MethodConfig {
  locationId: string
  parameter: ParameterCode
  methodCode: MonitoringMethodCode
  isLME?: boolean
  isLTFF?: boolean
}

export interface MonitoringPlan {
  facilityId: string
  locations: Location[]
  methods: MethodConfig[]
  programs: ProgramCode[]
}

// ============================================================================
// REQUIRED OBJECTS (ECMPS Data Structures)
// ============================================================================

export interface RequiredObject {
  objectType:
    | 'HOURLY' // Hourly emissions/operating data
    | 'SUMMARY' // Quarterly summary values
    | 'DAILY_CO2' // Daily CO2 mass emissions (CSAPR)
    | 'DAILY_FUEL' // Daily fuel usage
    | 'DAILY_BACKSTOP' // Daily backstop data (CSAPR Group 3)
    | 'ROLLING_METRIC' // Rolling averages (NSPS)
  parameter?: ParameterCode
  locationId?: string
  explanation: string
}

// ============================================================================
// REGULATORY BRAIN OUTPUT
// ============================================================================

export interface RequiredParameter {
  locationId: string
  parameter: ParameterCode
  method: MonitoringMethodCode
  requiredBy: ProgramCode[]
  reason: string
}

export interface QARequirement {
  locationId: string
  parameter: ParameterCode
  testType: string // e.g., 'RATA', 'LINEARITY', 'FUEL_FLOW_ACCURACY'
  frequencyHint: string
  citation?: string
}

export interface RegBrainOutput {
  requiredParameters: RequiredParameter[]
  requiredObjects: RequiredObject[]
  qaRequirements: QARequirement[]
  notes: string[]
}

// ============================================================================
// CALCULATION PLANNER OUTPUT
// ============================================================================

export interface MethodPlan {
  locationId: string
  parameter: ParameterCode
  method: MonitoringMethodCode
  notes: string[]
}

export interface TestCase {
  name: string
  description: string
  inputs: unknown
  expected: unknown
}

export interface CalculationPlan {
  methodPlans: MethodPlan[]
  testCases: TestCase[]
}

// ============================================================================
// PQA MIRROR (ECMPS Quality Assurance Checks)
// ============================================================================

export interface CheckRule {
  id: string
  description: string
  objectType: RequiredObject['objectType']
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO'
}
