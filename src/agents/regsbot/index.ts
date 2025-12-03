/**
 * RegsBot Agent
 *
 * Supreme Commander of EPA Knowledge
 *
 * PURPOSE: RegsBot is the regulatory knowledge oracle. Given a facility's
 * monitoring plan or permit, it can deduce:
 * - What parameters must be monitored (SO2, NOx, Flow, etc.)
 * - What QA/QC tests are required (daily calibration, RATA, CGA, linearity)
 * - What calculations the DAHS must perform (hourly averages, heat input, mass emissions)
 * - What emission limits apply and must be tracked for exceedances
 * - What reports must be generated (quarterly EDR, annual compliance)
 * - What missing data substitution rules apply
 *
 * STANDALONE USAGE:
 *   const regsBot = new RegsBotService()
 *   const requirements = await regsBot.analyzeMonitoringPlan(orisCode)
 *   // Returns structured DAHSRequirements object
 *
 * LLM INTEGRATION:
 *   RegsBot produces structured JSON output that an LLM orchestrator can
 *   pass to RequirementsBot for gap analysis against DAHS capabilities.
 */

import type {
  ECFRQuery,
  ECFRSearchQuery,
  ECFRSearchResult,
  ECFRSection,
} from '../../types/ecfr-api'
import { REGULATORY_LANGUAGE_PATTERNS } from '../../types/ecfr-api'
import type {
  CAMDFacility,
  MonitoringMethod,
  MonitoringPlan,
  UnitQualification,
} from '../../types/ecmps-api'
import type {
  CalculationRequirement,
  CitationAnchor,
  DAHSRequirements,
  EmissionLimit,
  EvidenceItem,
  EvidenceLibraryData,
  MonitoringRequirement,
  ObligationType,
  PermitDocument,
  PermitObligation,
  QARequirement,
  RecordkeepingRequirement,
  ReportingRequirement,
  SubstitutionRequirement,
} from '../../types/orchestration'
import { ECFRClient, ecfrClient } from './ecfr-client'
import { ECMPSClient, ecmpsClient } from './ecmps-client'

// ============================================================================
// REGSBOT SERVICE
// ============================================================================

export interface RegsBotConfig {
  ecfrClient?: ECFRClient
  ecmpsClient?: ECMPSClient
}

export class RegsBotService {
  private ecfr: ECFRClient
  private ecmps: ECMPSClient

  constructor(config: RegsBotConfig = {}) {
    this.ecfr = config.ecfrClient ?? ecfrClient
    this.ecmps = config.ecmpsClient ?? ecmpsClient
  }

  // ============================================================================
  // REGULATION LOOKUP
  // ============================================================================

  /**
   * Look up a specific CFR section
   * @example lookupRegulation({ title: 40, part: 75, section: "11" })
   */
  async lookupRegulation(title: number, part: number, section?: string): Promise<ECFRSection> {
    const query: ECFRQuery = { title, part }
    if (section !== undefined) {
      query.section = section
    }
    return this.ecfr.getSection(query)
  }

  /**
   * Search eCFR for specific terms
   */
  async searchRegulations(query: string, title?: number, part?: number): Promise<ECFRSearchResult> {
    const searchQuery: ECFRSearchQuery = { query }
    if (title !== undefined) {
      searchQuery.title = title
    }
    if (part !== undefined) {
      searchQuery.part = part
    }
    return this.ecfr.search(searchQuery)
  }

  /**
   * Get Part 75 monitoring provisions
   */
  async getPart75Provisions(): Promise<ECFRSection> {
    return this.ecfr.getSection({ title: 40, part: 75 })
  }

  /**
   * Get MATS (Subpart UUUUU) provisions
   */
  async getMATSProvisions(): Promise<ECFRSection> {
    return this.ecfr.getSection({ title: 40, part: 63, subpart: 'UUUUU' })
  }

  // ============================================================================
  // FACILITY & MONITORING PLAN LOOKUP
  // ============================================================================

  /**
   * Get facility information from CAMD
   */
  async getFacilityInfo(orisCode: number): Promise<CAMDFacility> {
    return this.ecmps.getFacility(orisCode)
  }

