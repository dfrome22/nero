/**
 * RegBrainAgent - Regulatory Brain for Part 75/ECMPS
 *
 * Infers regulatory requirements from monitoring plans using Part 75 domain knowledge.
 */

import type {
  ApplicableRegulation,
  MonitoringRequirement,
  QARequirement,
} from '../../types/orchestration'
import type { MonitoringMethod, MonitoringPlan, MonitoringSystem } from '../../types/ecmps-api'
import type { RegBrainInput, RegBrainOutput } from '../../types/part75-orchestrator'

export class RegBrainAgent {
  /**
   * Analyze a monitoring plan and infer all regulatory requirements
   */
  analyze(input: RegBrainInput): RegBrainOutput {
    // Validate input
    if (input.monitoringPlan === undefined && input.orisCode === undefined) {
      throw new Error('Either monitoringPlan or orisCode must be provided')
    }

    // For now, we only support direct monitoring plan analysis
    // TODO: Add ORIS code fetching via ECMPS API
    if (!input.monitoringPlan) {
      throw new Error('ORIS code fetching not yet implemented')
    }

    const plan = input.monitoringPlan
    const locationId = input.locationId

    // Filter data to specific location if requested
    const locations = this.getLocations(plan, locationId)
    const methods = this.filterMethods(plan.methods, locationId)
    const systems = this.filterSystems(plan.systems, locationId)

    // Infer programs from monitoring plan
    const programs = this.inferPrograms(methods)

    // Build facility info
    const facilityInfo = {
      orisCode: plan.orisCode,
      facilityName: plan.facilityName,
      stateCode: plan.stateCode,
      programs,
    }

    // Infer requirements
    const monitoringRequirements = this.inferMonitoringRequirements(methods, programs)
    const applicableRegulations = this.inferApplicableRegulations(methods, systems, programs)
    const qaRequirements = this.inferQARequirements(systems, programs)

    // Assess confidence
    const confidence = this.assessConfidence(plan, methods, systems)

    // Generate warnings
    const warnings = this.generateWarnings(plan, methods, systems)

    return {
      facilityInfo,
      locations,
      monitoringRequirements,
      applicableRegulations,
      qaRequirements,
      confidence,
      warnings,
      analyzedAt: new Date().toISOString(),
    }
  }

  /**
   * Get location information from monitoring plan
   */
  private getLocations(
    plan: MonitoringPlan,
    filterLocationId?: string
  ): {
    locationId: string
    locationType: 'unit' | 'stack' | 'pipe' | 'common'
    parameters: string[]
  }[] {
    const locations =
      filterLocationId !== undefined && filterLocationId !== ''
        ? plan.locations.filter((l) => l.locationId === filterLocationId)
        : plan.locations

    return locations.map((loc) => {
      const methods = plan.methods.filter((m) => m.locationId === loc.locationId)
      return {
        locationId: loc.locationId,
        locationType: loc.locationType,
        parameters: methods.map((m) => m.parameterCode),
      }
    })
  }

  /**
   * Filter methods to specific location
   */
  private filterMethods(methods: MonitoringMethod[], locationId?: string): MonitoringMethod[] {
    if (locationId === undefined) return methods
    return methods.filter((m) => m.locationId === locationId)
  }

  /**
   * Filter systems to specific location
   */
  private filterSystems(systems: MonitoringSystem[], locationId?: string): MonitoringSystem[] {
    if (locationId === undefined) return systems
    return systems.filter((s) => s.locationId === locationId)
  }

  /**
   * Infer regulatory programs from monitoring methods
   */
  private inferPrograms(methods: MonitoringMethod[]): string[] {
    const programs = new Set<string>()

    const parameterCodes = new Set(methods.map((m) => m.parameterCode))

    // Acid Rain Program (ARP) - if monitoring SO2, NOX, CO2
    if (parameterCodes.has('SO2') || parameterCodes.has('NOX') || parameterCodes.has('CO2')) {
      programs.add('ARP')
    }

    // MATS - if monitoring Hg, HCl, HF
    if (parameterCodes.has('HG') || parameterCodes.has('HCL') || parameterCodes.has('HF')) {
      programs.add('MATS')
    }

    // If no specific program detected, assume ARP as default
    if (programs.size === 0) {
      programs.add('ARP')
    }

    return Array.from(programs)
  }

