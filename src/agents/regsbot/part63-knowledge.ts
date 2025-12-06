/**
 * Part 63 NESHAPs Knowledge Base
 *
 * Pre-indexed regulatory knowledge for 40 CFR Part 63 subparts.
 * Covers National Emission Standards for Hazardous Air Pollutants (NESHAPs),
 * including MATS (UUUUU) and Industrial Boiler MACT (DDDDD).
 *
 * Key Difference from Part 60:
 * - Part 60 = Criteria pollutants (SO2, NOX, PM, CO)
 * - Part 63 = Hazardous Air Pollutants (HAPs) like Hg, HCl, metals, dioxins
 */

// ============================================================================
// TYPES
// ============================================================================

/** Equipment categories for Part 63 applicability */
export type Part63EquipmentType =
  | 'coal-fired-boiler'
  | 'oil-fired-boiler'
  | 'industrial-boiler'
  | 'process-heater'
  | 'igcc' // Integrated Gasification Combined Cycle
  | 'gas-turbine'
  | 'stationary-rice' // Reciprocating IC Engine
  | 'coal-egu'
  | 'oil-egu'

/** Industry sectors */
export type Part63Industry =
  | 'electric-utility'
  | 'petroleum-refining'
  | 'chemical-manufacturing'
  | 'pulp-paper'
  | 'industrial'
  | 'manufacturing'
  | 'oil-gas-upstream'
  | 'oil-gas-midstream'

/** ZZZZ-specific source categories */
export type ZZZZSourceCategory = 'major' | 'area'

/** ZZZZ-specific engine types */
export type ZZZZEngineType = 'ci' | 'si-rich-burn' | 'si-lean-burn' | 'si-other'

/** ZZZZ-specific use categories */
export type ZZZZUseCategory = 'emergency' | 'non-emergency'

/** ZZZZ requirements query input */
export interface ZZZZRequirementsQuery {
  sourceCategory: ZZZZSourceCategory
  engineType: ZZZZEngineType
  useCategory: ZZZZUseCategory
  horsepower: number
  isExisting?: boolean
}

/** ZZZZ requirements result */
export interface ZZZZRequirementsResult {
  emissionStandards?: Part63EmissionStandard[]
  monitoring?: Part63MonitoringSpec[]
  workPractice?: string
  testingRequired: boolean
  tuneUpFrequency: string
}

/** HAP categories regulated under Part 63 */
export type HAPCategory =
  | 'mercury'
  | 'acid-gases' // HCl, HF
  | 'non-hg-metals' // Arsenic, Cadmium, Chromium, Lead, Nickel, Selenium
  | 'organic-hap' // Dioxins, furans, formaldehyde
  | 'metals' // General HAP metals surrogate

/** Monitoring method types for Part 63 */
export type Part63MonitoringMethod =
  | 'CEMS' // Continuous emission monitoring system
  | 'CPMS' // Continuous parameter monitoring system
  | 'sorbent-trap' // Sorbent trap monitoring (Appendix K)
  | 'stack-test' // Periodic performance testing
  | 'fuel-analysis'
  | 'work-practice'
  | 'oxygen-trim'

/** Emission standard structure */
export interface Part63EmissionStandard {
  parameter: string
  limit: string
  units: string
  averagingPeriod: string
  conditions?: string[]
  subcategory?: string
}

/** Monitoring specification */
export interface Part63MonitoringSpec {
  parameter: string
  method: Part63MonitoringMethod
  frequency: string
  alternatives?: string[]
  specifications?: {
    span?: string
    calibrationDrift?: string
    relativeAccuracy?: string
  }
  dataRecovery?: string
}

/** Test method reference */
export interface Part63TestMethod {
  parameter: string
  methods: string[] // e.g., ["Method 29", "Method 30B"]
  frequency: string
  conditions?: string
}

/** Reporting requirement */
export interface Part63ReportingReq {
  reportType: string
  frequency: string
  submitTo: 'EPA' | 'State' | 'Both'
  contents: string[]
  dueDate?: string
}

/** Work practice standard */
export interface Part63WorkPractice {
  description: string
  frequency: string
  applicability?: string
  requirements: string[]
}

/** Cross-reference to other regulations */
export interface Part63CrossRef {
  regulation: string
  relationship: 'coordinates' | 'supplements' | 'replaces'
  notes?: string
}

/** Subcategory for IB MACT (by fuel type) */
export interface Part63Subcategory {
  name: string
  description: string
  fuelTypes?: string[]
}

/**
 * Complete knowledge structure for a Part 63 subpart
 */
export interface Part63SubpartKnowledge {
  /** Subpart identifier (e.g., "UUUUU", "DDDDD") */
  subpart: string

  /** Full regulatory title */
  title: string

  /** CFR section range */
  cfrSections: string

  /** Equipment types this subpart covers */
  equipmentTypes: Part63EquipmentType[]

  /** Industries where this equipment is commonly found */
  industries: Part63Industry[]

  /** HAP categories regulated */
  hapCategories: HAPCategory[]

  /** Applicability criteria */
  applicability: {
    description: string
    sizeThreshold?: string
    constructionDate?: string
    exemptions?: string[]
  }

  /** Subcategories (e.g., by fuel type for IB MACT) */
  subcategories?: Part63Subcategory[]

  /** Emission standards */
  standards: Part63EmissionStandard[]

  /** Monitoring requirements */
  monitoring: Part63MonitoringSpec[]

  /** Test methods */
  testMethods: Part63TestMethod[]

  /** Reporting requirements */
  reporting: Part63ReportingReq[]

  /** Work practice standards */
  workPractices?: Part63WorkPractice[]

  /** Recordkeeping */
  recordkeeping: {
    records: string[]
    retentionPeriod: string
  }

