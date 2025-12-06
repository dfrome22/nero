/**
 * Compliance Data Service
 *
 * Client-side service that uses the shared EPA compliance data
 * (synced from the MCP server) to provide enhanced regulatory matching.
 *
 * This mirrors the MCP server's tools but runs client-side for NERO.
 */

import formulasData from '@/data/formulas.json'
import gapTypesData from '@/data/gap-types.json'
import limitsData from '@/data/limits.json'
import regulationsData from '@/data/regulations.json'

// Re-export shared MCP types for convenience
export type {
  ApplicableLimit,
  ApplicableProgram,
  ComplianceGap,
  CurrentMonitoringConfig,
  FuelType,
  MethodRecommendation,
  MonitoringPlanAnalysisInput,
  MonitoringPlanAnalysisOutput,
  Pollutant,
  QARequirement,
  ReportingItem,
  Severity,
  SuggestedFormula,
} from '@/types/mcp'

// Types matching MCP server
export interface Regulation {
  id: string
  title: string
  cfr: string
  description: string
  effectiveDate: string
  affectedStates: string[] | 'ALL'
  applicabilityCriteria: {
    minCapacity?: number
    maxCapacity?: number
    capacityUnits?: string
    unitTypes?: string[]
    fuelTypes?: string[]
    constructionDate?: { after?: string; before?: string }
    ozoneSeasonDates?: { start: string; end: string }
    notes?: string
    excludedUnits?: string[]
  }
  notes?: string
  status?: string
}

export interface EmissionLimit {
  id: string
  regulation: string
  pollutant: string
  limitValue: number
  units: string
  averagingPeriod?: string
  unitType: string
  fuelTypes?: string[]
  constructionDate?: { after?: string; before?: string }
  citation?: string
  effectiveDate?: string
  notes?: string
}

export interface FormulaMapping {
  appendix: string
  section: string
  description: string
  parameters: string[]
  applicableUnits: string
}

export interface GapItem {
  id: string
  title: string
  description: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  parameters?: string[]
  frequency?: string
}

export interface GapCategory {
  description: string
  gaps: GapItem[]
}

// Parse the imported data with proper typing
const regulations = regulationsData as Record<string, Regulation>
const limits = (limitsData as { limits: EmissionLimit[] }).limits
const formulas = Object.fromEntries(
  Object.entries(formulasData).filter(([key]) => !key.startsWith('_'))
) as Record<string, FormulaMapping>
const gapCategories = (gapTypesData as { gapCategories: Record<string, GapCategory> }).gapCategories

/**
 * Get regulations applicable to a specific state
 */
export function getApplicableRegulations(stateCode: string): Regulation[] {
  return Object.values(regulations).filter((reg) => {
    if (Array.isArray(reg.affectedStates)) {
      // Check for "ALL" marker or specific state code
      return reg.affectedStates.includes('ALL') || reg.affectedStates.includes(stateCode)
    }
    // Non-array affectedStates (e.g., "ALL" string) applies to all states
    return true
  })
}

/**
 * Determine which CSAPR groups apply to a state
 */
export function getCSAPRProgramsForState(stateCode: string): string[] {
  const programs: string[] = []

  const csaprRegs = [
    'CSAPR_NOX_ANNUAL',
    'CSAPR_NOX_OZONE_GROUP_1',
    'CSAPR_NOX_OZONE_GROUP_2',
    'CSAPR_NOX_OZONE_GROUP_3',
    'CSAPR_SO2_GROUP_1',
    'CSAPR_SO2_GROUP_2',
  ]

  for (const regId of csaprRegs) {
    const reg = regulations[regId]
    if (reg && Array.isArray(reg.affectedStates) && reg.affectedStates.includes(stateCode)) {
      programs.push(reg.id)
    }
  }

  return programs
}

/**
 * Get emission limits applicable to a facility based on fuel type and unit characteristics
 */
