/**
 * Reg-Brain Agent
 *
 * Given a MonitoringPlan, infer:
 * - Which parameters must be monitored and reported (SO2M, NOXM, NOXR, CO2M, HIT, OPTIME, OPHOURS, etc.).
 * - Which ECMPS objects must be populated (HOURLY, SUMMARY, DAILY_EMISSION, DAILY_FUEL, DAILY_BACKSTOP).
 * - Which QA tests are implied (RATAs, linearities, fuel flow tests, FSA sampling).
 *
 * Implementation is driven by Part 75/ECMPS regulatory knowledge.
 */

import type {
  MonitoringPlan,
  RequiredParameter,
  QARequirement,
  RequiredObject,
  RegBrainOutput,
  ProgramCode,
  ParameterCode,
  MethodConfig,
} from '../../types/dahs-domain'

export function inferRegulatoryRequirements(mp: MonitoringPlan): RegBrainOutput {
  const requiredParameters: RequiredParameter[] = []
  const requiredObjects: RequiredObject[] = []
  const qaRequirements: QARequirement[] = []
  const notes: string[] = []

  // Handle empty plan
  if (mp.programs.length === 0 && mp.methods.length === 0) {
    return {
      requiredParameters,
      requiredObjects,
      qaRequirements,
      notes,
    }
  }

  // Add program-specific notes
  for (const program of mp.programs) {
    addProgramNotes(program, notes)
  }

  // Add configuration-specific notes
  for (const location of mp.locations) {
    if (location.configurationType === 'COMMON_STACK') {
      notes.push(`Location ${location.id}: common stack configuration detected.`)
    }
  }

  // Process each method to determine requirements
  for (const method of mp.methods) {
    // Add required parameter
    const requiredBy = determineRequiredByPrograms(method.parameter, mp.programs)
    requiredParameters.push({
      locationId: method.locationId,
      parameter: method.parameter,
      method: method.methodCode,
      requiredBy,
      reason: generateMethodReason(method, mp.programs),
    })

    // Add required objects
    addRequiredObjects(method, mp.programs, requiredObjects)

    // Add QA requirements
    addQARequirements(method, qaRequirements)

    // Add method-specific notes
    if (method.isLME ?? false) {
      notes.push(`Location ${method.locationId}: Low Mass Emissions exemption applies.`)
    }
  }

  // Add program-level required objects
  if (mp.programs.includes('ARP')) {
    addIfNotExists(requiredObjects, {
      objectType: 'SUMMARY',
      explanation: 'Quarterly summary values required for ARP reporting',
    })
  }

  if (
    mp.programs.includes('CSAPR_SO2') ||
    mp.programs.includes('CSAPR_NOX_ANN') ||
    mp.programs.includes('CSAPR_NOX_OS')
  ) {
    // CSAPR requires daily data
    if (mp.methods.some((m) => m.parameter === 'CO2M')) {
      addIfNotExists(requiredObjects, {
        objectType: 'DAILY_CO2',
        explanation: 'Daily CO2 mass emissions required for CSAPR programs',
      })
    }
  }

  return {
    requiredParameters,
    requiredObjects,
    qaRequirements,
    notes,
  }
}

function addProgramNotes(program: ProgramCode, notes: string[]): void {
  switch (program) {
    case 'ARP':
      notes.push('ARP program: SO2M, NOXM/NOXR, CO2M, HI, OPTIME, OPHOURS summaries required.')
      break
    case 'CSAPR_NOX_OS':
      notes.push(
        'CSAPR NOx Ozone Season: NOXM, NOXR, HI, OPTIME, OPHOURS required; consider DAILY_BACKSTOP for Group 3 units.'
      )
      break
    case 'CSAPR_NOX_ANN':
      notes.push('CSAPR NOx Annual: NOXM, NOXR, HI, OPTIME required.')
      break
    case 'CSAPR_SO2':
      notes.push('CSAPR SO2: SO2M, HI, OPTIME required.')
      break
    case 'MATS':
      notes.push('MATS program: Mercury and acid gas monitoring required.')
      break
  }
}

function determineRequiredByPrograms(
  parameter: ParameterCode,
  programs: ProgramCode[]
): ProgramCode[] {
  const requiredBy: ProgramCode[] = []

  for (const program of programs) {
    if (programRequiresParameter(program, parameter)) {
      requiredBy.push(program)
    }
  }

  return requiredBy
}

