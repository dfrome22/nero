/**
 * Part 60 NSPS Knowledge Base
 *
 * Pre-indexed regulatory knowledge for 40 CFR Part 60 subparts.
 * This enables RegsBot to answer questions about NSPS requirements
 * without requiring live eCFR API calls for common queries.
 *
 * Structure mirrors the regulatory-coverage-matrix.md roadmap.
 */

// ============================================================================
// TYPES
// ============================================================================

/** Equipment categories for Part 60 applicability */
export type Part60EquipmentType =
  | 'steam-generator'
  | 'gas-turbine'
  | 'combustion-turbine'
  | 'ci-ice' // Compression ignition internal combustion engine
  | 'si-ice' // Spark ignition internal combustion engine
  | 'fccu' // Fluid catalytic cracking unit
  | 'claus-unit'
  | 'fuel-gas-combustion'
  | 'storage-vessel'
  | 'process-heater'
  | 'flare'
  | 'boiler'
  | 'pump' // LDAR equipment
  | 'compressor' // LDAR equipment
  | 'valve' // LDAR equipment
  | 'pressure-relief-device' // LDAR equipment
  | 'connector' // LDAR equipment
  | 'open-ended-line' // LDAR equipment
  | 'sampling-connection' // LDAR equipment

/** Industry sectors */
export type Part60Industry =
  | 'electric-utility'
  | 'industrial'
  | 'petroleum-refining'
  | 'oil-gas-upstream'
  | 'oil-gas-midstream'
  | 'chemical-manufacturing'
  | 'waste-to-energy'
  | 'synthetic-organic-chemical' // SOCMI for VV/VVa

/** Monitoring method types */
export type MonitoringMethodType =
  | 'CEMS' // Continuous emission monitoring system
  | 'CPMS' // Continuous parameter monitoring system
  | 'COMS' // Continuous opacity monitoring system
  | 'fuel-analysis'
  | 'stack-test'
  | 'predictive-emission-monitoring'
  | 'continuous-monitoring'
  | 'periodic-monitoring'
  | 'ldar-monitoring' // Leak detection and repair
  | 'ogi-monitoring' // Optical gas imaging
  | 'awp-monitoring' // Alternative work practice

/** Standard structure for emission limits */
export interface Part60EmissionStandard {
  parameter: string
  limit: string
  units: string
  averagingPeriod: string
  conditions?: string[]
  applicabilityDate?: string
}

/** Monitoring specification for a subpart */
export interface Part60MonitoringSpec {
  parameter: string
  method: MonitoringMethodType
  frequency: string
  specifications?: {
    span?: string
    calibrationDrift?: string
    relativeAccuracy?: string
    cylinderGasAudit?: string
  }
  dataRecovery?: string
  substituteData?: string
}

/** Reporting requirements for a subpart */
export interface Part60ReportingReq {
  reportType: string
  frequency: string
  submitTo: 'EPA' | 'State' | 'Both'
  contents: string[]
  dueDate?: string
}

/** Test method reference */
export interface Part60TestMethod {
  parameter: string
  methods: string[] // e.g., ["Method 5", "Method 5B"]
  frequency: string
  conditions?: string
}

/** Cross-reference to other regulations */
export interface Part60CrossRef {
  regulation: string // e.g., "Part 75", "Part 63 UUUUU"
  relationship: 'overlaps' | 'supplements' | 'replaces' | 'coordinates'
  notes?: string
}

/**
 * Complete knowledge structure for a Part 60 subpart
 */
export interface Part60SubpartKnowledge {
  /** Subpart identifier (e.g., "Da", "KKKK", "J") */
  subpart: string

  /** Full regulatory title */
  title: string

  /** CFR section range (e.g., "60.40Da - 60.52Da") */
  cfrSections: string

  /** Equipment types this subpart covers */
  equipmentTypes: Part60EquipmentType[]

  /** Industries where this equipment is commonly found */
  industries: Part60Industry[]

  /** Applicability criteria */
  applicability: {
    /** Equipment description */
    description: string
    /** Size threshold (e.g., ">250 MMBtu/hr heat input") */
    sizeThreshold?: string
    /** Construction/modification date threshold */
    constructionDate?: string
    /** Specific exemptions */
    exemptions?: string[]
  }

  /** Emission standards */
  standards: Part60EmissionStandard[]

  /** Monitoring requirements */
  monitoring: Part60MonitoringSpec[]

  /** Test methods */
  testMethods: Part60TestMethod[]

  /** Reporting requirements */
  reporting: Part60ReportingReq[]

  /** Recordkeeping */
  recordkeeping: {
    records: string[]
    retentionPeriod: string
  }

  /** Cross-references to related regulations */
  crossReferences: Part60CrossRef[]

  /** Whether this subpart requires CEMS */
  requiresCEMS: boolean

  /** Parameters requiring continuous monitoring */
  cemsParameters?: string[]

  /** Key regulatory citations for quick lookup */
  keyCitations: {
    applicability: string
    standards: string
    monitoring: string
    testMethods: string
    reporting: string
  }
}

// ============================================================================
// NSPS APPLICABILITY ENGINE TYPES
// ============================================================================

/** Input for NSPS applicability determination */
export interface NSPSApplicabilityInput {
  /** Equipment type */
  equipmentType:
    | 'steam-generator'
    | 'gas-turbine'
    | 'boiler'
    | 'combustion-turbine'
    | 'ci-ice'
    | 'si-ice'
  /** Fuel type code from Part 75 MP (C, PNG, OIL, RO, DSL, etc.) */
  fuelType: string
  /** Heat input capacity in MMBtu/hr */
  capacityMMBtu?: number
  /** Electric generating capacity in MW */
  capacityMW?: number
  /** Commercial operation date */
  commercialOpDate?: Date
  /** Construction commencement date */
  constructionDate?: Date
  /** Modification date (if modified) */
  modificationDate?: Date
  /** Is this an electric utility unit (affects Da vs Db)? */
  isElectricUtility?: boolean
}

/** Output from NSPS applicability determination */
export interface NSPSApplicabilityResult {
  /** List of applicable NSPS subparts */
  applicableSubparts: string[]
  /** Detailed reasoning for each subpart */
  subpartDetails: {
    subpart: string
    reason: string
    effectiveDate: string
    confidence: 'high' | 'medium' | 'low'
  }[]
  /** Whether opacity monitoring is required */
  requiresOpacity: boolean
  /** Regulatory basis for opacity requirement */
  opacityBasis?: string
  /** Part 75 coordination notes */
  part75Notes?: string
  /** Applicable Performance Specifications */
  performanceSpecs?: PerformanceSpecification[]
  /** Any warnings or caveats */
  warnings: string[]
}

/**
 * Performance Specification (PS) requirements for CEMS/COMS
 * These are found in 40 CFR Part 60, Appendix B
 */
export interface PerformanceSpecification {
  /** PS identifier (e.g., 'PS-1', 'PS-2', 'PS-18') */
  id: string
  /** Full title */
  title: string
  /** Parameter being monitored */
  parameter: string
  /** CFR citation */
  cfr: string
  /** Associated subparts that require this PS */
  applicableSubparts: string[]
  /** Key calibration drift limits */
  calibrationDrift?: string
  /** Key performance criteria */
  performanceCriteria: string[]
  /** Equations/calculations required */
  equations?: string[]
  /** Related test methods */
  relatedTestMethods: string[]
}

// ============================================================================
// PERFORMANCE SPECIFICATIONS (40 CFR Part 60, Appendix B)
// ============================================================================

/**
 * Performance Specifications for CEMS/COMS (40 CFR Part 60, Appendix B)
 * Complete list: PS-1 through PS-19
 * These define the installation, calibration, and performance criteria
 */