  /**
   * Get monitoring plan for a facility
   */
  async getMonitoringPlan(orisCode: number): Promise<MonitoringPlan> {
    return this.ecmps.getMonitoringPlan({ orisCode })
  }

  /**
   * Get regulatory programs for a facility
   */
  async getFacilityPrograms(orisCode: number): Promise<string[]> {
    return this.ecmps.getFacilityPrograms(orisCode)
  }

  // ============================================================================
  // PERMIT TEXT ANALYSIS
  // ============================================================================

  /**
   * Scan text for regulatory language patterns
   * Returns matches organized by category
   */
  scanForRegulatoryLanguage(text: string): Record<string, string[]> {
    const results: Record<string, string[]> = {}
    const lowerText = text.toLowerCase()

    for (const [category, patterns] of Object.entries(REGULATORY_LANGUAGE_PATTERNS)) {
      const matches: string[] = []
      for (const pattern of patterns) {
        if (lowerText.includes(pattern.toLowerCase())) {
          matches.push(pattern)
        }
      }
      if (matches.length > 0) {
        results[category] = matches
      }
    }

    return results
  }

  /**
   * Extract regulatory citations from text (e.g., "40 CFR 60.4")
   */
  extractCitations(text: string): CitationAnchor[] {
    const citations: CitationAnchor[] = []

    // Pattern: XX CFR YY.ZZ or XX CFR Part YY
    const cfrPattern = /(\d{1,2})\s*CFR\s*(?:Part\s*)?(\d{1,3})(?:\.(\d+[a-z]?))?/gi
    let match

    while ((match = cfrPattern.exec(text)) !== null) {
      const title = match[1]
      const part = match[2]
      const section = match[3]
      const fullMatch = match[0]

      // Get surrounding context (50 chars before and after)
      const start = Math.max(0, match.index - 50)
      const matchLength = fullMatch.length
      const end = Math.min(text.length, match.index + matchLength + 50)
      const excerpt = text.slice(start, end)

      if (title !== undefined && part !== undefined) {
        const sectionSuffix = section !== undefined && section !== '' ? `.${section}` : ''
        citations.push({
          sourceType: 'eCFR',
          sourceId: `${title}-CFR-${part}${sectionSuffix}`,
          location: `${title} CFR ${part}${sectionSuffix}`,
          excerpt: `...${excerpt}...`,
          confidence: 1.0,
        })
      }
    }

    return citations
  }

  /**
   * Determine obligation type from text
   */
  classifyObligationType(text: string): ObligationType {
    const lowerText = text.toLowerCase()

    if (
      lowerText.includes('shall monitor') ||
      lowerText.includes('continuous monitoring') ||
      lowerText.includes('cems')
    ) {
      return 'monitoring'
    }
    if (
      lowerText.includes('report') ||
      lowerText.includes('submit') ||
      lowerText.includes('notify')
    ) {
      return 'reporting'
    }
    if (lowerText.includes('record') || lowerText.includes('maintain')) {
      return 'recordkeeping'
    }
    if (
      lowerText.includes('shall not exceed') ||
      lowerText.includes('emission limit') ||
      lowerText.includes('lb/') ||
      lowerText.includes('ppm')
    ) {
      return 'limit'
    }
    if (lowerText.includes('calculate') || lowerText.includes('average')) {
      return 'calculation'
    }
    if (
      lowerText.includes('calibrat') ||
      lowerText.includes('rata') ||
      lowerText.includes('audit')
    ) {
      return 'calibration'
    }
    if (lowerText.includes('test')) {
      return 'testing'
    }

    return 'other'
  }

