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

/**
 * Monitoring Plan from ECMPS API Export
 * Field names match the actual API response from /plans/export
 */
export interface MonitoringPlanExport {
  version: string
  orisCode: number
  monitoringPlanCommentData: PlanComment[]
  unitStackConfigurationData: UnitStackConfiguration[]
  monitoringLocationData: MonitoringLocationExport[]
}

/**
 * Location data from API export - contains nested arrays for methods, systems, etc.
 */
export interface MonitoringLocationExport {
  unitId: string | null
  stackPipeId: string | null
  activeDate: string | null
  retireDate: string | null
  nonLoadBasedIndicator: number
  monitoringLocationAttribData: LocationAttribute[]
  unitCapacityData: UnitCapacity[]
  unitControlData: UnitControl[]
  unitFuelData: UnitFuelExport[]
  monitoringMethodData: MonitoringMethodExport[]
  supplementalMATSMonitoringMethodData: MATSMethodExport[]
  monitoringFormulaData: MonitoringFormulaExport[]
  monitoringDefaultData: MonitoringDefault[]
  monitoringSpanData: MonitoringSpanExport[]
  rectangularDuctWAFData: unknown[]
  monitoringLoadData: MonitoringLoad[]
  componentData: ComponentData[]
  monitoringSystemData: MonitoringSystemExport[]
  monitoringQualificationData: QualificationExport[]
}

/** Location attributes from API */
export interface LocationAttribute {
  ductIndicator: number | null
  bypassIndicator: number | null
  groundElevation: number | null
  stackHeight: number | null
  materialCode: string | null
  shapeCode: string | null
  crossAreaFlow: number | null
  crossAreaStackExit: number | null
  beginDate: string
  endDate: string | null
}

/** Unit capacity data */
export interface UnitCapacity {
  maximumHourlyHeatInputCapacity: number
  beginDate: string
  endDate: string | null
}

/** Unit control equipment from API */
export interface UnitControl {
  parameterCode: string
  controlCode: string
  originalCode: string | null
  installDate: string | null
  optimizationDate: string | null
  seasonalControlsIndicator: string | null
  retireDate: string | null
}

/** Unit fuel from API export */
export interface UnitFuelExport {
  fuelCode: string
  indicatorCode: string
  ozoneSeasonIndicator: number | null
  demGCV: number | null
  demSO2: number | null
  beginDate: string
  endDate: string | null
}

/** Monitoring method from API export */
export interface MonitoringMethodExport {
  parameterCode: string
  monitoringMethodCode: string
  substituteDataCode: string | null
  bypassApproachCode: string | null
  beginDate: string
  beginHour: number
  endDate: string | null
  endHour: number | null
}

/** MATS method from API */
export interface MATSMethodExport {
  supplementalMATSParameterCode: string
  supplementalMATSMonitoringMethodCode: string
  beginDate: string
  beginHour: number
  endDate: string | null
  endHour: number | null
}

/** Monitoring formula from API export */
export interface MonitoringFormulaExport {
  parameterCode: string
  formulaCode: string
  formulaId: string
  formulaText: string | null
  beginDate: string
  beginHour: number
  endDate: string | null
  endHour: number | null
}

/** Monitoring default from API */
export interface MonitoringDefault {
  parameterCode: string
  defaultValue: number
  defaultUnitsOfMeasureCode: string
  defaultPurposeCode: string
  fuelCode: string | null
  operatingConditionCode: string | null
  defaultSourceCode: string
  groupId: string | null
  beginDate: string
  beginHour: number
  endDate: string | null
  endHour: number | null
}

/** Monitoring span from API export */
export interface MonitoringSpanExport {
  componentTypeCode: string
  spanScaleCode: string
  spanMethodCode: string | null
  mecValue: number | null
  mpcValue: number | null
  mpfValue: number | null
  spanValue: number
  fullScaleRange: number
  spanUnitsOfMeasureCode: string
  scaleTransitionPoint: number | null
  defaultHighRange: number | null
  flowSpanValue: number | null
  flowFullScaleRange: number | null
  beginDate: string
  beginHour: number
  endDate: string | null
  endHour: number | null
}

/** Monitoring load from API */
export interface MonitoringLoad {
  loadAnalysisDate: string
  beginDate: string
  beginHour: number
  endDate: string | null
  endHour: number | null
  maximumLoadValue: number
  secondNormalIndicator: number
  upperOperationBoundary: number
  lowerOperationBoundary: number
  normalLevelCode: string
  secondLevelCode: string
  maximumLoadUnitsOfMeasureCode: string
}

