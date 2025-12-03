/**
 * eCFR API Types
 *
 * Based on https://www.ecfr.gov/developers/documentation/api/v1
 * The Electronic Code of Federal Regulations API
 */

// ============================================================================
// eCFR API RESPONSES
// ============================================================================

/** eCFR Title (e.g., Title 40 - Protection of Environment) */
export interface ECFRTitle {
  number: number
  name: string
  latest_amended_on: string
  latest_issue_date: string
  up_to_date_as_of: string
  reserved: boolean
}

/** eCFR Structure node (Chapter, Subchapter, Part, Subpart, Section) */
export interface ECFRStructureNode {
  identifier: string
  label: string
  label_level: string
  label_description: string
  reserved: boolean
  type: 'title' | 'chapter' | 'subchapter' | 'part' | 'subpart' | 'section' | 'appendix'
  children?: ECFRStructureNode[]
  volumes?: number[]
}

/** eCFR Section content */
export interface ECFRSection {
  identifier: string // e.g., "60.4"
  title: string
  type: 'section'
  structure_index: string
  headings: string[]
  content_html: string
  content_text: string
  citation: string // e.g., "40 CFR 60.4"
  authority: string
  source: string
  editorial_note?: string
  effective_date?: string
}

/** eCFR Search result */
export interface ECFRSearchResult {
  results: ECFRSearchHit[]
  total_count: number
  page: number
  per_page: number
}

/** Individual search hit */
export interface ECFRSearchHit {
  hierarchy: {
    title: string
    chapter?: string
    subchapter?: string
    part?: string
    subpart?: string
    section?: string
  }
  headings: string[]
  full_text_excerpt: string
  starts_on: string // Date
  type: string
  structure_index: string
}

// ============================================================================
// eCFR QUERY PARAMETERS
// ============================================================================

/** Query for fetching regulation content */
export interface ECFRQuery {
  title: number // e.g., 40 for EPA regulations
  part?: number // e.g., 60 for NSPS
  subpart?: string // e.g., "UUUUU" for MATS
  section?: string // e.g., "60.4"
  date?: string // Effective date (YYYY-MM-DD)
}

/** Search query parameters */
export interface ECFRSearchQuery {
  query: string
  title?: number
  part?: number
  page?: number
  per_page?: number
  order?: 'relevance' | 'hierarchy'
}

// ============================================================================
// REGULATORY PROGRAM MAPPINGS
// ============================================================================

/** Known EPA regulatory programs in Title 40 */
export const EPA_REGULATORY_PROGRAMS = {
  // Part 60 - NSPS (New Source Performance Standards)
  NSPS: {
    title: 40,
    part: 60,
    subparts: {
      A: 'General Provisions',
      D: 'Fossil-Fuel-Fired Steam Generators (> 250 MMBtu/hr)',
      Da: 'Electric Utility Steam Generating Units (> 250 MMBtu/hr, after Sept 18, 1978)',
      Db: 'Industrial-Commercial-Institutional Steam Generating Units (> 100 MMBtu/hr)',
      Dc: 'Small Industrial-Commercial-Institutional Steam Generating Units (10-100 MMBtu/hr)',
      J: 'Petroleum Refineries (Affected Facilities)',
      Ja: 'Petroleum Refineries (Fuel Gas Combustion Devices)',
      KKKK: 'Stationary Combustion Turbines',
      TTTT: 'Greenhouse Gas Emissions for Electric Utility Generating Units',
    },
  },

  // Part 63 - NESHAP/MATS
  NESHAP: {
    title: 40,
    part: 63,
    subparts: {
      A: 'General Provisions',
      DDDDD: 'Industrial, Commercial, and Institutional Boilers and Process Heaters',
      UUUUU: 'Coal- and Oil-Fired Electric Utility Steam Generating Units (MATS)',
      YYYY: 'Stationary Combustion Turbines',
    },
  },

  // Part 75 - Continuous Emission Monitoring (CEM)
  PART75: {
    title: 40,
    part: 75,
    subparts: {
      A: 'General Provisions',
      B: 'Monitoring Provisions',
      C: 'Operation and Maintenance Requirements',
      D: 'Missing Data Substitution Procedures',
      E: 'Alternative Monitoring Systems',
      F: 'Recordkeeping Requirements',
      G: 'Reporting Requirements',
      H: 'NOx Mass Emissions Provisions',
    },
  },

  // Part 97 - Cross-State Air Pollution Rule (CSAPR)
  CSAPR: {
    title: 40,
    part: 97,
    subparts: {
      AAAAA: 'CSAPR NOx Annual Trading Program',
      BBBBB: 'CSAPR NOx Ozone Season Group 1 Trading Program',
      CCCCC: 'CSAPR SO2 Group 1 Trading Program',
      DDDDD: 'CSAPR SO2 Group 2 Trading Program',
      EEEEE: 'CSAPR NOx Ozone Season Group 2 Trading Program',
      GGGGG: 'CSAPR NOx Ozone Season Group 3 Trading Program',
    },
  },

  // Part 72/73 - Acid Rain Program
  ACID_RAIN: {
    title: 40,
    parts: [72, 73],
  },
} as const

/** Common regulatory terms to search for in permit text */
export const REGULATORY_LANGUAGE_PATTERNS = {
  monitoring: [
    'continuous emission monitoring',
    'CEMS',
    'continuous opacity monitoring',
    'COMS',
    'shall monitor',
    'monitoring requirements',
    'parametric monitoring',
    'predictive emission monitoring',
    'PEMS',
  ],
  reporting: [
    'quarterly report',
    'annual report',
    'excess emissions report',
    'deviation report',
    'submit to',
    'EPA Region',
    'ECMPS',
    'electronic reporting',
  ],
  limits: [
    'emission limit',
    'shall not exceed',
    'lb/MMBtu',
    'lb/hr',
    'ppm',
    'mg/m3',
    'pounds per hour',
    'tons per year',
    'opacity limit',
  ],
  qa: [
    'RATA',
    'relative accuracy',
    'cylinder gas audit',
    'CGA',
    'linearity check',
    'calibration drift',
    'calibration error',
    'quality assurance',
    'QA/QC',
  ],
  programs: [
    'Acid Rain Program',
    'Part 75',
    'CSAPR',
    'Cross-State',
    'MATS',
    'NSPS',
    'NESHAP',
    'Title V',
    'PSD',
    'NSR',
  ],
}