export const PERFORMANCE_SPECIFICATIONS: PerformanceSpecification[] = [
  {
    id: 'PS-1',
    title: 'Performance Specification 1 - Continuous Opacity Monitoring Systems (COMS)',
    parameter: 'Opacity (OP)',
    cfr: '40 CFR Part 60, Appendix B, PS-1',
    applicableSubparts: ['D', 'Da', 'Db', 'Dc', 'GG', 'KKKK', 'Y', 'Z', 'CC'],
    calibrationDrift: '±2% opacity (24-hr)',
    performanceCriteria: [
      'Calibration error ≤3% opacity',
      'Zero drift ≤2% over 24 hours',
      'Calibration drift ≤2% over 24 hours',
      'Response time ≤10 seconds',
    ],
    equations: [
      'Calibration Error = |Known - Indicated| opacity',
      'Zero Drift = |End Zero - Initial Zero| opacity',
      'Span Drift = |End Span - Initial Span| opacity',
    ],
    relatedTestMethods: ['Method 9 (Visual Opacity)'],
  },
  {
    id: 'PS-2',
    title: 'Performance Specification 2 - SO2 and NOx CEMS',
    parameter: 'SO2, NOx',
    cfr: '40 CFR Part 60, Appendix B, PS-2',
    applicableSubparts: ['D', 'Da', 'Db', 'KKKK', 'GG', 'J', 'Ja', 'Kb'],
    calibrationDrift: '±2.5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20% (or 10% for §75)',
      'Calibration error ≤5% of span',
      'Zero drift ≤2.5% of span over 24 hours',
      'Span drift ≤2.5% of span over 24 hours',
    ],
    equations: [
      'Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%',
      'd̄ = mean difference between CEMS and reference',
      'Sd = standard deviation of differences',
      'cc = confidence coefficient (2.262 for n=9)',
    ],
    relatedTestMethods: ['Method 6/6C (SO2)', 'Method 7/7E (NOx)'],
  },
  {
    id: 'PS-3',
    title: 'Performance Specification 3 - O2/CO2 Diluent CEMS',
    parameter: 'O2, CO2 (diluent)',
    cfr: '40 CFR Part 60, Appendix B, PS-3',
    applicableSubparts: ['Da', 'Db', 'KKKK', 'J', 'Ja'],
    calibrationDrift: '±0.5% O2 or CO2 (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Calibration error ≤0.5% O2/CO2',
      'Zero drift ≤0.5% O2/CO2 over 24 hours',
    ],
    equations: ['Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['Method 3A (O2/CO2)'],
  },
  {
    id: 'PS-4',
    title: 'Performance Specification 4 - CO CEMS',
    parameter: 'CO (Carbon Monoxide)',
    cfr: '40 CFR Part 60, Appendix B, PS-4',
    applicableSubparts: ['Cb', 'Cc', 'IIII', 'JJJJ', 'ZZZZ'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤10%',
      'Calibration error ≤5% of span',
      'Zero drift ≤5% of span over 24 hours',
      'Span drift ≤5% of span over 24 hours',
    ],
    equations: ['Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['Method 10 (CO)'],
  },
  {
    id: 'PS-4A',
    title: 'Performance Specification 4A - CO CEMS (Alternative)',
    parameter: 'CO (Carbon Monoxide) - Alternative',
    cfr: '40 CFR Part 60, Appendix B, PS-4A',
    applicableSubparts: ['IIII', 'JJJJ'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤10%',
      'Uses cylinder gas audit (CGA) instead of RA',
      'CGA ≤10% of certified gas value',
    ],
    equations: ['CGA Error = |(Measured - Certified)/Certified| × 100%'],
    relatedTestMethods: ['Method 10 (CO)'],
  },
  {
    id: 'PS-4B',
    title: 'Performance Specification 4B - CO CEMS with O2 Correction',
    parameter: 'CO (Carbon Monoxide) with O2 correction',
    cfr: '40 CFR Part 60, Appendix B, PS-4B',
    applicableSubparts: ['YYYY'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤10%',
      'O2 correction to 15% required',
      'Combined system accuracy test',
    ],
    equations: ['CO_corrected = CO_measured × (20.9 - 15)/(20.9 - O2_measured)'],
    relatedTestMethods: ['Method 10 (CO)', 'Method 3A (O2)'],
  },
  {
    id: 'PS-5',
    title: 'Performance Specification 5 - TRS CEMS',
    parameter: 'TRS (Total Reduced Sulfur)',
    cfr: '40 CFR Part 60, Appendix B, PS-5',
    applicableSubparts: ['BB', 'CC', 'DD'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Calibration error ≤5% of span',
      'H2S interference test required',
    ],
    equations: ['Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['Method 15 (H2S/TRS)', 'Method 16 (TRS)'],
  },
  {
    id: 'PS-6',
    title: 'Performance Specification 6 - Flow Rate CEMS',
    parameter: 'FLOW (Stack Gas Volumetric Flow)',
    cfr: '40 CFR Part 60, Appendix B, PS-6',
    applicableSubparts: ['Da', 'Db', 'J', 'Ja'],
    calibrationDrift: 'N/A (no daily calibration for flow)',
    performanceCriteria: [
      'Relative Accuracy ≤10% (or 7.5% with bias)',
      'RATA at 3 load levels required',
      'Interference-free requirement',
    ],
    equations: ['RA = (|d̄| + |cc|×Sd)/RM × 100%', 'Bias Adjustment Factor = RM/CEM'],
    relatedTestMethods: ['Method 2 (Velocity)', 'Method 2F/2G (3D probes)'],
  },
  {
    id: 'PS-7',
    title: 'Performance Specification 7 - H2S CEMS',
    parameter: 'H2S (Hydrogen Sulfide)',
    cfr: '40 CFR Part 60, Appendix B, PS-7',
    applicableSubparts: ['J', 'Ja', 'GGG', 'GGGa'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Calibration error ≤5% of span',
      'Response time ≤90 seconds',
    ],
    equations: ['Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['Method 11 (H2S)', 'Method 15 (H2S/TRS)'],
  },
  {
    id: 'PS-8',
    title: 'Performance Specification 8 - VOC CEMS',
    parameter: 'VOC (Total Hydrocarbons as methane)',
    cfr: '40 CFR Part 60, Appendix B, PS-8',
    applicableSubparts: ['J', 'JJ', 'VV', 'VVa', 'GGG', 'GGGa', 'NNN', 'RRR'],
    calibrationDrift: '±2.5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Calibration error ≤5% of span',
      'Response time ≤2 minutes',
      'Flame ionization detector (FID) required',
    ],
    equations: ['Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['Method 25A (THC)', 'Method 25 (gaseous organic)'],
  },
  {
    id: 'PS-8A',
    title: 'Performance Specification 8A - VOC CEMS (Alternative)',
    parameter: 'VOC (Total Hydrocarbons) - Alternative',
    cfr: '40 CFR Part 60, Appendix B, PS-8A',
    applicableSubparts: ['VV', 'VVa', 'GGG', 'GGGa'],
    calibrationDrift: '±2.5% of span (24-hr)',
    performanceCriteria: [
      'Uses manufacturer certification in lieu of field RA test',
      'Calibration error ≤5% of span',
      'Quarterly audit required',
    ],
    equations: ['Audit Error = |(Measured - Certified)/Certified| × 100%'],
    relatedTestMethods: ['Method 25A (THC)'],
  },
  {
    id: 'PS-9',
    title: 'Performance Specification 9 - Volumetric Flow (GHG)',
    parameter: 'FLOW (Stack Gas Volumetric Flow for GHG)',
    cfr: '40 CFR Part 60, Appendix B, PS-9',
    applicableSubparts: ['TTTT', 'UUUU'],
    calibrationDrift: 'N/A',
    performanceCriteria: [
      'Relative Accuracy ≤10%',
      'Uses tracer dilution method',
      'Annual RA test required',
    ],
    equations: ['RA = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['Method 2G (tracer dilution)'],
  },
  {
    id: 'PS-10',
    title: 'Performance Specification 10 - H2O CEMS (Moisture)',
    parameter: 'H2O (Moisture)',
    cfr: '40 CFR Part 60, Appendix B, PS-10',
    applicableSubparts: ['Da', 'J', 'Ja'],
    calibrationDrift: '±1.5% H2O (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤10%',
      'Calibration error ≤1.5% H2O',
      'Response time ≤5 minutes',
    ],
    equations: ['Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['Method 4 (Moisture)'],
  },
  {
    id: 'PS-11',
    title: 'Performance Specification 11 - PM CEMS',
    parameter: 'PM (Particulate Matter)',
    cfr: '40 CFR Part 60, Appendix B, PS-11',
    applicableSubparts: ['Da', 'Db', 'Dc', 'Y', 'Z', 'AA', 'AAa'],
    calibrationDrift: 'Based on correlation with reference method',
    performanceCriteria: [
      'Correlation coefficient r ≥0.85',
      'Confidence interval ≤10%',
      'Tolerance interval ≤25%',
      'Correlation range test required',
    ],
    equations: [
      'Correlation: PM_CEMS = a + b × PM_Reference',
      'CI = t × SEE × √(1 + 1/n + (x-x̄)²/Σ(xi-x̄)²)',
    ],
    relatedTestMethods: ['Method 5 (PM)', 'Method 17 (In-stack PM)', 'Method 5I (low-level PM)'],
  },
  {
    id: 'PS-12A',
    title: 'Performance Specification 12A - Hg CEMS (Gaseous)',
    parameter: 'Hg (Mercury - Total Gaseous)',
    cfr: '40 CFR Part 60, Appendix B, PS-12A',
    applicableSubparts: ['UUUUU', 'Da'],
    calibrationDrift: '±5% of span or 1 µg/scm (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20% (or 10% for MATS)',
      'System Integrity: ≤5%',
      '7-day calibration drift test required',
      'Interference test required',
    ],
    equations: [
      'System Integrity Error = |(Csystem - Creference)/Creference| × 100%',
      'RA = (|d̄| + |cc|×Sd)/RM × 100%',
    ],
    relatedTestMethods: ['Method 30B (Sorbent Trap Hg)', 'Method 29 (Hg)'],
  },
  {
    id: 'PS-12B',
    title: 'Performance Specification 12B - Hg Sorbent Trap Monitoring',
    parameter: 'Hg (Mercury - Sorbent Trap)',
    cfr: '40 CFR Part 60, Appendix B, PS-12B',
    applicableSubparts: ['UUUUU'],
    calibrationDrift: 'N/A (sorbent trap, not CEMS)',
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Paired trap agreement ≤10%',
      'Field recovery test 85-115%',
      'Breakthrough ≤10% of section 1',
    ],
    equations: [
      'Paired Trap Agreement = |Trap1 - Trap2|/Average × 100%',
      'Field Recovery = (Mass recovered/Mass spiked) × 100%',
    ],
    relatedTestMethods: ['Method 30B (Sorbent Trap Hg)'],
  },
  {
    id: 'PS-13',
    title: 'Performance Specification 13 - Hg/HCl Dilution Probe',
    parameter: 'Hg, HCl (Dilution Probe Systems)',
    cfr: '40 CFR Part 60, Appendix B, PS-13',
    applicableSubparts: ['UUUUU'],
    calibrationDrift: 'Per PS-12A (Hg) or PS-15/18 (HCl)',
    performanceCriteria: [
      'Dilution ratio verification ≤5%',
      'System response time ≤15 minutes',
      'Memory effects test required',
    ],
    equations: ['Dilution Ratio = Probe flow / Sample flow'],
    relatedTestMethods: ['Method 30B (Hg)', 'Method 26A (HCl)'],
  },
  {
    id: 'PS-14',
    title: 'Performance Specification 14 - Total Facility Electric Output',
    parameter: 'MW (Electric Output)',
    cfr: '40 CFR Part 60, Appendix B, PS-14',
    applicableSubparts: ['TTTT', 'UUUU'],
    calibrationDrift: 'N/A',
    performanceCriteria: [
      'Accuracy ≤2% of reading',
      'Calibration every 5 years',
      'Totalized output required',
    ],
    equations: ['Heat Rate = Heat Input (Btu) / Net Electric Output (kWh)'],
    relatedTestMethods: ['Utility metering standards'],
  },
  {
    id: 'PS-15',
    title: 'Performance Specification 15 - HCl CEMS (Extractive)',
    parameter: 'HCl (Hydrogen Chloride - Extractive)',
    cfr: '40 CFR Part 60, Appendix B, PS-15',
    applicableSubparts: ['UUUUU', 'EEE'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Calibration error ≤5% of span',
      'Interference test required',
      'Sample conditioning required',
    ],
    equations: ['Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['Method 26A (HCl/HF)', 'Method 26 (HCl)'],
  },
  {
    id: 'PS-16',
    title: 'Performance Specification 16 - Non-Dispersive Ultraviolet CEMS',
    parameter: 'SO2, NO2 (NDUV-based)',
    cfr: '40 CFR Part 60, Appendix B, PS-16',
    applicableSubparts: ['Da', 'Db', 'KKKK'],
    calibrationDrift: '±2.5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤15%',
      'Interference test required',
      'Temperature sensitivity test',
    ],
    equations: ['RA = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['Method 6C (SO2)', 'Method 7E (NOx)'],
  },
  {
    id: 'PS-17',
    title: 'Performance Specification 17 - Hydrogen (H2) CEMS',
    parameter: 'H2 (Hydrogen)',
    cfr: '40 CFR Part 60, Appendix B, PS-17',
    applicableSubparts: ['Ja'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Calibration error ≤5% of span',
      'Thermal conductivity detector (TCD) typical',
    ],
    equations: ['Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['GC-based methods'],
  },
  {
    id: 'PS-18',
    title: 'Performance Specification 18 - HCl CEMS (IP-CEMS)',
    parameter: 'HCl (Hydrogen Chloride - In-situ Path)',
    cfr: '40 CFR Part 60, Appendix B, PS-18',
    applicableSubparts: ['UUUUU', 'HH', 'EEE'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Beam intensity verification',
      'Interference test: ≤2.5% of span',
      'Temperature verification ±10°F',
      'Path length verification',
    ],
    equations: ['RA = (|d̄| + |cc|×Sd)/RM × 100%', 'Beam Intensity = I/I₀ × 100%'],
    relatedTestMethods: ['Method 26A (HCl/HF)', 'Method 321 (HCl FTIR)'],
  },
  {
    id: 'PS-19',
    title: 'Performance Specification 19 - HF CEMS',
    parameter: 'HF (Hydrogen Fluoride)',
    cfr: '40 CFR Part 60, Appendix B, PS-19',
    applicableSubparts: ['UUUUU'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Calibration error ≤5% of span',
      'Interference test required',
      'May use FTIR or laser-based',
    ],
    equations: ['Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%'],
    relatedTestMethods: ['Method 26A (HCl/HF)'],
  },
]

/**
 * Get Performance Specifications applicable to a set of NSPS subparts
 */
export function getApplicablePerformanceSpecs(subparts: string[]): PerformanceSpecification[] {
  return PERFORMANCE_SPECIFICATIONS.filter((ps) =>
    ps.applicableSubparts.some((s) => subparts.includes(s))
  )
}

// ============================================================================
// NSPS APPLICABILITY RULES
// ============================================================================

/** NSPS Subpart effective dates and thresholds */
const NSPS_RULES = {
  // Subpart D - Original steam generators (pre-1978)
  D: {
    effectiveDate: new Date('1971-08-17'),
    supersededDate: new Date('1978-09-18'),
    minCapacityMMBtu: 250,
    equipmentTypes: ['steam-generator', 'boiler'],
    fuels: ['C', 'COAL', 'OIL', 'RO', 'DSL'], // Fossil fuels (not gas-only)
    title: 'Fossil-Fuel-Fired Steam Generators (>250 MMBtu/hr)',
    requiresOpacity: true,
  },
  // Subpart Da - Electric utility steam generators (post-1978)
  Da: {
    effectiveDate: new Date('1978-09-18'),
    minCapacityMMBtu: 250, // 73 MW ≈ 250 MMBtu/hr
    minCapacityMW: 73,
    equipmentTypes: ['steam-generator', 'boiler'],
    fuels: ['C', 'COAL', 'OIL', 'RO', 'DSL', 'PNG', 'NNG'], // All fossil fuels
    requiresElectricUtility: true,
    title: 'Electric Utility Steam Generating Units (>73 MW)',
    requiresOpacity: true, // For coal/oil, not gas
    opacityExemptFuels: ['PNG', 'NNG', 'LPG'],
  },
  // Subpart Db - Industrial boilers (post-1984)
  Db: {
    effectiveDate: new Date('1984-06-19'),
    minCapacityMMBtu: 100,
    maxCapacityMMBtu: undefined, // No upper limit, but Da takes priority for EGUs
    equipmentTypes: ['steam-generator', 'boiler'],
    fuels: ['C', 'COAL', 'OIL', 'RO', 'DSL', 'PNG', 'NNG', 'WOOD'],
    requiresElectricUtility: false,
    title: 'Industrial-Commercial-Institutional Steam Generating Units (>100 MMBtu/hr)',
    requiresOpacity: true,
    opacityExemptFuels: ['PNG', 'NNG', 'LPG'],
  },
  // Subpart Dc - Small industrial boilers (post-1989)
  Dc: {
    effectiveDate: new Date('1989-06-09'),
    minCapacityMMBtu: 10,
    maxCapacityMMBtu: 100,
    equipmentTypes: ['steam-generator', 'boiler'],
    fuels: ['C', 'COAL', 'OIL', 'RO', 'DSL'],
    requiresElectricUtility: false,
    title: 'Small Industrial-Commercial-Institutional Steam Generating Units (10-100 MMBtu/hr)',
    requiresOpacity: true,
    opacityExemptFuels: ['PNG', 'NNG', 'LPG'],
  },
  // Subpart GG - Gas turbines (pre-2005)
  GG: {
    effectiveDate: new Date('1977-10-03'),
    supersededDate: new Date('2005-02-18'),
    minCapacityMMBtu: 10, // ~2.9 MW
    equipmentTypes: ['gas-turbine', 'combustion-turbine'],
    fuels: ['PNG', 'NNG', 'OIL', 'DSL', 'LPG'],
    title: 'Stationary Gas Turbines',
    requiresOpacity: false, // Gas turbines exempt
  },
  // Subpart KKKK - Combustion turbines (post-2005)
  KKKK: {
    effectiveDate: new Date('2005-02-18'),
    minCapacityMMBtu: 10,
    equipmentTypes: ['gas-turbine', 'combustion-turbine'],
    fuels: ['PNG', 'NNG', 'OIL', 'DSL', 'LPG'],
    title: 'Stationary Combustion Turbines',
    requiresOpacity: false,
  },
} as const

/** Fuel type mappings for normalization - Complete ECMPS fuel codes from Team DAHS */
const FUEL_CATEGORIES = {
  // Coal: C, COL, ANT, BIT, LIG, SUB, WC, PC, RC (waste coal, petroleum coke, refined coal)
  coal: ['C', 'COL', 'COAL', 'ANT', 'BIT', 'LIG', 'SUB', 'WC', 'PC', 'RC', 'SC'],
  // Oil: OIL, RFO, DFO, DSL, JET, KER, NFS (natural fuel solvent), OGS (off-gas)
  oil: ['OIL', 'RO', 'RFO', 'DFO', 'DSL', 'JET', 'KER', 'NFS', 'OGS'],
  // Gas: PNG, NAT, NG, NGA, LPG, PRG (propane), BFG (blast furnace), COG (coke oven), OG, PG
  gas: ['PNG', 'NNG', 'NAT', 'NG', 'NGA', 'LPG', 'PRG', 'BFG', 'COG', 'OG', 'PG', 'NATR'],
  // Wood/Biomass: WOD, WDL (wood liquids), WDS (wood solids), BIO, AB (ag byproduct), OBS (other biomass), TDF (tire-derived)
  wood: ['WOD', 'WOOD', 'WDL', 'WDS', 'BIO', 'AB', 'OBS', 'TDF'],
}

/**
 * Normalize fuel code to a category
 */
function normalizeFuel(fuelCode: string): 'coal' | 'oil' | 'gas' | 'wood' | 'other' {
  const code = fuelCode.toUpperCase()
  for (const [category, codes] of Object.entries(FUEL_CATEGORIES)) {
    if (codes.includes(code)) {
      return category as 'coal' | 'oil' | 'gas' | 'wood'
    }
  }
  return 'other'
}

/**
 * Determine applicable NSPS subparts based on facility characteristics
 *
 * This is the core applicability engine that determines which Part 60 subparts
 * apply based on equipment type, fuel, capacity, and construction date.
 */
export function determineApplicableNSPS(input: NSPSApplicabilityInput): NSPSApplicabilityResult {
  const applicableSubparts: string[] = []
  const subpartDetails: NSPSApplicabilityResult['subpartDetails'] = []
  const warnings: string[] = []

  const fuelCategory = normalizeFuel(input.fuelType)
  const constructionDate = input.constructionDate ?? input.commercialOpDate
  const capacityMMBtu =
    input.capacityMMBtu ?? (input.capacityMW !== undefined ? input.capacityMW * 3.412 : 0)
  const isEGU = input.isElectricUtility ?? false

  // Check each NSPS rule
  // Steam Generators / Boilers
  if (['steam-generator', 'boiler'].includes(input.equipmentType)) {
    // Check Subpart D (1971-1978)
    if (
      constructionDate !== undefined &&
      constructionDate >= NSPS_RULES.D.effectiveDate &&
      constructionDate < NSPS_RULES.D.supersededDate &&
      capacityMMBtu >= NSPS_RULES.D.minCapacityMMBtu &&
      fuelCategory !== 'gas'
    ) {
      applicableSubparts.push('D')
      subpartDetails.push({
        subpart: 'D',
        reason: `Fossil-fuel-fired steam generator >250 MMBtu/hr constructed between 8/17/71 and 9/18/78`,
        effectiveDate: '1971-08-17',
        confidence: 'high',
      })
    }

    // Check Subpart Da (post-1978, EGU)
    if (
      constructionDate !== undefined &&
      constructionDate >= NSPS_RULES.Da.effectiveDate &&
      (capacityMMBtu >= NSPS_RULES.Da.minCapacityMMBtu ||
        (input.capacityMW ?? 0) >= NSPS_RULES.Da.minCapacityMW) &&
      isEGU
    ) {
      applicableSubparts.push('Da')
      subpartDetails.push({
        subpart: 'Da',
        reason: `Electric utility steam generating unit >73 MW constructed after 9/18/78`,
        effectiveDate: '1978-09-18',
        confidence: 'high',
      })
    }

    // Check Subpart Db (post-1984, industrial, >100 MMBtu)
    if (
      constructionDate !== undefined &&
      constructionDate >= NSPS_RULES.Db.effectiveDate &&
      capacityMMBtu >= NSPS_RULES.Db.minCapacityMMBtu &&
      !isEGU
    ) {
      applicableSubparts.push('Db')
      subpartDetails.push({
        subpart: 'Db',
        reason: `Industrial/commercial steam generating unit >100 MMBtu/hr constructed after 6/19/84`,
        effectiveDate: '1984-06-19',
        confidence: 'high',
      })
    }

    // Check Subpart Dc (post-1989, industrial, 10-100 MMBtu)
    if (
      constructionDate !== undefined &&
      constructionDate >= NSPS_RULES.Dc.effectiveDate &&
      capacityMMBtu >= NSPS_RULES.Dc.minCapacityMMBtu &&
      capacityMMBtu < (NSPS_RULES.Dc.maxCapacityMMBtu ?? Infinity) &&
      !isEGU &&
      fuelCategory !== 'gas'
    ) {
      applicableSubparts.push('Dc')
      subpartDetails.push({
        subpart: 'Dc',
        reason: `Small industrial steam generating unit 10-100 MMBtu/hr constructed after 6/9/89`,
        effectiveDate: '1989-06-09',
        confidence: 'high',
      })
    }
  }

  // Gas Turbines
  if (['gas-turbine', 'combustion-turbine'].includes(input.equipmentType)) {
    // Check Subpart GG (1977-2005)
    if (
      constructionDate !== undefined &&
      constructionDate >= NSPS_RULES.GG.effectiveDate &&
      constructionDate < NSPS_RULES.GG.supersededDate &&
      capacityMMBtu >= NSPS_RULES.GG.minCapacityMMBtu
    ) {
      applicableSubparts.push('GG')
      subpartDetails.push({
        subpart: 'GG',
        reason: `Stationary gas turbine constructed between 10/3/77 and 2/18/05`,
        effectiveDate: '1977-10-03',
        confidence: 'high',
      })
    }

    // Check Subpart KKKK (post-2005)
    if (
      (constructionDate !== undefined && constructionDate >= NSPS_RULES.KKKK.effectiveDate) ||
      (input.modificationDate !== undefined &&
        input.modificationDate >= NSPS_RULES.KKKK.effectiveDate)
    ) {
      applicableSubparts.push('KKKK')
      subpartDetails.push({
        subpart: 'KKKK',
        reason:
          input.modificationDate !== undefined &&
          input.modificationDate >= NSPS_RULES.KKKK.effectiveDate
            ? `Gas turbine modified after 2/18/05`
            : `Combustion turbine constructed after 2/18/05`,
        effectiveDate: '2005-02-18',
        confidence: 'high',
      })
    }
  }

  // Determine opacity requirements
  let requiresOpacity = false
  let opacityBasis: string | undefined

  if (applicableSubparts.includes('Da') && fuelCategory !== 'gas') {
    requiresOpacity = true
    opacityBasis = '40 CFR 60.42Da - Opacity standard for coal/oil-fired utility units'
  } else if (applicableSubparts.includes('Db') && fuelCategory !== 'gas') {
    requiresOpacity = true
    opacityBasis = '40 CFR 60.43Db - Opacity standard for coal/oil-fired industrial units'
  } else if (applicableSubparts.includes('Dc') && fuelCategory !== 'gas') {
    requiresOpacity = true
    opacityBasis = '40 CFR 60.43Dc - Opacity standard for small industrial units'
  } else if (applicableSubparts.includes('D') && fuelCategory !== 'gas') {
    requiresOpacity = true
    opacityBasis = '40 CFR 60.42 - Opacity standard for fossil-fuel-fired steam generators'
  }

  // Part 75 coordination notes
  let part75Notes: string | undefined
  if (applicableSubparts.some((s) => ['Da', 'D', 'Db'].includes(s))) {
    part75Notes =
      'Part 75 CEMS monitoring satisfies NSPS CEMS requirements for SO2, NOx, and opacity. ' +
      'Use Part 75 data for NSPS compliance demonstrations per 40 CFR 60.49Da(c).'
  }

  // Warnings for missing data
  if (constructionDate === undefined) {
    warnings.push('Construction date not provided - applicability determination may be incomplete')
  }
  if (capacityMMBtu === 0) {
    warnings.push('Heat input capacity not provided - size thresholds cannot be verified')
  }

  const result: NSPSApplicabilityResult = {
    applicableSubparts,
    subpartDetails,
    requiresOpacity,
    warnings,
  }

  if (opacityBasis !== undefined) {
    result.opacityBasis = opacityBasis
  }
  if (part75Notes !== undefined) {
    result.part75Notes = part75Notes
  }

  return result
}

/**
 * Get the correct CFR citation for opacity monitoring based on applicable NSPS subpart.
 *
 * IMPORTANT: Part 75 does NOT govern opacity. Part 75.10 is for NOx monitoring.
 * Opacity is regulated under Part 60 NSPS subparts.
 *
 * @param applicableSubparts - List of applicable NSPS subparts (from determineApplicableNSPS)
 * @param fuelCategory - Fuel category ('coal', 'oil', 'gas', 'wood', 'other')
 * @param equipmentType - Equipment type for gas turbines
 * @returns Object with citation and limit, or undefined if opacity not required
 */
export function getOpacityCFRCitation(
  applicableSubparts: string[],
  fuelCategory: 'coal' | 'oil' | 'gas' | 'wood' | 'other',
  equipmentType?: string
): { citation: string; limit: string; performanceSpec: string } | undefined {
  // Gas-fired units are exempt from opacity requirements
  if (fuelCategory === 'gas') {
    return undefined
  }

  // Check each subpart for opacity requirements
  if (applicableSubparts.includes('Da')) {
    return {
      citation: '40 CFR 60.42Da',
      limit: '20% opacity (6-minute average)',
      performanceSpec: 'PS-1 (COMS installation and performance)',
    }
  }
  if (applicableSubparts.includes('Db')) {
    return {
      citation: '40 CFR 60.43b',
      limit: '20% opacity (6-minute average)',
      performanceSpec: 'PS-1 (COMS installation and performance)',
    }
  }
  if (applicableSubparts.includes('Dc')) {
    return {
      citation: '40 CFR 60.43c',
      limit: '20% opacity (6-minute average)',
      performanceSpec: 'PS-1 (COMS installation and performance)',
    }
  }
  if (applicableSubparts.includes('D')) {
    return {
      citation: '40 CFR 60.42',
      limit: '20% opacity (6-minute average)',
      performanceSpec: 'PS-1 (COMS installation and performance)',
    }
  }
  // Gas turbines with oil firing
  if (
    applicableSubparts.includes('GG') &&
    ['gas-turbine', 'combustion-turbine'].includes(equipmentType ?? '')
  ) {
    return {
      citation: '40 CFR 60.334',
      limit: '5% opacity (oil-fired)',
      performanceSpec: 'PS-1 (COMS installation and performance)',
    }
  }
  if (
    applicableSubparts.includes('KKKK') &&
    ['gas-turbine', 'combustion-turbine'].includes(equipmentType ?? '')
  ) {
    return {
      citation: '40 CFR 60.4320',
      limit: '5% opacity (oil-fired)',
      performanceSpec: 'PS-1 (COMS installation and performance)',
    }
  }

  return undefined
}

// ============================================================================
// PRIORITY 1: UTILITY BOILERS (Da, TTTT)
// ============================================================================

export const SUBPART_Da: Part60SubpartKnowledge = {
  subpart: 'Da',
  title: 'Standards of Performance for Electric Utility Steam Generating Units',
  cfrSections: '60.40Da - 60.52Da',
  equipmentTypes: ['steam-generator', 'boiler'],
  industries: ['electric-utility'],

  applicability: {
    description:
      'Electric utility steam generating units capable of combusting more than 250 million Btu/hr heat input of fossil fuel',
    sizeThreshold: '>250 MMBtu/hr heat input capacity',
    constructionDate: 'Construction commenced after September 18, 1978',
    exemptions: [
      'Units combusting only natural gas',
      'Integrated gasification combined cycle units meeting specific criteria',
    ],
  },

  standards: [
    {
      parameter: 'SO2',
      limit: '1.2',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['Applies to coal-fired units'],
    },
    {
      parameter: 'SO2',
      limit: '90% reduction',
      units: 'percent',
      averagingPeriod: '30-day rolling average',
      conditions: ['Alternative standard for low-sulfur fuel'],
    },
    {
      parameter: 'NOX',
      limit: '0.50',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['Coal-fired units constructed after 7/9/97'],
    },
    {
      parameter: 'NOX',
      limit: '0.40',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['Oil-fired units'],
    },
    {
      parameter: 'NOX',
      limit: '0.20',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['Natural gas-fired units'],
    },
    {
      parameter: 'PM',
      limit: '0.03',
      units: 'lb/MMBtu',
      averagingPeriod: '3-hour average',
      conditions: ['Filterable PM only'],
    },
  ],

  monitoring: [
    {
      parameter: 'SO2',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '125% of maximum expected concentration',
        calibrationDrift: '±2.5% of span',
        relativeAccuracy: '±20% or 10 ppm',
      },
      dataRecovery: '≥95% per quarter',
      substituteData: 'Part 75 procedures',
    },
    {
      parameter: 'NOX',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '125% of maximum expected concentration',
        calibrationDrift: '±2.5% of span',
        relativeAccuracy: '±20% or 10 ppm',
      },
      dataRecovery: '≥95% per quarter',
    },
    {
      parameter: 'O2',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '25%',
        calibrationDrift: '±0.5% O2',
      },
    },
    {
      parameter: 'Opacity',
      method: 'COMS',
      frequency: 'Continuous',
      specifications: {
        span: '100%',
        calibrationDrift: '±2%',
      },
    },
  ],

  testMethods: [
    {
      parameter: 'SO2',
      methods: ['Method 6', 'Method 6C'],
      frequency: 'Annual RATA',
    },
    {
      parameter: 'NOX',
      methods: ['Method 7', 'Method 7E'],
      frequency: 'Annual RATA',
    },
    {
      parameter: 'PM',
      methods: ['Method 5', 'Method 5B'],
      frequency: 'Annual or per permit',
    },
    {
      parameter: 'Opacity',
      methods: ['Method 9'],
      frequency: 'As required',
    },
  ],

  reporting: [
    {
      reportType: 'Excess Emissions Report',
      frequency: 'Semiannual',
      submitTo: 'Both',
      contents: [
        'Exceedances of emission standards',
        'Monitor downtime',
        'Deviations from monitoring requirements',
      ],
    },
    {
      reportType: 'Performance Test Report',
      frequency: 'Within 60 days of test',
      submitTo: 'Both',
      contents: ['Test results', 'Test conditions', 'Supporting data'],
    },
  ],

  recordkeeping: {
    records: [
      'CEMS data (1-minute, hourly, daily averages)',
      'Calibration records',
      'RATA and other QA test results',
      'Excess emissions data',
      'Fuel analysis records',
    ],
    retentionPeriod: '2 years minimum',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 75',
      relationship: 'coordinates',
      notes: 'Part 75 monitoring satisfies most Da CEMS requirements',
    },
    {
      regulation: '40 CFR Part 63 Subpart UUUUU (MATS)',
      relationship: 'supplements',
      notes: 'MATS adds HAP requirements on top of NSPS',
    },
    {
      regulation: '40 CFR Part 60 Subpart TTTT',
      relationship: 'supplements',
      notes: 'TTTT adds GHG (CO2) requirements',
    },
  ],

  requiresCEMS: true,
  cemsParameters: ['SO2', 'NOX', 'O2', 'Opacity'],

  keyCitations: {
    applicability: '40 CFR 60.40Da',
    standards: '40 CFR 60.42Da - 60.44Da',
    monitoring: '40 CFR 60.48Da',
    testMethods: '40 CFR 60.50Da',
    reporting: '40 CFR 60.51Da',
  },
}

