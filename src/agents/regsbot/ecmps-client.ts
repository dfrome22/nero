/**
 * ECMPS/CAMD API Client
 *
 * Client for EPA's Clean Air Markets Division APIs
 * - Facility and Unit data
 * - Monitoring Plans
 * - Emissions data
 */

import {
  getApplicableLimits,
  getApplicableRegulations,
  getCSAPRProgramsForState,
} from '../../services/compliance-data'
import {
  normalizeMonitoringPlan,
  type CAMDFacility,
  type CAMDUnit,
  type EmissionsQuery,
  type EmissionsSummary,
  type FacilitySearchQuery,
  type MonitoringPlan,
  type MonitoringPlanQuery,
} from '../../types/ecmps-api'
import type { FacilityContext, GetFacilityContextInput } from '../../types/mcp'

// CAMD API base URLs (using test environment per API docs)
const CAMD_API_BASE = 'https://api.epa.gov/easey/test'
const FACILITIES_API = `${CAMD_API_BASE}/facilities-mgmt`
const MONITOR_PLANS_API = `${CAMD_API_BASE}/monitor-plan-mgmt`
const EMISSIONS_API = `${CAMD_API_BASE}/emissions-mgmt`

/**
 * ECMPS/CAMD API Client
 */
export class ECMPSClient {
  private apiKey?: string

  constructor(apiKey?: string) {
    if (apiKey !== undefined) {
      this.apiKey = apiKey
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey !== undefined && this.apiKey !== '') {
      headers['x-api-key'] = this.apiKey
    }
    return headers
  }

  // ============================================================================
  // FACILITY OPERATIONS
  // ============================================================================