export function getApplicableLimits(options: {
  fuelTypes?: string[]
  unitType?: string
  constructionDate?: string // ISO date string
  pollutants?: string[]
}): EmissionLimit[] {
  return limits.filter((limit) => {
    // Filter by fuel type if specified
    if (
      options.fuelTypes !== undefined &&
      options.fuelTypes.length > 0 &&
      limit.fuelTypes !== undefined
    ) {
      const limitFuels = limit.fuelTypes
      const hasFuelMatch = options.fuelTypes.some((fuel) =>
        limitFuels.some(
          (lf) =>
            lf.toLowerCase().includes(fuel.toLowerCase()) ||
            fuel.toLowerCase().includes(lf.toLowerCase())
        )
      )
      if (!hasFuelMatch) return false
    }

    // Filter by unit type
    if (options.unitType !== undefined && options.unitType !== '') {
      const unitMatch =
        limit.unitType.toLowerCase().includes(options.unitType.toLowerCase()) ||
        options.unitType.toLowerCase().includes(limit.unitType.toLowerCase())
      if (!unitMatch) return false
    }

    // Filter by construction date
    const constructionAfter = limit.constructionDate?.after
    if (
      options.constructionDate !== undefined &&
      options.constructionDate !== '' &&
      constructionAfter !== undefined &&
      constructionAfter !== ''
    ) {
      const facilityDate = new Date(options.constructionDate)
      const limitDate = new Date(constructionAfter)
      if (facilityDate < limitDate) return false
    }

    // Filter by pollutant
    if (options.pollutants !== undefined) {
      if (!options.pollutants.includes(limit.pollutant)) return false
    }

    return true
  })
}

/**
 * Get all limits for a specific regulation
 */
export function getLimitsForRegulation(regulationId: string): EmissionLimit[] {
  return limits.filter((limit) => limit.regulation === regulationId)
}

/**
 * Get formula CFR mapping
 */
export function getFormula(formulaCode: string): FormulaMapping | undefined {
  return formulas[formulaCode]
}

// Type for formula list results
type FormulaWithCode = { code: string } & FormulaMapping

/**
 * List all formulas, optionally filtered
 */
export function listFormulas(options?: {
  appendix?: string
  parameter?: string
}): FormulaWithCode[] {
  let results = Object.entries(formulas)

  const appendixFilter = options?.appendix
  if (appendixFilter !== undefined && appendixFilter !== '') {
    results = results.filter(([, v]) =>
      v.appendix.toLowerCase().includes(appendixFilter.toLowerCase())
    )
  }
  const parameterFilter = options?.parameter
  if (parameterFilter !== undefined && parameterFilter !== '') {
    results = results.filter(([, v]) =>
      v.parameters.some((p) => p.toLowerCase() === parameterFilter.toLowerCase())
    )
  }

  return results.map(([code, data]) => ({ code, ...data }))
}

/**
 * Get gap categories with severity information
 */
export function getGapCategories(): Record<string, GapCategory> {
  return gapCategories
}

// Type for gap with category
type GapWithCategory = GapItem & { category: string }

/**
 * Get gaps by severity level
 */
export function getGapsBySeverity(severity: 'HIGH' | 'MEDIUM' | 'LOW'): GapWithCategory[] {
  const results: GapWithCategory[] = []

  for (const [category, data] of Object.entries(gapCategories)) {
    for (const gap of data.gaps) {
      if (gap.severity === severity) {
        results.push({ ...gap, category })
      }
    }
  }

  return results
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: 'HIGH' | 'MEDIUM' | 'LOW'): {
  bg: string
  text: string
  border: string
} {
  switch (severity) {
    case 'HIGH':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
    case 'MEDIUM':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' }
    case 'LOW':
      return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' }
  }
}

/**
 * Determine MATS applicability based on fuel type
 */
export function isMATSApplicable(fuelTypes: string[]): boolean {
  const matsFuels = ['coal', 'oil', 'petroleum', 'lignite', 'bituminous', 'subbituminous']
  return fuelTypes.some((fuel) => matsFuels.some((mf) => fuel.toLowerCase().includes(mf)))
}