  /**
   * Extract obligations from permit text
   */
  extractObligations(permitId: string, text: string, pageReference: string): PermitObligation[] {
    const obligations: PermitObligation[] = []

    // Split text into sentences/clauses that might be obligations
    // Look for "shall" statements which typically indicate requirements
    const shallPattern = /[^.]*shall[^.]+\./gi
    let match
    let index = 0

    while ((match = shallPattern.exec(text)) !== null) {
      const obligationText = match[0].trim()
      const obligationType = this.classifyObligationType(obligationText)
      const regulatoryBasis = this.findRegulatoryBasis(obligationText)
      const frequency = this.extractFrequency(obligationText)

      const obligation: PermitObligation = {
        id: `${permitId}-obl-${(index++).toString()}`,
        permitId,
        pageReference,
        originalText: obligationText,
        obligationType,
        summary: this.summarizeObligation(obligationText),
        parameters: this.extractParameters(obligationText),
        confidence: 0.8, // Base confidence for extracted obligations
        confirmedByHuman: false,
      }

      if (regulatoryBasis !== undefined) {
        obligation.regulatoryBasis = regulatoryBasis
      }
      if (frequency !== undefined) {
        obligation.frequency = frequency
      }

      obligations.push(obligation)
    }

    return obligations
  }

  /**
   * Generate a plain-language summary of an obligation
   */
  private summarizeObligation(text: string): string {
    // For now, return a truncated version
    // TODO: Use LLM for better summarization
    const maxLength = 200
    if (text.length <= maxLength) return text
    return `${text.slice(0, maxLength)}...`
  }

  /**
   * Find regulatory basis cited in text
   */
  private findRegulatoryBasis(text: string): string | undefined {
    const citations = this.extractCitations(text)
    const first = citations[0]
    return first?.location
  }

  /**
   * Extract frequency terms from text
   */
  private extractFrequency(text: string): string | undefined {
    const lowerText = text.toLowerCase()
    const frequencies = [
      'hourly',
      'daily',
      'weekly',
      'monthly',
      'quarterly',
      'semi-annually',
      'annually',
      'continuous',
    ]

    for (const freq of frequencies) {
      if (lowerText.includes(freq)) {
        return freq
      }
    }
    return undefined
  }

  /**
   * Extract parameter names from text
   */
  private extractParameters(text: string): string[] {
    const parameters: string[] = []
    const upperText = text.toUpperCase()

    const knownParams = [
      'SO2',
      'NOX',
      'NOx',
      'CO2',
      'CO',
      'O2',
      'HG',
      'HCL',
      'HF',
      'PM',
      'PM2.5',
      'PM10',
      'VOC',
      'OPACITY',
    ]

    for (const param of knownParams) {
      if (upperText.includes(param.toUpperCase())) {
        parameters.push(param)
      }
    }

    return parameters
  }

  // ============================================================================
  // MONITORING PLAN ANALYSIS - Core RegsBot Capability
  // ============================================================================

  /**
   * Analyze a facility's monitoring plan and deduce all DAHS requirements.
   * This is the primary entry point for RegsBot.
   *
   * @param orisCode - The facility's ORIS code
   * @returns Structured requirements for DAHS configuration
   */
  async analyzeMonitoringPlan(orisCode: number): Promise<DAHSRequirements> {
    // Fetch facility info and monitoring plan from ECMPS
    const [facility, monitoringPlan, programs] = await Promise.all([
      this.getFacilityInfo(orisCode),
      this.getMonitoringPlan(orisCode),
      this.getFacilityPrograms(orisCode),
    ])

    // Derive all requirements from the monitoring plan
    const monitoringRequirements = this.deriveMonitoringRequirements(monitoringPlan, programs)
    const calculationRequirements = this.deriveCalculationRequirements(monitoringPlan, programs)
    const qaRequirements = this.deriveQARequirements(monitoringPlan, programs)
    const reportingRequirements = this.deriveReportingRequirements(programs)
    const emissionLimits = this.deriveEmissionLimits(monitoringPlan, programs)
    const substitutionRequirements = this.deriveSubstitutionRequirements(monitoringPlan)
    const recordkeepingRequirements = this.deriveRecordkeepingRequirements(programs)

    return {
      facilityId: facility.facilityId.toString(),
      facilityName: facility.facilityName,
      orisCode: facility.orisCode,
      programs,
      analyzedAt: new Date().toISOString(),
      monitoringRequirements,
      calculationRequirements,
      qaRequirements,
      reportingRequirements,
      emissionLimits,
      substitutionRequirements,
      recordkeepingRequirements,
    }
  }