export const SUBPART_TTTT: Part60SubpartKnowledge = {
  subpart: 'TTTT',
  title: 'Standards of Performance for Greenhouse Gas Emissions for Electric Generating Units',
  cfrSections: '60.5508 - 60.5580',
  equipmentTypes: ['steam-generator', 'boiler'],
  industries: ['electric-utility'],

  applicability: {
    description: 'Fossil fuel-fired steam generating units and IGCC units',
    sizeThreshold: '>250 MMBtu/hr heat input or >25 MW net output',
    constructionDate: 'Construction commenced after January 8, 2014',
    exemptions: [
      'Units that qualify as modified or reconstructed',
      'Units meeting limited operation criteria',
    ],
  },

  standards: [
    {
      parameter: 'CO2',
      limit: '1,400',
      units: 'lb/MWh-gross',
      averagingPeriod: '12-operating-month rolling average',
      conditions: ['New coal-fired units - Phase 1 (until 2030)'],
    },
    {
      parameter: 'CO2',
      limit: '1,000',
      units: 'lb/MWh-gross',
      averagingPeriod: '12-operating-month rolling average',
      conditions: ['New coal-fired units - Phase 2 (2030+)'],
    },
    {
      parameter: 'CO2',
      limit: '1,000',
      units: 'lb/MWh-gross',
      averagingPeriod: '12-operating-month rolling average',
      conditions: ['New base load natural gas units'],
    },
    {
      parameter: 'CO2',
      limit: '120',
      units: 'lb/MMBtu',
      averagingPeriod: '12-operating-month rolling average',
      conditions: ['Alternative heat input basis'],
    },
  ],

  monitoring: [
    {
      parameter: 'CO2',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '125% of maximum expected concentration',
        relativeAccuracy: '±10% or 1.5% CO2',
      },
      dataRecovery: '≥90% per calendar quarter',
      substituteData: 'Part 75 Appendix D or E procedures',
    },
    {
      parameter: 'Gross Output',
      method: 'continuous-monitoring',
      frequency: 'Hourly',
    },
  ],

  testMethods: [
    {
      parameter: 'CO2',
      methods: ['Method 3A', 'Part 75 Appendix F'],
      frequency: 'Initial and annual RATA',
    },
  ],

  reporting: [
    {
      reportType: 'Compliance Report',
      frequency: 'Annual',
      submitTo: 'EPA',
      contents: [
        '12-month rolling average CO2 emission rate',
        'Gross output data',
        'Any deviations from standards',
      ],
    },
  ],

  recordkeeping: {
    records: [
      'Hourly CO2 mass emissions',
      'Hourly gross output',
      'Rolling 12-month average calculations',
      'QA test records',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 75',
      relationship: 'coordinates',
      notes: 'Part 75 CO2 monitoring satisfies TTTT requirements',
    },
    {
      regulation: '40 CFR Part 60 Subpart Da',
      relationship: 'supplements',
      notes: 'TTTT adds CO2 on top of Da criteria pollutant standards',
    },
    {
      regulation: '40 CFR Part 98',
      relationship: 'coordinates',
      notes: 'GHG reporting rule - may use same data',
    },
  ],

  requiresCEMS: true,
  cemsParameters: ['CO2'],

  keyCitations: {
    applicability: '40 CFR 60.5509',
    standards: '40 CFR 60.5520',
    monitoring: '40 CFR 60.5535',
    testMethods: '40 CFR 60.5540',
    reporting: '40 CFR 60.5555',
  },
}

// ============================================================================
// PRIORITY 2: GAS TURBINES (GG, KKKK, UUUU)
// ============================================================================

