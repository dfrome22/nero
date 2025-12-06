/**
 * Facility Selector Component
 *
 * 3-Step facility selection flow:
 * 1. Select State → GET /facilities-mgmt/facilities?stateCode=XX (filter active only)
 * 2. Select Facility → GET /monitor-plan-mgmt/configurations?orisCodes=N
 * 3. Select Plan → GET /monitor-plan-mgmt/plans/export?planId=XXX&reportedValuesOnly=true
 *
 * Uses EPA ECMPS API (beta for facilities, test for monitor-plan-mgmt)
 */

import { useState } from 'react'
import styles from './FacilitySelector.module.css'

// ============================================================================
// TYPES
// ============================================================================

// US State codes for dropdown
const US_STATES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'PR', name: 'Puerto Rico' },
]

// Facility from Step 1 (facilities-mgmt/facilities)
interface Facility {
  facilityId: number // This is the ORIS code
  facilityName: string
  stateCode: string
}

// Plan configuration from Step 2 (monitor-plan-mgmt/configurations)
interface PlanConfiguration {
  id: string // This is the planId for export
  name: string
  locations: string[]
  active: boolean // Filter to active=true only
}

// Facility attributes from facilities-mgmt/facilities/attributes
interface FacilityUnitAttributes {
  unitId: string
  programCodeInfo: string // "ARP, CSNOX, CSOSG2, CSSO2G2, MATS"
  primaryFuelInfo: string
  secondaryFuelInfo: string | null
  unitType: string
  so2ControlInfo: string | null
  noxControlInfo: string | null
  pmControlInfo: string | null
  hgControlInfo: string | null
  maxHourlyHIRate: number
  operatingStatus: string
  epaRegion: number
  sourceCategory: string
}

// Aggregated facility info from attributes
interface FacilityInfo {
  programCodes: string[] // Unique programs across all units
  primaryFuels: string[]
  hasCoal: boolean
  hasGas: boolean
  hasOil: boolean
  hasMats: boolean
  units: FacilityUnitAttributes[]
}

// Full monitoring plan from Step 3
export interface MonitoringPlanFull {
  id: string
  orisCode: number
  facilityName: string
  data: Record<string, unknown>
}

export interface SelectedFacility {
  orisCode: number | null
  facilityName: string | null
  stateCode: string | null // State the facility is in (for state-specific regulations)
  selectedPlanId: string | null
  selectedLocationId: string | null // The location (unit/stack) selected within the plan
  fullPlan: MonitoringPlanFull | null
  facilityInfo: FacilityInfo | null
  locationInfo: LocationInfo | null // Info specific to the selected location
  apiKey: string
}

// Location-specific info extracted from the monitoring plan
export interface LocationInfo {
  locationId: string
  locationType: 'unit' | 'stack' | 'pipe' | 'common'
  unitId: string | null
  stackPipeId: string | null
  parameters: string[] // Parameters monitored at this location
  methods: string[] // Method codes used
  systems: string[] // System types
  programCodes: string[] // Programs applicable to this location
  primaryFuels: string[] // Fuels for this unit
}

interface FacilitySelectorProps {
  onSelectionChange: (selection: SelectedFacility) => void
}

// API Response types for type-safe parsing
interface FacilitiesApiResponse {
  items?: Facility[]
  data?: Facility[]
}

interface AttributesApiItem {
  unitId?: string | number
  programCodeInfo?: string
  primaryFuelInfo?: string
  secondaryFuelInfo?: string | null
  unitType?: string
  so2ControlInfo?: string | null
  noxControlInfo?: string | null
  pmControlInfo?: string | null
  hgControlInfo?: string | null
  maxHourlyHIRate?: number
  operatingStatus?: string
  epaRegion?: number
  sourceCategory?: string
}

interface AttributesApiResponse {
  items?: AttributesApiItem[]
}

interface PlanConfigApiItem {
  id?: string
  name?: string | null
  active?: boolean
}

interface MonitoringMethodApiData {
  parameterCode?: string
  monitoringMethodCode?: string
}