  /**
   * Derive monitoring requirements from the monitoring plan methods
   */
  private deriveMonitoringRequirements(
    plan: MonitoringPlan,
    programs: string[]
  ): MonitoringRequirement[] {
    const requirements: MonitoringRequirement[] = []

    for (const method of plan.methods) {
      const requirement = this.methodToMonitoringRequirement(method, programs)
      if (requirement !== undefined) {
        requirements.push(requirement)
      }
    }

    return requirements
  }

  /**
   * Convert a monitoring method to a DAHS monitoring requirement
   */
  private methodToMonitoringRequirement(
    method: MonitoringMethod,
    programs: string[]
  ): MonitoringRequirement | undefined {
    const parameterName = this.getParameterDisplayName(method.parameterCode)

    return {
      id: `mon-${method.methodId}`,
      parameter: parameterName,
      methodCode: method.methodCode,
      systemType: method.parameterCode,
      frequency: method.methodCode === 'CEM' ? 'continuous' : 'hourly',
      regulatoryBasis: this.getMethodRegulatoryBasis(method),
      applicablePrograms: programs,
      notes: this.getMethodNotes(method),
    }
  }

  /**
   * Derive calculation requirements based on monitoring methods and programs
   */
  private deriveCalculationRequirements(
    plan: MonitoringPlan,
    _programs: string[]
  ): CalculationRequirement[] {
    const requirements: CalculationRequirement[] = []
    const parameterCodes = new Set(plan.methods.map((m) => m.parameterCode))

    // Hourly averages for all CEM parameters
    for (const method of plan.methods) {
      if (method.methodCode === 'CEM') {
        requirements.push({
          id: `calc-hourly-${method.parameterCode}`,
          name: `Hourly Average ${this.getParameterDisplayName(method.parameterCode)}`,
          calculationType: 'hourly_average',
          inputParameters: [method.parameterCode],
          outputParameter: `${method.parameterCode}_HOURLY_AVG`,
          outputUnits: this.getParameterUnits(method.parameterCode),
          frequency: 'hourly',
          regulatoryBasis: '40 CFR 75.10',
          notes: ['Required for all CEM parameters'],
        })
      }
    }

    // Heat Input calculation if we have flow and diluent
    if (parameterCodes.has('FLOW') && (parameterCodes.has('O2') || parameterCodes.has('CO2'))) {
      requirements.push({
        id: 'calc-heat-input',
        name: 'Heat Input Calculation',
        calculationType: 'heat_input',
        inputParameters: ['FLOW', 'O2', 'Temperature'],
        outputParameter: 'HI',
        outputUnits: 'MMBtu',
        frequency: 'hourly',
        formula: 'HI = Qh × Fd × (20.9/(20.9 - %O2)) × 10^-6',
        regulatoryBasis: '40 CFR 75 Appendix F',
        notes: ['F-factor based heat input calculation'],
      })
    }

    // SO2 mass emissions if we have SO2 and Flow
    if (parameterCodes.has('SO2') && parameterCodes.has('FLOW')) {
      requirements.push({
        id: 'calc-so2-mass',
        name: 'SO2 Mass Emissions',
        calculationType: 'mass_emission',
        inputParameters: ['SO2', 'FLOW'],
        outputParameter: 'SO2_MASS',
        outputUnits: 'lb/hr',
        frequency: 'hourly',
        formula: 'SO2 Mass = Concentration × Flow × K',
        regulatoryBasis: '40 CFR 75 Appendix F',
        notes: ['Required for ARP, CSAPR'],
      })
    }

    // NOx mass emissions
    if (parameterCodes.has('NOX') && parameterCodes.has('FLOW')) {
      requirements.push({
        id: 'calc-nox-mass',
        name: 'NOx Mass Emissions',
        calculationType: 'mass_emission',
        inputParameters: ['NOX', 'FLOW'],
        outputParameter: 'NOX_MASS',
        outputUnits: 'lb/hr',
        frequency: 'hourly',
        regulatoryBasis: '40 CFR 75 Appendix F',
        notes: ['Required for NOx programs'],
      })
    }

    // NOx emission rate (lb/MMBtu)
    if (parameterCodes.has('NOX')) {
      requirements.push({
        id: 'calc-nox-rate',
        name: 'NOx Emission Rate',
        calculationType: 'emission_rate',
        inputParameters: ['NOX_MASS', 'HI'],
        outputParameter: 'NOX_RATE',
        outputUnits: 'lb/MMBtu',
        frequency: 'hourly',
        formula: 'NOx Rate = NOx Mass / Heat Input',
        regulatoryBasis: '40 CFR 75.10(d)',
        notes: ['Required for ARP NOx rate calculation'],
      })
    }

    // CO2 mass if applicable
    if (parameterCodes.has('CO2') && parameterCodes.has('FLOW')) {
      requirements.push({
        id: 'calc-co2-mass',
        name: 'CO2 Mass Emissions',
        calculationType: 'mass_emission',
        inputParameters: ['CO2', 'FLOW'],
        outputParameter: 'CO2_MASS',
        outputUnits: 'tons/hr',
        frequency: 'hourly',
        regulatoryBasis: '40 CFR 75 Subpart G',
        notes: ['Required for GHG reporting'],
      })
    }

    // Daily calibration error calculation
    requirements.push({
      id: 'calc-daily-cal',
      name: 'Daily Calibration Error',
      calculationType: 'custom',
      inputParameters: ['CAL_GAS_REF', 'CAL_GAS_MEAS'],
      outputParameter: 'CAL_ERROR_PCT',
      outputUnits: 'percent of span',
      frequency: 'daily',
      formula: '|Reference - Measured| / Span × 100',
      regulatoryBasis: '40 CFR 75 Appendix B',
      notes: ['Must be ≤2.5% of span for valid calibration'],
    })

    return requirements
  }