/** Component data from API */
export interface ComponentData {
  componentId: string
  componentTypeCode: string
  sampleAcquisitionMethodCode: string | null
  basisCode: string | null
  manufacturer: string | null
  modelVersion: string | null
  serialNumber: string | null
  hgConverterIndicator: number | null
  analyzerRangeData: AnalyzerRange[]
}

/** Analyzer range data */
export interface AnalyzerRange {
  analyzerRangeCode: string
  dualRangeIndicator: number
  beginDate: string
  beginHour: number
  endDate: string | null
  endHour: number | null
}

/** Monitoring system from API export */
export interface MonitoringSystemExport {
  monitoringSystemId: string
  systemTypeCode: string
  systemDesignationCode: string
  fuelCode: string | null
  beginDate: string
  beginHour: number
  endDate: string | null
  endHour: number | null
  monitoringSystemComponentData: SystemComponentLink[]
  monitoringSystemFuelFlowData: SystemFuelFlow[]
}

/** System component link */
export interface SystemComponentLink {
  componentId: string
  beginDate: string
  beginHour: number
  endDate: string | null
  endHour: number | null
}

/** System fuel flow data */
export interface SystemFuelFlow {
  maximumFuelFlowRate: number
  systemFuelFlowUnitsOfMeasureCode: string
  maximumFuelFlowRateSourceCode: string
  beginDate: string
  beginHour: number
  endDate: string | null
  endHour: number | null
}

/** Qualification from API export */
export interface QualificationExport {
  qualificationTypeCode: string
  beginDate: string
  endDate: string | null
  monitoringQualificationLEEData: LEEQualification[]
  monitoringQualificationLMEData: LMEQualification[]
  monitoringQualificationPercentData: PercentQualification[]
}

/** LEE qualification data */
export interface LEEQualification {
  qualificationTestDate: string
  parameterCode: string
  qualificationTestType: string
  potentialAnnualMassEmissions: number
  applicableEmissionStandard: number
  unitsOfStandard: string
  percentageOfEmissionStandard: number
}

/** LME qualification data */
export interface LMEQualification {
  qualificationDataYear: number
  operatingHours: number
  so2Tons: number
  noxTons: number
}

/** Percent qualification data */
export interface PercentQualification {
  qualificationYear: number
  averagePercentValue: number
  yr1QualificationDataYear: number
  yr1QualificationDataTypeCode: string
  yr1PercentageValue: number
  yr2QualificationDataYear: number
  yr2QualificationDataTypeCode: string
  yr2PercentageValue: number
  yr3QualificationDataYear: number
  yr3QualificationDataTypeCode: string
  yr3PercentageValue: number
}

// ============================================================================
// NORMALIZED MONITORING PLAN (for internal use)
// ============================================================================

/** Monitoring Plan summary (normalized from API export) */
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
  formulas?: MonitoringFormula[]
  unitFuels?: UnitFuel[]
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

/** Monitoring formula for emission calculations */
export interface MonitoringFormula {
  formulaId: string
  locationId: string
  parameterCode: string // "SO2", "NOX", "CO2", "HI", etc.
  formulaCode: string // "F-1", "F-2", "F-21A", "F-23", etc.
  formulaEquation?: string // The actual equation text
  beginDate: string
  beginHour?: number
  endDate?: string
  endHour?: number
}

/** Unit fuel information */
export interface UnitFuel {
  unitFuelId: string
  locationId: string
  fuelCode: string // "C", "OIL", "NFS", "PNG", "PG", etc.
  fuelTypeDescription?: string
  indicatorCode?: string // "P" (primary), "S" (secondary), "E" (emergency)
  ozoneSeasonIndicator?: boolean
  demGCV?: number // Default GCV
  demSO2?: number // Default SO2 rate
  beginDate: string
  endDate?: string
}

/** Standard fuel codes used in Part 75 */
export const FUEL_CODES = {
  C: 'Coal',
  OIL: 'Oil',
  NFS: 'Natural Gas (Pipeline)',
  PNG: 'Processed Natural Gas',
  PG: 'Process Gas',
  W: 'Wood',
  WL: 'Waste Liquid',
  WS: 'Waste Solid',
  TDF: 'Tire-Derived Fuel',
  DSL: 'Diesel',
  R: 'Residual Oil',
  WO: 'Waste Oil',
} as const