  /**
   * Infer monitoring requirements from methods
   */
  private inferMonitoringRequirements(
    methods: MonitoringMethod[],
    programs: string[]
  ): MonitoringRequirement[] {
    return methods.map((method, index) => ({
      id: `mon-${method.methodId !== '' ? method.methodId : index.toString()}`,
      parameter: this.getParameterDisplayName(method.parameterCode),
      methodCode: method.methodCode,
      systemType: method.parameterCode,
      frequency: method.methodCode === 'CEM' ? ('continuous' as const) : ('hourly' as const),
      regulatoryBasis: this.getMethodRegulatoryBasis(method),
      applicablePrograms: programs,
      notes: this.getMethodNotes(method),
    }))
  }

  /**
   * Infer applicable regulations from monitoring methods and systems
   */
  private inferApplicableRegulations(
    methods: MonitoringMethod[],
    systems: MonitoringSystem[],
    programs: string[]
  ): ApplicableRegulation[] {
    const regulations: ApplicableRegulation[] = []
    const parameterCodes = new Set(methods.map((m) => m.parameterCode))

    // Core Part 75 regulations
    const hasCEM = methods.some((m) => m.methodCode === 'CEM')
    if (hasCEM) {
      regulations.push({
        cfr: '40 CFR 75.10',
        part: 75,
        section: '10',
        title: 'General Operating Requirements',
        description: 'Core monitoring requirements for affected units',
        applicability: 'All Part 75 affected units',
      })

      regulations.push({
        cfr: '40 CFR 75 Subpart B',
        part: 75,
        subpart: 'B',
        title: 'Monitoring Provisions',
        description: 'CEM requirements for SO2, NOx, CO2, and flow',
        applicability: 'Units using CEMS',
      })
    }

    // QA/QC regulations if systems present
    if (systems.length > 0) {
      regulations.push({
        cfr: '40 CFR 75 Appendix B',
        part: 75,
        subpart: 'Appendix B',
        title: 'Quality Assurance and Quality Control Procedures',
        description: 'Calibration, linearity, RATA, CGA requirements',
        applicability: 'All Part 75 CEMS',
      })
    }

    // Calculation procedures if flow monitoring
    if (parameterCodes.has('FLOW') || parameterCodes.has('O2')) {
      regulations.push({
        cfr: '40 CFR 75 Appendix F',
        part: 75,
        subpart: 'Appendix F',
        title: 'Calculation Procedures',
        description: 'Heat input, emission rate, and mass emission calculations',
        applicability: 'All Part 75 sources',
      })
    }

    // Missing data regulations
    const hasSubstituteData = methods.some(
      (m) => m.substituteDataCode !== undefined && m.substituteDataCode !== ''
    )
    if (hasSubstituteData) {
      regulations.push({
        cfr: '40 CFR 75 Subpart D',
        part: 75,
        subpart: 'D',
        title: 'Missing Data Substitution Procedures',
        description: 'Standard procedures for missing CEMS data',
        applicability: 'All Part 75 CEMS',
      })
    }

    // MATS regulations if monitoring HAPs
    if (parameterCodes.has('HG') || parameterCodes.has('HCL') || parameterCodes.has('HF')) {
      regulations.push({
        cfr: '40 CFR 63 Subpart UUUUU',
        part: 63,
        subpart: 'UUUUU',
        title: 'MATS - Mercury and Air Toxics Standards',
        description: 'HAP monitoring for coal/oil EGUs',
        applicability: 'Coal and oil-fired EGUs',
      })
    }

    // Program-specific regulations
    if (programs.includes('ARP')) {
      regulations.push({
        cfr: '40 CFR 75.64',
        part: 75,
        section: '64',
        title: 'Quarterly Reports',
        description: 'Electronic Data Report submission requirements',
        applicability: 'All Part 75 sources',
      })
    }

    return regulations
  }