/**
 * Determine RGGI applicability based on state
 */
export function isRGGIApplicable(stateCode: string): boolean {
  const reg = regulations['RGGI']
  if (!reg || !Array.isArray(reg.affectedStates)) return false
  return reg.affectedStates.includes(stateCode)
}

/**
 * Get a summary of all applicable programs for a facility
 */
export function getFacilityProgramSummary(options: {
  stateCode: string
  fuelTypes: string[]
  capacityMW?: number
}): {
  programs: string[]
  regulations: Regulation[]
  limitCount: number
  hasMATS: boolean
  hasRGGI: boolean
  csaprPrograms: string[]
} {
  const applicableRegs = getApplicableRegulations(options.stateCode)
  const csaprPrograms = getCSAPRProgramsForState(options.stateCode)
  const hasMATS = isMATSApplicable(options.fuelTypes)
  const hasRGGI = isRGGIApplicable(options.stateCode)

  // Get applicable limits
  const applicableLimits = getApplicableLimits({ fuelTypes: options.fuelTypes })

  // Build program list
  const programs: string[] = ['ARP'] // Assume ARP for all >25MW units

  if (csaprPrograms.length > 0) {
    programs.push('CSAPR')
  }
  if (hasMATS) {
    programs.push('MATS')
  }
  if (hasRGGI) {
    programs.push('RGGI')
  }

  return {
    programs,
    regulations: applicableRegs,
    limitCount: applicableLimits.length,
    hasMATS,
    hasRGGI,
    csaprPrograms,
  }
}

// Export data for direct access if needed
export { formulas, gapCategories, limits, regulations }

// Import types for analyzeMonitoringPlan
import type {
  ApplicableProgram,
  ComplianceGap,
  FuelType,
  ApplicableLimit as MCPApplicableLimit,
  MethodRecommendation,
  MonitoringPlanAnalysisInput,
  MonitoringPlanAnalysisOutput,
  Pollutant,
  QARequirement,
  ReportingItem,
  SuggestedFormula,
} from '@/types/mcp'

/**
 * Analyze a monitoring plan and return comprehensive compliance information.
 * This is the client-side equivalent of the MCP analyzeMonitoringPlan tool.
 */
export function analyzeMonitoringPlan(
  input: MonitoringPlanAnalysisInput
): MonitoringPlanAnalysisOutput {
  const { stateCode, unitType, fuelTypes, pollutants, currentMonitors, capacityMW } = input

  // 1. Determine applicable programs
  const applicablePrograms = determineApplicablePrograms(stateCode, fuelTypes, capacityMW)

  // 2. Recommend monitoring methods
  const recommendedMethods = recommendMethods(pollutants, fuelTypes, currentMonitors)

  // 3. Get applicable limits
  const applicableLimits = getApplicableLimitsForAnalysis(fuelTypes, unitType, pollutants)

  // 4. Identify gaps
  const gaps = identifyGaps(pollutants, currentMonitors, applicablePrograms)

  // 5. QA requirements
  const qaRequirements = getQARequirements(pollutants, currentMonitors)

  // 6. Reporting schedule
  const reportingSchedule = getReportingSchedule(applicablePrograms)

  // 7. Suggest formulas
  const suggestedFormulas = suggestFormulas(fuelTypes, currentMonitors, pollutants)

  return {
    applicablePrograms,
    recommendedMethods,
    applicableLimits,
    gaps,
    qaRequirements,
    reportingSchedule,
    suggestedFormulas,
  }
}

// Helper functions for analyzeMonitoringPlan