/** Standard formula codes from 40 CFR 75 Appendix F */
export const FORMULA_CODES = {
  // SO2 mass formulas
  'F-1': 'SO2 mass from CEM (lb/hr)',
  'F-2': 'SO2 mass from fuel sampling',
  // NOx mass formulas
  'F-5': 'NOx mass from CEM (lb/hr)',
  'F-6': 'NOx mass emissions using diluent',
  // CO2 mass formulas
  'F-11': 'CO2 mass from CEM',
  // Heat Input formulas
  'F-21': 'Heat Input from steam load',
  'F-21A': 'Heat Input from fuel flow - gas',
  'F-21B': 'Heat Input from fuel flow - oil',
  'F-21C': 'Heat Input from fuel flow - coal',
  'F-23': 'Heat Input apportionment - common stack',
  'F-24': 'Apportioned NOx mass',
  'F-25': 'Apportioned CO2 mass',
  'F-26': 'Apportioned SO2 mass',
  // Moisture formulas
  'F-31': 'Moisture from wet bulb',
  // Flow formulas
  'F-2A': 'Volumetric flow with moisture correction',
} as const

/**
 * Formula-to-CFR mapping: Maps ECMPS formula codes to applicable CFR sections
 * Used by RegsBot to determine regulatory applicability from monitoring plan
 *
 * IMPORTANT: This data is imported from the shared EPA Compliance MCP data.
 * Source: C:\WebApp\shared\epa-compliance-mcp\data\formulas.json
 * To update: Edit the shared file, then run: npm run sync:compliance-data
 */
import sharedFormulasRaw from '../data/formulas.json'

// Filter out _metadata from the imported JSON
const { _metadata: _formulasMeta, ...sharedFormulas } = sharedFormulasRaw as Record<string, unknown>

export const FORMULA_TO_CFR: Record<
  string,
  {
    appendix: string
    section: string
    description: string
    parameters: string[]
    applicableUnits: string
  }
> = sharedFormulas as Record<
  string,
  {
    appendix: string
    section: string
    description: string
    parameters: string[]
    applicableUnits: string
  }
>

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

// ============================================================================
// MONITORING PLAN NORMALIZATION
// ============================================================================

/**
 * Normalize a monitoring plan from API export format to internal format.
 * The API returns nested data (monitoringLocationData[].monitoringMethodData[])
 * We flatten it to (methods[], systems[], etc.)
 *
 * @param data - Raw data from API or JSON file import
 * @returns Normalized MonitoringPlan or undefined if invalid
 */