  /**
   * Derive QA/QC test requirements based on system types
   */
  private deriveQARequirements(plan: MonitoringPlan, _programs: string[]): QARequirement[] {
    const requirements: QARequirement[] = []
    const systemTypes = new Set(plan.systems.map((s) => s.systemTypeCode))

    // Daily calibration for all CEM systems
    for (const system of plan.systems) {
      requirements.push({
        id: `qa-daily-cal-${system.systemId}`,
        testType: 'daily_calibration',
        parameterCode: system.systemTypeCode,
        frequency: 'daily (each operating day)',
        toleranceCriteria: '±2.5% of span value',
        regulatoryBasis: '40 CFR 75 Appendix B, Section 2.1',
        consequenceOfFailure:
          'Failed calibration requires recalibration within 8 hours or data invalidation',
        notes: [
          'Zero and upscale calibration gases required',
          'Must be performed prior to or at the beginning of each unit operating day',
        ],
      })
    }

    // Linearity check for gas analyzers
    for (const system of plan.systems) {
      if (['SO2', 'NOX', 'CO2', 'O2', 'NOXC'].includes(system.systemTypeCode)) {
        requirements.push({
          id: `qa-linearity-${system.systemId}`,
          testType: 'linearity',
          parameterCode: system.systemTypeCode,
          frequency: 'quarterly (once per QA operating quarter)',
          toleranceCriteria: '±5% of reference value or ±0.5% of span (NOx)',
          regulatoryBasis: '40 CFR 75 Appendix B, Section 2.2',
          consequenceOfFailure: 'Data invalidation back to last passed test',
          notes: [
            'Low, mid, and high level calibration gases required',
            'Must inject each gas 3 times',
          ],
        })
      }
    }

    // RATA for all CEM systems
    for (const system of plan.systems) {
      requirements.push({
        id: `qa-rata-${system.systemId}`,
        testType: 'rata',
        parameterCode: system.systemTypeCode,
        frequency: this.getRATAFrequency(plan.qualifications, system.systemTypeCode),
        toleranceCriteria: this.getRATATolerance(system.systemTypeCode),
        regulatoryBasis: '40 CFR 75 Appendix B, Section 2.3',
        consequenceOfFailure: 'Data invalidation, potential to lose CEM certification',
        notes: [
          'Reference method testing required',
          'At least 9 valid run pairs',
          'Bias adjustment may be required',
        ],
      })
    }

    // CGA for gas analyzers
    for (const system of plan.systems) {
      if (['SO2', 'NOX', 'CO2', 'O2'].includes(system.systemTypeCode)) {
        requirements.push({
          id: `qa-cga-${system.systemId}`,
          testType: 'quarterly_gas_audit',
          parameterCode: system.systemTypeCode,
          frequency: 'quarterly (alternate with RATA quarters)',
          toleranceCriteria: '±15% of certified reference value',
          regulatoryBasis: '40 CFR 75 Appendix B, Section 2.2.1',
          consequenceOfFailure: 'Failed audit requires corrective action',
          notes: ['EPA traceability protocol gases required'],
        })
      }
    }

    // Flow-to-load check
    if (systemTypes.has('FLOW')) {
      requirements.push({
        id: 'qa-flow-to-load',
        testType: 'flow_to_load',
        parameterCode: 'FLOW',
        frequency: 'quarterly',
        toleranceCriteria: 'Ratio within ±15% of baseline average',
        regulatoryBasis: '40 CFR 75 Appendix B, Section 2.2.5',
        consequenceOfFailure: 'RATA required within 168 operating hours if ratio out of range',
        notes: ['Evaluate gross load vs flow rate relationship'],
      })
    }

    // Leak check for differential pressure flow monitors
    if (systemTypes.has('FLOW')) {
      requirements.push({
        id: 'qa-leak-check',
        testType: 'leak_check',
        parameterCode: 'FLOW',
        frequency: 'quarterly',
        toleranceCriteria: 'No measureable leak',
        regulatoryBasis: '40 CFR 75 Appendix B, Section 2.2.2',
        consequenceOfFailure: 'Repair required, potential data invalidation',
        notes: ['For differential pressure flow monitors'],
      })
    }

    return requirements
  }

