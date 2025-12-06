/**
 * Demo Data Provider for RegsBot
 *
 * Provides realistic facility and monitoring plan data for demonstration
 * when the EPA ECMPS API is not accessible (requires API key).
 *
 * This data is based on real facility structures but uses example values.
 */

export interface DemoFacility {
  orisCode: number
  facilityName: string
  state: string
  county: string
  programs: string[]
  units: DemoUnit[]
}

export interface DemoUnit {
  unitId: string
  locationId: string
  unitType: string
  fuelTypes: string[]
  status: 'Active' | 'Retired' | 'Cold Standby'
  monitoringSystems: DemoMonitoringSystem[]
  methods: DemoMonitoringMethod[]
}

export interface DemoMonitoringSystem {
  systemId: string
  systemType: string // CEMS, LTFF, etc.
  parameters: string[]
  designationCode: string // P, B, RB, etc.
}

export interface DemoMonitoringMethod {
  parameterCode: string
  methodCode: string
  substituteDataCode?: string
  beginDate: string
}

// Sample facilities for demo purposes
export const DEMO_FACILITIES: DemoFacility[] = [
  {
    orisCode: 3,
    facilityName: 'Barry',
    state: 'AL',
    county: 'Mobile',
    programs: ['ARP', 'CSNOX', 'CSOSG2'],
    units: [
      {
        unitId: '1',
        locationId: '6',
        unitType: 'Tangentially-fired',
        fuelTypes: ['Coal', 'Natural Gas'],
        status: 'Active',
        monitoringSystems: [
          {
            systemId: 'AA1',
            systemType: 'CEMS',
            parameters: ['SO2', 'CO2', 'NOX', 'FLOW'],
            designationCode: 'P',
          },
          { systemId: 'AA2', systemType: 'CEMS', parameters: ['O2'], designationCode: 'P' },
        ],
        methods: [
          {
            parameterCode: 'SO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'NOX',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'CO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'FLOW',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          { parameterCode: 'HI', methodCode: 'AD', beginDate: '1995-01-01' },
        ],
      },
      {
        unitId: '2',
        locationId: '7',
        unitType: 'Tangentially-fired',
        fuelTypes: ['Coal', 'Natural Gas'],
        status: 'Active',
        monitoringSystems: [
          {
            systemId: 'AB1',
            systemType: 'CEMS',
            parameters: ['SO2', 'CO2', 'NOX', 'FLOW'],
            designationCode: 'P',
          },
        ],
        methods: [
          {
            parameterCode: 'SO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'NOX',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'CO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'FLOW',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
        ],
      },
      {
        unitId: '3',
        locationId: '8',
        unitType: 'Tangentially-fired',
        fuelTypes: ['Coal'],
        status: 'Retired',
        monitoringSystems: [],
        methods: [],
      },
      {
        unitId: '4',
        locationId: 'CS0AAN',
        unitType: 'Common Stack',
        fuelTypes: [],
        status: 'Active',
        monitoringSystems: [
          {
            systemId: 'CS1',
            systemType: 'CEMS',
            parameters: ['SO2', 'NOX', 'FLOW'],
            designationCode: 'P',
          },
        ],
        methods: [
          { parameterCode: 'SO2', methodCode: 'CEM', beginDate: '2000-01-01' },
          { parameterCode: 'NOX', methodCode: 'CEM', beginDate: '2000-01-01' },
        ],
      },
      {
        unitId: '5',
        locationId: '9',
        unitType: 'Combined Cycle',
        fuelTypes: ['Natural Gas'],
        status: 'Active',
        monitoringSystems: [
          {
            systemId: 'AC1',
            systemType: 'CEMS',
            parameters: ['NOX', 'CO2', 'FLOW'],
            designationCode: 'P',
          },
        ],
        methods: [
          {
            parameterCode: 'NOX',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '2010-01-01',
          },
          {
            parameterCode: 'CO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '2010-01-01',
          },
          { parameterCode: 'HI', methodCode: 'AD', beginDate: '2010-01-01' },
        ],
      },
    ],
  },
  {
    orisCode: 8,
    facilityName: 'Gorgas',
    state: 'AL',
    county: 'Walker',
    programs: ['ARP', 'CSNOX'],
    units: [
      {
        unitId: '10',
        locationId: '5',
        unitType: 'Wall-fired',
        fuelTypes: ['Coal'],
        status: 'Active',
        monitoringSystems: [
          {
            systemId: 'AA1',
            systemType: 'CEMS',
            parameters: ['SO2', 'NOX', 'CO2', 'FLOW'],
            designationCode: 'P',
          },
        ],
        methods: [
          {
            parameterCode: 'SO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'NOX',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'CO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
        ],
      },
    ],
  },
  {
    orisCode: 56,
    facilityName: 'Cholla',
    state: 'AZ',
    county: 'Navajo',
    programs: ['ARP', 'CSNOX', 'MATS'],
    units: [
      {
        unitId: '2',
        locationId: '6',
        unitType: 'Tangentially-fired',
        fuelTypes: ['Coal', 'Petroleum Coke'],
        status: 'Active',
        monitoringSystems: [
          {
            systemId: 'AA1',
            systemType: 'CEMS',
            parameters: ['SO2', 'NOX', 'CO2', 'FLOW'],
            designationCode: 'P',
          },
          { systemId: 'AB1', systemType: 'CEMS', parameters: ['HG'], designationCode: 'P' },
        ],
        methods: [
          {
            parameterCode: 'SO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'NOX',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'HG',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '2016-01-01',
          },
        ],
      },
      {
        unitId: '3',
        locationId: '7',
        unitType: 'Tangentially-fired',
        fuelTypes: ['Coal'],
        status: 'Active',
        monitoringSystems: [
          {
            systemId: 'BA1',
            systemType: 'CEMS',
            parameters: ['SO2', 'NOX', 'CO2', 'FLOW'],
            designationCode: 'P',
          },
        ],
        methods: [
          { parameterCode: 'SO2', methodCode: 'CEM', beginDate: '1995-01-01' },
          { parameterCode: 'NOX', methodCode: 'CEM', beginDate: '1995-01-01' },
        ],
      },
    ],
  },
  {
    orisCode: 2410,
    facilityName: 'Homer City Generating Station',
    state: 'PA',
    county: 'Indiana',
    programs: ['ARP', 'CSNOX', 'CSOSG2', 'RGGI'],
    units: [
      {
        unitId: '1',
        locationId: 'HC1',
        unitType: 'Tangentially-fired',
        fuelTypes: ['Coal', 'Bituminous'],
        status: 'Active',
        monitoringSystems: [
          {
            systemId: 'AA1',
            systemType: 'CEMS',
            parameters: ['SO2', 'NOX', 'CO2', 'FLOW'],
            designationCode: 'P',
          },
          { systemId: 'AA2', systemType: 'CEMS', parameters: ['O2'], designationCode: 'B' },
        ],
        methods: [
          {
            parameterCode: 'SO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'NOX',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'CO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'FLOW',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          { parameterCode: 'OPACITY', methodCode: 'CEM', beginDate: '1995-01-01' },
        ],
      },
      {
        unitId: '2',
        locationId: 'HC2',
        unitType: 'Tangentially-fired',
        fuelTypes: ['Coal', 'Bituminous'],
        status: 'Active',
        monitoringSystems: [
          {
            systemId: 'BA1',
            systemType: 'CEMS',
            parameters: ['SO2', 'NOX', 'CO2', 'FLOW'],
            designationCode: 'P',
          },
        ],
        methods: [
          {
            parameterCode: 'SO2',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
          {
            parameterCode: 'NOX',
            methodCode: 'CEM',
            substituteDataCode: 'SPTS',
            beginDate: '1995-01-01',
          },
        ],
      },
      {
        unitId: '3',
        locationId: 'HC3',
        unitType: 'Tangentially-fired',
        fuelTypes: ['Coal'],
        status: 'Cold Standby',
        monitoringSystems: [
          {
            systemId: 'CA1',
            systemType: 'CEMS',
            parameters: ['SO2', 'NOX', 'FLOW'],
            designationCode: 'P',
          },
        ],
        methods: [
          { parameterCode: 'SO2', methodCode: 'CEM', beginDate: '1995-01-01' },
          { parameterCode: 'NOX', methodCode: 'CEM', beginDate: '1995-01-01' },
        ],
      },
    ],
  },
]

// Program descriptions
export const PROGRAM_INFO: Record<string, { name: string; description: string; cfr: string }> = {
  ARP: {
    name: 'Acid Rain Program',
    description: 'SO2 and NOx emissions trading program',
    cfr: '40 CFR Part 75',
  },
  CSNOX: {
    name: 'Cross-State Air Pollution Rule NOx Annual',
    description: 'Interstate NOx transport program',
    cfr: '40 CFR Part 97',
  },
  CSOSG2: {
    name: 'Cross-State Air Pollution Rule SO2 Group 2',
    description: 'Interstate SO2 transport program',
    cfr: '40 CFR Part 97',
  },
  RGGI: {
    name: 'Regional Greenhouse Gas Initiative',
    description: 'Northeast CO2 cap-and-trade program',
    cfr: 'State-specific regulations',
  },
  MATS: {
    name: 'Mercury and Air Toxics Standards',
    description: 'HAP emissions from power plants',
    cfr: '40 CFR Part 63 Subpart UUUUU',
  },
}

// Method descriptions
export const METHOD_INFO: Record<string, string> = {
  CEM: 'Continuous Emission Monitoring System',
  AD: 'Appendix D - Heat input from fuel flow',
  CEMS: 'Continuous Emission Monitoring System',
  LME: 'Low Mass Emissions (< 25 tons/year)',
  LTFF: 'Long-Term Fuel Flow',
}

// QA test requirements by parameter
export const QA_REQUIREMENTS: Record<string, { tests: string[]; frequency: string }> = {
  SO2: {
    tests: ['RATA', 'Linearity', 'CGA', '7-Day Cal Error'],
    frequency: 'RATA: Yearly | Linearity: Quarterly | CGA: Daily | 7-Day: As needed',
  },
  NOX: {
    tests: ['RATA', 'Linearity', 'CGA', '7-Day Cal Error'],
    frequency: 'RATA: Yearly | Linearity: Quarterly | CGA: Daily | 7-Day: As needed',
  },
  CO2: {
    tests: ['RATA', 'Linearity', 'CGA', '7-Day Cal Error'],
    frequency: 'RATA: Yearly | Linearity: Quarterly | CGA: Daily | 7-Day: As needed',
  },
  FLOW: {
    tests: ['RATA', 'Leak Check', 'Transmitter Accuracy'],
    frequency: 'RATA: Yearly | Leak: Quarterly | Transmitter: Quarterly',
  },
  O2: {
    tests: ['RATA', 'Linearity', 'CGA'],
    frequency: 'RATA: Yearly | Linearity: Quarterly | CGA: Daily',
  },
  HG: {
    tests: ['RATA', 'System Integrity Check', 'Cal Gas Verification'],
    frequency: 'RATA: Yearly | SIC: Weekly | CGV: Daily',
  },
  OPACITY: {
    tests: ['Audit', 'Zero Alignment', 'Upscale Calibration'],
    frequency: 'Audit: Yearly | Zero: Daily | Upscale: Daily',
  },
}

/**
 * Get demo facility by ORIS code
 */
export function getDemoFacility(orisCode: number): DemoFacility | undefined {
  return DEMO_FACILITIES.find((f) => f.orisCode === orisCode)
}

/**
 * Search demo facilities by name (partial match)
 */
export function searchDemoFacilities(query: string): DemoFacility[] {
  const q = query.toLowerCase()
  return DEMO_FACILITIES.filter(
    (f) =>
      f.facilityName.toLowerCase().includes(q) ||
      f.state.toLowerCase() === q ||
      f.orisCode.toString() === q
  )
}

/**
 * Get list of all demo ORIS codes
 */
export function getDemoOrisCodesList(): number[] {
  return DEMO_FACILITIES.map((f) => f.orisCode)
}

/**
 * Format facility info for chat display
 */
export function formatFacilityInfo(facility: DemoFacility): string {
  const activeUnits = facility.units.filter((u) => u.status === 'Active')
  const programs = facility.programs.map((p) => PROGRAM_INFO[p]?.name ?? p).join(', ')

  let info = `🏭 **${facility.facilityName}** (ORIS ${facility.orisCode})\n`
  info += `📍 ${facility.county} County, ${facility.state}\n`
  info += `📜 Programs: ${programs}\n\n`
  info += `**Active Monitoring Locations:**\n`

  for (const unit of activeUnits) {
    const params = unit.methods.map((m) => m.parameterCode).join(', ')
    info += `• **${unit.locationId}** - ${unit.unitType}`
    if (unit.fuelTypes.length > 0) {
      info += ` (${unit.fuelTypes.join('/')})`
    }
    info += `\n  Parameters: ${params}\n`
  }

  return info
}

/**
 * Format location details for chat display
 */
export function formatLocationDetails(facility: DemoFacility, locationId: string): string {
  const unit = facility.units.find((u) => u.locationId === locationId)
  if (!unit) return `Location ${locationId} not found in facility.`

  let info = `📊 **Location ${locationId}** at ${facility.facilityName}\n\n`
  info += `**Unit Details:**\n`
  info += `• Type: ${unit.unitType}\n`
  info += `• Status: ${unit.status}\n`
  if (unit.fuelTypes.length > 0) {
    info += `• Fuels: ${unit.fuelTypes.join(', ')}\n`
  }

  info += `\n**Monitoring Systems:**\n`
  for (const sys of unit.monitoringSystems) {
    info += `• ${sys.systemId} (${sys.systemType}): ${sys.parameters.join(', ')} [${sys.designationCode}]\n`
  }

  info += `\n**Monitoring Methods:**\n`
  for (const method of unit.methods) {
    const methodName = METHOD_INFO[method.methodCode] ?? method.methodCode
    info += `• ${method.parameterCode}: ${methodName}`
    if (method.substituteDataCode) {
      info += ` (Sub: ${method.substituteDataCode})`
    }
    info += `\n`
  }

  info += `\n**Required QA Tests:**\n`
  const parameters = new Set(unit.methods.map((m) => m.parameterCode))
  for (const param of parameters) {
    const qa = QA_REQUIREMENTS[param]
    if (qa) {
      info += `• ${param}: ${qa.tests.join(', ')}\n`
    }
  }

  return info
}