interface MonitoringSystemApiData {
  systemTypeCode?: string
}

interface UnitFuelApiData {
  indicatorCode?: string
  fuelCode?: string
}

interface MonitoringQualificationApiData {
  qualificationTypeCode?: string
}

interface MonitoringLocationApiData {
  unitId?: string | null
  stackPipeId?: string | null
  monitoringMethodData?: MonitoringMethodApiData[]
  monitoringSystemData?: MonitoringSystemApiData[]
  unitFuelData?: UnitFuelApiData[]
  monitoringQualificationData?: MonitoringQualificationApiData[]
}

// ============================================================================
// HELPER: Extract location info from monitoring plan data
// ============================================================================

/**
 * Extract location-specific info from the monitoring plan export data.
 * The plan name often indicates which location (e.g., "6B" means unit 6B).
 */
function extractLocationInfo(
  data: Record<string, unknown>,
  planName?: string
): LocationInfo | null {
  const rawLocations = data.monitoringLocationData
  if (!Array.isArray(rawLocations) || rawLocations.length === 0) return null

  const locations = rawLocations as MonitoringLocationApiData[]
  const firstLocation = locations[0]
  if (firstLocation === undefined) return null

  // Try to find the location matching the plan name
  // Plan names are often like "6B", "1, 2, CS0AAN", etc.
  let targetLoc: MonitoringLocationApiData = firstLocation // Default to first location

  if (planName !== undefined && planName !== '') {
    // Parse the plan name for unit IDs (e.g., "6B" or "1, 2, CS0AAN")
    const parts = planName.split(',').map((p) => p.trim())
    for (const part of parts) {
      const found = locations.find(
        (loc) =>
          loc.unitId === part ||
          loc.stackPipeId === part ||
          (loc.unitId !== null && loc.unitId !== undefined && loc.unitId.includes(part)) ||
          (loc.stackPipeId !== null &&
            loc.stackPipeId !== undefined &&
            loc.stackPipeId.includes(part))
      )
      if (found !== undefined) {
        targetLoc = found
        break
      }
    }
  }

  const unitId = targetLoc.unitId ?? null
  const stackPipeId = targetLoc.stackPipeId ?? null
  const locationId = unitId ?? stackPipeId ?? 'unknown'
  const locationType: LocationInfo['locationType'] =
    stackPipeId !== null ? 'stack' : unitId !== null ? 'unit' : 'common'

  // Extract parameters from methods
  const methods = targetLoc.monitoringMethodData ?? []
  const parameters = [...new Set(methods.map((m) => m.parameterCode ?? '').filter(Boolean))]
  const methodCodes = [...new Set(methods.map((m) => m.monitoringMethodCode ?? '').filter(Boolean))]

  // Extract system types
  const systems = targetLoc.monitoringSystemData ?? []
  const systemTypes = [...new Set(systems.map((s) => s.systemTypeCode ?? '').filter(Boolean))]

  // Extract fuel info
  const fuels = targetLoc.unitFuelData ?? []
  const primaryFuels = [
    ...new Set(
      fuels
        .filter((f) => f.indicatorCode === 'P')
        .map((f) => f.fuelCode ?? '')
        .filter(Boolean)
    ),
  ]

  // Try to extract program codes from qualifications or other data
  const quals = targetLoc.monitoringQualificationData ?? []
  const programCodes = [...new Set(quals.map((q) => q.qualificationTypeCode ?? '').filter(Boolean))]

  return {
    locationId,
    locationType,
    unitId,
    stackPipeId,
    parameters,
    methods: methodCodes,
    systems: systemTypes,
    programCodes,
    primaryFuels,
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FacilitySelector({ onSelectionChange }: FacilitySelectorProps): React.JSX.Element {
  // API Key state
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  // Step 1: State selection
  const [selectedState, setSelectedState] = useState('')
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false)

  // Step 2: Facility selection
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [planConfigs, setPlanConfigs] = useState<PlanConfiguration[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)

  // Step 3: Plan selection & export
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [fullPlan, setFullPlan] = useState<MonitoringPlanFull | null>(null)
  const [isLoadingFullPlan, setIsLoadingFullPlan] = useState(false)

  // Facility attributes (program codes, fuels, etc.)
  const [facilityInfo, setFacilityInfo] = useState<FacilityInfo | null>(null)
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)

  // UI state
  const [searchLog, setSearchLog] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Helpers
  const log = (message: string): void => {
    setSearchLog((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${message}`])
  }

  const clearAll = (): void => {
    setFacilities([])
    setSelectedFacility(null)
    setPlanConfigs([])
    setSelectedPlanId(null)
    setFullPlan(null)
    setFacilityInfo(null)
    setLocationInfo(null)
    setSearchLog([])
    setError(null)
  }

  const notifyChange = (updates: Partial<SelectedFacility>): void => {
    onSelectionChange({
      orisCode: selectedFacility?.facilityId ?? null,
      facilityName: selectedFacility?.facilityName ?? null,
      stateCode: selectedState !== '' ? selectedState : null,
      selectedPlanId,
      selectedLocationId: null,
      fullPlan,
      facilityInfo,
      locationInfo,
      apiKey,
      ...updates,
    })
  }

  // ============================================================================
  // STEP 1: Load facilities for selected state
  // ============================================================================
  const handleStateChange = async (stateCode: string): Promise<void> => {
    setSelectedState(stateCode)
    clearAll()

    if (stateCode === '' || apiKey.trim() === '') {
      return
    }

    setIsLoadingFacilities(true)
    log(`Loading facilities for ${stateCode}...`)

    try {
      const response = await fetch(
        `https://api.epa.gov/easey/beta/facilities-mgmt/facilities?page=1&perPage=500&stateCode=${stateCode}`,
        {
          headers: {
            'x-api-key': apiKey,
            Accept: 'application/json',
          },
        }
      )

      if (!response.ok) {
        log(`✗ API error: ${response.status}`)
        setError(`API error: ${response.status}`)
        setIsLoadingFacilities(false)
        return
      }

      const rawData: FacilitiesApiResponse | Facility[] = (await response.json()) as
        | FacilitiesApiResponse
        | Facility[]

      // Handle different response structures - API returns { items: [...] }
      let data: Facility[] = []
      if (Array.isArray(rawData)) {
        data = rawData
      } else if (rawData.items !== undefined && Array.isArray(rawData.items)) {
        data = rawData.items
      } else if (rawData.data !== undefined && Array.isArray(rawData.data)) {
        data = rawData.data
      } else {
        log(`✗ Unexpected API response format`)
        log(`  Response keys: ${Object.keys(rawData).join(', ')}`)
        setError('Unexpected API response format')
        setIsLoadingFacilities(false)
        return
      }

      // No filtering here - active filter applies to monitoring plans (2nd call)
      log(`✓ Found ${data.length} facilities in ${stateCode}`)

      // Sort by name
      data.sort((a, b) => a.facilityName.localeCompare(b.facilityName))

      setFacilities(data)
    } catch (err) {
      log(`✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setError(err instanceof Error ? err.message : 'Failed to load facilities')
    } finally {
      setIsLoadingFacilities(false)
    }
  }

  // ============================================================================
  // HELPER: Fetch facility attributes (program codes, fuels, controls)
  // ============================================================================
  const fetchFacilityAttributes = async (facilityId: number): Promise<FacilityInfo | null> => {
    // Try years from current year backwards until we get data (go back to 2000)
    const currentYear = new Date().getFullYear()
    const yearsToTry: number[] = []
    for (let y = currentYear; y >= 2000; y--) {
      yearsToTry.push(y)
    }

    for (const year of yearsToTry) {
      try {
        const response = await fetch(
          `https://api.epa.gov/easey/beta/facilities-mgmt/facilities/attributes?year=${year}&facilityId=${facilityId}&page=1&perPage=100`,
          {
            headers: {
              'x-api-key': apiKey,
              Accept: 'application/json',
            },
          }
        )

        if (!response.ok) continue

        const rawData = (await response.json()) as AttributesApiResponse
        const items: AttributesApiItem[] = rawData.items ?? []

        if (items.length === 0) {
          log(`  No data for year ${year}, trying earlier...`)
          continue
        }

        log(`✓ Found facility attributes for year ${year}`)

        // Aggregate program codes across all units
        const allProgramCodes = new Set<string>()
        const allPrimaryFuels = new Set<string>()

        const units: FacilityUnitAttributes[] = items.map((item: AttributesApiItem) => {
          // Parse program codes (comma-separated string)
          const programStr = item.programCodeInfo ?? ''
          programStr.split(',').forEach((code: string) => {
            const trimmed = code.trim()
            if (trimmed !== '') allProgramCodes.add(trimmed)
          })

          // Track primary fuels
          if (item.primaryFuelInfo !== undefined && item.primaryFuelInfo !== '') {
            allPrimaryFuels.add(item.primaryFuelInfo)
          }

          return {
            unitId: item.unitId !== undefined ? String(item.unitId) : '',
            programCodeInfo: programStr,
            primaryFuelInfo: item.primaryFuelInfo ?? '',
            secondaryFuelInfo: item.secondaryFuelInfo ?? null,
            unitType: item.unitType ?? '',
            so2ControlInfo: item.so2ControlInfo ?? null,
            noxControlInfo: item.noxControlInfo ?? null,
            pmControlInfo: item.pmControlInfo ?? null,
            hgControlInfo: item.hgControlInfo ?? null,
            maxHourlyHIRate: item.maxHourlyHIRate ?? 0,
            operatingStatus: item.operatingStatus ?? '',
            epaRegion: item.epaRegion ?? 0,
            sourceCategory: item.sourceCategory ?? '',
          }
        })

        const programCodes = Array.from(allProgramCodes)
        const primaryFuels = Array.from(allPrimaryFuels)

        // Determine fuel types
        const fuelStr = primaryFuels.join(' ').toLowerCase()
        const hasCoal = fuelStr.includes('coal')
        const hasGas = fuelStr.includes('gas') || fuelStr.includes('natural')
        const hasOil =
          fuelStr.includes('oil') || fuelStr.includes('diesel') || fuelStr.includes('residual')
        const hasMats = programCodes.includes('MATS')

        // Log findings
        log(`  Programs: ${programCodes.join(', ')}`)
        log(`  Primary Fuels: ${primaryFuels.join(', ')}`)
        if (hasMats) log(`  ⚠️ MATS applicable (HAP monitoring required)`)

        return {
          programCodes,
          primaryFuels,
          hasCoal,
          hasGas,
          hasOil,
          hasMats,
          units,
        }
      } catch {
        // Try next year
        continue
      }
    }

    log(`  ⚠️ Could not fetch facility attributes`)
    return null
  }

  // ============================================================================
  // STEP 2: Load plan configurations for selected facility
  // ============================================================================
  const handleFacilitySelect = async (facility: Facility): Promise<void> => {
    setSelectedFacility(facility)
    setPlanConfigs([])
    setSelectedPlanId(null)
    setFullPlan(null)
    setFacilityInfo(null)

    log(`Selected: ${facility.facilityName} (ORIS: ${facility.facilityId})`)
    setIsLoadingPlans(true)

    // Fetch facility attributes in parallel with plan configurations
    const attributesPromise = fetchFacilityAttributes(facility.facilityId)

    try {
      // Use orisCodes (plural) parameter
      const response = await fetch(
        `https://api.epa.gov/easey/test/monitor-plan-mgmt/configurations?orisCodes=${facility.facilityId}`,
        {
          headers: {
            'x-api-key': apiKey,
            Accept: 'application/json',
          },
        }
      )

      if (!response.ok) {
        log(`✗ Failed to load plans: ${response.status}`)
        setError(`Failed to load monitoring plans: ${response.status}`)
        setIsLoadingPlans(false)
        return
      }

      const rawData:
        | { items?: PlanConfigApiItem[]; data?: PlanConfigApiItem[] }
        | PlanConfigApiItem[] = (await response.json()) as
        | { items?: PlanConfigApiItem[]; data?: PlanConfigApiItem[] }
        | PlanConfigApiItem[]

      // Handle different response structures
      let data: PlanConfigApiItem[] = []
      if (Array.isArray(rawData)) {
        data = rawData
      } else if (rawData.items !== undefined && Array.isArray(rawData.items)) {
        data = rawData.items
      } else if (rawData.data !== undefined && Array.isArray(rawData.data)) {
        data = rawData.data
      } else {
        log(`✗ Unexpected API response format`)
        log(`  Response keys: ${Object.keys(rawData as object).join(', ')}`)
        setError('Unexpected API response format')
        setIsLoadingPlans(false)
        return
      }

      // Map to our structure - use the 'name' field from API response
      const configs: PlanConfiguration[] = data.map((p: PlanConfigApiItem) => {
        // Use name if it exists and is not null/empty, otherwise fallback
        const planName =
          p.name !== null && p.name !== undefined && p.name !== ''
            ? p.name
            : `Plan ${(p.id ?? '').substring(0, 8)}`

        return {
          id: p.id ?? '',
          name: planName,
          locations: [],
          active: p.active === true,
        }
      })

      // Filter to active plans only
      const activeConfigs = configs.filter((c) => c.active)
      log(`✓ Found ${activeConfigs.length} active monitoring plan(s)`)

      activeConfigs.forEach((c) => {
        log(`  • ${c.name}`)
      })

      setPlanConfigs(activeConfigs)

      // Wait for facility attributes (started in parallel earlier)
      const attrs = await attributesPromise
      setFacilityInfo(attrs)

      notifyChange({
        orisCode: facility.facilityId,
        facilityName: facility.facilityName,
        facilityInfo: attrs,
      })
    } catch (err) {
      log(`✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setError(err instanceof Error ? err.message : 'Failed to load plans')
    } finally {
      setIsLoadingPlans(false)
    }
  }

  // ============================================================================
  // STEP 3: Export full monitoring plan
  // ============================================================================
  const handlePlanSelect = async (planId: string): Promise<void> => {
    setSelectedPlanId(planId)
    setFullPlan(null)
    setLocationInfo(null)
    setIsLoadingFullPlan(true)

    log(`Fetching full monitoring plan...`)

    try {
      const response = await fetch(
        `https://api.epa.gov/easey/test/monitor-plan-mgmt/plans/export?planId=${planId}&reportedValuesOnly=true`,
        {
          headers: {
            'x-api-key': apiKey,
            Accept: 'application/json',
          },
        }
      )

      if (!response.ok) {
        log(`✗ Failed to export plan: ${response.status}`)
        setError(`Failed to export monitoring plan: ${response.status}`)
        setIsLoadingFullPlan(false)
        return
      }

      const data = (await response.json()) as Record<string, unknown>
      const bytes = JSON.stringify(data).length

      log(`✓ Loaded monitoring plan (${bytes.toLocaleString()} bytes)`)

      const full: MonitoringPlanFull = {
        id: planId,
        orisCode: selectedFacility?.facilityId ?? 0,
        facilityName: selectedFacility?.facilityName ?? '',
        data,
      }

      // Extract location-specific info from the plan data
      const locInfo = extractLocationInfo(data, planConfigs.find((p) => p.id === planId)?.name)
      setLocationInfo(locInfo)

      if (locInfo) {
        log(`  Location: ${locInfo.locationId} (${locInfo.locationType})`)
        log(`  Parameters: ${locInfo.parameters.join(', ') || 'none'}`)
        log(`  Programs: ${locInfo.programCodes.join(', ') || 'none'}`)
      }

      setFullPlan(full)
      notifyChange({
        selectedPlanId: planId,
        selectedLocationId: locInfo?.locationId ?? null,
        fullPlan: full,
        locationInfo: locInfo,
      })
    } catch (err) {
      log(`✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setError(err instanceof Error ? err.message : 'Failed to export plan')
    } finally {
      setIsLoadingFullPlan(false)
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  const hasApiKey = apiKey.trim() !== ''

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <span className={styles.icon}>🏭</span>
        Select Facility
      </h3>

      {/* Step 1: API Key */}
      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <span className={styles.stepNumber}>1</span>
          <span className={styles.stepLabel}>EPA API Key</span>
        </div>
        <div className={styles.apiKeyRow}>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              notifyChange({ apiKey: e.target.value })
            }}
            placeholder="Enter your EPA API key"
            className={styles.apiKeyInput}
          />
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => {
              setShowApiKey(!showApiKey)
            }}
          >
            {showApiKey ? '🙈' : '👁️'}
          </button>
        </div>
        {!hasApiKey && (
          <p className={styles.hint}>
            Get a free API key at{' '}
            <a
              href="https://www.epa.gov/power-sector/cam-api-portal"
              target="_blank"
              rel="noopener noreferrer"
            >
              EPA CAM API Portal
            </a>
          </p>
        )}
      </div>

      {/* Step 2: Select State */}
      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <span className={styles.stepNumber}>2</span>
          <span className={styles.stepLabel}>Select State</span>
        </div>
        <select
          value={selectedState}
          onChange={(e) => {
            void handleStateChange(e.target.value)
          }}
          className={styles.stateSelect}
          disabled={!hasApiKey}
          title="Select a US state"
          aria-label="Select a US state"
        >
          <option value="">-- Select a State --</option>
          {US_STATES.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name} ({state.code})
            </option>
          ))}
        </select>
        {!hasApiKey && <p className={styles.warning}>⚠️ Enter API key first</p>}
        {isLoadingFacilities && <p className={styles.loading}>Loading facilities...</p>}
      </div>

      {/* Step 3: Select Facility */}
      {facilities.length > 0 && (
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>Select Facility ({facilities.length} found)</span>
          </div>
          <select
            value={selectedFacility?.facilityId ?? ''}
            onChange={(e) => {
              const fac = facilities.find((f) => f.facilityId === parseInt(e.target.value, 10))
              if (fac !== undefined) {
                void handleFacilitySelect(fac)
              }
            }}
            className={styles.facilitySelect}
            title="Select a facility"
            aria-label="Select a facility"
          >
            <option value="">-- Select a Facility --</option>
            {facilities.map((fac) => (
              <option key={fac.facilityId} value={fac.facilityId}>
                {fac.facilityName} (ORIS: {fac.facilityId})
              </option>
            ))}
          </select>
          {isLoadingPlans && <p className={styles.loading}>Loading monitoring plans...</p>}
        </div>
      )}

      {/* No Plans Warning - Show when facility selected but no active plans found */}
      {selectedFacility !== null && !isLoadingPlans && planConfigs.length === 0 && (
        <div className={styles.step}>
          <p className={styles.warning}>
            ⚠️ No active monitoring plans found for this facility. You can still ask general Part 75
            questions.
          </p>
        </div>
      )}

      {/* Facility Info Panel - Show program codes and fuel types (before plan selection) */}
      {facilityInfo !== null && planConfigs.length > 0 && locationInfo === null && (
        <div className={styles.facilityInfoPanel}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Programs:</span>
            <span className={styles.infoBadges}>
              {facilityInfo.programCodes.map((code) => (
                <span
                  key={code}
                  className={`${styles.programBadge} ${code === 'MATS' ? styles.matsBadge : ''}`}
                >
                  {code}
                </span>
              ))}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Primary Fuels:</span>
            <span className={styles.infoBadges}>
              {facilityInfo.primaryFuels.map((fuel) => (
                <span
                  key={fuel}
                  className={`${styles.fuelBadge} ${fuel.toLowerCase().includes('coal') ? styles.coalBadge : ''}`}
                >
                  {fuel}
                </span>
              ))}
            </span>
          </div>
          {facilityInfo.hasMats && (
            <div className={styles.matsWarning}>
              ⚠️ MATS Applicable - Mercury and Air Toxics monitoring may be required
            </div>
          )}
        </div>
      )}

      {/* Location Info Panel - Show location-specific info after plan selection */}
      {locationInfo !== null && (
        <div className={styles.facilityInfoPanel}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Location:</span>
            <span className={styles.infoBadges}>
              <span className={styles.programBadge}>
                {locationInfo.locationId} ({locationInfo.locationType})
              </span>
            </span>
          </div>
          {locationInfo.parameters.length > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Parameters:</span>
              <span className={styles.infoBadges}>
                {locationInfo.parameters.map((param) => (
                  <span key={param} className={styles.programBadge}>
                    {param}
                  </span>
                ))}
              </span>
            </div>
          )}
          {locationInfo.methods.length > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Methods:</span>
              <span className={styles.infoBadges}>
                {locationInfo.methods.map((method) => (
                  <span key={method} className={styles.fuelBadge}>
                    {method}
                  </span>
                ))}
              </span>
            </div>
          )}
          {locationInfo.primaryFuels.length > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fuels:</span>
              <span className={styles.infoBadges}>
                {locationInfo.primaryFuels.map((fuel) => (
                  <span
                    key={fuel}
                    className={`${styles.fuelBadge} ${fuel.toLowerCase().includes('c') ? styles.coalBadge : ''}`}
                  >
                    {fuel}
                  </span>
                ))}
              </span>
            </div>
          )}
          {/* Still show MATS warning from facility info if applicable */}
          {facilityInfo?.hasMats === true && (
            <div className={styles.matsWarning}>
              ⚠️ MATS Applicable - Mercury and Air Toxics monitoring may be required
            </div>
          )}
        </div>
      )}

      {/* Step 4: Select Plan */}
      {planConfigs.length > 0 && (
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNumber}>4</span>
            <span className={styles.stepLabel}>
              Select Monitoring Plan
              <span className={styles.facilityBadge}>{selectedFacility?.facilityName}</span>
            </span>
            <button type="button" className={styles.startOverBtn} onClick={clearAll}>
              ↩ Start Over
            </button>
          </div>
          <div className={styles.planList}>
            {planConfigs.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className={`${styles.planCard} ${selectedPlanId === plan.id ? styles.selected : ''}`}
                onClick={() => {
                  void handlePlanSelect(plan.id)
                }}
                disabled={isLoadingFullPlan}
              >
                <span className={styles.planName}>{plan.name}</span>
                <span className={styles.planMeta}>ID: {plan.id.substring(0, 12)}...</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator for full plan */}
      {isLoadingFullPlan && (
        <div className={styles.loading}>
          <span className={styles.spinner}>🔄</span>
          Loading full monitoring plan...
        </div>
      )}

      {/* Success Summary */}
      {fullPlan !== null && (
        <div className={styles.summary}>
          <span className={styles.summaryIcon}>✓</span>
          <span>
            Ready: <strong>{selectedFacility?.facilityName}</strong>
            {' → '}
            <strong>{planConfigs.find((p) => p.id === selectedPlanId)?.name}</strong>{' '}
            <span className={styles.summaryMeta}>
              ({JSON.stringify(fullPlan.data).length.toLocaleString()} bytes)
            </span>
          </span>
        </div>
      )}

      {/* Activity Log */}
      {searchLog.length > 0 && (
        <div className={styles.logPanel}>
          <div className={styles.logHeader}>
            <span>📡 Activity Log</span>
            <button
              type="button"
              className={styles.clearLogBtn}
              onClick={() => {
                setSearchLog([])
              }}
            >
              Clear
            </button>
          </div>
          <div className={styles.logContent}>
            {searchLog.map((entry, i) => (
              <div key={i} className={styles.logEntry}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error !== null && <div className={styles.error}>{error}</div>}
    </div>
  )
}