  /**
   * Derive reporting requirements based on programs
   */
  private deriveReportingRequirements(programs: string[]): ReportingRequirement[] {
    const requirements: ReportingRequirement[] = []

    // Quarterly EDR for all Part 75 sources
    requirements.push({
      id: 'rpt-quarterly-edr',
      reportType: 'Quarterly Electronic Data Report (EDR)',
      frequency: 'quarterly',
      submissionDeadline: '30 days after the end of each calendar quarter',
      dataElements: [
        'Hourly emissions data',
        'Operating time',
        'Heat input',
        'Quality assurance data',
        'Certification/recertification events',
      ],
      regulatoryBasis: '40 CFR 75.64',
      notes: ['Submit via ECMPS'],
    })

    // Annual compliance certification
    requirements.push({
      id: 'rpt-annual-compliance',
      reportType: 'Annual Compliance Certification',
      frequency: 'annual',
      submissionDeadline: 'March 1 of following year',
      dataElements: [
        'Annual emissions totals',
        'Excess emissions',
        'Monitor data availability',
        'QA test results',
      ],
      regulatoryBasis: '40 CFR 75.63',
      notes: ['Designated representative must certify'],
    })

    // MATS-specific if applicable
    if (programs.includes('MATS')) {
      requirements.push({
        id: 'rpt-mats-quarterly',
        reportType: 'MATS Quarterly Report',
        frequency: 'quarterly',
        submissionDeadline: '30 days after end of quarter',
        dataElements: ['Hg emissions', 'HCl emissions', 'Filterable PM'],
        regulatoryBasis: '40 CFR 63 Subpart UUUUU',
        notes: ['For MATS-affected units'],
      })
    }

    return requirements
  }

  /**
   * Derive emission limits based on programs (simplified - would need permit for actual limits)
   */
  private deriveEmissionLimits(plan: MonitoringPlan, programs: string[]): EmissionLimit[] {
    const limits: EmissionLimit[] = []
    const hasNOx = plan.methods.some((m) => m.parameterCode === 'NOX')
    const hasSO2 = plan.methods.some((m) => m.parameterCode === 'SO2')

    // Note: Actual limits would come from permit - these are regulatory thresholds
    if (programs.includes('ARP') && hasNOx) {
      limits.push({
        id: 'limit-nox-rate',
        parameter: 'NOx',
        limitValue: 0.5,
        units: 'lb/MMBtu',
        averagingPeriod: 'annual',
        limitType: 'emission_rate',
        regulatoryBasis: '40 CFR 76 (Phase II limits vary by boiler type)',
        applicablePrograms: ['ARP'],
        notes: ['Actual limit depends on boiler type and vintage'],
      })
    }

    if (programs.includes('CSAPR') && hasSO2) {
      limits.push({
        id: 'limit-csapr-so2',
        parameter: 'SO2',
        limitValue: 0,
        units: 'allowances',
        averagingPeriod: 'annual',
        limitType: 'mass',
        regulatoryBasis: '40 CFR 97 Subpart CCCCC',
        applicablePrograms: ['CSAPR'],
        notes: ['Allowance-based program - must hold allowances equal to emissions'],
      })
    }

    return limits
  }