  /**
   * Search for facilities
   */
  async searchFacilities(query: FacilitySearchQuery): Promise<CAMDFacility[]> {
    const params = new URLSearchParams()

    if (query.stateCode !== undefined) params.set('stateCode', query.stateCode)
    if (query.orisCode !== undefined) params.set('orisCode', query.orisCode.toString())
    if (query.facilityName !== undefined) params.set('facilityName', query.facilityName)
    if (query.programCode !== undefined) params.set('programCode', query.programCode)

    const response = await fetch(`${FACILITIES_API}/facilities?${params.toString()}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`CAMD API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<CAMDFacility[]>
  }

  /**
   * Get facility by ORIS code
   */
  async getFacility(orisCode: number): Promise<CAMDFacility> {
    const response = await fetch(`${FACILITIES_API}/facilities/${orisCode.toString()}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`CAMD API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<CAMDFacility>
  }

  /**
   * Get units for a facility
   */
  async getUnits(orisCode: number): Promise<CAMDUnit[]> {
    const response = await fetch(`${FACILITIES_API}/facilities/${orisCode.toString()}/units`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`CAMD API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<CAMDUnit[]>
  }

  // ============================================================================
  // MONITORING PLAN OPERATIONS
  // ============================================================================

  /**
   * Get list of monitoring plan configurations for a facility.
   * Each configuration has an 'id' which is the planId for export.
   * Uses /monitor-plan-mgmt/configurations endpoint with orisCodes parameter.
   */
  async getMonitoringPlanConfigurations(orisCode: number): Promise<
    {
      id: string
      name?: string
      active?: boolean
      unitIds?: string[]
      stackPipeIds?: string[]
    }[]
  > {
    // Use the correct endpoint: /monitor-plan-mgmt/configurations with orisCodes (plural)
    const response = await fetch(`${MONITOR_PLANS_API}/configurations?orisCodes=${orisCode}`, {
      headers: this.getHeaders(),
    })

    // Handle 404 as "no configurations found" - this is common for newer facilities
    if (response.status === 404) {
      return []
    }

    if (!response.ok) {
      throw new Error(`CAMD API error: ${response.status} ${response.statusText}`)
    }

    const rawData = (await response.json()) as
      | { id?: string; name?: string | null; active?: boolean }[]
      | { items?: { id?: string; name?: string | null; active?: boolean }[] }

    // Handle different response structures
    let configs: { id?: string; name?: string | null; active?: boolean }[] = []
    if (Array.isArray(rawData)) {
      configs = rawData
    } else if (rawData.items !== undefined) {
      configs = rawData.items
    }

    // Filter to active plans and map to expected structure
    return configs
      .filter((c) => c.active === true && c.id !== undefined)
      .map((c) => {
        const result: { id: string; name?: string; active?: boolean } = {
          id: c.id ?? '',
        }
        // Only add name if it's a non-null/non-empty string
        if (c.name !== null && c.name !== undefined && c.name !== '') {
          result.name = c.name
        }
        // Only add active if defined
        if (c.active !== undefined) {
          result.active = c.active
        }
        return result
      })
  }

  /**
   * Export full monitoring plan by planId.
   * Use getMonitoringPlanConfigurations first to get available planIds.
   * Normalizes the raw API response to flat MonitoringPlan structure.
   */
  async exportMonitoringPlan(planId: string): Promise<MonitoringPlan> {
    const params = new URLSearchParams()
    params.set('planId', planId)
    params.set('reportedValuesOnly', 'true')

    const response = await fetch(`${MONITOR_PLANS_API}/plans/export?${params.toString()}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`CAMD API error: ${response.status} ${response.statusText}`)
    }

    // Raw API returns nested structure - normalize it to flat arrays
    const rawData: unknown = await response.json()
    const normalized = normalizeMonitoringPlan(rawData)

    if (!normalized) {
      throw new Error(`Failed to normalize monitoring plan ${planId}`)
    }

    return normalized
  }

  /**
   * Get monitoring plan for a facility (legacy - fetches first available plan)
   * @deprecated Use getMonitoringPlanConfigurations + exportMonitoringPlan instead
   */
  async getMonitoringPlan(query: MonitoringPlanQuery): Promise<MonitoringPlan> {
    // Get list of configurations first
    const configs = await this.getMonitoringPlanConfigurations(query.orisCode)

    if (configs.length === 0) {
      throw new Error(`No monitoring plans found for ORIS ${query.orisCode}`)
    }

    // Get first config (we already checked length > 0)
    const firstConfig = configs[0]
    if (firstConfig === undefined) {
      throw new Error(`No monitoring plans found for ORIS ${query.orisCode}`)
    }

    // If unitId specified, try to find matching plan
    let planId = firstConfig.id
    if (query.unitId !== undefined) {
      const match = configs.find((c) => c.unitIds?.includes(query.unitId!))
      if (match !== undefined) {
        planId = match.id
      }
    }

    // Export the full plan
    return this.exportMonitoringPlan(planId)
  }

  /**
   * Get monitoring methods for a location
   */
  async getMonitoringMethods(
    orisCode: number,
    locationId: string
  ): Promise<MonitoringPlan['methods']> {
    const plan = await this.getMonitoringPlan({ orisCode })
    return plan.methods.filter((m) => m.locationId === locationId)
  }

  /**
   * Get monitoring systems for a location
   */
  async getMonitoringSystems(
    orisCode: number,
    locationId: string
  ): Promise<MonitoringPlan['systems']> {
    const plan = await this.getMonitoringPlan({ orisCode })
    return plan.systems.filter((s) => s.locationId === locationId)
  }

  // ============================================================================
  // EMISSIONS DATA OPERATIONS
  // ============================================================================

  /**
   * Get emissions data for a facility
   */
  async getEmissions(query: EmissionsQuery): Promise<EmissionsSummary[]> {
    const params = new URLSearchParams()
    params.set('orisCode', query.orisCode.toString())
    params.set('beginYear', query.beginYear.toString())
    params.set('endYear', query.endYear.toString())

    if (query.unitId !== undefined) params.set('unitId', query.unitId)
    if (query.beginQuarter !== undefined) params.set('beginQuarter', query.beginQuarter.toString())
    if (query.endQuarter !== undefined) params.set('endQuarter', query.endQuarter.toString())

    const response = await fetch(
      `${EMISSIONS_API}/emissions/apportioned/quarterly?${params.toString()}`,
      {
        headers: this.getHeaders(),
      }
    )

    if (!response.ok) {
      throw new Error(`CAMD API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<EmissionsSummary[]>
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get programs a facility participates in.
   * Checks both facility-level programCodes and unit-level programData.
   * Handles API errors gracefully - if getUnits fails, still returns facility-level programs.
   */
  async getFacilityPrograms(orisCode: number): Promise<string[]> {
    const programs = new Set<string>()

    // Get facility info (required)
    const facility = await this.getFacility(orisCode)

    // Add facility-level programs
    for (const code of facility.programCodes ?? []) {
      programs.add(code)
    }

    // Try to get unit-level programs (optional - may fail for some facilities)
    try {
      const units = await this.getUnits(orisCode)
      for (const unit of units) {
        for (const pd of unit.programData ?? []) {
          if (pd.programCode) {
            programs.add(pd.programCode)
          }
        }
      }
    } catch {
      // getUnits may return 404 for some facilities - that's OK, use facility-level programs
    }

    // Normalize common program variations
    const normalized = new Set<string>()
    for (const p of programs) {
      normalized.add(p)
      // Also add canonical names
      if (p === 'ARP' || p === 'Acid Rain') normalized.add('ARP')
      if (p.startsWith('CS')) normalized.add('CSAPR') // CSNOX, CSOSG1, etc.
      if (p === 'MATS' || p === 'MATSMRP') normalized.add('MATS')
      if (p === 'NBP' || p === 'OTC') normalized.add('NBP')
    }

    return Array.from(normalized)
  }

  /**
   * Check if facility is in a specific program
   */
  async isInProgram(orisCode: number, programCode: string): Promise<boolean> {
    const programs = await this.getFacilityPrograms(orisCode)
    return programs.includes(programCode)
  }

  // ============================================================================
  // CONSOLIDATED FACILITY CONTEXT
  // ============================================================================

  /**
   * Get comprehensive facility context in a single call.
   * Consolidates facility info, monitoring plan, programs, and enriched MCP data.
   *
   * @param input - Facility query parameters
   * @returns FacilityContext with all data needed for compliance analysis
   */
  async getFacilityContext(input: GetFacilityContextInput): Promise<FacilityContext> {
    const errors: string[] = []

    // 1. Fetch facility info
    let facilityData: CAMDFacility | null = null
    try {
      facilityData = await this.getFacility(input.orisCode)
    } catch (err) {
      errors.push(`Failed to fetch facility: ${err instanceof Error ? err.message : String(err)}`)
    }

    // 2. Fetch unit attributes
    let unitsData: CAMDUnit[] = []
    try {
      unitsData = await this.getUnits(input.orisCode)
    } catch (err) {
      errors.push(`Failed to fetch units: ${err instanceof Error ? err.message : String(err)}`)
    }

    // 3. Fetch monitoring plan configurations and export latest
    let monitoringPlanData: MonitoringPlan | null = null
    try {
      const configs = await this.getMonitoringPlanConfigurations(input.orisCode)
      if (configs.length > 0) {
        const planId = input.planId ?? configs[0]?.id
        if (planId !== undefined) {
          monitoringPlanData = await this.exportMonitoringPlan(planId)
        }
      }
    } catch (err) {
      errors.push(
        `Failed to fetch monitoring plan: ${err instanceof Error ? err.message : String(err)}`
      )
    }

    // Extract programs from facility data
    const programs = facilityData?.programCodes ?? []

    // Build facility section (handle optional county properly)
    const facility =
      facilityData !== null
        ? (() => {
            const base = {
              orisCode: facilityData.orisCode,
              facilityId: facilityData.facilityId,
              facilityName: facilityData.facilityName,
              stateCode: facilityData.stateCode,
            }
            if (facilityData.countyCode !== undefined) {
              return { ...base, county: facilityData.countyCode }
            }
            return base
          })()
        : null

    // Build monitoring plan section
    const monitoringPlan =
      monitoringPlanData !== null
        ? {
            planId: monitoringPlanData.monitorPlanId ?? '',
            status: monitoringPlanData.submissionStatus ?? 'UNKNOWN',
            locations: (monitoringPlanData.locations ?? []).map((loc) => {
              const base = {
                locationId: loc.locationId,
                locationType: this.determineLocationType(loc),
              }
              if (loc.unitId !== undefined) {
                return { ...base, unitId: loc.unitId }
              }
              if (loc.stackPipeId !== undefined) {
                return { ...base, stackPipeId: loc.stackPipeId }
              }
              return base
            }),
            methods: monitoringPlanData.methods.map((m) => {
              const base = {
                locationId: m.locationId,
                parameter: m.parameterCode,
                methodCode: m.methodCode,
                beginDate: m.beginDate,
              }
              if (m.substituteDataCode !== undefined) {
                return { ...base, substituteDataCode: m.substituteDataCode }
              }
              return base
            }),
            systems: monitoringPlanData.systems.map((s) => {
              const base = {
                locationId: s.locationId,
                systemId: s.systemId,
                systemType: s.systemTypeCode,
              }
              if (s.fuelCode !== undefined) {
                return { ...base, fuelCode: s.fuelCode }
              }
              return base
            }),
            formulas: (monitoringPlanData.formulas ?? []).map((f) => ({
              locationId: f.locationId,
              formulaId: f.formulaId,
              formulaCode: f.formulaCode,
              parameter: f.parameterCode,
            })),
          }
        : {
            planId: '',
            status: 'NOT_FOUND',
            locations: [],
            methods: [],
            systems: [],
            formulas: [],
          }

    // Build units section from CAMD unit data
    const units = unitsData.map((unit) => {
      const base = {
        unitId: unit.unitName,
        unitType: unit.unitType ?? 'Unknown',
        fuelTypes: [unit.primaryFuelCode, unit.secondaryFuelCode].filter(
          (f): f is string => f !== undefined
        ),
        programs: (unit.programData ?? []).map((p) => p.programCode),
      }
      if (unit.maxHourlyHeatInputCapacity !== undefined) {
        return { ...base, capacityMW: unit.maxHourlyHeatInputCapacity / 10 }
      }
      return base
    })

    // Enrich with MCP data
    const stateCode = facilityData?.stateCode ?? ''
    const regsForState = getApplicableRegulations(stateCode)
    const applicableRegulations = regsForState.map((reg) => ({
      id: reg.id,
      title: reg.title,
      cfr: reg.cfr,
    }))
    const csaprPrograms = getCSAPRProgramsForState(stateCode)

    // Get applicable limits based on unit types and fuels
    const allFuelTypes = units.flatMap((u) => u.fuelTypes)
    const rawLimits = getApplicableLimits({
      fuelTypes: allFuelTypes,
    })
    const applicableLimits = rawLimits.map((lim) => ({
      regulation: lim.regulation,
      pollutant: lim.pollutant,
      limitValue: lim.limitValue,
      units: lim.units,
      citation: lim.citation ?? '',
    }))

    // Determine program flags
    const hasARP = programs.includes('ARP') || programs.includes('Acid Rain')
    const hasMATS = programs.includes('MATS') || programs.includes('MATSMRP')
    const hasRGGI = programs.includes('RGGI')

    const result: FacilityContext = {
      facility,
      programs,
      monitoringPlan,
      units,
      applicableRegulations,
      csaprPrograms,
      applicableLimits,
      hasMATS,
      hasRGGI,
      hasARP,
    }

    // Add errors if any occurred
    if (errors.length > 0) {
      result.errors = errors
    }

    // Include raw plan if requested
    if (input.includeFullPlan === true && monitoringPlanData !== null) {
      result.rawMonitoringPlan = monitoringPlanData
    }

    return result
  }

  /**
   * Determine location type from monitoring location data
   */
  private determineLocationType(loc: {
    unitId?: string
    stackPipeId?: string
  }): 'unit' | 'stack' | 'pipe' | 'multiple' {
    if (loc.unitId !== undefined && loc.stackPipeId !== undefined) {
      return 'multiple'
    }
    if (loc.stackPipeId !== undefined) {
      return loc.stackPipeId.startsWith('CP') ? 'pipe' : 'stack'
    }
    return 'unit'
  }
}

// Default singleton instance (no API key - uses public endpoints)
export const ecmpsClient = new ECMPSClient()