export const SUBPART_GG: Part60SubpartKnowledge = {
  subpart: 'GG',
  title: 'Standards of Performance for Stationary Gas Turbines',
  cfrSections: '60.330 - 60.335',
  equipmentTypes: ['gas-turbine'],
  industries: ['electric-utility', 'industrial', 'oil-gas-midstream'],

  applicability: {
    description: 'Stationary gas turbines with heat input at peak load ≥10 MMBtu/hr',
    sizeThreshold: '≥10 MMBtu/hr heat input at peak load',
    constructionDate: 'Construction commenced after October 3, 1977',
    exemptions: [
      'Emergency standby turbines used <500 hours/year',
      'Turbines used for firefighting or flood control',
    ],
  },

  standards: [
    {
      parameter: 'NOX',
      limit: '150',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: 'Stack test average',
      conditions: ['Natural gas fuel'],
    },
    {
      parameter: 'NOX',
      limit: '75',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: 'Stack test average',
      conditions: ['Natural gas, electric utility >30 MW'],
    },
    {
      parameter: 'SO2',
      limit: '150',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: 'Stack test average',
    },
    {
      parameter: 'SO2',
      limit: '0.015% sulfur by weight',
      units: 'fuel sulfur content',
      averagingPeriod: 'Per fuel delivery',
      conditions: ['Alternative fuel monitoring'],
    },
  ],

  monitoring: [
    {
      parameter: 'NOX',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '125% of maximum expected concentration',
        calibrationDrift: '±2.5% of span',
        relativeAccuracy: '±20% or 10 ppm',
      },
      dataRecovery: '≥90%',
    },
    {
      parameter: 'Fuel Sulfur',
      method: 'fuel-analysis',
      frequency: 'Per delivery or monthly composite',
    },
    {
      parameter: 'Operating Hours',
      method: 'continuous-monitoring',
      frequency: 'Continuous',
    },
  ],

  testMethods: [
    {
      parameter: 'NOX',
      methods: ['Method 7E', 'Method 20'],
      frequency: 'Initial and annual',
    },
    {
      parameter: 'SO2',
      methods: ['Method 6', 'Method 6C'],
      frequency: 'Initial, then as required',
    },
    {
      parameter: 'Fuel Sulfur',
      methods: ['ASTM D1266', 'ASTM D4294', 'ASTM D5453'],
      frequency: 'Per delivery',
    },
  ],

  reporting: [
    {
      reportType: 'Excess Emissions Report',
      frequency: 'Semiannual',
      submitTo: 'Both',
      contents: ['Exceedances', 'Monitor downtime', 'Fuel sulfur data'],
    },
  ],

  recordkeeping: {
    records: [
      'Fuel sulfur content records',
      'Operating hours',
      'CEMS data if installed',
      'Stack test results',
    ],
    retentionPeriod: '2 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart KKKK',
      relationship: 'replaces',
      notes: 'KKKK applies to newer turbines (after 2/18/2005)',
    },
    {
      regulation: '40 CFR Part 75',
      relationship: 'coordinates',
      notes: 'Part 75 may apply to utility turbines',
    },
  ],

  requiresCEMS: false, // Optional based on compliance approach
  cemsParameters: ['NOX'], // If CEMS elected

  keyCitations: {
    applicability: '40 CFR 60.330',
    standards: '40 CFR 60.332',
    monitoring: '40 CFR 60.334',
    testMethods: '40 CFR 60.335',
    reporting: '40 CFR 60.334(c)',
  },
}

export const SUBPART_KKKK: Part60SubpartKnowledge = {
  subpart: 'KKKK',
  title: 'Standards of Performance for Stationary Combustion Turbines',
  cfrSections: '60.4300 - 60.4420',
  equipmentTypes: ['combustion-turbine', 'gas-turbine'],
  industries: ['electric-utility', 'industrial', 'oil-gas-midstream'],

  applicability: {
    description:
      'Stationary combustion turbines with heat input at peak load ≥10 MMBtu/hr, based on higher heating value',
    sizeThreshold: '≥10 MMBtu/hr heat input at peak load (HHV)',
    constructionDate: 'Construction commenced after February 18, 2005',
    exemptions: [
      'Emergency combustion turbines',
      'Combustion turbines at major sources under Part 63 Subpart YYYY',
      'Turbines firing landfill gas or digester gas',
    ],
  },

  standards: [
    {
      parameter: 'NOX',
      limit: '25',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      conditions: ['New turbines ≥30 MW, natural gas'],
    },
    {
      parameter: 'NOX',
      limit: '42',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      conditions: ['New turbines ≥30 MW, oil'],
    },
    {
      parameter: 'NOX',
      limit: '150',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      conditions: ['New turbines <30 MW'],
    },
    {
      parameter: 'SO2',
      limit: '0.060',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['If using fuel with sulfur >0.05% by weight'],
    },
  ],

  monitoring: [
    {
      parameter: 'NOX',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '125% of maximum expected concentration',
        calibrationDrift: '±2.5% of span',
        relativeAccuracy: '±10% or 3 ppm',
      },
      dataRecovery: '≥90%',
    },
    {
      parameter: 'O2',
      method: 'CEMS',
      frequency: 'Continuous',
    },
    {
      parameter: 'Fuel Sulfur',
      method: 'fuel-analysis',
      frequency: 'Per delivery or as specified in monitoring plan',
    },
  ],

  testMethods: [
    {
      parameter: 'NOX',
      methods: ['Method 7E', 'Method 20'],
      frequency: 'Initial and annual RATA',
    },
    {
      parameter: 'SO2',
      methods: ['Method 6', 'Method 6C'],
      frequency: 'Initial if applicable',
    },
  ],

  reporting: [
    {
      reportType: 'Excess Emissions Report',
      frequency: 'Semiannual',
      submitTo: 'Both',
      contents: ['Exceedances of NOX standard', 'Monitor downtime', 'Fuel sulfur exceedances'],
    },
    {
      reportType: 'Electronic Reporting',
      frequency: 'Quarterly',
      submitTo: 'EPA',
      contents: ['CEMS data if Part 75 applies'],
      dueDate: '30 days after quarter end',
    },
  ],

  recordkeeping: {
    records: [
      'Hourly NOX emission rates',
      '4-hour rolling averages',
      'Fuel sulfur records',
      'Operating hours',
      'Startup/shutdown records',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 75',
      relationship: 'coordinates',
      notes: 'Part 75 monitoring satisfies KKKK CEMS requirements',
    },
    {
      regulation: '40 CFR Part 60 Subpart GG',
      relationship: 'replaces',
      notes: 'KKKK supersedes GG for turbines constructed after 2/18/2005',
    },
    {
      regulation: '40 CFR Part 60 Subpart UUUU',
      relationship: 'supplements',
      notes: 'UUUU adds GHG requirements',
    },
  ],

  requiresCEMS: true,
  cemsParameters: ['NOX', 'O2'],

  keyCitations: {
    applicability: '40 CFR 60.4305',
    standards: '40 CFR 60.4320',
    monitoring: '40 CFR 60.4340',
    testMethods: '40 CFR 60.4400',
    reporting: '40 CFR 60.4375',
  },
}

// ============================================================================
// PRIORITY 4: PETROLEUM REFINERIES (J, Ja)
// ============================================================================

export const SUBPART_J: Part60SubpartKnowledge = {
  subpart: 'J',
  title: 'Standards of Performance for Petroleum Refineries',
  cfrSections: '60.100 - 60.109',
  equipmentTypes: ['fccu', 'claus-unit', 'fuel-gas-combustion'],
  industries: ['petroleum-refining'],

  applicability: {
    description:
      'Fluid catalytic cracking unit catalyst regenerators, fuel gas combustion devices, and Claus sulfur recovery plants',
    constructionDate: 'Construction commenced after June 11, 1973',
    exemptions: ['Claus plants <20 long tons/day sulfur'],
  },

  standards: [
    {
      parameter: 'PM',
      limit: '1.0',
      units: 'kg/Mg coke burn-off',
      averagingPeriod: 'Per performance test',
      conditions: ['FCCU catalyst regenerators'],
    },
    {
      parameter: 'Opacity',
      limit: '30',
      units: 'percent',
      averagingPeriod: '6-minute average',
      conditions: ['FCCU catalyst regenerators'],
    },
    {
      parameter: 'CO',
      limit: '500',
      units: 'ppmv',
      averagingPeriod: '1-hour average',
      conditions: ['FCCU catalyst regenerators (dry basis)'],
    },
    {
      parameter: 'SO2',
      limit: '50',
      units: 'ppmv (dry basis)',
      averagingPeriod: '12-hour average',
      conditions: ['Claus sulfur recovery - oxidation control'],
    },
    {
      parameter: 'SO2 Reduction',
      limit: '90',
      units: 'percent',
      averagingPeriod: 'Per performance test',
      conditions: ['Claus sulfur recovery ≥20 long tons/day'],
    },
    {
      parameter: 'H2S',
      limit: '230',
      units: 'mg/dscm',
      averagingPeriod: '3-hour average',
      conditions: ['Fuel gas combustion devices'],
    },
    {
      parameter: 'H2S',
      limit: '163',
      units: 'ppmv (dry basis)',
      averagingPeriod: '3-hour average',
      conditions: ['Alternative: ppm basis'],
    },
  ],

  monitoring: [
    {
      parameter: 'CO',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '1000 ppm or 1.5× max expected',
        calibrationDrift: '±5% of span',
        relativeAccuracy: '±20% or 50 ppm',
      },
      dataRecovery: '≥75%',
    },
    {
      parameter: 'SO2',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '250 ppm or as appropriate',
        calibrationDrift: '±2.5% of span',
      },
    },
    {
      parameter: 'H2S',
      method: 'continuous-monitoring',
      frequency: 'Continuous',
    },
    {
      parameter: 'O2',
      method: 'CEMS',
      frequency: 'Continuous',
    },
    {
      parameter: 'Opacity',
      method: 'COMS',
      frequency: 'Continuous',
    },
  ],

  testMethods: [
    {
      parameter: 'PM',
      methods: ['Method 5', 'Method 5B', 'Method 5F'],
      frequency: 'Initial and as required',
    },
    {
      parameter: 'CO',
      methods: ['Method 10', 'Method 10A', 'Method 10B'],
      frequency: 'Initial and annual RATA',
    },
    {
      parameter: 'SO2',
      methods: ['Method 6', 'Method 6A', 'Method 6C'],
      frequency: 'Initial and annual RATA',
    },
    {
      parameter: 'H2S',
      methods: ['Method 11', 'Method 15', 'Method 15A', 'Method 16', 'Method 16A'],
      frequency: 'Initial and as required',
    },
    {
      parameter: 'Coke Burn Rate',
      methods: ['Procedure in §60.106'],
      frequency: 'Calculated from air rate and flue gas composition',
    },
  ],

  reporting: [
    {
      reportType: 'Excess Emissions Report',
      frequency: 'Semiannual',
      submitTo: 'Both',
      contents: [
        'All periods of excess emissions',
        'Monitor downtime',
        'Startup/shutdown emissions',
      ],
    },
  ],

  recordkeeping: {
    records: [
      'CEMS data (1-minute, hourly averages)',
      'Coke burn rate calculations',
      'Air flow rate',
      'Stack test results',
      'Calibration records',
    ],
    retentionPeriod: '2 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart Ja',
      relationship: 'supplements',
      notes: 'Ja has updated/additional requirements for newer units',
    },
    {
      regulation: '40 CFR Part 63 Subpart UUU',
      relationship: 'supplements',
      notes: 'Refinery MACT for HAPs',
    },
  ],

  requiresCEMS: true,
  cemsParameters: ['CO', 'SO2', 'O2', 'Opacity'],

  keyCitations: {
    applicability: '40 CFR 60.100',
    standards: '40 CFR 60.102 - 60.104',
    monitoring: '40 CFR 60.105',
    testMethods: '40 CFR 60.106',
    reporting: '40 CFR 60.107',
  },
}

// ============================================================================
// PRIORITY 3: INDUSTRIAL BOILERS (Db, Dc)
// ============================================================================

export const SUBPART_Db: Part60SubpartKnowledge = {
  subpart: 'Db',
  title: 'Standards of Performance for Industrial-Commercial-Institutional Steam Generating Units',
  cfrSections: '60.40b - 60.49b',
  equipmentTypes: ['boiler', 'steam-generator'],
  industries: ['industrial'],

  applicability: {
    description:
      'Steam generating units that have a heat input capacity from fuels combusted of greater than 100 MMBtu/hr',
    sizeThreshold: '>100 MMBtu/hr heat input capacity',
    constructionDate: 'Construction, modification, or reconstruction commenced after June 19, 1984',
    exemptions: [
      'Heat recovery steam generators operated with combustion turbines',
      'Recovery furnaces at kraft pulp mills',
      'Temporary boilers used during construction',
    ],
  },

  standards: [
    {
      parameter: 'SO2',
      limit: '0.50',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['For coal-fired units'],
    },
    {
      parameter: 'SO2',
      limit: '90% reduction',
      units: 'percent reduction',
      averagingPeriod: '30-day rolling average',
      conditions: ['Alternative to emission rate for coal'],
    },
    {
      parameter: 'SO2',
      limit: '0.50',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['For oil-fired units'],
    },
    {
      parameter: 'PM',
      limit: '0.05',
      units: 'lb/MMBtu',
      averagingPeriod: 'Test average',
      conditions: ['Coal and oil-fired units'],
    },
    {
      parameter: 'NOX',
      limit: '0.50',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['For coal-fired spreader stoker or fluidized bed'],
    },
    {
      parameter: 'NOX',
      limit: '0.70',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['For other coal-fired units'],
    },
  ],

  monitoring: [
    {
      parameter: 'SO2',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '125% of maximum expected concentration',
        calibrationDrift: '2.5% of span value',
        relativeAccuracy: '20% or 10% (coal)',
      },
      dataRecovery: '95% per quarter',
    },
    {
      parameter: 'NOX',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '125% of maximum expected concentration',
        calibrationDrift: '2.5% of span value',
        relativeAccuracy: '20%',
      },
      dataRecovery: '95% per quarter',
    },
    {
      parameter: 'Opacity',
      method: 'COMS',
      frequency: 'Continuous',
      dataRecovery: '95% per quarter',
    },
    {
      parameter: 'Fuel sulfur',
      method: 'fuel-analysis',
      frequency: 'Per delivery or monthly composite',
    },
  ],

  testMethods: [
    {
      parameter: 'SO2',
      methods: ['Method 6', 'Method 6C'],
      frequency: 'Initial and as required',
    },
    {
      parameter: 'NOX',
      methods: ['Method 7', 'Method 7E'],
      frequency: 'Initial and as required',
    },
    {
      parameter: 'PM',
      methods: ['Method 5', 'Method 5B'],
      frequency: 'Initial and annual for coal',
    },
    {
      parameter: 'Opacity',
      methods: ['Method 9'],
      frequency: 'As required',
    },
  ],

  reporting: [
    {
      reportType: 'Excess Emissions Report',
      frequency: 'Semiannual',
      submitTo: 'State',
      contents: [
        'Duration of excess emissions',
        'Fuel combusted during excess emissions',
        'Emission averages during excess periods',
        'Monitoring downtime',
      ],
    },
    {
      reportType: 'Fuel Analysis Records',
      frequency: 'Quarterly',
      submitTo: 'State',
      contents: ['Sulfur content by fuel type', 'Heat content determinations'],
    },
  ],

  recordkeeping: {
    records: [
      'CEMS data (hourly and 30-day averages)',
      'Fuel sulfur analysis results',
      'Excess emission duration and magnitude',
      'Monitoring system performance data',
      'Stack test results',
    ],
    retentionPeriod: '2 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 63 Subpart DDDDD',
      relationship: 'supplements',
      notes: 'Boiler MACT for HAPs - may have additional requirements beyond NSPS for some sources',
    },
    {
      regulation: '40 CFR Part 60 Subpart Da',
      relationship: 'coordinates',
      notes:
        'Da applies to larger utility units (>250 MMBtu); Db applies to industrial (100-250 MMBtu)',
    },
    {
      regulation: '40 CFR Part 60 Subpart Dc',
      relationship: 'coordinates',
      notes: 'Dc applies to smaller units (10-100 MMBtu)',
    },
  ],

  requiresCEMS: true,
  cemsParameters: ['SO2', 'NOX', 'Opacity'],

  keyCitations: {
    applicability: '40 CFR 60.40b',
    standards: '40 CFR 60.42b - 60.44b',
    monitoring: '40 CFR 60.45b - 60.47b',
    testMethods: '40 CFR 60.45b',
    reporting: '40 CFR 60.49b',
  },
}