function determineApplicablePrograms(
  stateCode: string,
  fuelTypes: FuelType[],
  capacityMW?: number
): ApplicableProgram[] {
  const programs: ApplicableProgram[] = []

  // ARP - applies to most EGUs over 25 MW
  if (capacityMW === undefined || capacityMW >= 25) {
    programs.push({
      programId: 'ARP',
      title: 'Acid Rain Program',
      reason: 'Utility unit with capacity >= 25 MW',
      pollutants: ['SO2', 'NOx', 'CO2'] as Pollutant[],
    })
  }

  // CSAPR
  const csaprPrograms = getCSAPRProgramsForState(stateCode)
  if (csaprPrograms.length > 0) {
    programs.push({
      programId: 'CSAPR',
      title: 'Cross-State Air Pollution Rule',
      reason: `State ${stateCode} is subject to CSAPR: ${csaprPrograms.join(', ')}`,
      pollutants: ['SO2', 'NOx'] as Pollutant[],
    })
  }

  // MATS
  if (isMATSApplicable(fuelTypes)) {
    programs.push({
      programId: 'MATS',
      title: 'Mercury and Air Toxics Standards',
      reason: `Unit burns coal/oil (${fuelTypes.join(', ')})`,
      pollutants: ['Hg', 'HCl', 'HF', 'PM'] as Pollutant[],
    })
  }

  // RGGI
  if (isRGGIApplicable(stateCode)) {
    programs.push({
      programId: 'RGGI',
      title: 'Regional Greenhouse Gas Initiative',
      reason: `State ${stateCode} participates in RGGI`,
      pollutants: ['CO2'] as Pollutant[],
    })
  }

  return programs
}

function recommendMethods(
  pollutants: Pollutant[],
  fuelTypes: FuelType[],
  _currentMonitors?: MonitoringPlanAnalysisInput['currentMonitors']
): MethodRecommendation[] {
  const recommendations: MethodRecommendation[] = []

  for (const pollutant of pollutants) {
    const methods: MethodRecommendation['methods'] = []

    // Determine method options based on pollutant
    if (['SO2', 'NOx', 'CO2', 'CO'].includes(pollutant)) {
      methods.push({
        method: 'CEM',
        formulas:
          pollutant === 'SO2' ? ['F-1', 'F-2'] : pollutant === 'NOx' ? ['F-5', 'F-6'] : ['F-11'],
        pros: ['Real-time monitoring', 'High accuracy', 'Widely accepted'],
        cons: ['Higher capital cost', 'Ongoing maintenance'],
        recommended: true,
      })

      if (
        pollutant === 'SO2' &&
        fuelTypes.some((f) => ['gas', 'natural_gas', 'pipeline_gas'].includes(f))
      ) {
        methods.push({
          method: 'Appendix_D',
          formulas: ['D-5', 'D-6'],
          pros: ['Lower cost for gas units', 'Less maintenance'],
          cons: ['Less accurate', 'Requires fuel sampling'],
          recommended: false,
        })
      }
    }

    if (pollutant === 'Hg') {
      methods.push({
        method: 'Sorbent_Trap',
        formulas: [],
        pros: ['Accurate for Hg', 'Part 63 compliant'],
        cons: ['Consumables cost', 'Lab analysis required'],
        recommended: true,
      })
    }

    if (['PM', 'PM10', 'PM2.5'].includes(pollutant)) {
      methods.push({
        method: 'PM_CPMS',
        formulas: [],
        pros: ['Continuous monitoring'],
        cons: ['Correlation testing required'],
        recommended: true,
      })
      methods.push({
        method: 'Stack_Test',
        formulas: [],
        pros: ['Direct measurement'],
        cons: ['Periodic only', 'High per-test cost'],
        recommended: false,
      })
    }

    recommendations.push({
      pollutant,
      methods,
      citation: getCitationForPollutant(pollutant),
    })
  }

  return recommendations
}

function getCitationForPollutant(pollutant: Pollutant): string {
  const citations: Record<string, string> = {
    SO2: '40 CFR Part 75, Appendix A',
    NOx: '40 CFR Part 75, Appendix A',
    CO2: '40 CFR Part 75, Appendix G',
    CO: '40 CFR Part 75, Appendix A',
    Hg: '40 CFR Part 63, Subpart UUUUU',
    HCl: '40 CFR Part 63, Subpart UUUUU',
    HF: '40 CFR Part 63, Subpart UUUUU',
    PM: '40 CFR Part 63, Subpart UUUUU',
    PM10: '40 CFR Part 63, Subpart UUUUU',
    'PM2.5': '40 CFR Part 63, Subpart UUUUU',
  }
  return citations[pollutant] ?? '40 CFR Part 75'
}