  /**
   * Derive missing data substitution requirements
   */
  private deriveSubstitutionRequirements(plan: MonitoringPlan): SubstitutionRequirement[] {
    const requirements: SubstitutionRequirement[] = []

    for (const method of plan.methods) {
      if (method.substituteDataCode !== undefined) {
        requirements.push({
          id: `sub-${method.methodId}`,
          parameter: method.parameterCode,
          substituteDataCode: method.substituteDataCode,
          method: this.getSubstitutionMethodDescription(method.substituteDataCode),
          regulatoryBasis: '40 CFR 75 Subpart D',
          notes: this.getSubstitutionNotes(method.substituteDataCode),
        })
      }
    }

    return requirements
  }

  /**
   * Derive recordkeeping requirements
   */
  private deriveRecordkeepingRequirements(_programs: string[]): RecordkeepingRequirement[] {
    return [
      {
        id: 'rk-hourly-data',
        category: 'Emissions Data',
        description: 'All hourly emissions data, including substitute data',
        retentionPeriod: '3 years',
        regulatoryBasis: '40 CFR 75.57',
        notes: ['Electronic storage acceptable'],
      },
      {
        id: 'rk-qa-records',
        category: 'QA/QC Records',
        description: 'All calibration, linearity, RATA, CGA and other QA test results',
        retentionPeriod: '3 years',
        regulatoryBasis: '40 CFR 75.57',
        notes: ['Include all failed tests and corrective actions'],
      },
      {
        id: 'rk-monitoring-plan',
        category: 'Monitoring Plan',
        description: 'Current and historical monitoring plans',
        retentionPeriod: '3 years',
        regulatoryBasis: '40 CFR 75.57',
        notes: ['Keep all versions submitted to EPA'],
      },
      {
        id: 'rk-calibration-gases',
        category: 'Calibration Gases',
        description: 'Certificates for all calibration gases used',
        retentionPeriod: '3 years',
        regulatoryBasis: '40 CFR 75.57',
        notes: ['Must have EPA traceability protocol certificates'],
      },
    ]
  }

  // ============================================================================
  // HELPER METHODS FOR ANALYSIS
  // ============================================================================

  private getParameterDisplayName(code: string): string {
    const names: Record<string, string> = {
      SO2: 'Sulfur Dioxide',
      NOX: 'Nitrogen Oxides',
      NOXC: 'NOx Concentration',
      CO2: 'Carbon Dioxide',
      O2: 'Oxygen',
      FLOW: 'Stack Gas Flow',
      H2O: 'Moisture',
      HG: 'Mercury',
      HCL: 'Hydrogen Chloride',
      HI: 'Heat Input',
      OP: 'Opacity',
    }
    return names[code] ?? code
  }

  private getParameterUnits(code: string): string {
    const units: Record<string, string> = {
      SO2: 'ppm',
      NOX: 'ppm',
      CO2: 'percent',
      O2: 'percent',
      FLOW: 'scfh',
      H2O: 'percent',
      HG: 'µg/scm',
      HCL: 'ppm',
    }
    return units[code] ?? 'units'
  }

  private getMethodRegulatoryBasis(method: MonitoringMethod): string {
    const bases: Record<string, string> = {
      CEM: '40 CFR 75.10(a)',
      CALC: '40 CFR 75 Appendix F',
      AD: '40 CFR 75 Appendix D',
      LME: '40 CFR 75.19',
    }
    return bases[method.methodCode] ?? '40 CFR 75'
  }