export const SUBPART_Dc: Part60SubpartKnowledge = {
  subpart: 'Dc',
  title:
    'Standards of Performance for Small Industrial-Commercial-Institutional Steam Generating Units',
  cfrSections: '60.40c - 60.48c',
  equipmentTypes: ['boiler', 'steam-generator'],
  industries: ['industrial'],

  applicability: {
    description: 'Steam generating units with heat input capacity between 10 and 100 MMBtu/hr',
    sizeThreshold: '10-100 MMBtu/hr heat input capacity',
    constructionDate: 'Construction, modification, or reconstruction commenced after June 9, 1989',
    exemptions: [
      'Units combusting only gaseous fuel',
      'Temporary boilers used during construction',
      'Hot water heaters',
    ],
  },

  standards: [
    {
      parameter: 'SO2',
      limit: '0.50',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['For coal-fired units'],
    },
    {
      parameter: 'SO2',
      limit: '90% reduction',
      units: 'percent reduction',
      averagingPeriod: '30-day rolling average',
      conditions: ['Alternative for coal (75% if <2% sulfur coal)'],
    },
    {
      parameter: 'SO2',
      limit: '0.50',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['For oil-fired units >30 MMBtu/hr'],
    },
    {
      parameter: 'PM',
      limit: '20% opacity',
      units: 'percent opacity',
      averagingPeriod: '6-minute average',
      conditions: ['Standard opacity limit'],
    },
  ],

  monitoring: [
    {
      parameter: 'SO2',
      method: 'fuel-analysis',
      frequency: 'Per delivery or monthly composite',
    },
    {
      parameter: 'Opacity',
      method: 'COMS',
      frequency: 'Continuous',
      dataRecovery: '90% minimum',
    },
  ],

  testMethods: [
    {
      parameter: 'SO2',
      methods: ['Method 6', 'Method 6C'],
      frequency: 'Initial if required by Administrator',
    },
    {
      parameter: 'PM',
      methods: ['Method 5'],
      frequency: 'As required by Administrator',
    },
    {
      parameter: 'Opacity',
      methods: ['Method 9'],
      frequency: 'As required',
    },
  ],

  reporting: [
    {
      reportType: 'Fuel Analysis Records',
      frequency: 'Annual',
      submitTo: 'State',
      contents: ['Sulfur content by fuel supplier', 'Heat content if applicable'],
    },
    {
      reportType: 'Excess Emissions',
      frequency: 'Semiannual',
      submitTo: 'State',
      contents: ['Duration of opacity exceedances', 'Actions taken', 'Monitoring system downtime'],
    },
  ],

  recordkeeping: {
    records: [
      'Fuel analysis records (sulfur content)',
      'Fuel supplier certifications',
      'Opacity monitoring data (if COMS installed)',
      'Stack test results (if performed)',
    ],
    retentionPeriod: '2 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 63 Subpart DDDDD',
      relationship: 'supplements',
      notes: 'Boiler MACT for HAPs applies to some small boilers based on subcategory',
    },
    {
      regulation: '40 CFR Part 60 Subpart Db',
      relationship: 'coordinates',
      notes: 'Db applies to larger units (>100 MMBtu); Dc for smaller units',
    },
  ],

  requiresCEMS: false,
  cemsParameters: [],

  keyCitations: {
    applicability: '40 CFR 60.40c',
    standards: '40 CFR 60.42c - 60.43c',
    monitoring: '40 CFR 60.44c - 60.46c',
    testMethods: '40 CFR 60.44c',
    reporting: '40 CFR 60.48c',
  },
}

// ============================================================================
// PRIORITY 4: STATIONARY ENGINES (IIII, JJJJ)
// ============================================================================

export const SUBPART_IIII: Part60SubpartKnowledge = {
  subpart: 'IIII',
  title: 'Standards of Performance for Stationary Compression Ignition Internal Combustion Engines',
  cfrSections: '60.4200 - 60.4219',
  equipmentTypes: ['ci-ice'],
  industries: ['industrial', 'oil-gas-upstream', 'oil-gas-midstream'],

  applicability: {
    description:
      'Stationary compression ignition (CI) internal combustion engines (diesel engines)',
    sizeThreshold: 'All sizes, requirements vary by displacement and model year',
    constructionDate: 'Manufactured after April 1, 2006 (or July 11, 2005 for fire pump engines)',
    exemptions: [
      'Engines used for testing at engine manufacturers',
      'Research and development engines',
      'Engines at residential locations <25 hp',
    ],
  },

  standards: [
    {
      parameter: 'NOX+NMHC',
      limit: '4.0',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['Tier 2, engines 175-300 hp, model year 2007+'],
    },
    {
      parameter: 'NOX+NMHC',
      limit: '0.30',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['Tier 4 Final, engines >750 hp, model year 2015+'],
    },
    {
      parameter: 'PM',
      limit: '0.15',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['Tier 2, engines 175-600 hp'],
    },
    {
      parameter: 'PM',
      limit: '0.01',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['Tier 4 Final, engines >75 hp, model year 2012+'],
    },
    {
      parameter: 'CO',
      limit: '2.6',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['Tier 2 and later, most engine sizes'],
    },
  ],

  monitoring: [
    {
      parameter: 'Engine operation',
      method: 'continuous-monitoring',
      frequency: 'Continuous',
    },
    {
      parameter: 'Fuel usage',
      method: 'fuel-analysis',
      frequency: 'Per delivery (for non-road diesel sulfur requirements)',
    },
  ],

  testMethods: [
    {
      parameter: 'All pollutants',
      methods: ['EPA certification (primary)', 'Method 1-4 for flow/moisture'],
      frequency: 'Manufacturer certification or initial/annual testing',
    },
    {
      parameter: 'NOX',
      methods: ['Method 7E', 'ASTM D6522'],
      frequency: 'If performance testing required',
    },
    {
      parameter: 'PM',
      methods: ['Method 5'],
      frequency: 'If performance testing required',
    },
  ],

  reporting: [
    {
      reportType: 'Initial Notification',
      frequency: 'One-time',
      submitTo: 'EPA',
      contents: ['Engine identification', 'Model year', 'Rated power', 'Certified emission levels'],
    },
    {
      reportType: 'Annual Compliance Report',
      frequency: 'Annual',
      submitTo: 'EPA',
      contents: ['Operating hours', 'Fuel consumption', 'Maintenance performed'],
    },
  ],

  recordkeeping: {
    records: [
      'Engine manufacturer data (model, serial, certification)',
      'Operating hours (non-resettable hour meter)',
      'Fuel delivery records',
      'Maintenance records per manufacturer specs',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 63 Subpart ZZZZ',
      relationship: 'coordinates',
      notes:
        'RICE NESHAP has HAP requirements for same engines; compliance with one aids the other',
    },
    {
      regulation: '40 CFR Part 60 Subpart JJJJ',
      relationship: 'coordinates',
      notes: 'JJJJ covers spark ignition engines; IIII covers compression ignition',
    },
    {
      regulation: '40 CFR Part 1039',
      relationship: 'coordinates',
      notes: 'Nonroad engine certification standards',
    },
  ],

  requiresCEMS: false,
  cemsParameters: [],

  keyCitations: {
    applicability: '40 CFR 60.4200 - 60.4202',
    standards: '40 CFR 60.4204 - 60.4205',
    monitoring: '40 CFR 60.4206 - 60.4209',
    testMethods: '40 CFR 60.4212',
    reporting: '40 CFR 60.4214',
  },
}

export const SUBPART_JJJJ: Part60SubpartKnowledge = {
  subpart: 'JJJJ',
  title: 'Standards of Performance for Stationary Spark Ignition Internal Combustion Engines',
  cfrSections: '60.4230 - 60.4248',
  equipmentTypes: ['si-ice'],
  industries: ['industrial', 'oil-gas-upstream', 'oil-gas-midstream'],

  applicability: {
    description:
      'Stationary spark ignition (SI) internal combustion engines (natural gas, LPG, gasoline engines)',
    sizeThreshold: 'All sizes, requirements vary by power rating and use',
    constructionDate: 'Manufactured after June 12, 2006 (or January 1, 2009 for certain engines)',
    exemptions: [
      'Research and development engines',
      'Test cell engines at manufacturers',
      'Engines at residential locations <25 hp',
    ],
  },

  standards: [
    {
      parameter: 'NOX',
      limit: '2.0',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['Rich-burn engines ≤500 hp, manufactured 2008+'],
    },
    {
      parameter: 'NOX',
      limit: '1.0',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['Rich-burn engines >500 hp, manufactured 2008+'],
    },
    {
      parameter: 'NOX',
      limit: '2.0',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['Lean-burn engines ≤500 hp, manufactured 2008+'],
    },
    {
      parameter: 'NOX',
      limit: '1.0',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['Lean-burn engines >500 hp, manufactured 2010+'],
    },
    {
      parameter: 'CO',
      limit: '4.0',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['All engines, landfill/digester gas get 47.0'],
    },
    {
      parameter: 'VOC',
      limit: '1.0',
      units: 'g/hp-hr',
      averagingPeriod: 'Test average',
      conditions: ['All engines except landfill/digester gas'],
    },
  ],

  monitoring: [
    {
      parameter: 'Engine operation',
      method: 'continuous-monitoring',
      frequency: 'Continuous (non-resettable hour meter required)',
    },
    {
      parameter: 'Catalyst inlet temperature',
      method: 'continuous-monitoring',
      frequency: 'Continuous (if catalyst used for compliance)',
    },
  ],

  testMethods: [
    {
      parameter: 'All pollutants',
      methods: ['EPA/CARB certification (primary)'],
      frequency: 'Manufacturer certification',
    },
    {
      parameter: 'NOX',
      methods: ['Method 7E', 'Method 20'],
      frequency: 'If performance testing required',
    },
    {
      parameter: 'CO',
      methods: ['Method 10'],
      frequency: 'If performance testing required',
    },
    {
      parameter: 'VOC',
      methods: ['Method 25A', 'Method 18'],
      frequency: 'If performance testing required',
    },
  ],

  reporting: [
    {
      reportType: 'Initial Notification',
      frequency: 'One-time',
      submitTo: 'EPA',
      contents: ['Engine identification', 'Site location', 'Emission control equipment'],
    },
    {
      reportType: 'Annual Compliance Report',
      frequency: 'Semiannual',
      submitTo: 'EPA',
      contents: ['Deviations from requirements', 'Operating hours', 'Maintenance performed'],
    },
  ],

  recordkeeping: {
    records: [
      'Engine manufacturer data and certification',
      'Operating hours (non-resettable hour meter)',
      'Maintenance log per manufacturer specs',
      'Catalyst monitoring data (if applicable)',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 63 Subpart ZZZZ',
      relationship: 'coordinates',
      notes: 'RICE NESHAP covers HAPs from same engines',
    },
    {
      regulation: '40 CFR Part 60 Subpart IIII',
      relationship: 'coordinates',
      notes: 'IIII covers compression ignition engines; JJJJ covers spark ignition',
    },
  ],

  requiresCEMS: false,
  cemsParameters: [],

  keyCitations: {
    applicability: '40 CFR 60.4230 - 60.4233',
    standards: '40 CFR 60.4233 - 60.4234',
    monitoring: '40 CFR 60.4236 - 60.4237',
    testMethods: '40 CFR 60.4244',
    reporting: '40 CFR 60.4245',
  },
}

// ============================================================================
// PRIORITY 5: PETROLEUM REFINERIES - NEW SOURCE (Ja)
// ============================================================================

export const SUBPART_Ja: Part60SubpartKnowledge = {
  subpart: 'Ja',
  title:
    'Standards of Performance for Petroleum Refineries for Which Construction, Reconstruction, or Modification Commenced After May 14, 2007',
  cfrSections: '60.100a - 60.109a',
  equipmentTypes: ['fccu', 'claus-unit', 'fuel-gas-combustion', 'process-heater', 'flare'],
  industries: ['petroleum-refining'],

  applicability: {
    description:
      'Petroleum refinery process units including FCCUs, sulfur recovery plants, fuel gas combustion devices, and process heaters',
    sizeThreshold: 'FCCUs with coke burn-off >50,000 lb/hr; process heaters >40 MMBtu/hr',
    constructionDate: 'Construction, reconstruction, or modification commenced after May 14, 2007',
    exemptions: [
      'Co-located hydrogen plants with separate standards',
      'Facilities processing primarily natural gas liquids',
    ],
  },

  standards: [
    {
      parameter: 'PM',
      limit: '0.5',
      units: 'kg/Mg coke burn-off',
      averagingPeriod: '7-day rolling average',
      conditions: ['FCCU catalyst regenerator'],
    },
    {
      parameter: 'SO2',
      limit: '50',
      units: 'ppmvd @ 0% excess air',
      averagingPeriod: '7-day rolling average',
      conditions: ['FCCU catalyst regenerator'],
    },
    {
      parameter: 'NOX',
      limit: '80',
      units: 'ppmvd @ 0% excess air',
      averagingPeriod: '7-day rolling average',
      conditions: ['FCCU catalyst regenerator'],
    },
    {
      parameter: 'CO',
      limit: '500',
      units: 'ppmvd @ 0% excess air',
      averagingPeriod: '1-hour average',
      conditions: ['FCCU catalyst regenerator'],
    },
    {
      parameter: 'SO2',
      limit: '40',
      units: 'ppmvd @ 0% O2',
      averagingPeriod: '365-day rolling average',
      conditions: ['Process heater >40 MMBtu/hr'],
    },
    {
      parameter: 'NOX',
      limit: '40',
      units: 'ppmvd @ 0% O2',
      averagingPeriod: '30-day rolling average',
      conditions: ['Process heater >40 MMBtu/hr, natural gas fired'],
    },
    {
      parameter: 'H2S',
      limit: '162',
      units: 'ppmv',
      averagingPeriod: '3-hour rolling average',
      conditions: ['Fuel gas combustion devices'],
    },
    {
      parameter: 'Flare emissions',
      limit: 'No visible emissions',
      units: 'opacity',
      averagingPeriod: '5-minute observation',
      conditions: ['Flares (except startup/shutdown)'],
    },
  ],

  monitoring: [
    {
      parameter: 'SO2',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '125% of max expected',
        relativeAccuracy: '20%',
      },
      dataRecovery: '95%',
    },
    {
      parameter: 'NOX',
      method: 'CEMS',
      frequency: 'Continuous',
      specifications: {
        span: '125% of max expected',
        relativeAccuracy: '20%',
      },
      dataRecovery: '95%',
    },
    {
      parameter: 'CO',
      method: 'CEMS',
      frequency: 'Continuous',
      dataRecovery: '95%',
    },
    {
      parameter: 'O2',
      method: 'CEMS',
      frequency: 'Continuous',
      dataRecovery: '95%',
    },
    {
      parameter: 'Flare Flow Rate',
      method: 'continuous-monitoring',
      frequency: 'Continuous',
    },
    {
      parameter: 'Flare Pilot Flame',
      method: 'continuous-monitoring',
      frequency: 'Continuous',
    },
    {
      parameter: 'H2S in fuel gas',
      method: 'continuous-monitoring',
      frequency: 'Continuous',
    },
  ],

  testMethods: [
    {
      parameter: 'PM',
      methods: ['Method 5', 'Method 5B', 'Method 5F'],
      frequency: 'Initial and annual',
    },
    {
      parameter: 'SO2',
      methods: ['Method 6', 'Method 6C'],
      frequency: 'RATA annually',
    },
    {
      parameter: 'NOX',
      methods: ['Method 7E', 'Method 20'],
      frequency: 'RATA annually',
    },
    {
      parameter: 'Coke burn rate',
      methods: ['Calculation from air rate and O2/CO2'],
      frequency: 'Continuous',
    },
  ],

  reporting: [
    {
      reportType: 'Performance Test Report',
      frequency: 'After each test',
      submitTo: 'EPA',
      contents: ['Test results', 'Operating conditions', 'Calculation methodology'],
    },
    {
      reportType: 'Excess Emissions and CMS Performance',
      frequency: 'Semiannual',
      submitTo: 'EPA',
      contents: ['Excess emissions summary', 'CEMS downtime', 'Flare events', 'Process upsets'],
    },
    {
      reportType: 'Flare Event Report',
      frequency: 'Within 2 days of event',
      submitTo: 'EPA',
      contents: ['Date/time', 'Duration', 'Flow rate', 'Cause'],
      dueDate: '2 calendar days after event ends',
    },
  ],

  recordkeeping: {
    records: [
      'CEMS data (1-minute, hourly, rolling averages)',
      'Flare monitoring records',
      'Fuel gas H2S monitoring',
      'Process heater fuel usage',
      'Stack test results',
      'CMS calibration records',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart J',
      relationship: 'supplements',
      notes: 'Ja has more stringent limits and additional requirements beyond Subpart J',
    },
    {
      regulation: '40 CFR Part 63 Subpart CC',
      relationship: 'supplements',
      notes: 'Refinery MACT 1 for HAPs from process vents',
    },
    {
      regulation: '40 CFR Part 63 Subpart UUU',
      relationship: 'supplements',
      notes: 'Refinery MACT 2 for FCCU HAPs',
    },
  ],

  requiresCEMS: true,
  cemsParameters: ['SO2', 'NOX', 'CO', 'O2'],

  keyCitations: {
    applicability: '40 CFR 60.100a',
    standards: '40 CFR 60.102a - 60.103a',
    monitoring: '40 CFR 60.105a - 60.107a',
    testMethods: '40 CFR 60.104a',
    reporting: '40 CFR 60.108a',
  },
}

