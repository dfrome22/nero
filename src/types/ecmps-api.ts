/**
 * ECMPS/CAMD API Types
 *
 * EPA's Clean Air Markets Division (CAMD) APIs
 * - ECMPS: Emissions Collection and Monitoring Plan System
 * - Facility, Unit, and Monitoring Plan data
 */

// ============================================================================
// FACILITY & UNIT DATA
// ============================================================================

/** Facility from CAMD API */
export interface CAMDFacility {
  facilityId: number
  orisCode: number
  facilityName: string
  stateCode: string
  countyCode?: string
  latitude?: number
  longitude?: number
  primaryFuelInfo?: string
  secondaryFuelInfo?: string
  unitCount?: number
  generatorCount?: number
  programCodes?: string[] // e.g., ["ARP", "CSAPR", "MATS"]
}

/** Unit from CAMD API */
export interface CAMDUnit {
  unitId: number
  facilityId: number
  unitName: string
  unitType?: string // e.g., "Tangentially-fired", "Wall-fired"
  primaryFuelCode?: string
  secondaryFuelCode?: string
  maxHourlyHeatInputCapacity?: number // MMBtu/hr
  commercialOperationDate?: string
  operatingStatusCode?: string // "OPR", "RET", etc.
  associatedGeneratorIds?: number[]
  programData?: UnitProgramData[]
}

/** Unit's participation in regulatory programs */
export interface UnitProgramData {
  programCode: string // "ARP", "CSAPR", "MATS"
  unitMonitorPlanId?: string
  classCode?: string
  emissionsRecordingBeginDate?: string
  endDate?: string
}

// ============================================================================
// MONITORING PLAN DATA
// ============================================================================

/** Monitoring Plan summary */
export interface MonitoringPlan {
  monitorPlanId: string
  facilityId: number
  facilityName: string
  orisCode: number
  stateCode: string
  unitStackConfigurations: UnitStackConfiguration[]
  locations: MonitoringLocation[]
  methods: MonitoringMethod[]
  systems: MonitoringSystem[]
  spans: MonitoringSpan[]
  qualifications: UnitQualification[]
  controlEquipment?: ControlEquipment[]
  comments?: PlanComment[]
  submissionStatus?: string
  submissionDate?: string
  lastUpdated?: string
}

/** Unit/Stack configuration in monitoring plan */
export interface UnitStackConfiguration {
  unitId: string
  stackPipeId?: string
  beginDate: string
  endDate?: string
}

/** Monitoring location (stack, pipe, or unit) */
export interface MonitoringLocation {
  locationId: string
  locationType: 'unit' | 'stack' | 'pipe' | 'common'
  unitId?: string
  stackPipeId?: string
  activeDate?: string
  retireDate?: string
}

/** Monitoring method for a parameter */
export interface MonitoringMethod {
  methodId: string
  locationId: string
  parameterCode: string // "SO2", "NOX", "CO2", "HI", "OP", etc.
  methodCode: string // "CEM", "CALC", "AD", "LME", etc.
  substituteDataCode?: string // "SUBS75", "MHHI", etc.
  beginDate: string
  beginHour?: number
  endDate?: string
  endHour?: number
}

/** Monitoring system (analyzer components) */
export interface MonitoringSystem {
  systemId: string
  locationId: string
  systemTypeCode: string // "SO2", "NOX", "FLOW", "H2O", etc.
  systemDesignationCode?: string // "P", "B", "RB", etc.
  fuelCode?: string
  beginDate: string
  endDate?: string
  components?: SystemComponent[]
}

/** System component (analyzer, probe, etc.) */
export interface SystemComponent {
  componentId: string
  componentTypeCode: string // "SO2", "NOX", "CO2", "FLOW", "DIF", etc.
  basisCode?: string // "D", "W", etc.
  analyticalPrincipleCode?: string // "UV", "NDIR", "TD", etc.
  manufacturer?: string
  modelVersion?: string
  serialNumber?: string
}