export function normalizeMonitoringPlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): MonitoringPlan | undefined {
  if (!data) return undefined

  // Check if already normalized (has flat methods array)
  if (Array.isArray(data.methods) && data.methods.length > 0) {
    return data as MonitoringPlan
  }

  // Check if it's the API export format (has monitoringLocationData)
  if (!Array.isArray(data.monitoringLocationData)) {
    // Maybe it's a simple object, try to use as-is with defaults
    return {
      monitorPlanId: data.id ?? data.monitorPlanId ?? 'unknown',
      facilityId: data.facilityId ?? 0,
      facilityName: data.facilityName ?? '',
      orisCode: data.orisCode ?? 0,
      stateCode: data.stateCode ?? '',
      unitStackConfigurations:
        data.unitStackConfigurationData ?? data.unitStackConfigurations ?? [],
      locations: [],
      methods: [],
      systems: [],
      spans: [],
      qualifications: [],
      formulas: [],
      unitFuels: [],
    }
  }

  // Normalize from API export format
  const locations: MonitoringLocation[] = []
  const methods: MonitoringMethod[] = []
  const systems: MonitoringSystem[] = []
  const spans: MonitoringSpan[] = []
  const qualifications: UnitQualification[] = []
  const formulas: MonitoringFormula[] = []
  const unitFuels: UnitFuel[] = []

  let methodCounter = 0
  let systemCounter = 0
  let spanCounter = 0
  let qualCounter = 0
  let formulaCounter = 0
  let fuelCounter = 0

  for (const loc of data.monitoringLocationData as MonitoringLocationExport[]) {
    // Derive location ID from unit or stack
    const locationId = loc.unitId ?? loc.stackPipeId ?? `loc-${locations.length}`
    const locationType: MonitoringLocation['locationType'] = loc.stackPipeId
      ? 'stack'
      : loc.unitId
        ? 'unit'
        : 'common'

    // Build location object conditionally to avoid undefined
    const location: MonitoringLocation = {
      locationId,
      locationType,
    }
    if (loc.unitId) location.unitId = loc.unitId
    if (loc.stackPipeId) location.stackPipeId = loc.stackPipeId
    if (loc.activeDate) location.activeDate = loc.activeDate
    if (loc.retireDate) location.retireDate = loc.retireDate
    locations.push(location)

    // Flatten methods
    for (const m of loc.monitoringMethodData ?? []) {
      const method: MonitoringMethod = {
        methodId: `method-${++methodCounter}`,
        locationId,
        parameterCode: m.parameterCode,
        methodCode: m.monitoringMethodCode,
        beginDate: m.beginDate,
      }
      if (m.substituteDataCode) method.substituteDataCode = m.substituteDataCode
      if (m.beginHour !== null && m.beginHour !== undefined) method.beginHour = m.beginHour
      if (m.endDate) method.endDate = m.endDate
      if (m.endHour !== null && m.endHour !== undefined) method.endHour = m.endHour
      methods.push(method)
    }

    // Flatten systems
    for (const s of loc.monitoringSystemData ?? []) {
      const system: MonitoringSystem = {
        systemId: s.monitoringSystemId ?? `sys-${++systemCounter}`,
        locationId,
        systemTypeCode: s.systemTypeCode,
        beginDate: s.beginDate,
      }
      if (s.systemDesignationCode) system.systemDesignationCode = s.systemDesignationCode
      if (s.fuelCode) system.fuelCode = s.fuelCode
      if (s.endDate) system.endDate = s.endDate
      // Map components (ignoring componentTypeCode which doesn't exist on SystemComponentLink)
      if (s.monitoringSystemComponentData && s.monitoringSystemComponentData.length > 0) {
        system.components = s.monitoringSystemComponentData.map((c) => ({
          componentId: c.componentId ?? '',
          componentTypeCode: '', // Not available from SystemComponentLink
        }))
      }
      systems.push(system)
    }

    // Flatten spans
    for (const sp of loc.monitoringSpanData ?? []) {
      const span: MonitoringSpan = {
        spanId: `span-${++spanCounter}`,
        locationId,
        componentTypeCode: sp.componentTypeCode,
        beginDate: sp.beginDate,
      }
      if (sp.spanScaleCode) span.spanScaleCode = sp.spanScaleCode
      if (sp.spanValue !== null && sp.spanValue !== undefined) span.spanValue = sp.spanValue
      if (sp.spanUnitsOfMeasureCode) span.spanUnitsOfMeasureCode = sp.spanUnitsOfMeasureCode
      if (sp.endDate) span.endDate = sp.endDate
      spans.push(span)
    }

    // Flatten qualifications
    for (const q of loc.monitoringQualificationData ?? []) {
      const qual: UnitQualification = {
        qualificationId: `qual-${++qualCounter}`,
        locationId,
        qualificationTypeCode: q.qualificationTypeCode,
        beginDate: q.beginDate,
      }
      if (q.endDate) qual.endDate = q.endDate
      qualifications.push(qual)
    }

    // Flatten formulas
    for (const f of loc.monitoringFormulaData ?? []) {
      const formula: MonitoringFormula = {
        formulaId: f.formulaId ?? `formula-${++formulaCounter}`,
        locationId,
        parameterCode: f.parameterCode,
        formulaCode: f.formulaCode,
        beginDate: f.beginDate,
      }
      if (f.formulaText) formula.formulaEquation = f.formulaText
      if (f.beginHour !== null && f.beginHour !== undefined) formula.beginHour = f.beginHour
      if (f.endDate) formula.endDate = f.endDate
      if (f.endHour !== null && f.endHour !== undefined) formula.endHour = f.endHour
      formulas.push(formula)
    }

    // Flatten unit fuels
    for (const uf of loc.unitFuelData ?? []) {
      const fuel: UnitFuel = {
        unitFuelId: `fuel-${++fuelCounter}`,
        locationId,
        fuelCode: uf.fuelCode,
        beginDate: uf.beginDate,
      }
      if (uf.indicatorCode) fuel.indicatorCode = uf.indicatorCode
      if (uf.ozoneSeasonIndicator !== null && uf.ozoneSeasonIndicator !== undefined) {
        fuel.ozoneSeasonIndicator = uf.ozoneSeasonIndicator === 1
      }
      if (uf.demGCV !== null && uf.demGCV !== undefined) fuel.demGCV = uf.demGCV
      if (uf.demSO2 !== null && uf.demSO2 !== undefined) fuel.demSO2 = uf.demSO2
      if (uf.endDate) fuel.endDate = uf.endDate
      unitFuels.push(fuel)
    }
  }

  return {
    monitorPlanId: data.id ?? 'unknown',
    facilityId: 0, // Not in export, would need facility lookup
    facilityName: '', // Not in export
    orisCode: data.orisCode ?? 0,
    stateCode: '', // Not in export
    unitStackConfigurations: data.unitStackConfigurationData ?? [],
    locations,
    methods,
    systems,
    spans,
    qualifications,
    formulas,
    unitFuels,
    comments: data.monitoringPlanCommentData ?? [],
  }
}