// ============================================================================
// PRIORITY 6: LDAR - EQUIPMENT LEAKS (VV, VVa)
// ============================================================================

/**
 * Subpart VV - Equipment Leaks of VOC in SOCMI
 *
 * Original LDAR requirements for synthetic organic chemical manufacturing.
 * Method 21 based leak detection with repair requirements.
 */
export const SUBPART_VV: Part60SubpartKnowledge = {
  subpart: 'VV',
  title:
    'Standards of Performance for Equipment Leaks of VOC in the Synthetic Organic Chemicals Manufacturing Industry',
  cfrSections: '60.480 - 60.489',
  equipmentTypes: [
    'pump',
    'compressor',
    'valve',
    'pressure-relief-device',
    'connector',
    'open-ended-line',
    'sampling-connection',
  ],
  industries: ['chemical-manufacturing', 'petroleum-refining'],

  applicability: {
    description:
      'Equipment in VOC service at SOCMI process units constructed after January 5, 1981',
    constructionDate: 'Construction commenced after January 5, 1981',
    exemptions: [
      'Equipment in vacuum service',
      'Equipment with VOC concentration <10% by weight',
      'Instrumentation systems',
      'Compressor seals with barrier fluid system',
    ],
  },

  standards: [
    {
      parameter: 'VOC',
      limit: '10,000',
      units: 'ppmv',
      averagingPeriod: 'Instantaneous (Method 21)',
      conditions: ['Leak definition for valves, pumps, connectors'],
    },
    {
      parameter: 'VOC',
      limit: '500',
      units: 'ppmv',
      averagingPeriod: 'Instantaneous (Method 21)',
      conditions: ['Leak definition for compressors'],
    },
    {
      parameter: 'VOC',
      limit: '0',
      units: 'ppmv',
      averagingPeriod: 'No detectable emissions',
      conditions: ['Open-ended lines must be capped or plugged'],
    },
  ],

  monitoring: [
    {
      parameter: 'VOC',
      method: 'ldar-monitoring',
      frequency: 'Monthly (pumps), Quarterly (valves)',
      specifications: {
        calibrationDrift: 'Per Method 21',
      },
    },
  ],

  testMethods: [
    {
      parameter: 'VOC',
      methods: ['Method 21'],
      frequency: 'Per monitoring schedule',
      conditions: 'Portable analyzer, calibrate with methane',
    },
  ],

  reporting: [
    {
      reportType: 'Semiannual Report',
      frequency: 'Semiannual',
      submitTo: 'State',
      contents: [
        'Number of valves, pumps, compressors subject to LDAR',
        'Number of leaks detected',
        'Number of leaks repaired',
        'Number of leaks not repaired (delay of repair)',
        'Percentage of leaking components',
      ],
    },
  ],

  recordkeeping: {
    records: [
      'Equipment ID and location for each component',
      'Date and instrument reading of each monitoring event',
      'Date leak detected and date repaired',
      'Delay of repair justification',
      'Method 21 calibration records',
    ],
    retentionPeriod: '2 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart VVa',
      relationship: 'replaces',
      notes: 'VVa has updated provisions for new sources after 2006',
    },
    {
      regulation: '40 CFR Part 63 Subpart H',
      relationship: 'supplements',
      notes: 'HON equipment leak provisions for HAPs',
    },
  ],

  requiresCEMS: false,

  keyCitations: {
    applicability: '40 CFR 60.480',
    standards: '40 CFR 60.482-1 through 60.482-10',
    monitoring: '40 CFR 60.485',
    testMethods: '40 CFR 60.485(b)',
    reporting: '40 CFR 60.487',
  },
}

/**
 * Subpart VVa - Equipment Leaks of VOC in SOCMI (2006+)
 *
 * Updated LDAR requirements with lower leak thresholds and OGI option.
 */
export const SUBPART_VVa: Part60SubpartKnowledge = {
  subpart: 'VVa',
  title:
    'Standards of Performance for Equipment Leaks of VOC in the Synthetic Organic Chemicals Manufacturing Industry for Which Construction, Reconstruction, or Modification Commenced After November 7, 2006',
  cfrSections: '60.480a - 60.489a',
  equipmentTypes: [
    'pump',
    'compressor',
    'valve',
    'pressure-relief-device',
    'connector',
    'open-ended-line',
    'sampling-connection',
  ],
  industries: ['chemical-manufacturing', 'petroleum-refining'],

  applicability: {
    description:
      'Equipment in VOC service at SOCMI process units constructed after November 7, 2006',
    constructionDate: 'Construction commenced after November 7, 2006',
    exemptions: [
      'Equipment in vacuum service',
      'Equipment with VOC concentration <10% by weight',
      'Instrumentation systems',
      'Compressor seals with barrier fluid system',
    ],
  },

  standards: [
    {
      parameter: 'VOC',
      limit: '500',
      units: 'ppmv',
      averagingPeriod: 'Instantaneous (Method 21)',
      conditions: ['Leak definition for valves (lower than VV)'],
    },
    {
      parameter: 'VOC',
      limit: '2,000',
      units: 'ppmv',
      averagingPeriod: 'Instantaneous (Method 21)',
      conditions: ['Leak definition for pumps'],
    },
    {
      parameter: 'VOC',
      limit: '500',
      units: 'ppmv',
      averagingPeriod: 'Instantaneous (Method 21)',
      conditions: ['Leak definition for compressors'],
    },
    {
      parameter: 'VOC',
      limit: '500',
      units: 'ppmv',
      averagingPeriod: 'Instantaneous (Method 21)',
      conditions: ['Leak definition for connectors'],
    },
  ],

  monitoring: [
    {
      parameter: 'VOC',
      method: 'ldar-monitoring',
      frequency: 'Monthly (pumps), Quarterly (valves), Annually (connectors)',
      specifications: {
        calibrationDrift: 'Per Method 21',
      },
    },
    {
      parameter: 'VOC',
      method: 'ogi-monitoring',
      frequency: 'Alternative to Method 21 per 60.18(g)',
      specifications: {
        calibrationDrift: 'Per OGI protocol',
      },
    },
  ],

  testMethods: [
    {
      parameter: 'VOC',
      methods: ['Method 21', 'OGI (Alternative Work Practice)'],
      frequency: 'Per monitoring schedule',
      conditions: 'OGI requires EPA approval and specific camera specs',
    },
  ],

  reporting: [
    {
      reportType: 'Semiannual Report',
      frequency: 'Semiannual',
      submitTo: 'State',
      contents: [
        'Number of components by type',
        'Number of leaks detected and repaired',
        'Delay of repair documentation',
        'Leak percentage calculations',
      ],
    },
  ],

  recordkeeping: {
    records: [
      'Equipment ID and location for each component',
      'Date and instrument reading of each monitoring event',
      'OGI video files if using alternative work practice',
      'Date leak detected and date repaired',
      'Delay of repair justification',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart VV',
      relationship: 'replaces',
      notes: 'VVa applies to newer sources with stricter limits',
    },
    {
      regulation: '40 CFR Part 63 Subpart H',
      relationship: 'supplements',
      notes: 'HON equipment leak provisions for HAPs',
    },
  ],

  requiresCEMS: false,

  keyCitations: {
    applicability: '40 CFR 60.480a',
    standards: '40 CFR 60.482a-1 through 60.482a-10',
    monitoring: '40 CFR 60.485a',
    testMethods: '40 CFR 60.485a(b)',
    reporting: '40 CFR 60.487a',
  },
}

// ============================================================================
// PRIORITY 7: STORAGE VESSELS (Kb)
// ============================================================================

/**
 * Subpart Kb - Volatile Organic Liquid Storage Vessels
 *
 * Requirements for tanks storing VOCs - controls and monitoring.
 */
export const SUBPART_Kb: Part60SubpartKnowledge = {
  subpart: 'Kb',
  title:
    'Standards of Performance for Volatile Organic Liquid Storage Vessels (Including Petroleum Liquid Storage Vessels) for Which Construction, Reconstruction, or Modification Commenced After July 23, 1984',
  cfrSections: '60.110b - 60.117b',
  equipmentTypes: ['storage-vessel'],
  industries: ['petroleum-refining', 'oil-gas-midstream', 'chemical-manufacturing'],

  applicability: {
    description: 'Storage vessels with capacity ≥75 m³ storing VOLs with vapor pressure ≥3.5 kPa',
    sizeThreshold: '≥75 m³ (approximately 19,800 gallons)',
    constructionDate: 'Construction commenced after July 23, 1984',
    exemptions: [
      'Vessels with capacity <75 m³',
      'Pressure vessels (>15 psig)',
      'Vessels storing wastewater',
      'Vessels at coke oven by-product plants',
    ],
  },

  standards: [
    {
      parameter: 'VOC',
      limit: '95%',
      units: 'percent control',
      averagingPeriod: 'Control efficiency',
      conditions: ['Required for vessels ≥151 m³ with VOL vapor pressure ≥76.6 kPa'],
    },
    {
      parameter: 'VOC',
      limit: 'Floating roof or equivalent',
      units: 'control device',
      averagingPeriod: 'Equipment standard',
      conditions: ['Internal or external floating roof required'],
    },
  ],

  monitoring: [
    {
      parameter: 'VOC',
      method: 'periodic-monitoring',
      frequency: 'Annual (gap measurements), Semiannual (seal inspections)',
      specifications: {
        calibrationDrift: 'N/A - physical inspection',
      },
    },
  ],

  testMethods: [
    {
      parameter: 'VOC vapor pressure',
      methods: ['ASTM D2879', 'ASTM D323'],
      frequency: 'When liquid stored changes',
      conditions: 'Determines applicability based on vapor pressure',
    },
    {
      parameter: 'Seal gaps',
      methods: ['Physical measurement per 60.113b'],
      frequency: 'Annual for EFR, every 10 years for IFR',
      conditions: 'Gap area limits: primary seal 212 cm²/m, secondary seal 21.2 cm²/m',
    },
  ],

  reporting: [
    {
      reportType: 'Initial Notification',
      frequency: 'One-time',
      submitTo: 'State',
      contents: [
        'Vessel identification and location',
        'Vessel capacity and dimensions',
        'Type of control (IFR, EFR, closed vent)',
      ],
    },
    {
      reportType: 'Semiannual Report',
      frequency: 'Semiannual',
      submitTo: 'State',
      contents: ['Inspection results', 'Gap measurement results', 'Repairs made'],
    },
  ],

  recordkeeping: {
    records: [
      'Vessel identification and capacity',
      'Type of roof and seals',
      'Inspection dates and findings',
      'Gap measurement results',
      'Repair dates and descriptions',
      'Vapor pressure of stored liquid',
    ],
    retentionPeriod: '2 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart Ka',
      relationship: 'replaces',
      notes: 'Ka is for older vessels (pre-1984)',
    },
    {
      regulation: '40 CFR Part 63 Subpart WW',
      relationship: 'supplements',
      notes: 'Storage vessel provisions for HAPs sources',
    },
  ],

  requiresCEMS: false,

  keyCitations: {
    applicability: '40 CFR 60.110b',
    standards: '40 CFR 60.112b',
    monitoring: '40 CFR 60.113b',
    testMethods: '40 CFR 60.113b(b)',
    reporting: '40 CFR 60.115b',
  },
}

// ============================================================================
// PRIORITY 5: OIL & GAS PHASE 5 - OOOO (2011-2015)
// ============================================================================

/**
 * Subpart OOOO - Crude Oil and Natural Gas Facilities (2011-2015)
 *
 * Original O&G NSPS covering well sites, compressor stations, and processing plants.
 * Sources constructed 8/23/2011 - 9/18/2015.
 */
