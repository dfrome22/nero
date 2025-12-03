/**
 * RegsBot Agent
 *
 * EPA Regulatory Knowledge Oracle
 *
 * PURPOSE: Answer regulatory questions about what a DAHS needs to:
 * - RECORD: What data must be logged and stored
 * - CALCULATE: What emissions calculations are required
 * - QA/QC: What testing and calibration is required
 * - REPORT: What reports must be submitted
 *
 * INPUTS: RegsBot accepts any of:
 * - Natural language questions ("What QA tests do I need for SO2?")
 * - Structured queries ({ queryType: 'qa-requirements', context: { parameters: ['SO2'] }})
 * - Monitoring plan JSON (from file or API)
 * - Permit text (from OCR or paste)
 * - ORIS code (to fetch from ECMPS API)
 *
 * SOURCES: RegsBot searches controlled regulatory sources:
 * - eCFR (Electronic Code of Federal Regulations)
 * - ECMPS/CAMD APIs (Monitoring plans, facility data)
 * - State permits (Title V / Part 70)
 * - EPA guidance documents
 *
 * USAGE:
 *   const regsBot = new RegsBotService()
 *
 *   // Natural language
 *   const answer = await regsBot.ask({
 *     question: "What QA tests are required for a SO2 CEMS?"
 *   })
 *
 *   // With context
 *   const answer = await regsBot.ask({
 *     queryType: 'qa-requirements',
 *     context: { orisCode: 3, locationId: '7B' }
 *   })
 *
 *   // With monitoring plan
 *   const answer = await regsBot.ask({
 *     question: "What subparts apply?",
 *     context: { monitoringPlan: jsonPlan }
 *   })
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */

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
  ApplicableRegulation,
  ApplicableSubpart,
  CalculationRequirement,
  CitationAnchor,
  DAHSRequirements,
  EmissionLimit,
  EvidenceItem,
  EvidenceLibraryData,
  LocationInfo,
  MonitoringPlanQuery,
  MonitoringPlanQueryResult,
  MonitoringRequirement,
  ObligationType,
  PermitDocument,
  PermitObligation,
  QARequirement,
  QATestInfo,
  RecordkeepingRequirement,
  RegsBotContext,
  RegsBotInput,
  RegsBotQueryType,
  RegsBotResponse,
  RegsBotResponseData,
  RegulatoryCitation,
  RegulatorySource,
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
  // MAIN ENTRY POINT - Ask RegsBot anything
  // ============================================================================

  /**
   * Ask RegsBot a regulatory question.
   *
   * @param input - Question (natural language or structured) with optional context
   * @returns Structured response with answer, data, and citations
   *
   * @example
   * // Natural language
   * await regsBot.ask({ question: "What QA tests are required for SO2?" })
   *
   * // Structured query with context
   * await regsBot.ask({
   *   queryType: 'qa-requirements',
   *   context: { orisCode: 3, parameters: ['SO2', 'NOX'] }
   * })
   *
   * // With monitoring plan
   * await regsBot.ask({
   *   queryType: 'applicable-regulations',
   *   context: { monitoringPlan: jsonPlan, locationId: '7B' }
   * })
   */
  async ask(input: RegsBotInput): Promise<RegsBotResponse> {
    // Determine the query type from natural language if not specified
    const queryType = input.queryType ?? this.inferQueryType(input.question)

    // Get or fetch the monitoring plan if we have context
    const monitoringPlan = await this.resolveMonitoringPlan(input.context)

    // Build response based on query type
    const responseData = this.buildResponse(queryType, input, monitoringPlan)

    // Generate natural language answer
    const answer = this.generateAnswer(queryType, responseData, input)

    // Collect citations
    const citations = this.collectCitations(responseData, input.sources)

    return {
      input,
      answer,
      data: responseData,
      citations,
      relatedQuestions: this.suggestRelatedQuestions(queryType),
      confidence: this.assessConfidence(input, monitoringPlan),
      warnings: this.generateWarnings(input, monitoringPlan),
    }
  }

  /**
   * Infer query type from natural language question
   */
  private inferQueryType(question?: string): RegsBotQueryType {
    if (!question) return 'general'

    const q = question.toLowerCase()

    if (q.includes('qa') || q.includes('test') || q.includes('calibrat') || q.includes('rata')) {
      return 'qa-requirements'
    }
    if (q.includes('monitor') || q.includes('parameter') || q.includes('cems')) {
      return 'what-to-monitor'
    }
    if (
      q.includes('calculat') ||
      q.includes('average') ||
      q.includes('heat input') ||
      q.includes('mass')
    ) {
      return 'what-to-calculate'
    }
    if (q.includes('record') || q.includes('store') || q.includes('retain') || q.includes('log')) {
      return 'what-to-record'
    }
    if (
      q.includes('report') ||
      q.includes('submit') ||
      q.includes('edr') ||
      q.includes('quarterly')
    ) {
      return 'reporting-requirements'
    }
    if (
      q.includes('regulation') ||
      q.includes('subpart') ||
      q.includes('cfr') ||
      q.includes('part 75')
    ) {
      return 'applicable-regulations'
    }
    if (q.includes('limit') || q.includes('exceed') || q.includes('threshold')) {
      return 'emission-limits'
    }
    if (q.includes('missing') || q.includes('substitut') || q.includes('data availab')) {
      return 'missing-data'
    }

    return 'general'
  }

  /**
   * Resolve monitoring plan from context (fetch if needed)
   */
  private async resolveMonitoringPlan(
    context?: RegsBotContext
  ): Promise<MonitoringPlan | undefined> {
    if (!context) return undefined

    // Use provided monitoring plan
    if (context.monitoringPlan) {
      return context.monitoringPlan
    }

    // Fetch from ECMPS if ORIS code provided
    if (context.orisCode) {
      try {
        return await this.getMonitoringPlan(context.orisCode)
      } catch {
        // API might not be available, continue without it
        return undefined
      }
    }

    return undefined
  }

  /**
   * Build response data based on query type
   */
  private buildResponse(
    queryType: RegsBotQueryType,
    input: RegsBotInput,
    plan?: MonitoringPlan
  ): RegsBotResponseData {
    const context = input.context
    const locationId = context?.locationId
    const parameters = context?.parameters

    switch (queryType) {
      case 'what-to-monitor':
        return {
          monitoringRequirements: plan
            ? this.deriveMonitoringRequirements(plan, context?.programs ?? [])
            : this.getGenericMonitoringRequirements(parameters),
          regulations: this.getMonitoringRegulations(parameters),
        }

      case 'what-to-calculate':
        return {
          calculationRequirements: plan
            ? this.deriveCalculationRequirements(plan, [])
            : this.getGenericCalculationRequirements(parameters),
          regulations: this.getCalculationRegulations(),
        }

      case 'qa-requirements':
        return {
          qaRequirements: plan
            ? this.deriveQARequirements(plan, [])
            : this.getGenericQARequirements(parameters),
          regulations: this.getQARegulations(),
        }

      case 'reporting-requirements':
        return {
          reportingRequirements: this.deriveReportingRequirements(context?.programs ?? ['ARP']),
          regulations: this.getReportingRegulations(),
        }

      case 'applicable-regulations':
        return {
          regulations: plan
            ? this.deriveApplicableRegulations(plan, locationId)
            : this.getGenericRegulations(parameters, context?.programs),
        }

      case 'emission-limits':
        return {
          emissionLimits: plan ? this.deriveEmissionLimits(plan, context?.programs ?? []) : [],
          regulations: this.getLimitRegulations(context?.programs),
        }

      case 'missing-data':
        return {
          substitutionRequirements: plan
            ? this.deriveSubstitutionRequirements(plan)
            : this.getGenericSubstitutionRequirements(),
          regulations: this.getMissingDataRegulations(),
        }

      case 'what-to-record':
        return {
          recordkeepingRequirements: this.deriveRecordkeepingRequirements(context?.programs ?? []),
          regulations: this.getRecordkeepingRegulations(),
        }

      case 'general':
      default:
        // For general questions, provide overview
        return {
          regulations: plan
            ? this.deriveApplicableRegulations(plan, locationId)
            : this.getGenericRegulations(parameters, context?.programs),
        }
    }
  }

  /**
   * Generate natural language answer from response data
   */
  private generateAnswer(
    queryType: RegsBotQueryType,
    data: RegsBotResponseData,
    input: RegsBotInput
  ): string {
    const context = input.context
    const locationStr = context?.locationId
      ? ` for location ${context.locationId}`
      : context?.orisCode
        ? ` for ORIS ${context.orisCode}`
        : ''

    switch (queryType) {
      case 'what-to-monitor': {
        const reqs = data.monitoringRequirements ?? []
        const params = reqs.map((r) => r.parameter).join(', ')
        return `Based on Part 75 requirements${locationStr}, the following parameters must be monitored: ${params || 'See monitoring plan for specifics'}. Each parameter requires continuous monitoring with hourly data recording.`
      }

      case 'what-to-calculate': {
        const calcs = data.calculationRequirements ?? []
        const types = [...new Set(calcs.map((c) => c.name))].slice(0, 5).join(', ')
        return `The DAHS must perform these calculations${locationStr}: ${types || 'hourly averages, heat input, mass emissions'}. All calculations must be performed hourly and stored per 40 CFR 75 Appendix F.`
      }

      case 'qa-requirements': {
        const qa = data.qaRequirements ?? []
        const tests = [...new Set(qa.map((q) => q.testType))].join(', ')
        return `Required QA/QC tests${locationStr}: ${tests || 'daily calibration, quarterly linearity, RATA, CGA'}. The DAHS must track test results, due dates, and grace periods per 40 CFR 75 Appendix B.`
      }

      case 'reporting-requirements': {
        const reports = data.reportingRequirements ?? []
        return `Reporting requirements${locationStr}: ${reports.map((r) => r.reportType).join(', ') || 'Quarterly EDR, Annual Compliance Certification'}. Submit via ECMPS per 40 CFR 75.64.`
      }

      case 'applicable-regulations': {
        const regs = data.regulations ?? []
        const summary = regs
          .slice(0, 5)
          .map((r) => r.cfr)
          .join(', ')
        return `Applicable regulations${locationStr}: ${summary || '40 CFR 75 (Part 75 monitoring), 40 CFR 75 Appendix B (QA/QC)'}. ${regs.length} total regulatory provisions apply.`
      }

      case 'emission-limits': {
        const limits = data.emissionLimits ?? []
        if (limits.length === 0) {
          return `Emission limits are facility-specific and come from your permit. Check your Title V permit for applicable limits. The DAHS must track exceedances and report them.`
        }
        return `Found ${limits.length} emission limits${locationStr}. The DAHS must track these for exceedance monitoring and reporting.`
      }

      case 'missing-data': {
        return `Missing data substitution${locationStr}: Part 75 Subpart D procedures apply. The DAHS must use 90th percentile values for emissions, maximum values for flow, based on quality-assured hours in the lookback period. Data availability must be ≥90% to avoid bias adjustment.`
      }

      case 'what-to-record': {
        const records = data.recordkeepingRequirements ?? []
        return `Recordkeeping requirements${locationStr}: ${records.map((r) => r.category).join(', ') || 'hourly emissions data, QA records, calibration gas certificates'}. All records must be retained for ${records[0]?.retentionPeriod ?? '3 years'} per 40 CFR 75.57.`
      }

      default:
        return `Based on EPA regulations${locationStr}, the DAHS must continuously monitor emissions, perform required calculations, conduct QA/QC testing, and submit quarterly reports. See the detailed data for specifics.`
    }
  }

  /**
   * Collect citations from response data
   */
  private collectCitations(
    data: RegsBotResponseData,
    _sources?: RegulatorySource[]
  ): RegulatoryCitation[] {
    const citations: RegulatoryCitation[] = []

    // Add citations from regulations
    for (const reg of data.regulations ?? []) {
      const citation: RegulatoryCitation = {
        source: 'ecfr',
        reference: reg.cfr,
        title: reg.title,
        excerpt: reg.description,
      }
      if (reg.url) {
        citation.url = reg.url
      }
      citations.push(citation)
    }

    // Add citations from QA requirements
    for (const qa of data.qaRequirements ?? []) {
      if (!citations.some((c) => c.reference === qa.regulatoryBasis)) {
        citations.push({
          source: 'ecfr',
          reference: qa.regulatoryBasis,
          title: `${qa.testType} Requirements`,
          excerpt: `${qa.frequency}, tolerance: ${qa.toleranceCriteria}`,
        })
      }
    }

    return citations.slice(0, 10) // Limit citations
  }

  /**
   * Suggest related questions
   */
  private suggestRelatedQuestions(queryType: RegsBotQueryType): string[] {
    const suggestions: Record<RegsBotQueryType, string[]> = {
      'what-to-monitor': [
        'What calculations are required for these parameters?',
        'What QA tests do I need for my monitors?',
        'What are the missing data procedures?',
      ],
      'what-to-calculate': [
        'How is heat input calculated?',
        'What are the mass emission formulas?',
        'When are calculations due?',
      ],
      'qa-requirements': [
        'What is the RATA frequency?',
        'What happens if I fail a linearity test?',
        'What calibration gases do I need?',
      ],
      'reporting-requirements': [
        'When is the quarterly EDR due?',
        'What data goes in the annual certification?',
        'How do I submit to ECMPS?',
      ],
      'applicable-regulations': [
        'What monitoring is required?',
        'What QA/QC tests do I need?',
        'What are my reporting deadlines?',
      ],
      'emission-limits': [
        'How do I track exceedances?',
        'What are the averaging periods?',
        'What happens if I exceed a limit?',
      ],
      'missing-data': [
        'What is the substitute data formula?',
        'What is the lookback period?',
        'When is bias adjustment required?',
      ],
      'what-to-record': [
        'How long must I retain records?',
        'What format should records be in?',
        'What must be in the audit trail?',
      ],
      general: [
        'What parameters must I monitor?',
        'What QA tests are required?',
        'What are my reporting requirements?',
      ],
    }

    return suggestions[queryType]
  }

  /**
   * Assess confidence level
   */
  private assessConfidence(input: RegsBotInput, plan?: MonitoringPlan): 'high' | 'medium' | 'low' {
    // High confidence if we have a monitoring plan
    if (plan) return 'high'

    // Medium if we have ORIS code or specific parameters
    const params = input.context?.parameters
    if (input.context?.orisCode || (params && params.length > 0)) {
      return 'medium'
    }

    // Low for general questions without context
    return 'low'
  }

  /**
   * Generate warnings
   */
  private generateWarnings(input: RegsBotInput, plan?: MonitoringPlan): string[] {
    const warnings: string[] = []

    if (!plan && !input.context?.orisCode) {
      warnings.push(
        'Response is based on general Part 75 requirements. Provide a monitoring plan or ORIS code for facility-specific guidance.'
      )
    }

    if (!input.context?.programs?.length) {
      warnings.push(
        'Regulatory programs not specified. Assuming Acid Rain Program (ARP) requirements.'
      )
    }

    if (input.context?.stateCode) {
      warnings.push(
        `State-specific (${input.context.stateCode}) Title V requirements may apply but are not included in this response.`
      )
    }

    return warnings
  }

  // ============================================================================
  // GENERIC REQUIREMENT BUILDERS (when no monitoring plan available)
  // ============================================================================

  private getGenericMonitoringRequirements(parameters?: string[]): MonitoringRequirement[] {
    const params = parameters ?? ['SO2', 'NOX', 'CO2', 'FLOW', 'O2']
    return params.map((param, i) => ({
      id: `mon-generic-${i}`,
      parameter: this.getParameterDisplayName(param),
      methodCode: 'CEM',
      systemType: param,
      frequency: 'continuous' as const,
      regulatoryBasis: '40 CFR 75.10',
      applicablePrograms: ['ARP'],
      notes: ['Continuous emissions monitoring required'],
    }))
  }

  private getGenericCalculationRequirements(parameters?: string[]): CalculationRequirement[] {
    const calcs: CalculationRequirement[] = [
      {
        id: 'calc-hourly-avg',
        name: 'Hourly Average',
        calculationType: 'hourly_average',
        inputParameters: parameters ?? ['SO2', 'NOX', 'CO2'],
        outputParameter: 'HOURLY_AVG',
        outputUnits: 'various',
        frequency: 'hourly',
        regulatoryBasis: '40 CFR 75.10',
        notes: ['Required for all monitored parameters'],
      },
      {
        id: 'calc-heat-input',
        name: 'Heat Input',
        calculationType: 'heat_input',
        inputParameters: ['FLOW', 'O2'],
        outputParameter: 'HI',
        outputUnits: 'MMBtu',
        frequency: 'hourly',
        formula: 'HI = Qh × Fd × (20.9/(20.9 - %O2)) × 10^-6',
        regulatoryBasis: '40 CFR 75 Appendix F',
        notes: ['F-factor based calculation'],
      },
      {
        id: 'calc-so2-mass',
        name: 'SO2 Mass Emissions',
        calculationType: 'mass_emission',
        inputParameters: ['SO2', 'FLOW'],
        outputParameter: 'SO2_MASS',
        outputUnits: 'lb/hr',
        frequency: 'hourly',
        regulatoryBasis: '40 CFR 75 Appendix F',
        notes: ['Required for ARP'],
      },
    ]
    return calcs
  }

  private getGenericQARequirements(parameters?: string[]): QARequirement[] {
    const params = parameters ?? ['SO2', 'NOX', 'FLOW']
    const reqs: QARequirement[] = []

    for (const param of params) {
      reqs.push({
        id: `qa-cal-${param}`,
        testType: 'daily_calibration',
        parameterCode: param,
        frequency: 'daily (each operating day)',
        toleranceCriteria: '±2.5% of span value',
        regulatoryBasis: '40 CFR 75 Appendix B §2.1',
        consequenceOfFailure: 'Recalibrate within 8 hours or invalidate data',
        notes: ['Zero and upscale gases required'],
      })

      if (['SO2', 'NOX', 'CO2', 'O2'].includes(param)) {
        reqs.push({
          id: `qa-lin-${param}`,
          testType: 'linearity',
          parameterCode: param,
          frequency: 'quarterly',
          toleranceCriteria: '±5% of reference or ±0.5% of span',
          regulatoryBasis: '40 CFR 75 Appendix B §2.2',
          consequenceOfFailure: 'Data invalid back to last passed test',
          notes: ['Low, mid, high gases - 3 injections each'],
        })
      }

      reqs.push({
        id: `qa-rata-${param}`,
        testType: 'rata',
        parameterCode: param,
        frequency: 'semi-annual or annual',
        toleranceCriteria: param === 'FLOW' ? '≤10% RA' : '≤10% RA',
        regulatoryBasis: '40 CFR 75 Appendix B §2.3',
        consequenceOfFailure: 'Potential to lose CEM certification',
        notes: ['Reference method testing', 'At least 9 valid run pairs'],
      })
    }

    return reqs
  }

  private getGenericSubstitutionRequirements(): SubstitutionRequirement[] {
    return [
      {
        id: 'sub-emissions',
        parameter: 'Emissions (SO2, NOx, CO2)',
        substituteDataCode: 'SUBS75',
        method: '90th percentile from quality-assured hours in lookback period',
        regulatoryBasis: '40 CFR 75 Subpart D',
        notes: ['2,160 hour lookback', 'Use maximum if <2,160 QA hours'],
      },
      {
        id: 'sub-flow',
        parameter: 'FLOW',
        substituteDataCode: 'SUBS75',
        method: 'Maximum value from quality-assured hours',
        regulatoryBasis: '40 CFR 75 Subpart D',
        notes: ['Conservative approach for flow'],
      },
    ]
  }

  // ============================================================================
  // REGULATION LOOKUPS
  // ============================================================================

  private getMonitoringRegulations(parameters?: string[]): ApplicableRegulation[] {
    const regs: ApplicableRegulation[] = [
      {
        cfr: '40 CFR 75.10',
        part: 75,
        section: '10',
        title: 'General Operating Requirements',
        description: 'Core monitoring requirements for affected units',
        applicability: 'All Part 75 affected units',
      },
      {
        cfr: '40 CFR 75 Subpart B',
        part: 75,
        subpart: 'B',
        title: 'Monitoring Provisions',
        description: 'CEM requirements for SO2, NOx, CO2, and flow',
        applicability: 'Units using CEMS',
      },
    ]

    if (parameters?.includes('HG') || parameters?.includes('HCL')) {
      regs.push({
        cfr: '40 CFR 63 Subpart UUUUU',
        part: 63,
        subpart: 'UUUUU',
        title: 'MATS',
        description: 'Mercury and Air Toxics Standards',
        applicability: 'Coal and oil-fired EGUs',
      })
    }

    return regs
  }

  private getCalculationRegulations(): ApplicableRegulation[] {
    return [
      {
        cfr: '40 CFR 75 Appendix F',
        part: 75,
        subpart: 'Appendix F',
        title: 'Calculation Procedures',
        description: 'Heat input, emission rate, and mass emission calculations',
        applicability: 'All Part 75 sources',
      },
    ]
  }

  private getQARegulations(): ApplicableRegulation[] {
    return [
      {
        cfr: '40 CFR 75 Appendix B',
        part: 75,
        subpart: 'Appendix B',
        title: 'Quality Assurance and Quality Control Procedures',
        description: 'Calibration, linearity, RATA, CGA requirements',
        applicability: 'All Part 75 CEMS',
      },
    ]
  }

  private getReportingRegulations(): ApplicableRegulation[] {
    return [
      {
        cfr: '40 CFR 75.64',
        part: 75,
        section: '64',
        title: 'Quarterly Reports',
        description: 'Electronic Data Report submission requirements',
        applicability: 'All Part 75 sources',
      },
      {
        cfr: '40 CFR 75.63',
        part: 75,
        section: '63',
        title: 'Compliance Certification',
        description: 'Annual compliance certification requirements',
        applicability: 'All Part 75 sources',
      },
    ]
  }

  private getLimitRegulations(programs?: string[]): ApplicableRegulation[] {
    const regs: ApplicableRegulation[] = []

    if (programs?.includes('ARP') || !programs) {
      regs.push({
        cfr: '40 CFR 76',
        part: 76,
        title: 'Acid Rain Nitrogen Oxides Emission Reduction Program',
        description: 'NOx emission limits by boiler type',
        applicability: 'ARP affected units',
      })
    }

    if (programs?.includes('CSAPR')) {
      regs.push({
        cfr: '40 CFR 97 Subpart CCCCC',
        part: 97,
        subpart: 'CCCCC',
        title: 'CSAPR SO2 Trading Program',
        description: 'SO2 allowance requirements',
        applicability: 'CSAPR affected states',
      })
    }

    return regs
  }

  private getMissingDataRegulations(): ApplicableRegulation[] {
    return [
      {
        cfr: '40 CFR 75 Subpart D',
        part: 75,
        subpart: 'D',
        title: 'Missing Data Substitution Procedures',
        description: 'Standard procedures for missing CEMS data',
        applicability: 'All Part 75 CEMS',
      },
    ]
  }

  private getRecordkeepingRegulations(): ApplicableRegulation[] {
    return [
      {
        cfr: '40 CFR 75.57',
        part: 75,
        section: '57',
        title: 'General Recordkeeping Provisions',
        description: 'Record retention and format requirements',
        applicability: 'All Part 75 sources',
      },
    ]
  }

  private getGenericRegulations(
    parameters?: string[],
    programs?: string[]
  ): ApplicableRegulation[] {
    return [
      ...this.getMonitoringRegulations(parameters),
      ...this.getQARegulations(),
      ...this.getCalculationRegulations(),
      ...this.getReportingRegulations(),
      ...this.getLimitRegulations(programs),
    ]
  }

  private deriveApplicableRegulations(
    plan: MonitoringPlan,
    locationId?: string
  ): ApplicableRegulation[] {
    const methods = locationId
      ? plan.methods.filter((m) => m.locationId === locationId)
      : plan.methods
    const params = methods.map((m) => m.parameterCode)

    return this.getGenericRegulations(params)
  }

  // ============================================================================
  // REGULATION LOOKUP (existing methods)
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
  // MONITORING PLAN QUERIES - Answer questions about a specific MP
  // ============================================================================

  /**
   * Query a monitoring plan - answer questions about regulatory requirements.
   * Can accept a JSON monitoring plan directly or fetch by ORIS code.
   *
   * @example
   * // With JSON monitoring plan
   * regsBot.queryMonitoringPlan({
   *   plan: jsonMonitoringPlan,
   *   locationId: '7B',
   *   question: 'subparts'
   * })
   *
   * // Fetch from API
   * regsBot.queryMonitoringPlan({
   *   orisCode: 3,
   *   locationId: '7B',
   *   question: 'subparts'
   * })
   */
  async queryMonitoringPlan(query: MonitoringPlanQuery): Promise<MonitoringPlanQueryResult> {
    // Get the monitoring plan (from JSON or API)
    if (query.plan) {
      const plan = query.plan
      return this.executeMonitoringPlanQuery(query, plan)
    }
    if (query.orisCode === undefined) {
      throw new Error('Either plan or orisCode must be provided')
    }
    const plan = await this.getMonitoringPlan(query.orisCode)
    return this.executeMonitoringPlanQuery(query, plan)
  }

  private executeMonitoringPlanQuery(
    query: MonitoringPlanQuery,
    plan: MonitoringPlan
  ): MonitoringPlanQueryResult {
    // Filter to specific location if provided
    const locationId = query.locationId
    const unitId = query.unitId

    // Route to appropriate query handler
    switch (query.question) {
      case 'subparts':
        return this.queryApplicableSubparts(plan, locationId, unitId)
      case 'parameters':
        return this.queryMonitoredParameters(plan, locationId)
      case 'methods':
        return this.queryMonitoringMethods(plan, locationId)
      case 'qa-tests':
        return this.queryRequiredQATests(plan, locationId)
      case 'systems':
        return this.queryMonitoringSystems(plan, locationId)
      case 'qualifications':
        return this.queryUnitQualifications(plan, locationId, unitId)
      case 'summary':
      default:
        return this.queryLocationSummary(plan, locationId, unitId)
    }
  }

  /**
   * Get all locations in a monitoring plan
   */
  getLocations(plan: MonitoringPlan): LocationInfo[] {
    return plan.locations.map((loc) => {
      const info: LocationInfo = {
        locationId: loc.locationId,
        locationType: loc.locationType,
        isActive: loc.retireDate === undefined,
        parameters: plan.methods
          .filter((m) => m.locationId === loc.locationId)
          .map((m) => m.parameterCode),
        systems: plan.systems
          .filter((s) => s.locationId === loc.locationId)
          .map((s) => s.systemTypeCode),
      }
      if (loc.unitId) info.unitId = loc.unitId
      if (loc.stackPipeId) info.stackPipeId = loc.stackPipeId
      return info
    })
  }

  /**
   * Query: What regulatory subparts apply to this location/unit?
   */
  private queryApplicableSubparts(
    plan: MonitoringPlan,
    locationId?: string,
    unitId?: string
  ): MonitoringPlanQueryResult {
    const subparts: ApplicableSubpart[] = []
    const methods = this.filterByLocation(plan.methods, locationId)
    const qualifications = this.filterQualificationsByLocation(
      plan.qualifications,
      locationId,
      unitId
    )
    const parameterCodes = new Set(methods.map((m) => m.parameterCode))

    // Part 75 - Core monitoring (always applies if any CEM methods)
    const hasCEM = methods.some((m) => m.methodCode === 'CEM')
    if (hasCEM) {
      subparts.push({
        part: 75,
        subpart: 'A',
        title: 'General Provisions',
        description: 'Core Part 75 monitoring requirements',
        applicableParameters: Array.from(parameterCodes),
        regulatoryBasis: '40 CFR 75 Subpart A',
      })

      // Subpart B - Continuous Emission Monitoring
      subparts.push({
        part: 75,
        subpart: 'B',
        title: 'Continuous Emission Monitoring',
        description: 'CEM requirements for SO2, NOx, CO2, and flow',
        applicableParameters: ['SO2', 'NOX', 'CO2', 'FLOW'].filter((p) => parameterCodes.has(p)),
        regulatoryBasis: '40 CFR 75 Subpart B',
      })

      // Subpart C - Missing Data
      subparts.push({
        part: 75,
        subpart: 'C',
        title: 'Missing Data Substitution',
        description: 'Procedures for missing data',
        applicableParameters: Array.from(parameterCodes),
        regulatoryBasis: '40 CFR 75 Subpart C',
      })

      // Subpart D - Missing Data (Alternative)
      if (methods.some((m) => m.substituteDataCode !== undefined)) {
        subparts.push({
          part: 75,
          subpart: 'D',
          title: 'Missing Data Substitution Procedures',
          description: 'Alternative missing data procedures',
          applicableParameters: methods
            .filter((m) => m.substituteDataCode !== undefined)
            .map((m) => m.parameterCode),
          regulatoryBasis: '40 CFR 75 Subpart D',
        })
      }
    }

    // Appendix D - Fuel flow if AD method
    if (methods.some((m) => m.methodCode === 'AD')) {
      subparts.push({
        part: 75,
        subpart: 'Appendix D',
        title: 'Optional SO2 Emissions Data Protocol',
        description: 'Fuel-based SO2 monitoring using fuel flow and sulfur content',
        applicableParameters: ['SO2', 'HI'],
        regulatoryBasis: '40 CFR 75 Appendix D',
      })
    }

    // LME - Low Mass Emissions
    if (
      methods.some((m) => m.methodCode === 'LME') ||
      qualifications.some(
        (q) => q.qualificationTypeCode === 'LMEA' || q.qualificationTypeCode === 'LMES'
      )
    ) {
      subparts.push({
        part: 75,
        subpart: '75.19',
        title: 'Low Mass Emissions Units',
        description: 'Simplified monitoring for low-emitting units',
        applicableParameters: ['SO2', 'NOX', 'CO2'],
        regulatoryBasis: '40 CFR 75.19',
      })
    }

    // Subpart G - CO2 (if monitoring CO2)
    if (parameterCodes.has('CO2')) {
      subparts.push({
        part: 75,
        subpart: 'G',
        title: 'CO2 Mass Emissions',
        description: 'CO2 monitoring and reporting requirements',
        applicableParameters: ['CO2'],
        regulatoryBasis: '40 CFR 75 Subpart G',
      })
    }

    // Subpart H - NOx mass (if monitoring NOx)
    if (parameterCodes.has('NOX')) {
      subparts.push({
        part: 75,
        subpart: 'H',
        title: 'NOx Mass Emissions',
        description: 'NOx mass emissions monitoring provisions',
        applicableParameters: ['NOX'],
        regulatoryBasis: '40 CFR 75 Subpart H',
      })
    }

    // Check for mercury monitoring
    if (parameterCodes.has('HG') || parameterCodes.has('HCL') || parameterCodes.has('HF')) {
      subparts.push({
        part: 63,
        subpart: 'UUUUU',
        title: 'MATS - Mercury and Air Toxics Standards',
        description: 'HAP monitoring for coal/oil EGUs',
        applicableParameters: ['HG', 'HCL', 'HF'].filter((p) => parameterCodes.has(p)),
        regulatoryBasis: '40 CFR 63 Subpart UUUUU',
      })
    }

    // Appendix B - QA/QC procedures (always if CEM)
    if (hasCEM) {
      subparts.push({
        part: 75,
        subpart: 'Appendix B',
        title: 'Quality Assurance and Quality Control Procedures',
        description: 'Calibration, linearity, RATA, CGA requirements',
        applicableParameters: Array.from(parameterCodes),
        regulatoryBasis: '40 CFR 75 Appendix B',
      })
    }

    // Appendix F - Calculation procedures
    if (parameterCodes.has('FLOW') || parameterCodes.has('HI')) {
      subparts.push({
        part: 75,
        subpart: 'Appendix F',
        title: 'Calculation Procedures',
        description: 'Heat input, emission rate, and mass emission calculations',
        applicableParameters: ['FLOW', 'HI', 'SO2', 'NOX', 'CO2'].filter(
          (p) => parameterCodes.has(p) || p === 'HI'
        ),
        regulatoryBasis: '40 CFR 75 Appendix F',
      })
    }

    const result: MonitoringPlanQueryResult = {
      question: 'subparts',
      answer: {
        subparts,
        totalCount: subparts.length,
      },
      summary: `Location ${locationId ?? 'all'} is subject to ${subparts.length} regulatory subparts`,
    }
    if (locationId) result.locationId = locationId
    if (unitId) result.unitId = unitId
    return result
  }

  /**
   * Query: What parameters are monitored at this location?
   */
  private queryMonitoredParameters(
    plan: MonitoringPlan,
    locationId?: string
  ): MonitoringPlanQueryResult {
    const methods = this.filterByLocation(plan.methods, locationId)

    const parameters = methods.map((m) => {
      const param: {
        parameterCode: string
        parameterName: string
        methodCode: string
        methodDescription: string
        substituteDataCode?: string
        beginDate: string
        endDate?: string
        isActive: boolean
      } = {
        parameterCode: m.parameterCode,
        parameterName: this.getParameterDisplayName(m.parameterCode),
        methodCode: m.methodCode,
        methodDescription: this.getMethodDescription(m.methodCode),
        beginDate: m.beginDate,
        isActive: m.endDate === undefined,
      }
      if (m.substituteDataCode) param.substituteDataCode = m.substituteDataCode
      if (m.endDate) param.endDate = m.endDate
      return param
    })

    const result: MonitoringPlanQueryResult = {
      question: 'parameters',
      answer: { parameters },
      summary: `${parameters.length} parameters monitored at location ${locationId ?? 'all'}`,
    }
    if (locationId) result.locationId = locationId
    return result
  }

  /**
   * Query: What monitoring methods are used?
   */
  private queryMonitoringMethods(
    plan: MonitoringPlan,
    locationId?: string
  ): MonitoringPlanQueryResult {
    const methods = this.filterByLocation(plan.methods, locationId)

    const methodSummary = methods.map((m) => {
      const method: {
        parameterCode: string
        methodCode: string
        methodDescription: string
        regulatoryBasis: string
        substituteDataCode?: string
      } = {
        parameterCode: m.parameterCode,
        methodCode: m.methodCode,
        methodDescription: this.getMethodDescription(m.methodCode),
        regulatoryBasis: this.getMethodRegulatoryBasis(m),
      }
      if (m.substituteDataCode) method.substituteDataCode = m.substituteDataCode
      return method
    })

    const result: MonitoringPlanQueryResult = {
      question: 'methods',
      answer: { methods: methodSummary },
      summary: `${methodSummary.length} monitoring methods at location ${locationId ?? 'all'}`,
    }
    if (locationId) result.locationId = locationId
    return result
  }

  /**
   * Query: What QA tests are required?
   */
  private queryRequiredQATests(
    plan: MonitoringPlan,
    locationId?: string
  ): MonitoringPlanQueryResult {
    const systems = this.filterByLocation(plan.systems, locationId)

    const qaTests: QATestInfo[] = []

    for (const system of systems) {
      // Daily calibration for all systems
      qaTests.push({
        testType: 'Daily Calibration',
        systemId: system.systemId,
        parameterCode: system.systemTypeCode,
        frequency: 'Daily (each operating day)',
        tolerance: '±2.5% of span',
        regulatoryBasis: '40 CFR 75 Appendix B §2.1',
      })

      // Linearity for gas analyzers
      if (['SO2', 'NOX', 'NOXC', 'CO2', 'O2'].includes(system.systemTypeCode)) {
        qaTests.push({
          testType: 'Linearity Check',
          systemId: system.systemId,
          parameterCode: system.systemTypeCode,
          frequency: 'Quarterly',
          tolerance: '±5% of reference or ±0.5% of span',
          regulatoryBasis: '40 CFR 75 Appendix B §2.2',
        })

        qaTests.push({
          testType: 'Cylinder Gas Audit (CGA)',
          systemId: system.systemId,
          parameterCode: system.systemTypeCode,
          frequency: 'Quarterly (alternate with RATA)',
          tolerance: '±15% of certified value',
          regulatoryBasis: '40 CFR 75 Appendix B §2.2.1',
        })
      }

      // RATA for all systems
      qaTests.push({
        testType: 'RATA',
        systemId: system.systemId,
        parameterCode: system.systemTypeCode,
        frequency: 'Semi-annual or Annual',
        tolerance: system.systemTypeCode === 'FLOW' ? '≤10% RA' : '≤10% RA',
        regulatoryBasis: '40 CFR 75 Appendix B §2.3',
      })

      // Flow-specific tests
      if (system.systemTypeCode === 'FLOW') {
        qaTests.push({
          testType: 'Flow-to-Load Ratio',
          systemId: system.systemId,
          parameterCode: 'FLOW',
          frequency: 'Quarterly',
          tolerance: '±15% of baseline',
          regulatoryBasis: '40 CFR 75 Appendix B §2.2.5',
        })

        qaTests.push({
          testType: 'Leak Check',
          systemId: system.systemId,
          parameterCode: 'FLOW',
          frequency: 'Quarterly',
          tolerance: 'No measurable leak',
          regulatoryBasis: '40 CFR 75 Appendix B §2.2.2',
        })
      }
    }

    const result: MonitoringPlanQueryResult = {
      question: 'qa-tests',
      answer: { qaTests },
      summary: `${qaTests.length} QA tests required at location ${locationId ?? 'all'}`,
    }
    if (locationId) result.locationId = locationId
    return result
  }

  /**
   * Query: What monitoring systems are installed?
   */
  private queryMonitoringSystems(
    plan: MonitoringPlan,
    locationId?: string
  ): MonitoringPlanQueryResult {
    const systems = this.filterByLocation(plan.systems, locationId)

    const systemInfo = systems.map((s) => {
      const sys: {
        systemId: string
        systemType: string
        systemTypeName: string
        designationCode?: string
        fuelCode?: string
        beginDate: string
        endDate?: string
        isActive: boolean
        componentCount: number
      } = {
        systemId: s.systemId,
        systemType: s.systemTypeCode,
        systemTypeName: this.getSystemTypeName(s.systemTypeCode),
        beginDate: s.beginDate,
        isActive: s.endDate === undefined,
        componentCount: s.components?.length ?? 0,
      }
      if (s.systemDesignationCode) sys.designationCode = s.systemDesignationCode
      if (s.fuelCode) sys.fuelCode = s.fuelCode
      if (s.endDate) sys.endDate = s.endDate
      return sys
    })

    const result: MonitoringPlanQueryResult = {
      question: 'systems',
      answer: { systems: systemInfo },
      summary: `${systemInfo.length} monitoring systems at location ${locationId ?? 'all'}`,
    }
    if (locationId) result.locationId = locationId
    return result
  }

  /**
   * Query: What unit qualifications apply?
   */
  private queryUnitQualifications(
    plan: MonitoringPlan,
    locationId?: string,
    unitId?: string
  ): MonitoringPlanQueryResult {
    const qualifications = this.filterQualificationsByLocation(
      plan.qualifications,
      locationId,
      unitId
    )

    const qualInfo = qualifications.map((q) => {
      const qual: {
        qualificationType: string
        qualificationName: string
        description: string
        beginDate: string
        endDate?: string
        isActive: boolean
      } = {
        qualificationType: q.qualificationTypeCode,
        qualificationName: this.getQualificationName(q.qualificationTypeCode),
        description: this.getQualificationDescription(q.qualificationTypeCode),
        beginDate: q.beginDate,
        isActive: q.endDate === undefined,
      }
      if (q.endDate) qual.endDate = q.endDate
      return qual
    })

    const result: MonitoringPlanQueryResult = {
      question: 'qualifications',
      answer: { qualifications: qualInfo },
      summary: `${qualInfo.length} unit qualifications at location ${locationId ?? unitId ?? 'all'}`,
    }
    if (locationId) result.locationId = locationId
    if (unitId) result.unitId = unitId
    return result
  }

  /**
   * Query: Get a summary of everything at a location
   */
  private queryLocationSummary(
    plan: MonitoringPlan,
    locationId?: string,
    unitId?: string
  ): MonitoringPlanQueryResult {
    const location = plan.locations.find((l) =>
      locationId !== undefined
        ? l.locationId === locationId
        : unitId !== undefined
          ? l.unitId === unitId
          : false
    )

    const methods = this.filterByLocation(plan.methods, locationId)
    const systems = this.filterByLocation(plan.systems, locationId)
    const qualifications = this.filterQualificationsByLocation(
      plan.qualifications,
      locationId,
      unitId
    )

    interface LocInfoType {
      locationId: string
      locationType: 'unit' | 'stack' | 'pipe' | 'common'
      unitId?: string
      stackPipeId?: string
    }

    const locInfo: LocInfoType | undefined = location
      ? ((): LocInfoType => {
          const info: LocInfoType = {
            locationId: location.locationId,
            locationType: location.locationType,
          }
          if (location.unitId) info.unitId = location.unitId
          if (location.stackPipeId) info.stackPipeId = location.stackPipeId
          return info
        })()
      : undefined

    const summary = {
      location: locInfo,
      parameterCount: methods.length,
      parameters: methods.map((m) => m.parameterCode),
      systemCount: systems.length,
      systems: systems.map((s) => s.systemTypeCode),
      qualifications: qualifications.map((q) => q.qualificationTypeCode),
      hasCEM: methods.some((m) => m.methodCode === 'CEM'),
      hasAppendixD: methods.some((m) => m.methodCode === 'AD'),
      hasLME: methods.some((m) => m.methodCode === 'LME'),
    }

    const result: MonitoringPlanQueryResult = {
      question: 'summary',
      answer: summary,
      summary: `Location ${locationId ?? unitId ?? 'all'}: ${methods.length} parameters, ${systems.length} systems`,
    }
    if (locationId) result.locationId = locationId
    if (unitId) result.unitId = unitId
    return result
  }

  // ============================================================================
  // QUERY HELPER METHODS
  // ============================================================================

  private filterByLocation<T extends { locationId: string }>(items: T[], locationId?: string): T[] {
    if (locationId === undefined) return items
    return items.filter((item) => item.locationId === locationId)
  }

  private filterQualificationsByLocation(
    qualifications: UnitQualification[],
    locationId?: string,
    unitId?: string
  ): UnitQualification[] {
    if (locationId === undefined && unitId === undefined) return qualifications
    return qualifications.filter(
      (q) =>
        (locationId === undefined || q.locationId === locationId) &&
        (unitId === undefined || q.locationId.includes(unitId))
    )
  }

  private getMethodDescription(methodCode: string): string {
    const descriptions: Record<string, string> = {
      CEM: 'Continuous Emission Monitoring System',
      CALC: 'Calculation-based methodology',
      AD: 'Appendix D fuel flow methodology',
      LME: 'Low Mass Emissions exemption',
      LTFF: 'Long-term fuel flow',
      EXC: 'Excepted methodology',
    }
    return descriptions[methodCode] ?? methodCode
  }

  private getSystemTypeName(systemType: string): string {
    const names: Record<string, string> = {
      SO2: 'SO2 Monitoring System',
      NOX: 'NOx Monitoring System',
      NOXC: 'NOx Concentration System',
      NOXP: 'NOx-Diluent System',
      CO2: 'CO2 Monitoring System',
      O2: 'O2 Monitoring System',
      FLOW: 'Flow Monitoring System',
      H2O: 'Moisture Monitoring System',
      HG: 'Mercury Monitoring System',
      HCL: 'HCl Monitoring System',
      HF: 'HF Monitoring System',
    }
    return names[systemType] ?? systemType
  }

  private getQualificationName(qualType: string): string {
    const names: Record<string, string> = {
      LMEA: 'Low Mass Emissions - Appendix A',
      LMES: 'Low Mass Emissions - Standard',
      SK: 'Sorbent Trap (Stack)',
      GF: 'Gas-Fired',
      PRATA1: 'RATA Frequency - Annual (Group 1)',
      PRATA2: 'RATA Frequency - Annual (Group 2)',
      COMPLEX: 'Complex Stack Configuration',
      PEAKING: 'Peaking Unit',
    }
    return names[qualType] ?? qualType
  }

  private getQualificationDescription(qualType: string): string {
    const descriptions: Record<string, string> = {
      LMEA: 'Qualifies for simplified monitoring under Appendix A procedures',
      LMES: 'Qualifies for low mass emissions simplified monitoring',
      GF: 'Gas-fired unit - may use Appendix D for SO2',
      PRATA1: 'Annual RATA based on prior test results',
      PRATA2: 'Annual RATA based on prior test results',
      PEAKING: 'Operates less than threshold hours - special provisions apply',
    }
    return descriptions[qualType] ?? 'See 40 CFR 75 for details'
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