function programRequiresParameter(program: ProgramCode, parameter: ParameterCode): boolean {
  const programParameters: Record<ProgramCode, ParameterCode[]> = {
    ARP: ['SO2M', 'NOXM', 'NOXR', 'CO2M', 'HIT', 'OPTIME', 'OPHOURS'],
    CSAPR_SO2: ['SO2M', 'HIT', 'OPTIME', 'CO2M'],
    CSAPR_NOX_ANN: ['NOXM', 'NOXR', 'HIT', 'OPTIME'],
    CSAPR_NOX_OS: ['NOXM', 'NOXR', 'HIT', 'OPTIME', 'OPHOURS'],
    MATS: ['HIT', 'OPTIME'], // Mercury/acid gas would be separate
    STATE: [], // State-specific
    NSPS: ['OPTIME'], // NSPS varies by subpart
  }

  const params = programParameters[program]
  return params.includes(parameter)
}

function generateMethodReason(method: MethodConfig, programs: ProgramCode[]): string {
  const programNames = programs.join(', ')

  switch (method.methodCode) {
    case 'CEM':
      return `Continuous monitoring required for ${method.parameter} under ${programNames}`
    case 'AD':
      return `Appendix D fuel flow methodology for ${method.parameter} under ${programNames}`
    case 'LME':
      return `Low Mass Emissions exemption for ${method.parameter} under ${programNames}`
    case 'FSA':
      return `Fuel sampling and analysis for ${method.parameter} under ${programNames}`
    default:
      return `${method.methodCode} methodology for ${method.parameter} under ${programNames}`
  }
}

function addRequiredObjects(
  method: MethodConfig,
  programs: ProgramCode[],
  requiredObjects: RequiredObject[]
): void {
  // All CEM methods require hourly data
  if (method.methodCode === 'CEM') {
    addIfNotExists(requiredObjects, {
      objectType: 'HOURLY',
      parameter: method.parameter,
      locationId: method.locationId,
      explanation: `Hourly ${method.parameter} data required for CEM at ${method.locationId}`,
    })
  }

  // Appendix D requires daily fuel data
  if (method.methodCode === 'AD') {
    addIfNotExists(requiredObjects, {
      objectType: 'DAILY_FUEL',
      parameter: method.parameter,
      locationId: method.locationId,
      explanation: `Daily fuel data required for Appendix D at ${method.locationId}`,
    })
  }

  // Add program-specific daily requirements
  if (programs.includes('CSAPR_NOX_OS') && method.parameter === 'NOXM') {
    addIfNotExists(requiredObjects, {
      objectType: 'DAILY_BACKSTOP',
      parameter: method.parameter,
      locationId: method.locationId,
      explanation: `Daily backstop data for CSAPR NOx Ozone Season at ${method.locationId}`,
    })
  }
}

function addQARequirements(method: MethodConfig, qaRequirements: QARequirement[]): void {
  // CEM systems require comprehensive QA
  if (method.methodCode === 'CEM') {
    // RATA - Relative Accuracy Test Audit
    qaRequirements.push({
      locationId: method.locationId,
      parameter: method.parameter,
      testType: 'RATA',
      frequencyHint: 'Semi-annual or annual based on prior test results',
      citation: '40 CFR 75 Appendix B, Section 2.3',
    })

    // Linearity check
    qaRequirements.push({
      locationId: method.locationId,
      parameter: method.parameter,
      testType: 'LINEARITY',
      frequencyHint: 'Quarterly',
      citation: '40 CFR 75 Appendix B, Section 2.2',
    })

    // Daily calibration (implicit for all CEMS)
    qaRequirements.push({
      locationId: method.locationId,
      parameter: method.parameter,
      testType: 'DAILY_CALIBRATION',
      frequencyHint: 'Each operating day',
      citation: '40 CFR 75 Appendix B, Section 2.1',
    })
  }

  // Appendix D fuel flow requires accuracy testing
  if (method.methodCode === 'AD') {
    qaRequirements.push({
      locationId: method.locationId,
      parameter: method.parameter,
      testType: 'FUEL_FLOW_ACCURACY',
      frequencyHint: 'Annual',
      citation: '40 CFR 75 Appendix D',
    })
  }

  // FSA requires sampling protocol compliance
  if (method.methodCode === 'FSA') {
    qaRequirements.push({
      locationId: method.locationId,
      parameter: method.parameter,
      testType: 'FUEL_SAMPLING',
      frequencyHint: 'Per sampling plan',
      citation: '40 CFR 75 Appendix D',
    })
  }
}

function addIfNotExists(array: RequiredObject[], obj: RequiredObject): void {
  const exists = array.some(
    (item) =>
      item.objectType === obj.objectType &&
      item.parameter === obj.parameter &&
      item.locationId === obj.locationId
  )

  if (!exists) {
    array.push(obj)
  }
}