  private getMethodNotes(method: MonitoringMethod): string[] {
    const notes: string[] = []
    if (method.methodCode === 'CEM') {
      notes.push('Continuous emissions monitoring required')
      notes.push('Subject to daily calibration and periodic QA tests')
    }
    if (method.methodCode === 'AD') {
      notes.push('Appendix D fuel flow methodology')
      notes.push('Requires fuel flowmeter with daily calibration')
    }
    if (method.substituteDataCode !== undefined) {
      notes.push(`Substitute data: ${method.substituteDataCode}`)
    }
    return notes
  }

  private getRATAFrequency(qualifications: UnitQualification[], _systemType: string): string {
    // Check for special qualifications that affect RATA frequency
    const hasLowMass = qualifications.some((q) => q.qualificationTypeCode === 'LME')
    if (hasLowMass) {
      return 'Once every 5 years (low mass emissions)'
    }
    return 'semi-annual or annual (based on previous RATA results)'
  }

  private getRATATolerance(systemType: string): string {
    if (systemType === 'FLOW') {
      return '≤10% relative accuracy or ≤7.5% with bias factor'
    }
    if (['SO2', 'NOX', 'NOXC', 'CO2'].includes(systemType)) {
      return '≤10% relative accuracy for RA >10%, or ≤5% for RA ≤10%'
    }
    return '≤10% relative accuracy'
  }

  private getSubstitutionMethodDescription(code: string): string {
    const descriptions: Record<string, string> = {
      SUBS75: 'Standard Part 75 substitute data procedures',
      MHHI: 'Maximum hourly heat input',
      MAX90: '90th percentile value from lookback period',
    }
    return descriptions[code] ?? code
  }

  private getSubstitutionNotes(code: string): string[] {
    if (code === 'SUBS75') {
      return [
        'Use 90th percentile for missing emissions data',
        'Use maximum for missing flow data',
        'Lookback period: quality-assured hours in previous 2,160 hours',
      ]
    }
    return []
  }

  // ============================================================================
  // EVIDENCE LIBRARY BUILDING
  // ============================================================================

  /**
   * Create an evidence item from a CFR section
   */
  async createEvidenceFromCFR(
    title: number,
    part: number,
    section?: string
  ): Promise<EvidenceItem> {
    const content = await this.lookupRegulation(title, part, section)

    return {
      id: `ecfr-${title.toString()}-${part.toString()}${section !== undefined && section !== '' ? `-${section}` : ''}`,
      sourceType: 'eCFR',
      title: content.title,
      content: content.content_text,
      citations: [
        {
          sourceType: 'eCFR',
          sourceId: content.citation,
          location: content.citation,
          excerpt: content.content_text.slice(0, 500),
          confidence: 1.0,
        },
      ],
      confirmedByHuman: false,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Create an evidence item from permit obligations
   */
  createEvidenceFromPermit(permit: PermitDocument, obligations: PermitObligation[]): EvidenceItem {
    const citations: CitationAnchor[] = obligations.map((obl) => ({
      sourceType: 'Permit' as const,
      sourceId: obl.id,
      location: obl.pageReference,
      excerpt: obl.originalText,
      confidence: obl.confidence,
    }))

    return {
      id: `permit-${permit.id}`,
      sourceType: 'Permit',
      title: `${permit.facilityName ?? 'Unknown Facility'} - ${permit.permitNumber ?? permit.filename}`,
      content: obligations.map((o) => o.originalText).join('\n\n'),
      citations,
      confirmedByHuman: false,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Build an evidence library from multiple sources
   */
  buildEvidenceLibrary(items: EvidenceItem[]): EvidenceLibraryData {
    return {
      items,
      scope: 'project',
    }
  }
}

// Default singleton instance
export const regsBotService = new RegsBotService()

// Re-export clients and types
export { EPA_REGULATORY_PROGRAMS, REGULATORY_LANGUAGE_PATTERNS } from '../../types/ecfr-api'
export { ECFRClient, ecfrClient } from './ecfr-client'
export { ECMPSClient, ecmpsClient } from './ecmps-client'