  /** Cross-references to related regulations */
  crossReferences: Part63CrossRef[]

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
// SUBPART UUUUU - MATS (Mercury and Air Toxics Standards)
// ============================================================================

export const SUBPART_UUUUU: Part63SubpartKnowledge = {
  subpart: 'UUUUU',
  title:
    'National Emission Standards for Hazardous Air Pollutants: Coal- and Oil-Fired Electric Utility Steam Generating Units (MATS)',
  cfrSections: '63.9980 - 63.10042',
  equipmentTypes: ['coal-fired-boiler', 'oil-fired-boiler', 'coal-egu', 'oil-egu', 'igcc'],
  industries: ['electric-utility'],
  hapCategories: ['mercury', 'acid-gases', 'non-hg-metals'],

  applicability: {
    description:
      'Coal- and oil-fired electric utility steam generating units (EGUs) that serve a generator >25 MW producing electricity for sale',
    sizeThreshold: '>25 MW net electric output',
    constructionDate: 'All existing and new sources',
    exemptions: [
      'Units firing <10% coal/oil on 12-month rolling heat input basis',
      'Units in non-continental areas with <25 MW and oil-fired',
      'Solid waste incineration units subject to Part 60 Subpart Eb or Ce',
      'Integrated gasification combined cycle units not burning coal/oil',
    ],
  },

  standards: [
    // Mercury - Coal Units
    {
      parameter: 'Hg',
      limit: '1.2',
      units: 'lb/TBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['coal', 'existing'],
    },
    {
      parameter: 'Hg',
      limit: '1.0',
      units: 'lb/TBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['coal', 'new'],
    },
    {
      parameter: 'Hg',
      limit: '0.013',
      units: 'lb/GWh',
      averagingPeriod: '30-day rolling average',
      conditions: ['coal', 'existing', 'output-based alternative'],
    },
    // Mercury - Oil Units
    {
      parameter: 'Hg',
      limit: '0.2',
      units: 'lb/TBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['oil', 'existing'],
    },
    {
      parameter: 'Hg',
      limit: '0.2',
      units: 'lb/TBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['oil', 'new'],
    },
    // HCl - Acid Gas Surrogate
    {
      parameter: 'HCl',
      limit: '0.002',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average or 3-run average',
      conditions: ['coal', 'existing'],
    },
    {
      parameter: 'HCl',
      limit: '0.001',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average or 3-run average',
      conditions: ['coal', 'new'],
    },
    {
      parameter: 'HCl',
      limit: '0.0004',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average or 3-run average',
      conditions: ['oil'],
    },
    // SO2 as Alternate Acid Gas Surrogate
    {
      parameter: 'SO2',
      limit: '0.20',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average',
      conditions: ['coal', 'existing', 'alternate acid gas'],
    },
    // PM - HAP Metals Surrogate (Filterable PM)
    {
      parameter: 'PM',
      limit: '0.030',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average or 3-run average',
      conditions: ['coal', 'existing'],
      subcategory: 'Filterable PM (non-Hg metals surrogate)',
    },
    {
      parameter: 'PM',
      limit: '0.090',
      units: 'lb/MWh',
      averagingPeriod: '30-day rolling average or 3-run average',
      conditions: ['coal', 'existing', 'output-based alternative'],
      subcategory: 'Filterable PM (non-Hg metals surrogate)',
    },
    {
      parameter: 'PM',
      limit: '0.020',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average or 3-run average',
      conditions: ['coal', 'new'],
      subcategory: 'Filterable PM (non-Hg metals surrogate)',
    },
    {
      parameter: 'PM',
      limit: '0.03',
      units: 'lb/MMBtu',
      averagingPeriod: '30-day rolling average or 3-run average',
      conditions: ['oil'],
      subcategory: 'Filterable PM (non-Hg metals surrogate)',
    },
  ],

  monitoring: [
    {
      parameter: 'Hg',
      method: 'CEMS',
      frequency: 'Continuous',
      alternatives: ['sorbent-trap'],
      specifications: {
        relativeAccuracy: '20% or 1.0 µg/scm',
      },
      dataRecovery: '≥90% quarterly',
    },
    {
      parameter: 'HCl',
      method: 'CEMS',
      frequency: 'Continuous',
      alternatives: ['stack-test'],
      dataRecovery: '≥90% quarterly',
    },
    {
      parameter: 'SO2',
      method: 'CEMS',
      frequency: 'Continuous (if using SO2 as acid gas surrogate)',
      dataRecovery: '≥95% quarterly (per Part 75)',
    },
    {
      parameter: 'PM',
      method: 'CPMS',
      frequency: 'Continuous',
      alternatives: ['stack-test'],
      specifications: {
        span: 'Site-specific operating limit',
      },
    },
  ],

  testMethods: [
    {
      parameter: 'Hg',
      methods: ['Method 30B', 'Appendix K sorbent trap'],
      frequency: 'Initial and ongoing RATA annually',
    },
    {
      parameter: 'HCl',
      methods: ['Method 26A', 'ASTM D6348'],
      frequency: 'Quarterly (if not using CEMS)',
    },
    {
      parameter: 'PM',
      methods: ['Method 5', 'Method 5D', 'Method 17'],
      frequency: 'Quarterly (if not using PM CPMS)',
      conditions: 'Filterable PM only',
    },
    {
      parameter: 'Non-Hg HAP Metals',
      methods: ['Method 29'],
      frequency: 'Initial and triennial',
      conditions: 'If electing metals HAP alternative to PM',
    },
  ],

  reporting: [
    {
      reportType: 'Compliance Report (electronic)',
      frequency: 'Semiannual',
      submitTo: 'EPA',
      contents: [
        'Emission data summary',
        'Deviations from emission limits',
        'Monitoring system performance',
        'Submit via ECMPS or CEDRI',
      ],
    },
    {
      reportType: 'Initial Notification',
      frequency: 'Once',
      submitTo: 'Both',
      contents: ['Unit identification', 'Applicable subcategory', 'Compliance date'],
    },
    {
      reportType: 'Notification of Compliance Status',
      frequency: 'Once (within 60 days of compliance date)',
      submitTo: 'Both',
      contents: ['Test results', 'Monitoring approach', 'Compliance demonstration'],
    },
  ],

  workPractices: [
    {
      description: 'Startup and shutdown work practice',
      frequency: 'Each startup/shutdown',
      applicability: 'All affected sources',
      requirements: [
        'Follow startup/shutdown work practice plan',
        'Minimize emissions during startup',
        'Maintain records of startup/shutdown duration',
      ],
    },
    {
      description: 'Annual tune-up for limited-use liquid oil-fired EGUs',
      frequency: 'Annual',
      applicability: 'Oil-fired EGUs operating <8% capacity factor',
      requirements: [
        'Inspect combustion system',
        'Optimize combustion',
        'Maintain combustion efficiency',
      ],
    },
    {
      description: 'Tune-up for units not operating for 2+ years',
      frequency: 'Prior to restart',
      applicability: 'Units with extended outages',
      requirements: [
        'Combustion system inspection',
        'Burner/combustion optimization',
        'Document work practice completion',
      ],
    },
  ],

  recordkeeping: {
    records: [
      'All monitoring data (hourly values)',
      'Performance test results',
      'Startup/shutdown records',
      'Malfunction records',
      'Calibration and maintenance records',
      'Fuel analysis records',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: 'Part 75 (Acid Rain)',
      relationship: 'coordinates',
      notes:
        'Use Part 75 monitoring data for operating parameters. MATS Hg monitoring follows Part 75 Appendix A.',
    },
    {
      regulation: 'Part 60 Subpart Da',
      relationship: 'coordinates',
      notes: 'MATS applies in addition to Part 60 Da for coal/oil EGUs.',
    },
    {
      regulation: 'Part 60 Subpart TTTT',
      relationship: 'coordinates',
      notes: 'GHG requirements apply separately from HAP requirements.',
    },
  ],

  keyCitations: {
    applicability: '§63.9984',
    standards: '§63.9991',
    monitoring: '§63.10010',
    testMethods: '§63.10007',
    reporting: '§63.10031',
  },
}

// ============================================================================
// SUBPART DDDDD - INDUSTRIAL BOILER MACT (Major Sources)
// ============================================================================

export const SUBPART_DDDDD: Part63SubpartKnowledge = {
  subpart: 'DDDDD',
  title:
    'National Emission Standards for Hazardous Air Pollutants for Major Sources: Industrial, Commercial, and Institutional Boilers and Process Heaters',
  cfrSections: '63.7480 - 63.7575',
  equipmentTypes: ['industrial-boiler', 'process-heater'],
  industries: [
    'petroleum-refining',
    'chemical-manufacturing',
    'pulp-paper',
    'industrial',
    'manufacturing',
  ],
  hapCategories: ['mercury', 'acid-gases', 'non-hg-metals', 'metals', 'organic-hap'],

  applicability: {
    description:
      'Industrial, commercial, and institutional boilers and process heaters at major sources of HAP',
    sizeThreshold: 'No minimum size (major source determination)',
    constructionDate: 'All existing and new sources at major HAP sources',
    exemptions: [
      'Units subject to Part 63 Subpart UUUUU (EGUs)',
      'Gas-fired boilers (gas 1 subcategory has limited requirements)',
      'Units <10 MMBtu/hr firing gas 2 fuels',
      'Hot water heaters',
      'Temporary boilers',
      'Residential boilers',
    ],
  },

  subcategories: [
    {
      name: 'Coal',
      description: 'Coal-fired boilers (stoker, fluidized bed, pulverized)',
      fuelTypes: ['coal', 'coal refuse'],
    },
    {
      name: 'Biomass',
      description: 'Biomass/bio-based solid fuel boilers',
      fuelTypes: ['wood', 'agricultural residue', 'biomass'],
    },
    {
      name: 'Solid Fuel',
      description: 'Other solid fuel boilers',
      fuelTypes: ['solid fuel', 'tire-derived fuel'],
    },
    {
      name: 'Liquid',
      description: 'Liquid fuel-fired boilers (heavy oil, light oil)',
      fuelTypes: ['residual oil', 'distillate oil'],
    },
    {
      name: 'Gas 1',
      description: 'Natural gas, refinery gas, or other gas 1 fuel (work practice only)',
      fuelTypes: ['natural gas', 'refinery fuel gas', 'landfill gas'],
    },
    {
      name: 'Gas 2',
      description: 'Process gases with HAP content',
      fuelTypes: ['process gas', 'biogas with HAP'],
    },
  ],

  standards: [
    // PM Standards (by subcategory)
    {
      parameter: 'PM',
      limit: '0.040',
      units: 'lb/MMBtu',
      averagingPeriod: '3-run average',
      conditions: ['coal', 'existing', 'stoker'],
      subcategory: 'Coal',
    },
    {
      parameter: 'PM',
      limit: '0.025',
      units: 'lb/MMBtu',
      averagingPeriod: '3-run average',
      conditions: ['coal', 'existing', 'fluidized bed'],
      subcategory: 'Coal',
    },
    {
      parameter: 'PM',
      limit: '0.030',
      units: 'lb/MMBtu',
      averagingPeriod: '3-run average',
      conditions: ['biomass', 'existing'],
      subcategory: 'Biomass',
    },
    {
      parameter: 'PM',
      limit: '0.020',
      units: 'lb/MMBtu',
      averagingPeriod: '3-run average',
      conditions: ['liquid', 'existing'],
      subcategory: 'Liquid',
    },
    // HCl Standards
    {
      parameter: 'HCl',
      limit: '0.022',
      units: 'lb/MMBtu',
      averagingPeriod: '3-run average',
      conditions: ['coal', 'existing'],
      subcategory: 'Coal',
    },
    {
      parameter: 'HCl',
      limit: '0.0037',
      units: 'lb/MMBtu',
      averagingPeriod: '3-run average',
      conditions: ['biomass', 'existing'],
      subcategory: 'Biomass',
    },
    {
      parameter: 'HCl',
      limit: '0.00067',
      units: 'lb/MMBtu',
      averagingPeriod: '3-run average',
      conditions: ['liquid', 'existing'],
      subcategory: 'Liquid',
    },
    // Mercury Standards
    {
      parameter: 'Hg',
      limit: '5.7E-06',
      units: 'lb/MMBtu',
      averagingPeriod: '3-run average',
      conditions: ['coal', 'existing'],
      subcategory: 'Coal',
    },
    {
      parameter: 'Hg',
      limit: '4.2E-06',
      units: 'lb/MMBtu',
      averagingPeriod: '3-run average',
      conditions: ['biomass', 'existing'],
      subcategory: 'Biomass',
    },
    // CO Standards (organic HAP surrogate)
    {
      parameter: 'CO',
      limit: '130',
      units: 'ppm @ 3% O2',
      averagingPeriod: '10-day rolling average or 3-run average',
      conditions: ['coal', 'existing'],
      subcategory: 'Coal',
    },
    {
      parameter: 'CO',
      limit: '460',
      units: 'ppm @ 3% O2',
      averagingPeriod: '10-day rolling average or 3-run average',
      conditions: ['biomass', 'existing'],
      subcategory: 'Biomass',
    },
    {
      parameter: 'CO',
      limit: '130',
      units: 'ppm @ 3% O2',
      averagingPeriod: '10-day rolling average or 3-run average',
      conditions: ['liquid', 'existing'],
      subcategory: 'Liquid',
    },
  ],

  monitoring: [
    {
      parameter: 'PM',
      method: 'stack-test',
      frequency: 'Annual or triennial (depending on compliance margin)',
      alternatives: ['CPMS'],
    },
    {
      parameter: 'PM',
      method: 'CPMS',
      frequency: 'Continuous',
      alternatives: ['stack-test'],
      specifications: {
        span: 'Site-specific operating limit based on initial test',
      },
    },
    {
      parameter: 'HCl',
      method: 'stack-test',
      frequency: 'Annual or triennial',
      alternatives: ['fuel-analysis'],
    },
    {
      parameter: 'Hg',
      method: 'stack-test',
      frequency: 'Annual or triennial',
      alternatives: ['fuel-analysis'],
    },
    {
      parameter: 'CO',
      method: 'CEMS',
      frequency: 'Continuous',
      alternatives: ['stack-test'],
      dataRecovery: '≥90%',
    },
    {
      parameter: 'O2',
      method: 'CEMS',
      frequency: 'Continuous (for CO correction to 3% O2)',
      dataRecovery: '≥90%',
    },
  ],

  testMethods: [
    {
      parameter: 'PM',
      methods: ['Method 5', 'Method 5D', 'Method 17', 'Method 29'],
      frequency: 'Annual (first 2 yrs), then triennial if low emitting',
    },
    {
      parameter: 'HCl',
      methods: ['Method 26', 'Method 26A', 'ASTM D6348'],
      frequency: 'Annual or triennial',
    },
    {
      parameter: 'Hg',
      methods: ['Method 29', 'Method 30A', 'Method 30B'],
      frequency: 'Annual or triennial',
    },
    {
      parameter: 'CO',
      methods: ['Method 10'],
      frequency: 'If not using CEMS',
    },
    {
      parameter: 'Dioxins/Furans',
      methods: ['Method 23'],
      frequency: 'Initial (coal, biomass subcategories)',
      conditions: 'One-time test for solid fuel units',
    },
  ],

  reporting: [
    {
      reportType: 'Compliance Report',
      frequency: 'Semiannual',
      submitTo: 'Both',
      contents: [
        'Summary of compliance status',
        'Deviations from standards',
        'Stack test results (if conducted)',
        'Monitoring data summary',
        'Submit via CEDRI (electronic)',
      ],
    },
    {
      reportType: 'Initial Notification',
      frequency: 'Once (within 120 days of effective date)',
      submitTo: 'Both',
      contents: ['Unit identification', 'Applicable subcategory', 'Expected compliance date'],
    },
    {
      reportType: 'Notification of Compliance Status',
      frequency: 'Once (within 60 days of initial compliance test)',
      submitTo: 'Both',
      contents: ['Test results', 'Operating limits established', 'Compliance demonstration method'],
    },
  ],

  workPractices: [
    {
      description: 'Energy assessment for large boilers',
      frequency: 'Once (initial)',
      applicability: 'Boilers ≥10 MMBtu/hr',
      requirements: [
        'Identify energy conservation measures',
        'Evaluate implementation costs',
        'Document assessment results',
      ],
    },
    {
      description: 'Tune-up work practice',
      frequency: 'Biennial for oil/gas, annual for solid fuel',
      applicability: 'All boilers',
      requirements: [
        'Inspect burner and combustion system',
        'Measure CO and O2 in stack',
        'Optimize air-to-fuel ratio',
        'Inspect system for leaks',
        'Maintain tune-up records',
      ],
    },
    {
      description: 'Startup and shutdown work practice',
      frequency: 'Each startup/shutdown',
      applicability: 'All boilers',
      requirements: [
        'Follow manufacturer procedures',
        'Minimize emissions during startup',
        'Use clean startup fuel where practical',
      ],
    },
  ],

  recordkeeping: {
    records: [
      'Fuel analysis records',
      'Stack test results',
      'CPMS/CEMS data (if applicable)',
      'Operating parameter data',
      'Tune-up records',
      'Energy assessment (if required)',
      'Startup/shutdown records',
      'Malfunction and deviation records',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: 'Part 60 Subpart Db',
      relationship: 'coordinates',
      notes:
        'Industrial boilers may be subject to both Part 60 Db (criteria pollutants) and Part 63 DDDDD (HAPs).',
    },
    {
      regulation: 'Part 60 Subpart Dc',
      relationship: 'coordinates',
      notes: 'Small industrial boilers may be subject to Part 60 Dc in addition to IB MACT.',
    },
    {
      regulation: 'Part 63 Subpart JJJJJJ',
      relationship: 'supplements',
      notes: 'Area sources use Subpart JJJJJJ instead of DDDDD. Major sources use DDDDD.',
    },
  ],

  keyCitations: {
    applicability: '§63.7485',
    standards: '§63.7500 - §63.7515',
    monitoring: '§63.7525 - §63.7535',
    testMethods: '§63.7520',
    reporting: '§63.7545 - §63.7550',
  },
}

// ============================================================================
// SUBPART ZZZZ - STATIONARY RICE (Reciprocating Internal Combustion Engines)
// ============================================================================

/**
 * Extended applicability for Subpart ZZZZ with engine-specific criteria
 */
export interface ZZZZApplicability {
  description: string
  majorSource: string
  areaSource: string
  engineTypes: ZZZZEngineType[]
  useCategories: ZZZZUseCategory[]
  sizeThresholds: { threshold: string; description: string }[]
  exemptions?: string[]
}

/**
 * Subpart ZZZZ with extended applicability structure
 */
export interface Part63SubpartZZZZ extends Omit<Part63SubpartKnowledge, 'applicability'> {
  applicability: ZZZZApplicability
}

export const SUBPART_ZZZZ: Part63SubpartZZZZ = {
  subpart: 'ZZZZ',
  title:
    'National Emission Standards for Hazardous Air Pollutants for Stationary Reciprocating Internal Combustion Engines (RICE)',
  cfrSections: '63.6580 - 63.6675',
  equipmentTypes: ['stationary-rice'],
  industries: ['industrial', 'oil-gas-upstream', 'oil-gas-midstream', 'manufacturing'],
  hapCategories: ['organic-hap'],

  applicability: {
    description:
      'Stationary RICE at major and area sources of HAP emissions. Requirements vary by source category, engine type, use category, and size.',
    majorSource:
      'Facilities with potential to emit ≥10 tons/year of any single HAP or ≥25 tons/year combined HAPs',
    areaSource:
      'Facilities below major source thresholds. Work practice standards typically apply.',
    engineTypes: ['ci', 'si-rich-burn', 'si-lean-burn', 'si-other'],
    useCategories: ['emergency', 'non-emergency'],
    sizeThresholds: [
      { threshold: '500 hp', description: 'Engines ≥500 hp have more stringent requirements' },
      {
        threshold: '100 hp',
        description: 'Engines 100-500 hp have intermediate requirements at major sources',
      },
      { threshold: '<100 hp', description: 'Small engines often qualify for work practice only' },
    ],
    exemptions: [
      'Engines at residential locations',
      'Research and development engines',
      'Engines testing at manufacturer facilities',
      'Engines used for national security purposes',
      'Emergency engines limited to 100 hours/year for non-emergency use',
    ],
  },

  standards: [
    // Major Source CI Engines
    {
      parameter: 'CO',
      limit: '23',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      subcategory: 'New CI major source ≥500 hp',
    },
    {
      parameter: 'Formaldehyde',
      limit: '2.7',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: 'Performance test',
      subcategory: 'New CI major source ≥500 hp',
    },
    // Major Source SI Lean-Burn
    {
      parameter: 'CO',
      limit: '47',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      subcategory: 'New SI lean-burn major source ≥500 hp',
    },
    {
      parameter: 'Formaldehyde',
      limit: '5.0',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: 'Performance test',
      subcategory: 'New SI lean-burn major source ≥500 hp',
    },
    // Major Source SI Rich-Burn
    {
      parameter: 'CO',
      limit: '270',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      subcategory: 'New SI rich-burn major source ≥500 hp',
    },
    {
      parameter: 'Formaldehyde',
      limit: '2.7',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: 'Performance test',
      subcategory: 'New SI rich-burn major source ≥500 hp',
    },
    // Area Source - Work Practice
    {
      parameter: 'Work Practice',
      limit: 'Management practices',
      units: 'N/A',
      averagingPeriod: 'Ongoing',
      subcategory: 'Area source - non-emergency engines',
      conditions: [
        'Change oil and filter per manufacturer specs',
        'Inspect air cleaner',
        'Inspect spark plugs or fuel injectors',
      ],
    },
    {
      parameter: 'Work Practice',
      limit: 'Limited operation',
      units: 'N/A',
      averagingPeriod: 'Annual',
      subcategory: 'Area source - emergency engines',
      conditions: [
        '100 hours/year limit for non-emergency use',
        'Readiness testing and maintenance allowed',
      ],
    },
    // Existing Engine Standards (less stringent)
    {
      parameter: 'CO',
      limit: '49',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      subcategory: 'Existing CI major source ≥500 hp',
    },
    {
      parameter: 'Formaldehyde',
      limit: '5.5',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: 'Performance test',
      subcategory: 'Existing CI major source ≥500 hp',
    },
  ],

  monitoring: [
    {
      parameter: 'CO',
      method: 'CEMS',
      frequency: 'Continuous',
      alternatives: ['CPMS with operating limits', 'Periodic stack test'],
      specifications: {
        span: '200 ppmvd (typical)',
        calibrationDrift: '5% daily, 10% quarterly',
        relativeAccuracy: '10%',
      },
      dataRecovery: '95% minimum',
    },
    {
      parameter: 'Catalyst inlet temperature',
      method: 'CPMS',
      frequency: 'Continuous (if oxidation catalyst used)',
      dataRecovery: '95% minimum',
    },
    {
      parameter: 'Operating parameters',
      method: 'CPMS',
      frequency: 'Continuous',
      alternatives: ['Non-resettable hour meter'],
    },
    {
      parameter: 'Formaldehyde',
      method: 'stack-test',
      frequency: 'Initial + every 8,760 hours or 3 years',
    },
  ],

  testMethods: [
    {
      parameter: 'CO',
      methods: ['Method 10', 'ASTM D6522'],
      frequency: 'Initial + every 8,760 hours or 3 years (or use CEMS)',
    },
    {
      parameter: 'Formaldehyde',
      methods: ['Method 320', 'Method 323'],
      frequency: 'Initial + every 8,760 hours or 3 years',
    },
    {
      parameter: 'O2',
      methods: ['Method 3A'],
      frequency: 'Concurrent with CO/formaldehyde testing',
    },
  ],

  reporting: [
    {
      reportType: 'Initial Notification',
      frequency: 'One-time',
      submitTo: 'EPA',
      contents: [
        'Engine identification',
        'Location',
        'Engine type (CI/SI)',
        'Use category (emergency/non-emergency)',
        'Rated power (hp)',
        'Date of construction/reconstruction',
      ],
    },
    {
      reportType: 'Notification of Compliance Status',
      frequency: 'One-time (within 120 days of compliance date)',
      submitTo: 'EPA',
      contents: [
        'Engine identification',
        'Results of initial performance test',
        'Operating limits established',
      ],
    },
    {
      reportType: 'Semiannual Compliance Report',
      frequency: 'Semiannual',
      submitTo: 'EPA',
      contents: [
        'Summary of deviations',
        'CEMS/CPMS data summary',
        'Operating hours for emergency engines',
        'Maintenance and tune-up records',
      ],
    },
  ],

  workPractices: [
    {
      description: 'Oil and filter change',
      frequency: 'Per manufacturer recommendation or every 500 hours',
      applicability: 'All engines',
      requirements: [
        'Change oil per manufacturer specifications',
        'Replace oil filter',
        'Document date and operating hours at change',
      ],
    },
    {
      description: 'Tune-up',
      frequency: 'Annual for engines ≥500 hp, biennial for <500 hp',
      applicability: 'All non-emergency engines',
      requirements: [
        'Inspect spark plugs (SI) or fuel injectors (CI)',
        'Inspect air cleaner and hoses',
        'Change oil and filter if not done recently',
        'Inspect all exhaust system components',
        'For SI engines: measure and optimize air-to-fuel ratio',
      ],
    },
    {
      description: 'Emergency engine operating limits',
      frequency: 'Continuous tracking',
      applicability: 'Emergency engines only',
      requirements: [
        '100 hours per year maximum for non-emergency operation',
        'Unlimited hours for emergency operation',
        '50 hours for maintenance and readiness testing',
        'Maintain operating log with reason for operation',
      ],
    },
    {
      description: 'Fuel requirements for CI engines',
      frequency: 'Per fuel delivery',
      applicability: 'All CI engines',
      requirements: [
        'Use ultra-low sulfur diesel (ULSD, 15 ppm S max)',
        'Obtain and retain fuel supplier certification',
        'No used oil as fuel unless permitted',
      ],
    },
  ],

  recordkeeping: {
    records: [
      'Operating hours (non-resettable hour meter)',
      'Fuel consumption records',
      'Fuel sulfur content documentation',
      'Maintenance and tune-up records',
      'Performance test results',
      'CEMS/CPMS calibration and QA records',
      'Deviation reports',
      'Malfunction and corrective action records',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart IIII',
      relationship: 'coordinates',
      notes:
        'Part 60 IIII covers criteria pollutant (NOX, PM, CO) standards for CI engines. ZZZZ adds HAP requirements. Compliance with both is required for affected CI engines.',
    },
    {
      regulation: '40 CFR Part 60 Subpart JJJJ',
      relationship: 'coordinates',
      notes:
        'Part 60 JJJJ covers criteria pollutant standards for SI engines. ZZZZ adds HAP requirements. Compliance with both is required for affected SI engines.',
    },
    {
      regulation: '40 CFR Part 63 Subpart A',
      relationship: 'supplements',
      notes: 'General Provisions apply to all Part 63 subparts including ZZZZ.',
    },
  ],

  keyCitations: {
    applicability: '40 CFR 63.6585 - 63.6590',
    standards: '40 CFR 63.6600 - 63.6612',
    monitoring: '40 CFR 63.6625 - 63.6635',
    testMethods: '40 CFR 63.6620',
    reporting: '40 CFR 63.6650 - 63.6660',
  },
}

// ============================================================================
// SUBPART YYYY - Stationary Combustion Turbines NESHAP
// ============================================================================

export const SUBPART_YYYY: Part63SubpartKnowledge = {
  subpart: 'YYYY',
  title:
    'National Emission Standards for Hazardous Air Pollutants for Stationary Combustion Turbines',
  cfrSections: '63.6080 - 63.6175',
  equipmentTypes: ['gas-turbine'],
  industries: ['electric-utility', 'industrial', 'oil-gas-midstream'],
  hapCategories: ['organic-hap'],

  applicability: {
    description:
      'Stationary combustion turbines located at major sources of HAP emissions. Covers both new and existing turbines.',
    sizeThreshold: '>1 MW rated peak power output',
    constructionDate:
      'Existing: construction commenced before 1/14/2003. New: construction commenced on or after 1/14/2003',
    exemptions: [
      'Emergency turbines (≤500 hours/year)',
      'Turbines firing landfill gas or digester gas subject to other regulations',
      'Turbines used for research and development',
      'Turbines at area sources (below major source thresholds)',
      'Turbines combusting only natural gas with oxidation catalyst (lean premix)',
      'Diffusion flame turbines meeting fuel specification',
    ],
  },

  standards: [
    // Formaldehyde - New Turbines with Oxidation Catalyst
    {
      parameter: 'Formaldehyde',
      limit: '91',
      units: 'ppbvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      conditions: ['New turbine', 'With oxidation catalyst'],
    },
    // Formaldehyde - Existing Turbines with Oxidation Catalyst
    {
      parameter: 'Formaldehyde',
      limit: '91',
      units: 'ppbvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      conditions: ['Existing turbine', 'With oxidation catalyst'],
    },
    // Formaldehyde - Lean Premix New Turbines
    {
      parameter: 'Formaldehyde',
      limit: '91',
      units: 'ppbvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      conditions: ['New lean premix turbine'],
    },
    // HAP emission rate (alternative)
    {
      parameter: 'Total HAP',
      limit: '1.0',
      units: 'ppmvd @ 15% O2',
      averagingPeriod: '4-hour average',
      conditions: ['Alternative to formaldehyde limit'],
    },
  ],

  monitoring: [
    {
      parameter: 'Formaldehyde',
      method: 'stack-test',
      frequency: 'Annual or less frequent with good compliance history',
      alternatives: ['CEMS if approved'],
    },
    {
      parameter: 'Catalyst Inlet Temperature',
      method: 'CPMS',
      frequency: 'Continuous',
      specifications: {
        calibrationDrift: '±2% of span',
      },
      dataRecovery: '95%',
    },
    {
      parameter: 'Operating Hours',
      method: 'CPMS',
      frequency: 'Continuous',
      alternatives: ['Hour meter', 'Electronic tracking'],
    },
  ],

  testMethods: [
    {
      parameter: 'Formaldehyde',
      methods: ['Method 320', 'Method 323'],
      frequency: 'Initial and periodic performance testing',
      conditions: 'During normal steady-state operation',
    },
    {
      parameter: 'HAP Metals',
      methods: ['Method 29'],
      frequency: 'If required by permit',
      conditions: 'Fuel analysis may be used as alternative',
    },
    {
      parameter: 'Oxygen',
      methods: ['Method 3A', 'Method 3B'],
      frequency: 'Concurrent with formaldehyde testing',
    },
  ],

  reporting: [
    {
      reportType: 'Initial Notification',
      frequency: 'One-time',
      submitTo: 'Both',
      contents: [
        'Facility identification',
        'Description of affected turbines',
        'Expected compliance date',
      ],
      dueDate: '120 days before compliance date or upon startup',
    },
    {
      reportType: 'Notification of Compliance Status',
      frequency: 'One-time',
      submitTo: 'Both',
      contents: ['Description of methods used to achieve compliance', 'Test results'],
      dueDate: '60 days after initial performance test',
    },
    {
      reportType: 'Compliance Report',
      frequency: 'Semiannual',
      submitTo: 'Both',
      contents: [
        'Summary of operating conditions',
        'Deviations from emission limits',
        'Actions taken to correct deviations',
        'Operating hours summary',
      ],
    },
  ],

  workPractices: [
    {
      description: 'Fuel Specification',
      frequency: 'Continuous',
      applicability: 'Diffusion flame turbines without add-on controls',
      requirements: [
        'Burn only pipeline-quality natural gas',
        'Or fuel meeting sulfur content specification',
        'Maintain fuel receipts and analyses',
      ],
    },
    {
      description: 'Startup and Shutdown',
      frequency: 'Each event',
      applicability: 'All turbines with oxidation catalyst',
      requirements: [
        'Minimize startup and shutdown duration',
        'Follow manufacturer procedures',
        'Catalyst bypass allowed during cold startup until operating temperature reached',
      ],
    },
    {
      description: 'Oxidation Catalyst Maintenance',
      frequency: 'Per manufacturer recommendations',
      applicability: 'Turbines using oxidation catalyst for compliance',
      requirements: [
        'Inspect catalyst annually',
        'Replace catalyst per manufacturer schedule',
        'Maintain catalyst inlet temperature within operating range',
      ],
    },
  ],

  recordkeeping: {
    records: [
      'Operating hours for each turbine',
      'Fuel consumption records',
      'Fuel sulfur content analyses (if applicable)',
      'Performance test results',
      'Catalyst inlet temperature data',
      'Deviation and corrective action records',
      'Maintenance records for emission controls',
    ],
    retentionPeriod: '5 years',
  },

  crossReferences: [
    {
      regulation: '40 CFR Part 60 Subpart KKKK',
      relationship: 'coordinates',
      notes:
        'Part 60 KKKK covers NOx emission standards for new stationary combustion turbines. YYYY adds HAP requirements. Both may apply to major source turbines.',
    },
    {
      regulation: '40 CFR Part 60 Subpart GG',
      relationship: 'coordinates',
      notes:
        'Part 60 GG covers older stationary gas turbines (pre-2006). YYYY adds HAP requirements to GG-affected turbines at major sources.',
    },
    {
      regulation: '40 CFR Part 63 Subpart A',
      relationship: 'supplements',
      notes: 'General Provisions apply to all Part 63 subparts including YYYY.',
    },
    {
      regulation: '40 CFR Part 75',
      relationship: 'coordinates',
      notes:
        'Part 75 CEMS requirements may provide compliance data for turbines in Acid Rain Program.',
    },
  ],

  keyCitations: {
    applicability: '40 CFR 63.6085',
    standards: '40 CFR 63.6090 - 63.6100',
    monitoring: '40 CFR 63.6115 - 63.6135',
    testMethods: '40 CFR 63.6120',
    reporting: '40 CFR 63.6145 - 63.6155',
  },
}

// ============================================================================
// KNOWLEDGE BASE INDEX
// ============================================================================

/** All indexed Part 63 subparts */
export const INDEXED_PART63_SUBPARTS = ['UUUUU', 'DDDDD', 'ZZZZ', 'YYYY'] as const

export type IndexedPart63Subpart = (typeof INDEXED_PART63_SUBPARTS)[number]

/** Knowledge base lookup by subpart */
export const PART63_KNOWLEDGE_BASE: Record<string, Part63SubpartKnowledge | Part63SubpartZZZZ> = {
  UUUUU: SUBPART_UUUUU,
  DDDDD: SUBPART_DDDDD,
  ZZZZ: SUBPART_ZZZZ,
  YYYY: SUBPART_YYYY,
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get knowledge for a specific Part 63 subpart
 */
export function getPart63SubpartKnowledge(subpartId: string): Part63SubpartKnowledge | undefined {
  return PART63_KNOWLEDGE_BASE[subpartId]
}

/**
 * Find Part 63 subparts by equipment type
 */
export function findPart63SubpartsByEquipment(
  equipmentType: Part63EquipmentType
): Part63SubpartKnowledge[] {
  return Object.values(PART63_KNOWLEDGE_BASE).filter((subpart) =>
    subpart.equipmentTypes.includes(equipmentType)
  )
}

/**
 * Find Part 63 subparts by industry
 */
export function findPart63SubpartsByIndustry(industry: Part63Industry): Part63SubpartKnowledge[] {
  return Object.values(PART63_KNOWLEDGE_BASE).filter((subpart) =>
    subpart.industries.includes(industry)
  )
}

/**
 * Find Part 63 subparts by parameter (HAP or surrogate)
 */
export function findPart63SubpartsByParameter(parameter: string): Part63SubpartKnowledge[] {
  return Object.values(PART63_KNOWLEDGE_BASE).filter((subpart) =>
    subpart.standards.some((std) => std.parameter === parameter)
  )
}

/**
 * Check if a Part 63 subpart has Part 75 overlap
 */
export function hasPart75Overlap(subpartId: string): boolean {
  const subpart = PART63_KNOWLEDGE_BASE[subpartId]
  if (!subpart) return false

  return subpart.crossReferences.some(
    (ref) => ref.regulation.includes('Part 75') && ref.relationship === 'coordinates'
  )
}

/**
 * Check if a Part 63 subpart has Part 60 overlap
 */
export function hasPart60Overlap(subpartId: string): boolean {
  const subpart = PART63_KNOWLEDGE_BASE[subpartId]
  if (!subpart) return false

  return subpart.crossReferences.some(
    (ref) => ref.regulation.includes('Part 60') && ref.relationship === 'coordinates'
  )
}

// ============================================================================
// ZZZZ-SPECIFIC HELPER FUNCTIONS
// ============================================================================

/**
 * Get requirements for a specific ZZZZ engine configuration
 *
 * Returns applicable emission standards, monitoring, and work practice
 * requirements based on the engine's source category, type, and size.
 */
export function getZZZZRequirements(query: ZZZZRequirementsQuery): ZZZZRequirementsResult {
  const { sourceCategory, engineType, useCategory, horsepower, isExisting } = query

  // Emergency engines have work practice only
  if (useCategory === 'emergency') {
    return {
      testingRequired: false,
      tuneUpFrequency: 'Annual',
      workPractice:
        'Emergency operation unlimited; non-emergency use limited to 100 hours/year; maintenance and readiness testing up to 50 hours/year; tune-up annually',
    }
  }

  // Area sources have work practice standards
  if (sourceCategory === 'area') {
    const tuneUpFreq = horsepower >= 500 ? 'Annual' : 'Biennial'
    return {
      testingRequired: false,
      tuneUpFrequency: tuneUpFreq,
      workPractice: `Oil change per manufacturer; inspect spark plugs/injectors; inspect air cleaner; tune-up ${tuneUpFreq.toLowerCase()}`,
    }
  }

  // Major sources with non-emergency engines need emission standards
  const standards: Part63EmissionStandard[] = []
  const monitoring: Part63MonitoringSpec[] = []

  // Determine CO limit based on engine type and new/existing status
  let coLimit: string
  let formaldehydeLimit: string

  if (engineType === 'ci') {
    coLimit = isExisting === true ? '49' : '23'
    formaldehydeLimit = isExisting === true ? '5.5' : '2.7'
  } else if (engineType === 'si-lean-burn') {
    coLimit = isExisting === true ? '225' : '47'
    formaldehydeLimit = isExisting === true ? '10.3' : '5.0'
  } else {
    // SI rich-burn
    coLimit = isExisting === true ? '350' : '270'
    formaldehydeLimit = isExisting === true ? '5.5' : '2.7'
  }

  // Only engines ≥500 hp have numeric limits; smaller engines use work practice
  if (horsepower >= 500) {
    standards.push({
      parameter: 'CO',
      limit: coLimit,
      units: 'ppmvd @ 15% O2',
      averagingPeriod: '4-hour rolling average',
      subcategory: `${isExisting === true ? 'Existing' : 'New'} ${engineType.toUpperCase()} major source ≥500 hp`,
    })
    standards.push({
      parameter: 'Formaldehyde',
      limit: formaldehydeLimit,
      units: 'ppmvd @ 15% O2',
      averagingPeriod: 'Performance test',
      subcategory: `${isExisting === true ? 'Existing' : 'New'} ${engineType.toUpperCase()} major source ≥500 hp`,
    })

    monitoring.push({
      parameter: 'CO',
      method: 'CEMS',
      frequency: 'Continuous',
      alternatives: ['CPMS with operating limits', 'Periodic stack test'],
    })
    monitoring.push({
      parameter: 'Formaldehyde',
      method: 'stack-test',
      frequency: 'Initial + every 8,760 hours or 3 years',
    })

    return {
      emissionStandards: standards,
      monitoring,
      testingRequired: true,
      tuneUpFrequency: 'Annual',
    }
  }

  // Engines 100-500 hp at major sources
  if (horsepower >= 100) {
    const result: ZZZZRequirementsResult = {
      testingRequired: true,
      tuneUpFrequency: 'Annual',
      workPractice:
        'Performance test required for 100-500 hp engines at major sources; tune-up annually',
    }
    if (standards.length > 0) {
      result.emissionStandards = standards
    }
    if (monitoring.length > 0) {
      result.monitoring = monitoring
    }
    return result
  }

  // Small engines <100 hp
  return {
    testingRequired: false,
    tuneUpFrequency: 'Biennial',
    workPractice: 'Work practice standards only for engines <100 hp; tune-up biennially',
  }
}