export const SUBPART_OOOO: Part60SubpartKnowledge = {
  subpart: 'OOOO',
  title:
    'Standards of Performance for Crude Oil and Natural Gas Production, Transmission and Distribution',
  cfrSections: '60.5360 - 60.5499',
  equipmentTypes: [
    'compressor',
    'storage-vessel',
    'pump',
    'valve',
    'connector',
    'pressure-relief-device',
  ],
  industries: ['oil-gas-upstream', 'oil-gas-midstream'],

  applicability: {
    description:
      'Well sites, compressor stations, and natural gas processing plants with affected equipment',
    constructionDate:
      'Construction commenced after August 23, 2011 and on or before September 18, 2015',
    exemptions: [
      'Sources in Alaska outside of North Slope',
      'Stripper wells and low production wells',
      'Equipment at residential locations',
    ],
  },

  standards: [
    {
      parameter: 'VOC',
      limit: '95',
      units: 'percent control',
      averagingPeriod: 'Control efficiency',
      conditions: ['Storage vessels with VOC emissions ≥6 tpy'],
    },
    {
      parameter: 'VOC',
      limit: '98',
      units: 'percent reduction',
      averagingPeriod: 'Control efficiency',
      conditions: ['Centrifugal compressor wet seal degassing'],
    },
    {
      parameter: 'VOC',
      limit: '95',
      units: 'percent reduction',
      averagingPeriod: 'Control efficiency',
      conditions: ['Reciprocating compressor rod packing'],
    },
    {
      parameter: 'SO2',
      limit: '4',
      units: 'long tons/day',
      averagingPeriod: '24-hour',
      conditions: ['Sweetening units at onshore gas processing plants'],
    },
  ],

  monitoring: [
    {
      parameter: 'VOC',
      method: 'ldar-monitoring',
      frequency: 'Quarterly (Method 21)',
      specifications: {
        calibrationDrift: 'Per Method 21',
      },
    },
    {
      parameter: 'VOC',
      method: 'ogi-monitoring',
      frequency: 'Semiannual (alternative to Method 21)',
    },
    {
      parameter: 'Control device',
      method: 'CPMS',
      frequency: 'Continuous (combustor temperature)',
    },
  ],

  testMethods: [
    {
      parameter: 'VOC',
      methods: ['Method 21', 'OGI per 60.5397'],
      frequency: 'Per monitoring schedule',
    },
    {
      parameter: 'Control efficiency',
      methods: ['Method 25A', 'Method 18'],
      frequency: 'Initial',
    },
    {
      parameter: 'SO2',
      methods: ['Method 6', 'Method 6C'],
      frequency: 'Per 60.5406',
    },
  ],

  reporting: [
    {
      reportType: 'Initial Annual Report',
      frequency: 'Annual',
      submitTo: 'EPA',
      contents: [
        'Facility identification',
        'Affected equipment count',
        'Monitoring method used',
        'Leak detection and repair summary',
      ],
    },
  ],

  recordkeeping: {
    records: [
      'Equipment identification and location',
      'Monitoring dates and results',
      'Leaks detected and repair dates',
      'Control device monitoring data',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart OOOOa',
      relationship: 'coordinates',
      notes: 'OOOOa applies to sources after September 18, 2015',
    },
    {
      regulation: '40 CFR Part 60 Subpart OOOOb',
      relationship: 'coordinates',
      notes: 'OOOOb (2024) has more stringent requirements and covers existing sources',
    },
    {
      regulation: '40 CFR Part 63 Subpart HH',
      relationship: 'supplements',
      notes: 'Oil & gas HAP standards may also apply',
    },
  ],

  requiresCEMS: false,

  keyCitations: {
    applicability: '40 CFR 60.5360 - 60.5365',
    standards: '40 CFR 60.5375 - 60.5395',
    monitoring: '40 CFR 60.5397',
    testMethods: '40 CFR 60.5400 - 60.5406',
    reporting: '40 CFR 60.5420',
  },
}

// ============================================================================
// PRIORITY 5: OIL & GAS PHASE 5 - OOOOb (2024+ METHANE RULE)
// ============================================================================

/**
 * Subpart OOOOb - Crude Oil and Natural Gas GHG Emission Guidelines (2024+)
 *
 * The "super-emitter" rule with comprehensive methane requirements.
 * Applies to new AND existing sources. Includes third-party monitoring.
 */
export const SUBPART_OOOOb: Part60SubpartKnowledge = {
  subpart: 'OOOOb',
  title:
    'Standards of Performance for Crude Oil and Natural Gas Facilities: Emission Guidelines for Greenhouse Gas Emissions',
  cfrSections: '60.5360b - 60.5499b',
  equipmentTypes: [
    'compressor',
    'storage-vessel',
    'pump',
    'valve',
    'connector',
    'pressure-relief-device',
    'flare',
    'open-ended-line',
  ],
  industries: ['oil-gas-upstream', 'oil-gas-midstream'],

  applicability: {
    description:
      'Both new and existing crude oil and natural gas facilities including super-emitter response program requirements',
    constructionDate: 'Final rule effective 2024; applies to new and existing sources',
    sizeThreshold: 'Varies by equipment type; many apply regardless of size',
    exemptions: [
      'Alaska North Slope facilities (delayed compliance)',
      'Low production well sites (<15 boe/day) may have reduced requirements',
    ],
  },

  standards: [
    {
      parameter: 'Methane',
      limit: '95',
      units: 'percent control',
      averagingPeriod: 'Control efficiency',
      conditions: ['Pneumatic controllers - zero-emissions required at natural gas sites'],
    },
    {
      parameter: 'VOC',
      limit: '95',
      units: 'percent control',
      averagingPeriod: 'Control efficiency',
      conditions: ['Storage vessels with emissions ≥6 tpy'],
    },
    {
      parameter: 'Methane',
      limit: '0',
      units: 'scfh (zero emissions)',
      averagingPeriod: 'Continuous',
      conditions: ['Pneumatic pumps at processing plants'],
    },
    {
      parameter: 'Combustion',
      limit: '96',
      units: 'percent destruction efficiency',
      averagingPeriod: 'Control device performance',
      conditions: ['Flares and enclosed combustors'],
    },
  ],

  monitoring: [
    {
      parameter: 'Methane',
      method: 'ogi-monitoring',
      frequency: 'Quarterly for compressor stations; Semiannual for well sites',
    },
    {
      parameter: 'Super-emitter events',
      method: 'continuous-monitoring',
      frequency: 'Third-party aerial/satellite detection with response requirements',
    },
    {
      parameter: 'Flare combustion',
      method: 'CPMS',
      frequency: 'Continuous (pilot flame and combustion zone temperature)',
    },
    {
      parameter: 'Methane/VOC',
      method: 'ldar-monitoring',
      frequency: 'Alternative to OGI per state plan',
    },
  ],

  testMethods: [
    {
      parameter: 'Methane/VOC',
      methods: ['OGI per 60.5397b', 'Method 21'],
      frequency: 'Per monitoring schedule',
    },
    {
      parameter: 'Control efficiency',
      methods: ['Method 25A', 'Method 18', 'NSPS OOOOb Appendix K'],
      frequency: 'Initial and annual',
    },
  ],

  reporting: [
    {
      reportType: 'Annual Report',
      frequency: 'Annual',
      submitTo: 'EPA',
      contents: [
        'Super-emitter notifications received and responses',
        'Fugitive emissions monitoring summary',
        'Equipment counts and modifications',
        'Flare and combustor performance',
      ],
      dueDate: '90 days after year end',
    },
    {
      reportType: 'Super-emitter Response Notification',
      frequency: 'Within 5 days of notification',
      submitTo: 'EPA',
      contents: [
        'Investigation findings',
        'Root cause analysis',
        'Corrective actions taken',
        'Confirmation of repair',
      ],
    },
  ],

  recordkeeping: {
    records: [
      'All equipment identification and coordinates',
      'OGI video files (2 years minimum)',
      'Super-emitter investigation records',
      'Flare pilot monitoring data',
      'Repair delay documentation',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart OOOO',
      relationship: 'coordinates',
      notes: 'OOOO applies to 2011-2015 sources; OOOOb is more stringent',
    },
    {
      regulation: '40 CFR Part 60 Subpart OOOOa',
      relationship: 'coordinates',
      notes: 'OOOOa applies to 2015-2024 sources; OOOOb overlays additional requirements',
    },
    {
      regulation: '40 CFR Part 98 Subpart W',
      relationship: 'supplements',
      notes: 'GHG reporting requirements for petroleum and natural gas systems',
    },
    {
      regulation: '40 CFR Part 63 Subpart HH',
      relationship: 'supplements',
      notes: 'HAP requirements for oil and gas production',
    },
  ],

  requiresCEMS: false,

  keyCitations: {
    applicability: '40 CFR 60.5360b - 60.5365b',
    standards: '40 CFR 60.5375b - 60.5398b',
    monitoring: '40 CFR 60.5397b - 60.5398b',
    testMethods: '40 CFR 60.5400b - 60.5401b',
    reporting: '40 CFR 60.5420b - 60.5422b',
  },
}

// ============================================================================
// PRIORITY 5: GHG COMBUSTION TURBINES - UUUU
// ============================================================================

/**
 * Subpart UUUU - GHG Emission Guidelines for Existing Combustion Turbines
 *
 * CO2 emission guidelines for existing stationary combustion turbine EGUs.
 * Works with Part 75 for monitoring coordination.
 */
export const SUBPART_UUUU: Part60SubpartKnowledge = {
  subpart: 'UUUU',
  title:
    'Emission Guidelines for Greenhouse Gas Emissions from Existing Stationary Combustion Turbine Electric Generating Units',
  cfrSections: '60.5508 - 60.5580',
  equipmentTypes: ['gas-turbine', 'combustion-turbine'],
  industries: ['electric-utility', 'industrial'],

  applicability: {
    description:
      'Existing stationary combustion turbines that are EGUs and commenced construction before the date of publication',
    sizeThreshold: '>25 MW net-electric generating capacity; >10% capacity factor',
    constructionDate: 'Existing sources (commenced construction before rule publication)',
    exemptions: [
      'Simple cycle units that are not baseload',
      'Combined heat and power (CHP) units meeting certain efficiency criteria',
      'Units under 25 MW',
      'Peaking units with capacity factor ≤10%',
    ],
  },

  standards: [
    {
      parameter: 'CO2',
      limit: '1000',
      units: 'lb CO2/MWh-net',
      averagingPeriod: 'Annual (rolling 12-month)',
      conditions: ['Baseload natural gas-fired combined cycle units'],
    },
    {
      parameter: 'CO2',
      limit: '1100',
      units: 'lb CO2/MWh-net',
      averagingPeriod: 'Annual (rolling 12-month)',
      conditions: ['Intermediate load combined cycle units (10-50% capacity factor)'],
    },
    {
      parameter: 'Heat Input',
      limit: 'Monitoring required',
      units: 'MMBtu/hr',
      averagingPeriod: 'Hourly',
      conditions: ['Part 75 methods acceptable'],
    },
  ],

  monitoring: [
    {
      parameter: 'CO2',
      method: 'CEMS',
      frequency: 'Continuous (per Part 75 Subpart H)',
      specifications: {
        span: 'Per Part 75',
        relativeAccuracy: '10%',
      },
      dataRecovery: '90% annual availability',
    },
    {
      parameter: 'Heat Input',
      method: 'continuous-monitoring',
      frequency: 'Continuous (fuel flow or Part 75)',
    },
    {
      parameter: 'Net generation',
      method: 'continuous-monitoring',
      frequency: 'Continuous (MWh metering)',
    },
  ],

  testMethods: [
    {
      parameter: 'CO2',
      methods: ['Part 75 Appendix F', 'Method 3A'],
      frequency: 'RATA annually per Part 75',
    },
    {
      parameter: 'Heat input',
      methods: ['Part 75 Appendix D', 'Fuel flow metering'],
      frequency: 'Continuous',
    },
  ],

  reporting: [
    {
      reportType: 'Annual Emissions Report',
      frequency: 'Annual',
      submitTo: 'EPA',
      contents: [
        'CO2 mass emissions (tons)',
        'Net electrical output (MWh)',
        'CO2 emission rate (lb/MWh)',
        'Capacity factor',
        'Part 75 compliance status',
      ],
      dueDate: 'Per Part 75 schedule (quarterly EDR)',
    },
  ],

  recordkeeping: {
    records: [
      'CO2 CEMS data (per Part 75)',
      'Heat input data',
      'Net generation records',
      'RATA and QA test results',
      'Substitute data calculations',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 75',
      relationship: 'coordinates',
      notes:
        'CO2 monitoring per Part 75 Subpart H; uses Part 75 CEMS infrastructure and QA requirements',
    },
    {
      regulation: '40 CFR Part 60 Subpart KKKK',
      relationship: 'coordinates',
      notes: 'KKKK covers NOX/SO2 for new combustion turbines',
    },
    {
      regulation: '40 CFR Part 60 Subpart TTTT',
      relationship: 'coordinates',
      notes: 'TTTT covers GHG for fossil fuel-fired steam generators (coal/gas boilers)',
    },
    {
      regulation: '40 CFR Part 60 Subpart GG',
      relationship: 'supplements',
      notes: 'Original turbine NSPS for older units',
    },
  ],

  requiresCEMS: true,
  cemsParameters: ['CO2'],

  keyCitations: {
    applicability: '40 CFR 60.5508 - 60.5515',
    standards: '40 CFR 60.5520 - 60.5540',
    monitoring: '40 CFR 60.5535 - 60.5545',
    testMethods: '40 CFR 60.5535 (references Part 75)',
    reporting: '40 CFR 60.5550 - 60.5560',
  },
}

// ============================================================================
// PRIORITY 8: OIL & GAS (OOOOa)
// ============================================================================

/**
 * Subpart OOOOa - Crude Oil and Natural Gas Facilities (2016+)
 *
 * Comprehensive requirements for upstream oil & gas, including well sites,
 * compressor stations, and processing plants. Includes both LDAR and equipment
 * standards.
 */
export const SUBPART_OOOOa: Part60SubpartKnowledge = {
  subpart: 'OOOOa',
  title:
    'Standards of Performance for Crude Oil and Natural Gas Facilities for which Construction, Modification or Reconstruction Commenced After September 18, 2015',
  cfrSections: '60.5360a - 60.5499a',
  equipmentTypes: [
    'compressor',
    'storage-vessel',
    'pump',
    'valve',
    'connector',
    'pressure-relief-device',
    'flare',
  ],
  industries: ['oil-gas-upstream', 'oil-gas-midstream'],

  applicability: {
    description:
      'Well sites, centralized production facilities, compressor stations, and natural gas processing plants constructed after September 18, 2015',
    constructionDate: 'Construction commenced after September 18, 2015',
    exemptions: [
      'Facilities in the contiguous United States only',
      'Low production well sites (<15 boe/day)',
      'Stripper wells',
    ],
  },

  standards: [
    {
      parameter: 'VOC',
      limit: '95%',
      units: 'percent control',
      averagingPeriod: 'Control efficiency',
      conditions: ['Storage vessels with VOC emissions ≥6 tpy'],
    },
    {
      parameter: 'Methane',
      limit: '95%',
      units: 'percent control',
      averagingPeriod: 'Control efficiency',
      conditions: ['Pneumatic controllers, pumps at processing plants'],
    },
    {
      parameter: 'VOC',
      limit: '500',
      units: 'ppmv',
      averagingPeriod: 'Instantaneous',
      conditions: ['Fugitive emissions leak threshold'],
    },
  ],

  monitoring: [
    {
      parameter: 'VOC/Methane',
      method: 'ogi-monitoring',
      frequency: 'Semiannual (well sites), Quarterly (compressor stations)',
      specifications: {
        calibrationDrift: 'Per OGI protocol in 60.5397a',
      },
    },
    {
      parameter: 'VOC/Methane',
      method: 'ldar-monitoring',
      frequency: 'Alternative to OGI',
      specifications: {
        calibrationDrift: 'Method 21 protocol',
      },
    },
  ],

  testMethods: [
    {
      parameter: 'VOC/Methane',
      methods: ['OGI per 60.5397a', 'Method 21'],
      frequency: 'Per monitoring schedule',
      conditions: 'OGI is default; Method 21 is alternative',
    },
    {
      parameter: 'Control device efficiency',
      methods: ['Method 25A', 'Method 18'],
      frequency: 'Initial and when modified',
      conditions: 'Demonstrate 95% control',
    },
  ],

  reporting: [
    {
      reportType: 'Initial Annual Report',
      frequency: 'Annual',
      submitTo: 'EPA',
      contents: [
        'Facility identification',
        'Equipment counts by type',
        'Monitoring method used (OGI or Method 21)',
        'Leaks detected and repaired',
      ],
    },
    {
      reportType: 'Annual Report',
      frequency: 'Annual',
      submitTo: 'EPA',
      contents: [
        'Fugitive emissions monitoring results',
        'Leaks detected, repaired, and not repaired',
        'Delay of repair documentation',
        'Control device performance',
      ],
      dueDate: 'March 31 for previous calendar year',
    },
  ],

  recordkeeping: {
    records: [
      'Well site and equipment identification',
      'OGI or Method 21 monitoring records',
      'Leak detection dates and repair dates',
      'Video files if using OGI',
      'Control device monitoring data',
      'Pneumatic controller inventory',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart OOOO',
      relationship: 'replaces',
      notes: 'OOOO applies to 2011-2015 sources',
    },
    {
      regulation: '40 CFR Part 60 Subpart OOOOb',
      relationship: 'coordinates',
      notes: 'OOOOb (2024) has stricter requirements for newest sources',
    },
    {
      regulation: '40 CFR Part 63 Subpart HH',
      relationship: 'supplements',
      notes: 'Oil & gas HAPs source categories',
    },
  ],

  requiresCEMS: false,

  keyCitations: {
    applicability: '40 CFR 60.5360a - 60.5365a',
    standards: '40 CFR 60.5375a - 60.5395a',
    monitoring: '40 CFR 60.5397a',
    testMethods: '40 CFR 60.5400a - 60.5401a',
    reporting: '40 CFR 60.5420a',
  },
}