function getApplicableLimitsForAnalysis(
  fuelTypes: FuelType[],
  unitType: string,
  pollutants: Pollutant[]
): MCPApplicableLimit[] {
  const matchedLimits = getApplicableLimits({
    fuelTypes,
    unitType,
    pollutants,
  })

  return matchedLimits.map((limit) => ({
    regulation: limit.regulation,
    pollutant: limit.pollutant as Pollutant,
    limitValue: limit.limitValue,
    units: limit.units,
    averagingPeriod: limit.averagingPeriod ?? '30-day rolling',
    citation: limit.citation ?? '',
  }))
}

function identifyGaps(
  pollutants: Pollutant[],
  currentMonitors: MonitoringPlanAnalysisInput['currentMonitors'],
  applicablePrograms: ApplicableProgram[]
): ComplianceGap[] {
  const gaps: ComplianceGap[] = []

  // Check for missing CEM monitors
  const cemPollutants: Pollutant[] = ['SO2', 'NOx', 'CO2']
  const currentCemParams = currentMonitors?.cems?.map((c) => c.parameter) ?? []

  for (const pollutant of pollutants) {
    if (cemPollutants.includes(pollutant) && !currentCemParams.includes(pollutant)) {
      gaps.push({
        category: 'MONITORING',
        gapId: `MISSING_${pollutant}_CEM`,
        issue: `No ${pollutant} CEM configured`,
        severity: 'HIGH',
        recommendation: `Install ${pollutant} CEM or use approved alternative method`,
        citation: '40 CFR 75.10',
        affectedPrograms: applicablePrograms.map((p) => p.programId),
      })
    }
  }

  // Check for missing Hg monitoring
  if (pollutants.includes('Hg') && currentMonitors?.sorbentTrap !== true) {
    gaps.push({
      category: 'MONITORING',
      gapId: 'MISSING_HG_MONITOR',
      issue: 'No Hg sorbent trap monitoring configured',
      severity: 'HIGH',
      recommendation: 'Install sorbent trap monitoring for Hg (MATS requirement)',
      citation: '40 CFR 63.10010',
      affectedPrograms: ['MATS'],
    })
  }

  // Check for flow monitor
  if (
    !currentCemParams.includes('Flow' as Pollutant) &&
    pollutants.some((p) => ['SO2', 'NOx', 'CO2'].includes(p))
  ) {
    gaps.push({
      category: 'MONITORING',
      gapId: 'MISSING_FLOW',
      issue: 'No flow monitor configured (required for mass calculations)',
      severity: 'HIGH',
      recommendation: 'Install flow monitoring system',
      citation: '40 CFR 75.10(a)(2)',
      affectedPrograms: ['ARP', 'CSAPR'],
    })
  }

  return gaps
}

function getQARequirements(
  _pollutants: Pollutant[],
  currentMonitors: MonitoringPlanAnalysisInput['currentMonitors']
): QARequirement[] {
  const requirements: QARequirement[] = []

  const hasCEM = (currentMonitors?.cems?.length ?? 0) > 0

  if (hasCEM) {
    requirements.push({
      test: 'RATA',
      frequency: 'Annual (quarterly if relative accuracy > 7.5%)',
      applicableMonitors: currentMonitors?.cems?.map((c) => c.parameter) ?? [],
      citation: '40 CFR 75 Appendix B, §2.3',
    })

    requirements.push({
      test: 'linearity',
      frequency: 'Quarterly',
      applicableMonitors: currentMonitors?.cems?.map((c) => c.parameter) ?? [],
      citation: '40 CFR 75 Appendix B, §2.2',
    })

    requirements.push({
      test: 'CGA',
      frequency: 'Quarterly (if using Appendix D)',
      applicableMonitors: ['Fuel flow'],
      citation: '40 CFR 75 Appendix D, §2.1.7',
    })
  }

  if (currentMonitors?.sorbentTrap === true) {
    requirements.push({
      test: 'sorbent_trap_section_breakthrough',
      frequency: 'Each sample period',
      applicableMonitors: ['Hg'],
      citation: '40 CFR 63 Appendix A, Method 30B',
    })
  }

  return requirements
}

