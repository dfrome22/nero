/**
 * EPA Compliance MCP Server
 *
 * Shared regulatory rules server for EPA ECMPS compliance tools.
 * Used by both NERO and dahs-ui-shell-1 projects.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

// Get directory path for loading JSON files
const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')

// Load data files
const formulas = JSON.parse(readFileSync(join(dataDir, 'formulas.json'), 'utf-8'))
const regulations = JSON.parse(readFileSync(join(dataDir, 'regulations.json'), 'utf-8'))
const limitsData = JSON.parse(readFileSync(join(dataDir, 'limits.json'), 'utf-8'))
const gapTypesData = JSON.parse(readFileSync(join(dataDir, 'gap-types.json'), 'utf-8'))

// Types
interface FormulaMapping {
  appendix: string
  section: string
  description: string
  parameters: string[]
  applicableUnits: string
}

interface Regulation {
  id: string
  title: string
  cfr: string
  description: string
  effectiveDate: string
  affectedStates: string
  applicabilityCriteria: Record<string, unknown>
  notes?: string
  status?: string
}

interface EmissionLimit {
  id: string
  regulation: string
  pollutant: string
  limitValue: number
  units: string
  unitType: string
  effectiveDate?: string
  notes?: string
}

// Create the MCP server
const server = new McpServer({
  name: 'epa-compliance',
  version: '1.0.0',
})

// ============================================================================
// FORMULA TOOLS
// ============================================================================

server.tool(
  'getFormulaMapping',
  'Look up the CFR section and details for an ECMPS formula code (e.g., D-5, F-14A, 19-1)',
  {
    formulaCode: z.string().describe('The ECMPS formula code (e.g., D-5, F-14A, G-4, 19-1)'),
  },
  async ({ formulaCode }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    const mapping = formulas[formulaCode] as FormulaMapping | undefined
    if (!mapping) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Unknown formula code: ${formulaCode}`,
              availableFormulas: Object.keys(formulas),
            }),
          },
        ],
      }
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ formulaCode, ...mapping }, null, 2),
        },
      ],
    }
  }
)

server.tool(
  'listFormulas',
  'List all available formula codes, optionally filtered by appendix or parameter',
  {
    appendix: z
      .string()
      .optional()
      .describe('Filter by appendix (e.g., "Appendix D", "Appendix F")'),
    parameter: z.string().optional().describe('Filter by parameter (e.g., "SO2", "NOX", "HI")'),
  },
  async ({ appendix, parameter }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    let results = Object.entries(formulas) as Array<[string, FormulaMapping]>

    if (appendix) {
      results = results.filter(([, v]) => v.appendix.toLowerCase().includes(appendix.toLowerCase()))
    }
    if (parameter) {
      results = results.filter(([, v]) =>
        v.parameters.some((p) => p.toLowerCase() === parameter.toLowerCase())
      )
    }

    const output = results.map(([code, data]) => ({
      code,
      appendix: data.appendix,
      description: data.description,
      parameters: data.parameters,
    }))

    return {
      content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
    }
  }
)

// ============================================================================
// REGULATION TOOLS
// ============================================================================

server.tool(
  'getRegulation',
  'Get details about a specific federal regulatory program',
  {
    regulationId: z
      .string()
      .describe('The regulation ID (e.g., MATS, CSAPR_NOX_ANNUAL, ARP_PHASE_2)'),
  },
  async ({ regulationId }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    const regulation = regulations[regulationId] as Regulation | undefined
    if (!regulation) {
      const available = Object.keys(regulations).filter((k) => !k.startsWith('_'))
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Unknown regulation: ${regulationId}`,
              availableRegulations: available,
            }),
          },
        ],
      }
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ regulationId, ...regulation }, null, 2),
        },
      ],
    }
  }
)

server.tool(
  'listRegulations',
  'List all federal regulatory programs with their basic info',
  {},
  async (): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    const output = Object.entries(regulations)
      .filter(([key]) => !key.startsWith('_'))
      .map(([id, reg]) => {
        const r = reg as Regulation
        return {
          id,
          title: r.title,
          cfr: r.cfr,
          affectedStates: r.affectedStates,
          status: r.status || 'ACTIVE',
        }
      })

    return {
      content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
    }
  }
)

server.tool(
  'determineApplicability',
  'Determine which regulations apply to a unit based on its characteristics',
  {
    state: z.string().describe('Two-letter state code (e.g., TX, PA)'),
    unitType: z.string().describe('Unit type (e.g., EGU, industrial, turbine)'),
    capacityMW: z.number().optional().describe('Unit capacity in MW'),
    fuelType: z.string().optional().describe('Primary fuel type (coal, oil, gas)'),
    constructionDate: z.string().optional().describe('Construction date (YYYY-MM-DD)'),
  },
  async ({
    state,
    unitType,
    capacityMW,
    fuelType,
    constructionDate,
  }: {
    state: string
    unitType: string
    capacityMW?: number
    fuelType?: string
    constructionDate?: string
  }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    const applicable: Array<{ regulationId: string; title: string; reason: string }> = []

    for (const [id, reg] of Object.entries(regulations)) {
      if (id.startsWith('_')) continue
      const r = reg as Regulation

      let matches = true
      let reason = ''

      // Check state applicability
      if (r.affectedStates) {
        if (r.affectedStates === 'ALL') {
          reason += 'Applies to all states. '
        } else {
          const states = r.affectedStates.split(' ')
          if (!states.includes(state)) {
            matches = false
          } else {
            reason += `State ${state} is in program. `
          }
        }
      }

      // Check applicability criteria
      const criteria = r.applicabilityCriteria as Record<string, unknown> | undefined
      if (criteria) {
        // Check unit type
        if (criteria.unitTypes && Array.isArray(criteria.unitTypes)) {
          if (!criteria.unitTypes.includes(unitType)) {
            matches = false
          } else {
            reason += `Unit type ${unitType} covered. `
          }
        }

        // Check capacity
        if (capacityMW && criteria.minCapacity) {
          const minCap = criteria.minCapacity as number
          if (capacityMW < minCap) {
            matches = false
          } else {
            reason += `Capacity >= ${minCap} ${criteria.capacityUnits || 'MW'}. `
          }
        }

        // Check fuel type
        if (fuelType && criteria.fuelTypes && Array.isArray(criteria.fuelTypes)) {
          if (!criteria.fuelTypes.includes(fuelType)) {
            matches = false
          } else {
            reason += `Fuel type ${fuelType} covered. `
          }
        }

        // Check construction date
        if (constructionDate && criteria.constructionDate) {
          const constDate = new Date(constructionDate)
          const threshold = new Date(criteria.constructionDate as string)
          if (constDate < threshold) {
            matches = false
          } else {
            reason += `Constructed after ${criteria.constructionDate}. `
          }
        }
      }

      if (matches) {
        applicable.push({
          regulationId: id,
          title: r.title,
          reason: reason.trim() || 'Default applicability',
        })
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              unit: { state, unitType, capacityMW, fuelType, constructionDate },
              applicableRegulations: applicable,
              count: applicable.length,
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ============================================================================
// EMISSION LIMIT TOOLS
// ============================================================================

server.tool(
  'matchEmissionLimits',
  'Find applicable emission limits for a unit/pollutant combination',
  {
    regulation: z.string().optional().describe('Filter by regulation (e.g., MATS, NSPS_DA)'),
    pollutant: z.string().optional().describe('Filter by pollutant (e.g., SO2, NOX, Hg)'),
    unitType: z.string().optional().describe('Filter by unit type (e.g., coal, existing_coal)'),
  },
  async ({
    regulation,
    pollutant,
    unitType,
  }: {
    regulation?: string
    pollutant?: string
    unitType?: string
  }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    let limits = limitsData.limits as EmissionLimit[]

    if (regulation) {
      limits = limits.filter((l) => l.regulation.toLowerCase() === regulation.toLowerCase())
    }
    if (pollutant) {
      limits = limits.filter((l) => l.pollutant.toLowerCase() === pollutant.toLowerCase())
    }
    if (unitType) {
      limits = limits.filter((l) => l.unitType.toLowerCase().includes(unitType.toLowerCase()))
    }

    // Calculate confidence scores
    const scored = limits.map((limit) => {
      let confidence = 0
      if (pollutant && limit.pollutant.toLowerCase() === pollutant.toLowerCase()) {
        confidence += limitsData.scoringWeights.exactPollutantMatch
      }
      if (unitType && limit.unitType.toLowerCase().includes(unitType.toLowerCase())) {
        confidence += limitsData.scoringWeights.exactUnitTypeMatch
      }
      return { ...limit, confidence }
    })

    scored.sort((a, b) => b.confidence - a.confidence)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query: { regulation, pollutant, unitType },
              limits: scored,
              count: scored.length,
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ============================================================================
// GAP TYPES TOOLS
// ============================================================================

server.tool(
  'listGapTypes',
  'List all compliance gap types organized by category (MONITORING, QAQC, LIMIT, FORMULA, REPORTING, PROGRAM)',
  {
    category: z
      .string()
      .optional()
      .describe('Filter by category (e.g., "MONITORING", "QAQC", "LIMIT")'),
    severity: z.string().optional().describe('Filter by severity (e.g., "HIGH", "MEDIUM", "LOW")'),
  },
  async ({
    category,
    severity,
  }: {
    category?: string
    severity?: string
  }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    const categories = gapTypesData.gapCategories as Record<
      string,
      { gaps: Array<{ id: string; severity: string }> }
    >
    const result: Array<{ category: string; id: string; name: string; severity: string }> = []

    for (const [catId, catData] of Object.entries(categories)) {
      if (category && catId !== category.toUpperCase()) continue

      for (const gap of catData.gaps) {
        if (severity && gap.severity !== severity.toUpperCase()) continue
        result.push({
          category: catId,
          id: gap.id,
          name: ((gap as Record<string, unknown>).name as string) || gap.id,
          severity: gap.severity,
        })
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query: { category, severity },
              gaps: result,
              count: result.length,
              severityLevels: gapTypesData.severityLevels,
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

server.tool(
  'getGapCategories',
  'Get summary of all gap categories and their gap counts',
  {},
  async (): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    const categories = gapTypesData.gapCategories as Record<
      string,
      { name: string; description: string; gaps: unknown[] }
    >
    const summary = Object.entries(categories).map(([id, data]) => ({
      id,
      name: data.name,
      description: data.description,
      gapCount: data.gaps.length,
    }))

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              categories: summary,
              totalGapTypes: summary.reduce((sum, c) => sum + c.gapCount, 0),
              severityLevels: gapTypesData.severityLevels,
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ============================================================================
// PERFORMANCE SPECIFICATIONS (40 CFR Part 60, Appendix B)
// ============================================================================

interface PerformanceSpec {
  id: string
  title: string
  parameter: string
  cfr: string
  applicableSubparts: string[]
  calibrationDrift?: string
  performanceCriteria: string[]
  equations?: string[]
  relatedTestMethods: string[]
}

const PERFORMANCE_SPECIFICATIONS: PerformanceSpec[] = [
  {
    id: 'PS-1',
    title: 'Continuous Opacity Monitoring Systems (COMS)',
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
    ],
    relatedTestMethods: ['Method 9 (Visual Opacity)'],
  },
  {
    id: 'PS-2',
    title: 'SO2 and NOx CEMS',
    parameter: 'SO2, NOx',
    cfr: '40 CFR Part 60, Appendix B, PS-2',
    applicableSubparts: ['D', 'Da', 'Db', 'KKKK', 'GG', 'J', 'Ja', 'Kb'],
    calibrationDrift: '±2.5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20% (or 10% for §75)',
      'Calibration error ≤5% of span',
      'Zero drift ≤2.5% of span over 24 hours',
    ],
    equations: [
      'Relative Accuracy = (|d̄| + |cc|×Sd)/RM × 100%',
      'd̄ = mean difference between CEMS and reference',
    ],
    relatedTestMethods: ['Method 6/6C (SO2)', 'Method 7/7E (NOx)'],
  },
  {
    id: 'PS-3',
    title: 'O2/CO2 Diluent CEMS',
    parameter: 'O2, CO2 (diluent)',
    cfr: '40 CFR Part 60, Appendix B, PS-3',
    applicableSubparts: ['Da', 'Db', 'KKKK', 'J', 'Ja'],
    calibrationDrift: '±0.5% O2 or CO2 (24-hr)',
    performanceCriteria: ['Relative Accuracy ≤20%', 'Calibration error ≤0.5% O2/CO2'],
    relatedTestMethods: ['Method 3A (O2/CO2)'],
  },
  {
    id: 'PS-4',
    title: 'CO CEMS',
    parameter: 'CO (Carbon Monoxide)',
    cfr: '40 CFR Part 60, Appendix B, PS-4',
    applicableSubparts: ['Cb', 'Cc', 'IIII', 'JJJJ', 'ZZZZ'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: ['Relative Accuracy ≤10%', 'Calibration error ≤5% of span'],
    relatedTestMethods: ['Method 10 (CO)'],
  },
  {
    id: 'PS-4A',
    title: 'CO CEMS (Alternative)',
    parameter: 'CO (Alternative)',
    cfr: '40 CFR Part 60, Appendix B, PS-4A',
    applicableSubparts: ['IIII', 'JJJJ'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Uses cylinder gas audit (CGA) instead of RA',
      'CGA ≤10% of certified gas value',
    ],
    relatedTestMethods: ['Method 10 (CO)'],
  },
  {
    id: 'PS-4B',
    title: 'CO CEMS with O2 Correction',
    parameter: 'CO with O2 correction',
    cfr: '40 CFR Part 60, Appendix B, PS-4B',
    applicableSubparts: ['YYYY'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: ['Relative Accuracy ≤10%', 'O2 correction to 15% required'],
    equations: ['CO_corrected = CO_measured × (20.9 - 15)/(20.9 - O2_measured)'],
    relatedTestMethods: ['Method 10 (CO)', 'Method 3A (O2)'],
  },
  {
    id: 'PS-5',
    title: 'TRS CEMS',
    parameter: 'TRS (Total Reduced Sulfur)',
    cfr: '40 CFR Part 60, Appendix B, PS-5',
    applicableSubparts: ['BB', 'CC', 'DD'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: ['Relative Accuracy ≤20%', 'H2S interference test required'],
    relatedTestMethods: ['Method 15 (H2S/TRS)', 'Method 16 (TRS)'],
  },
  {
    id: 'PS-6',
    title: 'Flow Rate CEMS',
    parameter: 'FLOW (Stack Gas Volumetric Flow)',
    cfr: '40 CFR Part 60, Appendix B, PS-6',
    applicableSubparts: ['Da', 'Db', 'J', 'Ja'],
    calibrationDrift: 'N/A (no daily calibration)',
    performanceCriteria: [
      'Relative Accuracy ≤10% (or 7.5% with bias)',
      'RATA at 3 load levels required',
    ],
    equations: ['RA = (|d̄| + |cc|×Sd)/RM × 100%', 'Bias Adjustment Factor = RM/CEM'],
    relatedTestMethods: ['Method 2 (Velocity)', 'Method 2F/2G (3D probes)'],
  },
  {
    id: 'PS-7',
    title: 'H2S CEMS',
    parameter: 'H2S (Hydrogen Sulfide)',
    cfr: '40 CFR Part 60, Appendix B, PS-7',
    applicableSubparts: ['J', 'Ja', 'GGG', 'GGGa'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: ['Relative Accuracy ≤20%', 'Response time ≤90 seconds'],
    relatedTestMethods: ['Method 11 (H2S)', 'Method 15 (H2S/TRS)'],
  },
  {
    id: 'PS-8',
    title: 'VOC CEMS',
    parameter: 'VOC (Total Hydrocarbons)',
    cfr: '40 CFR Part 60, Appendix B, PS-8',
    applicableSubparts: ['J', 'JJ', 'VV', 'VVa', 'GGG', 'GGGa', 'NNN', 'RRR'],
    calibrationDrift: '±2.5% of span (24-hr)',
    performanceCriteria: ['Relative Accuracy ≤20%', 'Response time ≤2 minutes', 'FID required'],
    relatedTestMethods: ['Method 25A (THC)', 'Method 25 (gaseous organic)'],
  },
  {
    id: 'PS-8A',
    title: 'VOC CEMS (Alternative)',
    parameter: 'VOC (Alternative)',
    cfr: '40 CFR Part 60, Appendix B, PS-8A',
    applicableSubparts: ['VV', 'VVa', 'GGG', 'GGGa'],
    performanceCriteria: ['Manufacturer certification in lieu of field RA', 'Quarterly audit'],
    relatedTestMethods: ['Method 25A (THC)'],
  },
  {
    id: 'PS-9',
    title: 'Volumetric Flow (GHG)',
    parameter: 'FLOW (GHG reporting)',
    cfr: '40 CFR Part 60, Appendix B, PS-9',
    applicableSubparts: ['TTTT', 'UUUU'],
    performanceCriteria: ['Relative Accuracy ≤10%', 'Uses tracer dilution method'],
    relatedTestMethods: ['Method 2G (tracer dilution)'],
  },
  {
    id: 'PS-10',
    title: 'H2O CEMS (Moisture)',
    parameter: 'H2O (Moisture)',
    cfr: '40 CFR Part 60, Appendix B, PS-10',
    applicableSubparts: ['Da', 'J', 'Ja'],
    calibrationDrift: '±1.5% H2O (24-hr)',
    performanceCriteria: ['Relative Accuracy ≤10%', 'Response time ≤5 minutes'],
    relatedTestMethods: ['Method 4 (Moisture)'],
  },
  {
    id: 'PS-11',
    title: 'PM CEMS',
    parameter: 'PM (Particulate Matter)',
    cfr: '40 CFR Part 60, Appendix B, PS-11',
    applicableSubparts: ['Da', 'Db', 'Dc', 'Y', 'Z', 'AA', 'AAa'],
    performanceCriteria: [
      'Correlation coefficient r ≥0.85',
      'Confidence interval ≤10%',
      'Tolerance interval ≤25%',
    ],
    equations: ['Correlation: PM_CEMS = a + b × PM_Reference'],
    relatedTestMethods: ['Method 5 (PM)', 'Method 17 (In-stack PM)'],
  },
  {
    id: 'PS-12A',
    title: 'Hg CEMS (Gaseous)',
    parameter: 'Hg (Mercury)',
    cfr: '40 CFR Part 60, Appendix B, PS-12A',
    applicableSubparts: ['UUUUU', 'Da'],
    calibrationDrift: '±5% of span or 1 µg/scm (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20% (or 10% for MATS)',
      'System Integrity ≤5%',
      '7-day calibration drift test',
    ],
    relatedTestMethods: ['Method 30B (Sorbent Trap Hg)', 'Method 29 (Hg)'],
  },
  {
    id: 'PS-12B',
    title: 'Hg Sorbent Trap Monitoring',
    parameter: 'Hg (Sorbent Trap)',
    cfr: '40 CFR Part 60, Appendix B, PS-12B',
    applicableSubparts: ['UUUUU'],
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Paired trap agreement ≤10%',
      'Field recovery 85-115%',
    ],
    relatedTestMethods: ['Method 30B (Sorbent Trap Hg)'],
  },
  {
    id: 'PS-15',
    title: 'HCl CEMS (Extractive)',
    parameter: 'HCl (Hydrogen Chloride)',
    cfr: '40 CFR Part 60, Appendix B, PS-15',
    applicableSubparts: ['UUUUU', 'EEE'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: ['Relative Accuracy ≤20%', 'Interference test required'],
    relatedTestMethods: ['Method 26A (HCl/HF)', 'Method 26 (HCl)'],
  },
  {
    id: 'PS-18',
    title: 'HCl CEMS (IP-CEMS)',
    parameter: 'HCl (In-situ Path)',
    cfr: '40 CFR Part 60, Appendix B, PS-18',
    applicableSubparts: ['UUUUU', 'HH', 'EEE'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: [
      'Relative Accuracy ≤20%',
      'Beam intensity verification',
      'Interference test ≤2.5% of span',
    ],
    relatedTestMethods: ['Method 26A (HCl/HF)', 'Method 321 (HCl FTIR)'],
  },
  {
    id: 'PS-19',
    title: 'HF CEMS',
    parameter: 'HF (Hydrogen Fluoride)',
    cfr: '40 CFR Part 60, Appendix B, PS-19',
    applicableSubparts: ['UUUUU'],
    calibrationDrift: '±5% of span (24-hr)',
    performanceCriteria: ['Relative Accuracy ≤20%', 'Interference test required'],
    relatedTestMethods: ['Method 26A (HCl/HF)'],
  },
]

server.tool(
  'getPerformanceSpec',
  'Get details about a specific Performance Specification (PS-1 through PS-19) from 40 CFR Part 60 Appendix B',
  {
    psId: z.string().describe('The Performance Specification ID (e.g., PS-1, PS-2, PS-12A)'),
  },
  async ({
    psId,
  }: {
    psId: string
  }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    const ps = PERFORMANCE_SPECIFICATIONS.find((p) => p.id.toLowerCase() === psId.toLowerCase())
    if (!ps) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Unknown Performance Specification: ${psId}`,
              available: PERFORMANCE_SPECIFICATIONS.map((p) => p.id),
            }),
          },
        ],
      }
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(ps, null, 2) }],
    }
  }
)

server.tool(
  'listPerformanceSpecs',
  'List Performance Specifications, optionally filtered by parameter or NSPS subpart',
  {
    parameter: z.string().optional().describe('Filter by parameter (e.g., SO2, NOx, Hg, HCl, PM)'),
    subpart: z.string().optional().describe('Filter by NSPS subpart (e.g., Da, Db, KKKK, UUUUU)'),
  },
  async ({
    parameter,
    subpart,
  }: {
    parameter?: string
    subpart?: string
  }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    let results = PERFORMANCE_SPECIFICATIONS

    if (parameter) {
      results = results.filter((ps) => ps.parameter.toLowerCase().includes(parameter.toLowerCase()))
    }
    if (subpart) {
      results = results.filter((ps) =>
        ps.applicableSubparts.some((s) => s.toLowerCase() === subpart.toLowerCase())
      )
    }

    const output = results.map((ps) => ({
      id: ps.id,
      title: ps.title,
      parameter: ps.parameter,
      applicableSubparts: ps.applicableSubparts,
    }))

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { query: { parameter, subpart }, specs: output, count: output.length },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ============================================================================
// NSPS APPLICABILITY ENGINE
// ============================================================================

// Fuel code categories for opacity determination
const FUEL_CATEGORIES: Record<string, string[]> = {
  coal: ['C', 'COL', 'COAL', 'ANT', 'BIT', 'LIG', 'SUB', 'WC', 'PC', 'RC', 'SC'],
  oil: ['OIL', 'RO', 'RFO', 'DFO', 'DSL', 'JET', 'KER', 'NFS', 'OGS'],
  gas: ['PNG', 'NNG', 'NAT', 'NG', 'NGA', 'LPG', 'PRG', 'BFG', 'COG', 'OG', 'PG', 'NATR'],
  wood: ['WOD', 'WOOD', 'WDL', 'WDS', 'BIO', 'AB', 'OBS', 'TDF'],
}

function normalizeFuel(fuelCode: string): 'coal' | 'oil' | 'gas' | 'wood' | 'other' {
  const code = fuelCode.toUpperCase()
  for (const [category, codes] of Object.entries(FUEL_CATEGORIES)) {
    if (codes.includes(code)) {
      return category as 'coal' | 'oil' | 'gas' | 'wood'
    }
  }
  return 'other'
}

// NSPS Subpart rules
const NSPS_RULES = {
  D: {
    effectiveStart: '1971-08-17',
    effectiveEnd: '1978-09-18',
    minMMBtu: 250,
    requiresUtility: false,
  },
  Da: { effectiveStart: '1978-09-18', minMMBtu: 250, requiresUtility: true },
  Db: { effectiveStart: '1984-06-19', minMMBtu: 100, requiresUtility: false },
  Dc: { effectiveStart: '1989-06-09', minMMBtu: 10, maxMMBtu: 100, requiresUtility: false },
  GG: { effectiveStart: '1977-10-03', effectiveEnd: '2005-02-18', minMMBtu: 10 },
  KKKK: { effectiveStart: '2005-02-18', minMMBtu: 10 },
}

// Opacity CFR citations by subpart
const OPACITY_CITATIONS: Record<string, { citation: string; limit: string }> = {
  D: { citation: '40 CFR 60.42', limit: '20% opacity (6-min avg)' },
  Da: { citation: '40 CFR 60.42Da', limit: '20% opacity (6-min avg)' },
  Db: { citation: '40 CFR 60.43b', limit: '20% opacity (6-min avg)' },
  Dc: { citation: '40 CFR 60.43c', limit: '20% opacity (6-min avg)' },
  GG: { citation: '40 CFR 60.334', limit: '5% opacity (oil-fired)' },
  KKKK: { citation: '40 CFR 60.4320', limit: '5% opacity (oil-fired)' },
}

server.tool(
  'determineNSPSApplicability',
  'Determine applicable NSPS subparts based on equipment type, fuel, capacity, and dates. Returns opacity requirements with correct Part 60 citations (NOT Part 75).',
  {
    equipmentType: z
      .enum(['steam-generator', 'boiler', 'gas-turbine', 'combustion-turbine'])
      .describe('Equipment type'),
    fuelType: z.string().describe('Fuel code (C, PNG, OIL, DSL, etc.)'),
    capacityMMBtu: z.number().optional().describe('Heat input capacity in MMBtu/hr'),
    capacityMW: z
      .number()
      .optional()
      .describe('Electric capacity in MW (converted to MMBtu if needed)'),
    commercialOpDate: z.string().optional().describe('Commercial operation date (YYYY-MM-DD)'),
    isElectricUtility: z
      .boolean()
      .optional()
      .describe('Is this an electric utility unit? (affects Da vs Db)'),
  },
  async ({
    equipmentType,
    fuelType,
    capacityMMBtu,
    capacityMW,
    commercialOpDate,
    isElectricUtility,
  }: {
    equipmentType: string
    fuelType: string
    capacityMMBtu?: number
    capacityMW?: number
    commercialOpDate?: string
    isElectricUtility?: boolean
  }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
    const fuelCategory = normalizeFuel(fuelType)
    const capacity = capacityMMBtu ?? (capacityMW ? capacityMW * 3.412 : 0)
    const opDate = commercialOpDate ? new Date(commercialOpDate) : undefined
    const isEGU = isElectricUtility ?? false

    const applicableSubparts: Array<{ subpart: string; reason: string; effectiveDate: string }> = []
    const warnings: string[] = []

    // Check boiler/steam generator subparts
    if (['steam-generator', 'boiler'].includes(equipmentType)) {
      // Subpart D (1971-1978)
      if (
        opDate &&
        opDate >= new Date('1971-08-17') &&
        opDate < new Date('1978-09-18') &&
        capacity >= 250 &&
        fuelCategory !== 'gas'
      ) {
        applicableSubparts.push({
          subpart: 'D',
          reason: 'Fossil-fuel-fired steam generator >250 MMBtu/hr (1971-1978)',
          effectiveDate: '1971-08-17',
        })
      }
      // Subpart Da (post-1978, EGU)
      if (opDate && opDate >= new Date('1978-09-18') && capacity >= 250 && isEGU) {
        applicableSubparts.push({
          subpart: 'Da',
          reason: 'Electric utility steam generating unit >73 MW after 9/18/78',
          effectiveDate: '1978-09-18',
        })
      }
      // Subpart Db (post-1984, industrial)
      if (opDate && opDate >= new Date('1984-06-19') && capacity >= 100 && !isEGU) {
        applicableSubparts.push({
          subpart: 'Db',
          reason: 'Industrial steam generating unit >100 MMBtu/hr after 6/19/84',
          effectiveDate: '1984-06-19',
        })
      }
      // Subpart Dc (post-1989, small industrial)
      if (
        opDate &&
        opDate >= new Date('1989-06-09') &&
        capacity >= 10 &&
        capacity < 100 &&
        !isEGU &&
        fuelCategory !== 'gas'
      ) {
        applicableSubparts.push({
          subpart: 'Dc',
          reason: 'Small industrial unit 10-100 MMBtu/hr after 6/9/89',
          effectiveDate: '1989-06-09',
        })
      }
    }

    // Check gas turbine subparts
    if (['gas-turbine', 'combustion-turbine'].includes(equipmentType)) {
      // Subpart GG (1977-2005)
      if (
        opDate &&
        opDate >= new Date('1977-10-03') &&
        opDate < new Date('2005-02-18') &&
        capacity >= 10
      ) {
        applicableSubparts.push({
          subpart: 'GG',
          reason: 'Stationary gas turbine >10 MMBtu/hr (1977-2005)',
          effectiveDate: '1977-10-03',
        })
      }
      // Subpart KKKK (post-2005)
      if (opDate && opDate >= new Date('2005-02-18')) {
        applicableSubparts.push({
          subpart: 'KKKK',
          reason: 'Combustion turbine after 2/18/05',
          effectiveDate: '2005-02-18',
        })
      }
    }

    // Determine opacity requirements
    let requiresOpacity = false
    let opacityInfo: { citation: string; limit: string; performanceSpec: string } | null = null

    for (const { subpart } of applicableSubparts) {
      if (OPACITY_CITATIONS[subpart] && fuelCategory !== 'gas') {
        requiresOpacity = true
        opacityInfo = {
          ...OPACITY_CITATIONS[subpart],
          performanceSpec: 'PS-1 (COMS)',
        }
        break
      }
    }

    // Add warnings
    if (!opDate) {
      warnings.push('Commercial operation date not provided - applicability may be incomplete')
    }
    if (capacity === 0) {
      warnings.push('Heat input capacity not provided - size thresholds cannot be verified')
    }
    if (isElectricUtility === undefined && ['steam-generator', 'boiler'].includes(equipmentType)) {
      warnings.push(
        'isElectricUtility not specified - defaulted to industrial (Db). Set to true for utility (Da).'
      )
    }

    // Part 75 coordination notes
    let part75Notes = ''
    if (applicableSubparts.some((s) => ['Da', 'D', 'Db'].includes(s.subpart))) {
      part75Notes =
        'Part 75 CEMS data can satisfy NSPS monitoring requirements per 40 CFR 60.47Da, 60.334(b). ' +
        'IMPORTANT: Opacity is regulated under Part 60, not Part 75. Part 75.10 is for NOx monitoring only.'
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              input: {
                equipmentType,
                fuelType,
                fuelCategory,
                capacityMMBtu: capacity,
                commercialOpDate,
                isElectricUtility: isEGU,
              },
              applicableSubparts,
              requiresOpacity,
              opacityInfo,
              part75Notes,
              warnings,
              applicablePerformanceSpecs: applicableSubparts
                .flatMap((s) =>
                  PERFORMANCE_SPECIFICATIONS.filter((ps) =>
                    ps.applicableSubparts.includes(s.subpart)
                  ).map((ps) => ps.id)
                )
                .filter((v, i, a) => a.indexOf(v) === i), // unique
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('EPA Compliance MCP Server running on stdio')
}

main().catch(console.error)