/** Span configuration */
export interface MonitoringSpan {
  spanId: string
  locationId: string
  componentTypeCode: string
  spanScaleCode?: string // "H", "L"
  spanValue?: number
  spanUnitsOfMeasureCode?: string
  beginDate: string
  endDate?: string
}

/** Unit qualification (Part 75) */
export interface UnitQualification {
  qualificationId: string
  locationId: string
  qualificationTypeCode: string // "COMPLEX", "PEAKING", "GAS", etc.
  beginDate: string
  endDate?: string
  qualificationDataYear?: number
}

/** Control equipment */
export interface ControlEquipment {
  controlId: string
  locationId: string
  controlEquipmentParamCode: string // "SO2", "NOX", "PM", etc.
  controlCode: string // "SCR", "SNCR", "FGD", "ESP", etc.
  installDate?: string
  optimizationDate?: string
  retireDate?: string
}

/** Plan comment */
export interface PlanComment {
  commentId: string
  locationId?: string
  unitId?: string
  comment: string
  beginDate: string
  endDate?: string
}

// ============================================================================
// EMISSIONS DATA
// ============================================================================

/** Quarterly emissions summary */
export interface EmissionsSummary {
  facilityId: number
  unitId: string
  year: number
  quarter: number
  so2Mass?: number // tons
  noxMass?: number // tons
  co2Mass?: number // tons
  heatInput?: number // MMBtu
  operatingTime?: number // hours
  grossLoad?: number // MWh
}

// ============================================================================
// API QUERY PARAMETERS
// ============================================================================

/** Query for facility search */
export interface FacilitySearchQuery {
  stateCode?: string
  orisCode?: number
  facilityName?: string
  programCode?: string
}

/** Query for monitoring plan */
export interface MonitoringPlanQuery {
  orisCode: number
  unitId?: string
  year?: number
  quarter?: number
}

/** Query for emissions data */
export interface EmissionsQuery {
  orisCode: number
  unitId?: string
  beginYear: number
  endYear: number
  beginQuarter?: number
  endQuarter?: number
}

// ============================================================================
// PART 75 PARAMETER CODES
// ============================================================================

/** Standard parameter codes used in Part 75 */
export const PART75_PARAMETERS = {
  // Emission parameters
  SO2: 'Sulfur Dioxide',
  NOX: 'Nitrogen Oxides',
  CO2: 'Carbon Dioxide',
  HG: 'Mercury',
  HCL: 'Hydrogen Chloride',
  HF: 'Hydrogen Fluoride',

  // Diluent parameters
  O2: 'Oxygen',
  CO2D: 'Carbon Dioxide (Diluent)',

  // Flow/Other
  FLOW: 'Stack Gas Volumetric Flow Rate',
  H2O: 'Moisture',
  HI: 'Heat Input',
  OP: 'Opacity',
  TEMP: 'Stack Gas Temperature',
  BP: 'Barometric Pressure',
} as const

/** Standard method codes used in Part 75 */
export const PART75_METHOD_CODES = {
  CEM: 'Continuous Emission Monitoring',
  CALC: 'Calculation',
  AD: 'Appendix D (fuel flow)',
  LME: 'Low Mass Emissions',
  LTFF: 'Long-Term Fuel Flow',
  EXC: 'Excepted Methodology',
  NOXR: 'NOx Rate (lb/MMBtu)',
} as const

/** System type codes */
export const SYSTEM_TYPE_CODES = {
  SO2: 'SO2 Monitoring System',
  NOX: 'NOx Monitoring System',
  NOXC: 'NOx Concentration System',
  NOXP: 'NOx-Diluent System',
  CO2: 'CO2 Monitoring System',
  O2: 'O2 Monitoring System',
  FLOW: 'Flow Monitoring System',
  H2O: 'Moisture Monitoring System',
  HG: 'Mercury Monitoring System',
  HCL: 'HCl Monitoring System',
  HF: 'HF Monitoring System',
  GAS: 'Fuel Gas System',
  OILM: 'Oil Mass Flow System',
  OILV: 'Oil Volume Flow System',
} as const
