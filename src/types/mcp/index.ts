/**
 * Shared TypeScript Types for EPA Compliance MCP Server
 * 
 * Used by both DAHS and NERO projects.
 * Location: C:\WebApp\shared\epa-compliance-mcp\types\
 */

// =============================================================================
// MONITORING PLAN ANALYSIS - Input/Output Types
// =============================================================================

export interface MonitoringPlanAnalysisInput {
  // Facility identification
  orisCode?: string;
  stateCode: string;
  
  // Unit characteristics
  unitType: 'EGU' | 'industrial_boiler' | 'turbine' | 'cogeneration' | 'other';
  capacityMW?: number;
  constructionDate?: string;  // ISO 8601 date
  
  // Fuel configuration
  fuelTypes: FuelType[];
  primaryFuel?: FuelType;
  
  // What needs to be monitored
  pollutants: Pollutant[];
  
  // Existing monitoring (for gap analysis)
  currentMonitors?: CurrentMonitoringConfig;
  
  // For Phase 2: actual MP data
  rawMonitoringPlan?: object;
}

export interface CurrentMonitoringConfig {
  cems?: {
    parameter: Pollutant | 'Flow' | 'O2';
    spanValue?: number;
    installDate?: string;
  }[];
  fuel?: {
    method: 'volumetric' | 'mass' | 'tank_drop';
    fuelType: FuelType;
  }[];
  sorbentTrap?: boolean;
  pmCpms?: boolean;
}

export interface MonitoringPlanAnalysisOutput {
  // Program determination
  applicablePrograms: ApplicableProgram[];
  
  // Method recommendations
  recommendedMethods: MethodRecommendation[];
  
  // Emission limits that apply
  applicableLimits: ApplicableLimit[];
  
  // Gap analysis
  gaps: ComplianceGap[];
  
  // QA requirements
  qaRequirements: QARequirement[];
  
  // Reporting calendar
  reportingSchedule: ReportingItem[];
  
  // Formula suggestions
  suggestedFormulas: SuggestedFormula[];
}

export interface ApplicableProgram {
  programId: string;
  title: string;
  reason: string;
  pollutants: Pollutant[];
}

export interface MethodRecommendation {
  pollutant: Pollutant;
  methods: {
    method: MonitoringMethod;
    formulas: string[];
    pros: string[];
    cons: string[];
    recommended: boolean;
  }[];
  citation: string;
}

export interface ApplicableLimit {
  regulation: string;
  pollutant: Pollutant;
  limitValue: number;
  units: string;
  averagingPeriod: string;
  citation: string;
}

export interface ComplianceGap {
  category: GapCategory;
  gapId: string;
  issue: string;
  severity: Severity;
  recommendation: string;
  citation: string;
  affectedPrograms: string[];
}

export interface QARequirement {
  test: QATestType;
  frequency: string;
  applicableMonitors: string[];
  citation: string;
}

export interface ReportingItem {
  report: string;
  frequency: string;
  deadline: string;
  programs: string[];
}

export interface SuggestedFormula {
  formulaCode: string;
  appendix: string;
  description: string;
  parameters: string[];
  reason: string;
}

// =============================================================================
// ENUMS AND UNION TYPES
// =============================================================================

export type Pollutant = 
  | 'SO2' | 'NOx' | 'CO2' | 'CO' 
  | 'Hg' | 'HCl' | 'HF' 
  | 'PM' | 'PM10' | 'PM2.5';

export type FuelType = 
  | 'coal' | 'bituminous' | 'subbituminous' | 'lignite' | 'anthracite'
  | 'oil' | 'residual_oil' | 'distillate_oil'
  | 'gas' | 'natural_gas' | 'pipeline_gas' | 'propane'
  | 'wood' | 'biomass' | 'tire_derived_fuel' | 'refuse'
  | 'petroleum_coke' | 'other';

export type MonitoringMethod = 
  | 'CEM'           // Continuous Emission Monitoring
  | 'Appendix_D'    // Fuel analysis (SO2, HI)
  | 'Appendix_E'    // Fuel-specific NOx testing
  | 'Appendix_G'    // CO2 from fuel sampling
  | 'LME'           // Low Mass Emissions (75.19)
  | 'Sorbent_Trap'  // Mercury monitoring
  | 'PM_CPMS'       // Particulate Matter CPMS
  | 'Stack_Test';   // Reference method testing