  /**
   * Infer QA requirements from systems
   */
  private inferQARequirements(systems: MonitoringSystem[], _programs: string[]): QARequirement[] {
    const requirements: QARequirement[] = []

    for (const system of systems) {
      // Daily calibration for all systems
      requirements.push({
        id: `qa-daily-${system.systemId}`,
        testType: 'daily_calibration',
        parameterCode: system.systemTypeCode,
        frequency: 'daily (each operating day)',
        toleranceCriteria: '±2.5% of span value',
        regulatoryBasis: '40 CFR 75 Appendix B, Section 2.1',
        consequenceOfFailure:
          'Failed calibration requires recalibration within 8 hours or data invalidation',
        notes: ['Zero and upscale calibration gases required'],
      })

      // Linearity for gas analyzers
      if (['SO2', 'NOX', 'CO2', 'O2', 'NOXC'].includes(system.systemTypeCode)) {
        requirements.push({
          id: `qa-linearity-${system.systemId}`,
          testType: 'linearity',
          parameterCode: system.systemTypeCode,
          frequency: 'quarterly (once per QA operating quarter)',
          toleranceCriteria: '±5% of reference value or ±0.5% of span',
          regulatoryBasis: '40 CFR 75 Appendix B, Section 2.2',
          consequenceOfFailure: 'Data invalidation back to last passed test',
          notes: ['Low, mid, and high level calibration gases required'],
        })
      }

      // RATA for all systems
      requirements.push({
        id: `qa-rata-${system.systemId}`,
        testType: 'rata',
        parameterCode: system.systemTypeCode,
        frequency: 'semi-annual or annual',
        toleranceCriteria: '≤10% relative accuracy',
        regulatoryBasis: '40 CFR 75 Appendix B, Section 2.3',
        consequenceOfFailure: 'Data invalidation, potential to lose CEM certification',
        notes: ['Reference method testing required', 'At least 9 valid run pairs'],
      })
    }

    return requirements
  }

  /**
   * Assess confidence in the analysis
   */
  private assessConfidence(
    plan: MonitoringPlan,
    methods: MonitoringMethod[],
    systems: MonitoringSystem[]
  ): 'high' | 'medium' | 'low' {
    // High confidence if we have:
    // - Locations present
    // - Methods present
    // - Systems present
    if (plan.locations.length > 0 && methods.length > 0 && systems.length > 0) {
      return 'high'
    }

    // Medium confidence if some data is present
    if (methods.length > 0 || systems.length > 0) {
      return 'medium'
    }

    // Low confidence if minimal data
    return 'low'
  }

  /**
   * Generate warnings about the analysis
   */
  private generateWarnings(
    plan: MonitoringPlan,
    methods: MonitoringMethod[],
    systems: MonitoringSystem[]
  ): string[] {
    const warnings: string[] = []

    if (plan.locations.length === 0) {
      warnings.push('No monitoring locations found in plan')
    }

    if (methods.length === 0) {
      warnings.push('No monitoring methods found in plan')
    }

    if (systems.length === 0) {
      warnings.push('No monitoring systems found in plan')
    }

    if (methods.length !== systems.length) {
      warnings.push(
        'Method count does not match system count - some configurations may be incomplete'
      )
    }

    return warnings
  }

  /**
   * Get display name for parameter code
   */
  private getParameterDisplayName(code: string): string {
    const names: Record<string, string> = {
      SO2: 'Sulfur Dioxide',
      NOX: 'Nitrogen Oxides',
      CO2: 'Carbon Dioxide',
      O2: 'Oxygen',
      FLOW: 'Stack Gas Flow',
      H2O: 'Moisture',
      HG: 'Mercury',
      HCL: 'Hydrogen Chloride',
      HF: 'Hydrogen Fluoride',
    }
    return names[code] ?? code
  }

  /**
   * Get regulatory basis for monitoring method
   */
  private getMethodRegulatoryBasis(method: MonitoringMethod): string {
    const bases: Record<string, string> = {
      CEM: '40 CFR 75.10(a)',
      CALC: '40 CFR 75 Appendix F',
      AD: '40 CFR 75 Appendix D',
      LME: '40 CFR 75.19',
    }
    return bases[method.methodCode] ?? '40 CFR 75'
  }

  /**
   * Get notes for monitoring method
   */
  private getMethodNotes(method: MonitoringMethod): string[] {
    const notes: string[] = []

    if (method.methodCode === 'CEM') {
      notes.push('Continuous emissions monitoring required')
      notes.push('Subject to daily calibration and periodic QA tests')
    }

    if (method.substituteDataCode !== undefined && method.substituteDataCode !== '') {
      notes.push(`Substitute data: ${method.substituteDataCode}`)
    }

    return notes
  }
}
