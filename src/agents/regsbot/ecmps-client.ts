/**
 * ECMPS/CAMD API Client
 *
 * Client for EPA's Clean Air Markets Division APIs
 * - Facility and Unit data
 * - Monitoring Plans
 * - Emissions data
 */

import type {
  CAMDFacility,
  CAMDUnit,
  EmissionsQuery,
  EmissionsSummary,
  FacilitySearchQuery,
  MonitoringPlan,
  MonitoringPlanQuery,
} from '../../types/ecmps-api'

// CAMD API base URLs
const CAMD_API_BASE = 'https://api.epa.gov/easey'
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
   * Get monitoring plan for a facility
   */
  async getMonitoringPlan(query: MonitoringPlanQuery): Promise<MonitoringPlan> {
    const params = new URLSearchParams()
    params.set('orisCode', query.orisCode.toString())

    if (query.unitId !== undefined) params.set('unitId', query.unitId)
    if (query.year !== undefined) params.set('year', query.year.toString())
    if (query.quarter !== undefined) params.set('quarter', query.quarter.toString())

    const response = await fetch(`${MONITOR_PLANS_API}/monitor-plans?${params.toString()}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`CAMD API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<MonitoringPlan>
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
   * Get programs a facility participates in
   */
  async getFacilityPrograms(orisCode: number): Promise<string[]> {
    const facility = await this.getFacility(orisCode)
    return facility.programCodes ?? []
  }

  /**
   * Check if facility is in a specific program
   */
  async isInProgram(orisCode: number, programCode: string): Promise<boolean> {
    const programs = await this.getFacilityPrograms(orisCode)
    return programs.includes(programCode)
  }
}

// Default singleton instance (no API key - uses public endpoints)
export const ecmpsClient = new ECMPSClient()