export type GapCategory = 
  | 'MONITORING' | 'QAQC' | 'LIMIT' | 'FORMULA' | 'REPORTING' | 'PROGRAM';

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export type QATestType = 
  | 'RATA' | 'CGA' | 'linearity' | 'cylinder_gas_audit' 
  | 'flow_RATA' | 'leak_check' | 'beam_intensity' | 'calibration_error'
  | 'sorbent_trap_section_breakthrough' | 'relative_accuracy_audit';

// =============================================================================
// REGULATION AND REFERENCE DATA TYPES
// =============================================================================

export interface Regulation {
  id: string;
  title: string;
  cfr: string;
  description: string;
  effectiveDate: string;
  affectedStates: string[] | 'ALL';
  applicabilityCriteria?: ApplicabilityCriteria;
  status: 'ACTIVE' | 'PENDING' | 'SUPERSEDED';
}

export interface ApplicabilityCriteria {
  minCapacity?: number;
  capacityUnits?: string;
  unitTypes?: string[];
  fuelTypes?: FuelType[];
  constructionDate?: string;
}

export interface EmissionLimit {
  id: string;
  regulation: string;
  pollutant: Pollutant;
  limitValue: number;
  units: string;
  averagingPeriod: string;
  unitType: string;
  fuelTypes?: FuelType[];
  constructionDate?: { after?: string; before?: string };
  citation: string;
  effectiveDate?: string;
  notes?: string;
}

export interface FormulaMapping {
  appendix: string;
  section: string;
  description: string;
  parameters: string[];
  applicableUnits: string;
}

export interface GapType {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  category: GapCategory;
  detectionCriteria: string;
  recommendation: string;
}

// =============================================================================
// FACILITY AND UNIT TYPES
// =============================================================================

export interface Facility {
  orisCode: string;
  name: string;
  state: string;
  county?: string;
  programCodes: string[];
  units: Unit[];
}

export interface Unit {
  unitId: string;
  unitType: string;
  fuelTypes: FuelType[];
  capacityMW?: number;
  constructionDate?: string;
  retirementDate?: string;
  monitoringLocations: MonitoringLocation[];
}

export interface MonitoringLocation {
  locationId: string;
  locationType: 'unit' | 'stack' | 'pipe' | 'multiple';
  systems: MonitoringSystem[];
  methods: MonitoringMethodConfig[];
  formulas: FormulaConfig[];
}

export interface MonitoringSystem {
  systemId: string;
  systemType: string;
  fuelCode?: string;
  components: SystemComponent[];
}

export interface SystemComponent {
  componentId: string;
  componentType: string;
  sampleAcquisitionMethod?: string;
  basisCode?: string;
}

export interface MonitoringMethodConfig {
  parameter: string;
  methodCode: string;
  substituteDataCode?: string;
  beginDate: string;
  endDate?: string;
}

export interface FormulaConfig {
  formulaId: string;
  formulaCode: string;
  parameter: string;
  beginDate: string;
  endDate?: string;
}

// ============================================================================
// getFacilityContext Types
// ============================================================================

export interface GetFacilityContextInput {
  orisCode: number
  apiKey: string
  planId?: string
  unitId?: string
  includeFullPlan?: boolean
}

export interface FacilityContext {
  facility: {
    orisCode: number
    facilityId: number
    facilityName: string
    stateCode: string
    county?: string
  } | null

  programs: string[]

  monitoringPlan: {
    planId: string
    status: string
    locations: Array<{
      locationId: string
      locationType: 'unit' | 'stack' | 'pipe' | 'multiple'
      unitId?: string
      stackPipeId?: string
    }>
    methods: Array<{
      locationId: string
      parameter: string
      methodCode: string
      substituteDataCode?: string
      beginDate: string
    }>
    systems: Array<{
      locationId: string
      systemId: string
      systemType: string
      fuelCode?: string
    }>
    formulas: Array<{
      locationId: string
      formulaId: string
      formulaCode: string
      parameter: string
    }>
  }

  units: Array<{
    unitId: string
    unitType: string
    fuelTypes: string[]
    capacityMW?: number
    programs: string[]
    controls?: {
      so2?: string
      nox?: string
      pm?: string
      hg?: string
    }
  }>

  applicableRegulations: Array<{
    id: string
    title: string
    cfr: string
  }>

  csaprPrograms: string[]

  applicableLimits: Array<{
    regulation: string
    pollutant: string
    limitValue: number
    units: string
    citation: string
  }>

  hasMATS: boolean
  hasRGGI: boolean
  hasARP: boolean

  errors?: string[]

  rawMonitoringPlan?: object
}