function getReportingSchedule(applicablePrograms: ApplicableProgram[]): ReportingItem[] {
  const schedule: ReportingItem[] = []

  const programIds = applicablePrograms.map((p) => p.programId)

  if (programIds.includes('ARP') || programIds.includes('CSAPR')) {
    schedule.push({
      report: 'Quarterly EDR',
      frequency: 'Quarterly',
      deadline: '30 days after quarter end',
      programs: ['ARP', 'CSAPR'],
    })

    schedule.push({
      report: 'Annual Compliance Certification',
      frequency: 'Annual',
      deadline: 'March 1',
      programs: ['ARP'],
    })
  }

  if (programIds.includes('MATS')) {
    schedule.push({
      report: 'MATS Quarterly Report',
      frequency: 'Quarterly',
      deadline: '30 days after quarter end',
      programs: ['MATS'],
    })

    schedule.push({
      report: 'MATS Annual Compliance Report',
      frequency: 'Annual',
      deadline: 'January 31',
      programs: ['MATS'],
    })
  }

  return schedule
}

function suggestFormulas(
  fuelTypes: FuelType[],
  currentMonitors: MonitoringPlanAnalysisInput['currentMonitors'],
  pollutants: Pollutant[]
): SuggestedFormula[] {
  const suggestions: SuggestedFormula[] = []

  const hasCEM = (currentMonitors?.cems?.length ?? 0) > 0
  const hasFuelFlow = currentMonitors?.fuel !== undefined

  // CEM formulas
  if (hasCEM) {
    if (pollutants.includes('SO2')) {
      suggestions.push({
        formulaCode: 'F-1',
        appendix: 'A',
        description: 'SO2 mass rate from CEM concentration and flow',
        parameters: ['SO2 concentration', 'Stack flow'],
        reason: 'Standard CEM calculation for SO2 mass emissions',
      })
    }

    if (pollutants.includes('NOx')) {
      suggestions.push({
        formulaCode: 'F-5',
        appendix: 'A',
        description: 'NOx mass rate from CEM concentration and flow',
        parameters: ['NOx concentration', 'Stack flow'],
        reason: 'Standard CEM calculation for NOx mass emissions',
      })

      suggestions.push({
        formulaCode: 'F-14A',
        appendix: 'F',
        description: 'NOx emission rate (lb/MMBtu)',
        parameters: ['NOx concentration', 'O2 concentration'],
        reason: 'NOx rate calculation for emission standards',
      })
    }

    if (pollutants.includes('CO2')) {
      suggestions.push({
        formulaCode: 'F-11',
        appendix: 'G',
        description: 'CO2 mass rate from CEM concentration and flow',
        parameters: ['CO2 concentration', 'Stack flow'],
        reason: 'Standard CEM calculation for CO2 mass emissions',
      })
    }
  }

  // Fuel-based formulas
  if (hasFuelFlow && fuelTypes.some((f) => ['gas', 'natural_gas', 'pipeline_gas'].includes(f))) {
    suggestions.push({
      formulaCode: 'D-5',
      appendix: 'D',
      description: 'Heat input from gas fuel flow',
      parameters: ['Fuel flow rate', 'Gross calorific value'],
      reason: 'Gas units using fuel flow monitoring',
    })

    suggestions.push({
      formulaCode: 'G-3',
      appendix: 'G',
      description: 'CO2 from default gas carbon content',
      parameters: ['Fuel flow rate'],
      reason: 'CO2 calculation using default emission factors',
    })
  }

  return suggestions
}