// ============================================================================
// KNOWLEDGE BASE INDEX
// ============================================================================

/** All indexed Part 60 subparts */
export const PART60_KNOWLEDGE_BASE: Record<string, Part60SubpartKnowledge> = {
  // CEM-based subparts
  Da: SUBPART_Da,
  Db: SUBPART_Db,
  Dc: SUBPART_Dc,
  TTTT: SUBPART_TTTT,
  GG: SUBPART_GG,
  KKKK: SUBPART_KKKK,
  J: SUBPART_J,
  Ja: SUBPART_Ja,
  IIII: SUBPART_IIII,
  JJJJ: SUBPART_JJJJ,
  // LDAR and non-CEM subparts
  VV: SUBPART_VV,
  VVa: SUBPART_VVa,
  Kb: SUBPART_Kb,
  // O&G and GHG subparts (Phase 5)
  OOOO: SUBPART_OOOO,
  OOOOa: SUBPART_OOOOa,
  OOOOb: SUBPART_OOOOb,
  UUUU: SUBPART_UUUU,
}

/** List of indexed subparts */
export const INDEXED_SUBPARTS = Object.keys(PART60_KNOWLEDGE_BASE)

/** Get subpart knowledge by ID */
export function getSubpartKnowledge(subpartId: string): Part60SubpartKnowledge | undefined {
  return PART60_KNOWLEDGE_BASE[subpartId]
}

/** Find subparts applicable to an equipment type */
export function findSubpartsByEquipment(
  equipmentType: Part60EquipmentType
): Part60SubpartKnowledge[] {
  return Object.values(PART60_KNOWLEDGE_BASE).filter((subpart) =>
    subpart.equipmentTypes.includes(equipmentType)
  )
}

/** Find subparts applicable to an industry */
export function findSubpartsByIndustry(industry: Part60Industry): Part60SubpartKnowledge[] {
  return Object.values(PART60_KNOWLEDGE_BASE).filter((subpart) =>
    subpart.industries.includes(industry)
  )
}

/** Find subparts that require CEMS for a specific parameter */
export function findSubpartsByParameter(parameter: string): Part60SubpartKnowledge[] {
  return Object.values(PART60_KNOWLEDGE_BASE).filter(
    (subpart) =>
      (subpart.cemsParameters?.includes(parameter) ?? false) ||
      subpart.standards.some((std) => std.parameter === parameter)
  )
}

/** Check if a subpart overlaps with Part 75 */
export function hasPartOverlap(subpartId: string): boolean {
  const subpart = PART60_KNOWLEDGE_BASE[subpartId]
  if (!subpart) return false
  return subpart.crossReferences.some(
    (ref) => ref.regulation.includes('Part 75') && ref.relationship === 'coordinates'
  )
}

/** Check if a Part 60 subpart has Part 63 overlap */
export function hasPart63Overlap(subpartId: string): boolean {
  const subpart = PART60_KNOWLEDGE_BASE[subpartId]
  if (!subpart) return false
  return subpart.crossReferences.some(
    (ref) => ref.regulation.includes('Part 63') && ref.relationship !== 'replaces'
  )
}

// ============================================================================
// MONITORING PLAN ANALYSIS
// ============================================================================

/** Input for analyzing a monitoring plan location */
export interface MonitoringPlanLocation {
  unitType: string // 'boiler', 'turbine', 'engine', etc.
  fuelType: string // 'coal', 'gas', 'oil', 'diesel', etc.
  parameters: string[] // ['SO2', 'NOX', 'CO2', etc.]
  methods: string[] // ['CEM', 'AD', 'LME', etc.]
  capacity?: number // MW or MMBtu/hr
  constructionDate?: string // ISO date string
  industryType?: string // 'electric-utility', 'industrial', etc.
}

/** Applicable subpart info */
export interface ApplicableSubpartInfo {
  subpart: string
  title: string
  reason: string
  confidence: 'high' | 'medium' | 'low'
}

/** Missing monitoring info */
export interface MissingMonitoringInfo {
  parameter: string
  requiredMethod: string
  subpart: string
}

/** Result of analyzing a monitoring plan */
export interface MonitoringPlanAnalysis {
  applicableSubparts: ApplicableSubpartInfo[]
  part75Overlap: boolean
  part75Notes: string | undefined
  warnings: string[]
  recommendations: string[]
  missingMonitoring: MissingMonitoringInfo[]
}

/**
 * Map user-friendly unit types to Part60EquipmentType
 */
function mapUnitTypeToEquipment(unitType: string): Part60EquipmentType[] {
  const normalized = unitType.toLowerCase()

  if (normalized.includes('boiler') || normalized.includes('steam')) {
    return ['steam-generator', 'boiler']
  }
  if (normalized.includes('turbine') || normalized.includes('ct') || normalized.includes('cct')) {
    return ['gas-turbine', 'combustion-turbine']
  }
  if (
    normalized.includes('diesel') ||
    normalized.includes('ci') ||
    normalized.includes('compression')
  ) {
    return ['ci-ice']
  }
  if (
    normalized.includes('engine') ||
    normalized.includes('si') ||
    normalized.includes('spark') ||
    normalized.includes('recip')
  ) {
    return ['si-ice']
  }
  if (normalized.includes('fccu') || normalized.includes('fcc')) {
    return ['fccu']
  }
  if (normalized.includes('claus')) {
    return ['claus-unit']
  }
  if (normalized.includes('heater')) {
    return ['process-heater']
  }
  if (normalized.includes('flare')) {
    return ['flare']
  }
  if (normalized.includes('tank') || normalized.includes('storage')) {
    return ['storage-vessel']
  }
  if (normalized.includes('valve')) {
    return ['valve']
  }
  if (normalized.includes('pump')) {
    return ['pump']
  }
  if (normalized.includes('compressor')) {
    return ['compressor']
  }

  return []
}

/**
 * Map fuel type to industry context
 */
function inferIndustryFromFuel(fuelType: string, unitType: string): Part60Industry | undefined {
  const fuel = fuelType.toLowerCase()
  const unit = unitType.toLowerCase()

  if (unit.includes('utility') || unit.includes('egu')) {
    return 'electric-utility'
  }
  if (fuel.includes('coal') || fuel.includes('lignite')) {
    return 'electric-utility' // Most coal units are utility
  }
  if (unit.includes('fccu') || unit.includes('refin')) {
    return 'petroleum-refining'
  }
  if (unit.includes('wellhead') || unit.includes('upstream')) {
    return 'oil-gas-upstream'
  }
  if (unit.includes('compressor') && fuel.includes('gas')) {
    return 'oil-gas-midstream'
  }

  return 'industrial' // Default to industrial
}

/**
 * Analyze a monitoring plan and determine applicable Part 60 subparts
 */
export function analyzeMonitoringPlan(locations: MonitoringPlanLocation[]): MonitoringPlanAnalysis {
  const applicableSubparts: MonitoringPlanAnalysis['applicableSubparts'] = []
  const warnings: string[] = []
  const recommendations: string[] = []
  const missingMonitoring: MonitoringPlanAnalysis['missingMonitoring'] = []
  let part75Overlap = false
  let part75Notes: string | undefined

  const seenSubparts = new Set<string>()

  for (const location of locations) {
    // Map unit type to equipment types
    const equipmentTypes = mapUnitTypeToEquipment(location.unitType)

    // Infer industry
    const industry = inferIndustryFromFuel(location.fuelType, location.unitType)

    // Find applicable subparts by equipment
    for (const eqType of equipmentTypes) {
      const subparts = findSubpartsByEquipment(eqType)

      for (const subpart of subparts) {
        if (seenSubparts.has(subpart.subpart)) continue

        // Check if parameters match
        const paramMatch = location.parameters.some(
          (p) =>
            (subpart.cemsParameters?.includes(p) ?? false) ||
            subpart.standards.some((std) => std.parameter === p)
        )

        // Check industry match
        const industryMatch = industry ? subpart.industries.includes(industry) : true

        if (paramMatch || industryMatch) {
          seenSubparts.add(subpart.subpart)

          // Determine confidence
          let confidence: 'high' | 'medium' | 'low' = 'low'
          let reason = `Equipment type ${location.unitType} may be subject to Subpart ${subpart.subpart}`

          if (paramMatch && industryMatch) {
            confidence = 'high'
            reason = `${location.unitType} monitoring ${location.parameters.join(', ')} in ${industry} industry`
          } else if (paramMatch) {
            confidence = 'medium'
            const matchedParams = location.parameters.filter(
              (p) =>
                (subpart.cemsParameters?.includes(p) ?? false) ||
                subpart.standards.some((std) => std.parameter === p)
            )
            reason = `Monitors ${matchedParams.join(', ')} which Subpart ${subpart.subpart} regulates`
          }

          applicableSubparts.push({
            subpart: subpart.subpart,
            title: subpart.title,
            reason,
            confidence,
          })

          // Check Part 75 overlap
          if (hasPartOverlap(subpart.subpart)) {
            part75Overlap = true
            part75Notes = `Subpart ${subpart.subpart} coordinates with Part 75. Use Part 75 CEMS data for Part 60 compliance.`
          }

          // Check for missing monitoring
          if (subpart.requiresCEMS && subpart.cemsParameters) {
            for (const requiredParam of subpart.cemsParameters) {
              if (!location.parameters.includes(requiredParam)) {
                missingMonitoring.push({
                  parameter: requiredParam,
                  requiredMethod: 'CEMS',
                  subpart: subpart.subpart,
                })
              }
            }
          }
        }
      }
    }

    // Check for LME eligibility issues
    if (location.methods.includes('LME')) {
      if (location.capacity !== undefined && location.capacity > 25) {
        warnings.push(
          `LME method used for ${location.unitType} but capacity (${location.capacity} MW) may exceed LME threshold. Verify <25 tons/year SO2 and NOx.`
        )
      }
      recommendations.push(
        `Verify LME eligibility per §75.19(a): <25 tons/year SO2 AND <25 tons/year NOx`
      )
    }

    // Check for Appendix D without fuel sampling
    if (location.methods.includes('AD')) {
      if (location.fuelType.toLowerCase().includes('oil')) {
        recommendations.push(
          `Appendix D for oil-fired ${location.unitType}: ensure sulfur sampling per delivery per Appendix D §2.2`
        )
      }
    }
  }

  // Sort by confidence
  applicableSubparts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.confidence] - order[b.confidence]
  })

  // Add general recommendations if Part 75 overlap
  if (part75Overlap) {
    recommendations.push(
      'Part 75 and Part 60 overlap detected. Use Part 75 substitute data procedures (more stringent) for both.'
    )
  }

  return {
    applicableSubparts,
    part75Overlap,
    part75Notes,
    warnings,
    recommendations,
    missingMonitoring,
  }
}

/**
 * Validate a monitoring method for a parameter and source type
 */
export function validateMethodForParameter(
  methodCode: string,
  parameterCode: string,
  sourceType: string,
  capacity?: number
): {
  valid: boolean
  cfrCitation: string
  requirements: string[]
  warnings: string[]
} {
  const method = methodCode.toUpperCase()
  const param = parameterCode.toUpperCase()
  const source = sourceType.toLowerCase()
  const requirements: string[] = []
  const warnings: string[] = []
  let valid = true
  let cfrCitation = '40 CFR 75'

  // CEM validation
  if (method === 'CEM') {
    const cemParams = ['SO2', 'NOX', 'NOXR', 'CO2', 'O2', 'FLOW']
    if (!cemParams.includes(param)) {
      valid = false
      warnings.push(`CEM not applicable for ${param}. CEM supports: ${cemParams.join(', ')}`)
    }
    cfrCitation = '40 CFR 75.10-75.18'
    requirements.push('Hourly data recording', 'Daily calibration', 'Quarterly linearity')
    requirements.push('Semi-annual RATA (or annual if <8,760 op hours)')
  }

  // Appendix D validation
  if (method === 'AD') {
    const adParams = ['SO2', 'CO2', 'HI']
    if (!adParams.includes(param)) {
      valid = false
      warnings.push(`Appendix D not applicable for ${param}. AD supports: ${adParams.join(', ')}`)
    }
    if (source.includes('coal')) {
      valid = false
      warnings.push('Appendix D not allowed for coal-fired units for SO2. Use CEMS.')
    }
    cfrCitation = '40 CFR 75 Appendix D'
    requirements.push('Fuel flow metering', 'GCV sampling per lot (oil) or monthly (gas)')
    requirements.push('Annual flowmeter accuracy test')
  }

  // LME validation
  if (method === 'LME') {
    cfrCitation = '40 CFR 75.19'
    if (capacity !== undefined && capacity > 25) {
      warnings.push(`Capacity ${capacity} MW may exceed LME threshold. Verify <25 tons/year.`)
    }
    requirements.push('Fuel-based calculations per §75.19')
    requirements.push('Annual LME eligibility verification')
    requirements.push('<25 tons SO2/year AND <25 tons NOx/year')
  }

  // Appendix E validation
  if (method === 'AE') {
    if (param !== 'NOXR') {
      valid = false
      warnings.push('Appendix E only applies to NOx rate (NOXR)')
    }
    if (!source.includes('gas')) {
      warnings.push('Appendix E typically used for gas-fired units')
    }
    cfrCitation = '40 CFR 75 Appendix E'
    requirements.push('Initial correlation test')
    requirements.push('Retest every 20 QA operating quarters (5 years)')
  }

  return { valid, cfrCitation, requirements, warnings }
}
