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
 * EPA CODES: Uses EPA monitoring method codes (CEM, AD, LME, etc.),
 * formula codes (F-20, D-5, etc.), and parameter codes to provide
 * DAHS-specific answers linked to 40 CFR Part 75 sections.
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
  MonitoringFormula,
  MonitoringMethod,
  MonitoringPlan,
  UnitFuel,
  UnitQualification,
} from '../../types/ecmps-api'
import { FORMULA_TO_CFR, FUEL_CODES, normalizeMonitoringPlan } from '../../types/ecmps-api'
import type {
  ApplicableRegulation,
  ApplicableSubpart,
  CalculationItem,
  CalculationRequirement,
  CitationAnchor,
  ComplianceCitation,
  ComplianceReport,
  ComplianceReportSummary,
  DAHSRequirements,
  EmissionLimit,
  EmissionLimitItem,
  EvidenceItem,
  EvidenceLibraryData,
  LocationInfo,
  MissingDataItem,
  MonitoringMethodItem,
  MonitoringParameterGroup,
  MonitoringPlanQuery,
  MonitoringPlanQueryResult,
  MonitoringRequirement,
  ObligationType,
  PermitDocument,
  PermitObligation,
  QARequirement,
  QATestInfo,
  QATestMatrixItem,
  RecordkeepingItem,
  RecordkeepingRequirement,
  RegsBotContext,
  RegsBotInput,
  RegsBotQueryType,
  RegsBotResponse,
  RegsBotResponseData,
  RegulatoryCitation,
  RegulatorySource,
  ReportingRequirement,
  ReportingScheduleItem,
  SubstitutionRequirement,
} from '../../types/orchestration'
import { ECFRClient, ecfrClient } from './ecfr-client'
import { ECMPSClient, ecmpsClient } from './ecmps-client'
import { explainFormulaForDAHS, explainMethodForDAHS, FORMULA_CODES } from './epa-codes'
import {
  findSubpartsByParameter,
  getSubpartKnowledge,
  hasPartOverlap,
  type Part60SubpartKnowledge,
} from './part60-knowledge'

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
   * Normalizes the plan to our internal format if it's in API export format
   */
  private async resolveMonitoringPlan(
    context?: RegsBotContext
  ): Promise<MonitoringPlan | undefined> {
    if (!context) return undefined

    // Use provided monitoring plan - normalize it first
    if (context.monitoringPlan) {
      // The plan might be in API export format (nested) or already normalized (flat)
      // normalizeMonitoringPlan handles both cases
      return normalizeMonitoringPlan(context.monitoringPlan)
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

    // Build a rich location string: "FacilityName (ORIS) : Location"
    let locationStr = ''
    if (context?.facilityName || context?.orisCode || context?.locationId) {
      const parts: string[] = []

      // Facility identification
      if (context.facilityName && context.orisCode) {
        parts.push(`${context.facilityName} (${context.orisCode})`)
      } else if (context.facilityName) {
        parts.push(context.facilityName)
      } else if (context.orisCode) {
        parts.push(`ORIS ${context.orisCode}`)
      }

      // Location identification (unit or stack/pipe)
      if (context.locationId) {
        const locType =
          context.locationType === 'stack' || context.locationType === 'pipe'
            ? 'Stack/Pipe'
            : context.locationType === 'common'
              ? 'Common'
              : 'Unit'
        parts.push(`${locType} ${context.locationId}`)
      }

      locationStr = parts.length > 0 ? ` for ${parts.join(' : ')}` : ''
    }

    switch (queryType) {
      case 'what-to-monitor': {
        const reqs = data.monitoringRequirements ?? []
        const question = input.question?.toLowerCase() ?? ''

        // Specific answers for DAHS monitoring questions
        if (question.includes('co2') || question.includes('carbon dioxide')) {
          const co2Req = reqs.find(
            (r) =>
              r.parameter.toLowerCase().includes('co2') ||
              r.parameter.toLowerCase().includes('carbon dioxide')
          )
          if (co2Req) {
            const methodCode = co2Req.methodCode
            if (methodCode) {
              // Use EPA code mapping for DAHS-specific explanation
              const methodInfo = this.explainMonitoringMethod(methodCode)
              return `CO2 monitoring${locationStr}: ${methodInfo}`
            }
            return `CO2 monitoring${locationStr}: Method varies by fuel type. For gas-fired: use Appendix G fuel-based calculations. For coal/oil: use CEMS or fuel sampling. The DAHS must record hourly CO2 mass emissions (tons) and maintain quality-assured data.`
          }
        }

        if (question.includes('so2') || question.includes('sulfur')) {
          const so2Req = reqs.find(
            (r) =>
              r.parameter.toLowerCase().includes('so2') ||
              r.parameter.toLowerCase().includes('sulfur')
          )
          if (so2Req) {
            const methodCode = so2Req.methodCode
            if (methodCode) {
              const methodInfo = this.explainMonitoringMethod(methodCode)
              return `SO2 monitoring${locationStr}: ${methodInfo}`
            }
            return `SO2 monitoring${locationStr}: CEMS or fuel sampling. The DAHS must record hourly SO2 concentration (ppm), calculate mass emissions (lb/hr and tons), apply F-factors, and track CEMS data availability.`
          }
        }

        if (question.includes('nox') || question.includes('nitrogen')) {
          const noxReq = reqs.find(
            (r) =>
              r.parameter.toLowerCase().includes('nox') ||
              r.parameter.toLowerCase().includes('nitrogen')
          )
          if (noxReq) {
            const methodCode = noxReq.methodCode
            if (methodCode) {
              const methodInfo = this.explainMonitoringMethod(methodCode)
              return `NOx monitoring${locationStr}: ${methodInfo}`
            }
            return `NOx monitoring${locationStr}: CEMS. The DAHS must record hourly NOx concentration (ppm), calculate emission rate (lb/mmBtu), calculate mass (lb/hr and tons), and apply heat input for rate calculations.`
          }
        }

        if (question.includes('flow') || question.includes('stack gas')) {
          const flowReq = reqs.find((r) => r.parameter.toLowerCase().includes('flow'))
          if (flowReq) {
            const methodCode = flowReq.methodCode
            if (methodCode) {
              const methodInfo = this.explainMonitoringMethod(methodCode)
              return `Stack gas flow monitoring${locationStr}: ${methodInfo}`
            }
            return `Stack gas flow monitoring${locationStr}: CEMS flow monitor. The DAHS must record hourly volumetric flow rate (scfh), apply diluent corrections, and use flow data for mass emission calculations.`
          }
        }

        if (question.includes('heat input') || question.includes('hi ')) {
          // Check for method code from context
          const hiReq = reqs.find(
            (r) =>
              r.parameter.toLowerCase().includes('hi') || r.parameter.toLowerCase().includes('heat')
          )
          if (hiReq?.methodCode) {
            const methodInfo = this.explainMonitoringMethod(hiReq.methodCode)
            return `Heat input monitoring${locationStr}: ${methodInfo}`
          }
          return `Heat input monitoring${locationStr}: Per 40 CFR 75 Appendix F. The DAHS must calculate hourly heat input (mmBtu) from fuel flow × heating value OR from CEMS data × F-factors. Heat input is required for emission rate calculations and ARP allocations.`
        }

        // Check if asking about a specific method code (like "what does CEM mean?")
        const methodCodeMatch = /\b(cem|ad|ae|ag|lme|noxr|calc|fsa|pems)\b/i.exec(question)
        if (methodCodeMatch?.[1]) {
          const code = methodCodeMatch[1].toUpperCase()
          const methodInfo = this.explainMonitoringMethod(code)
          return `Monitoring method ${code}${locationStr}: ${methodInfo}`
        }

        // Use EPA parameter codes (CO2, SO2, NOX, HI, FLOW)
        const params = reqs.map((r) => this.toParameterCode(r.parameter)).join(', ')
        return `Based on Part 75 requirements${locationStr}, the following parameters must be monitored: ${params || 'See monitoring plan for specifics'}. Each parameter requires continuous monitoring with hourly data recording. The DAHS must maintain quality-assured hourly values for all parameters.`
      }

      case 'what-to-calculate': {
        const calcs = data.calculationRequirements ?? []
        const question = input.question?.toLowerCase() ?? ''

        // Specific DAHS calculation questions
        if (question.includes('f-factor') || question.includes('f factor')) {
          return `F-factor calculations${locationStr}: Per 40 CFR 75 Appendix F, use:
• Fc (carbon-based): 1040 scf CO2/mmBtu for natural gas, varies by fuel
• Fd (dry basis): 8710 dscf/mmBtu for gas, varies by fuel
• Fw (wet basis): 10,640 wscf/mmBtu for gas, varies by fuel
The DAHS must store F-factors by fuel type and apply correct values to mass calculations.`
        }

        if (question.includes('mass emission') || question.includes('lb/hr')) {
          return `Mass emission calculations${locationStr}: Per 40 CFR 75 Appendix F:
• SO2 (lb/hr) = SO2 concentration (ppm) × Flow (scfh) × (64.06/385.3E6)
• NOx (lb/hr) = NOx concentration (ppm) × Flow (scfh) × (46.01/385.3E6) × diluent correction
• CO2 (tons/hr) = CO2 concentration (%) × Flow (scfh) × (44.01/385.3E6) / 2000
The DAHS must perform these hourly and sum to daily/quarterly totals.`
        }

        if (question.includes('heat input') || question.includes('mmBtu')) {
          // Check for formula from context
          const hiCalc = calcs.find(
            (c) => c.name.toLowerCase().includes('heat') || c.formula?.includes('F-20')
          )
          if (hiCalc?.formula) {
            const formulaInfo = this.explainFormula('F-20')
            return `Heat input calculation${locationStr}: ${formulaInfo}`
          }
          return `Heat input calculation${locationStr}: Per 40 CFR 75 Appendix F:
• From fuel: HI = Fuel flow (scfh or lb/hr) × GCV (Btu/scf or Btu/lb) / 1E6
• From CEMS: HI = Flow (scfh) × Fc × (CO2% / 100) / 1E6
The DAHS must calculate hourly heat input and use it for emission rate calculations.`
        }

        if (question.includes('emission rate') || question.includes('lb/mmBtu')) {
          return `Emission rate calculation${locationStr}: Per 40 CFR 75 Appendix F:
• NOx rate (lb/mmBtu) = NOx (lb/hr) ÷ Heat Input (mmBtu/hr)
• SO2 rate (lb/mmBtu) = SO2 (lb/hr) ÷ Heat Input (mmBtu/hr)
The DAHS must calculate hourly rates and 30-day rolling averages for compliance.`
        }

        // Check if asking about a specific formula code (like "what is formula D-5?")
        const formulaCodeMatch = /\b([dfg]-?\d+[a-z]?|19-[123]|n-gas)\b/i.exec(question)
        if (formulaCodeMatch?.[1]) {
          const code = formulaCodeMatch[1].toUpperCase()
          const formulaInfo = this.explainFormula(code)
          return `Formula ${code}${locationStr}: ${formulaInfo}`
        }

        // Generic but detailed response
        const types = [...new Set(calcs.map((c) => c.name))].slice(0, 5).join(', ')
        return `The DAHS must perform these calculations${locationStr}: ${types || 'hourly averages, heat input, mass emissions, emission rates'}. Key formulas per 40 CFR 75 Appendix F:
• Mass emissions from concentrations × flow × molecular factors
• Heat input from fuel data or CEMS
• Emission rates from mass ÷ heat input
All calculations must be hourly with daily/quarterly aggregations.`
      }

      case 'qa-requirements': {
        const qa = data.qaRequirements ?? []
        const question = input?.question?.toLowerCase() ?? ''

        // Handle specific RATA frequency question
        if (question.includes('rata') && question.includes('frequen')) {
          const rataReqs = qa.filter((q) => q.testType.toLowerCase() === 'rata')
          if (rataReqs.length > 0) {
            const freq = rataReqs[0]?.frequency ?? 'semiannual (every 2 quarters)'
            return `RATA frequency${locationStr}: ${freq}. Per 40 CFR 75 Appendix B §2.3, RATAs must be performed semiannually (every 2 operating quarters) unless you qualify for annual testing based on prior RATA results <7.5% relative accuracy. The DAHS must track RATA due dates, grace periods (720 unit operating hours), and results for each CEM system.`
          }
          return `RATA (Relative Accuracy Test Audit) frequency${locationStr}: Semiannual (every 2 quarters) per 40 CFR 75 Appendix B §2.3.1. Annual frequency allowed if prior RATA relative accuracy ≤7.5%. The DAHS must: (1) Track RATA due dates per system, (2) Calculate grace period expiration (720 unit operating hours), (3) Store reference method results, (4) Flag overdue tests.`
        }

        // Handle specific linearity question
        if (question.includes('linear')) {
          const linReqs = qa.filter((q) => q.testType.toLowerCase().includes('linear'))
          const freq = linReqs[0]?.frequency ?? 'quarterly'
          const tolerance = linReqs[0]?.toleranceCriteria ?? '±5% of reference or ±0.5% of span'
          return `Linearity test frequency${locationStr}: ${freq}. Per 40 CFR 75 Appendix B §2.2, inject low/mid/high calibration gases (3 runs each = 9 injections). Tolerance: ${tolerance}. The DAHS must track linearity due dates, store injection values, calculate errors, and flag failures.`
        }

        // Handle specific calibration question
        if (
          question.includes('calibrat') &&
          (question.includes('daily') || question.includes('frequen'))
        ) {
          return `Daily calibration frequency${locationStr}: Every operating day, per 40 CFR 75 Appendix B §2.1. The DAHS must: (1) Perform zero/span check each operating day, (2) Calculate calibration error (must be ≤2.5% of span), (3) Track consecutive out-of-control conditions, (4) Apply calibration adjustment factors if needed. After 2 consecutive failed calibrations, data becomes conditionally valid pending corrective action.`
        }

        // Handle CGA question
        if (
          question.includes('cga') ||
          question.includes('gas audit') ||
          question.includes('cylinder')
        ) {
          return `Cylinder Gas Audit (CGA) frequency${locationStr}: Quarterly, alternating with linearity tests per 40 CFR 75 Appendix B §2.2. Use EPA Protocol gases. The DAHS must track CGA schedules, store audit results, and verify gas certificate expiration dates.`
        }

        // Generic QA answer with more detail
        const tests = [...new Set(qa.map((q) => q.testType))].join(', ')
        return `Required QA/QC tests${locationStr}: ${tests || 'daily_calibration, linearity, rata, quarterly_gas_audit'}. The DAHS must track test results, due dates, and grace periods per 40 CFR 75 Appendix B. Key frequencies: Daily calibration (each operating day), Linearity (quarterly), CGA (quarterly), RATA (semiannual or annual).`
      }

      case 'reporting-requirements': {
        const reports = data.reportingRequirements ?? []
        const question = input.question?.toLowerCase() ?? ''

        // Specific DAHS reporting questions
        if (question.includes('quarterly') || question.includes('edr')) {
          return `Quarterly EDR submission${locationStr}: Per 40 CFR 75.64, submit Electronic Data Reports within 30 days after quarter end:
• Q1 (Jan-Mar): Due April 30
• Q2 (Apr-Jun): Due July 30
• Q3 (Jul-Sep): Due October 30
• Q4 (Oct-Dec): Due January 30
The DAHS must generate EDR XML files, validate via EPA's ERT tool, and submit through ECMPS.`
        }

        if (question.includes('annual') || question.includes('certification')) {
          return `Annual compliance certification${locationStr}: Per 40 CFR 75.63, submit with Q1 EDR (due April 30). The Designated Representative must certify compliance with monitoring plan, QA/QC requirements, and emission reporting. The DAHS must generate certification data and flag any compliance issues.`
        }

        if (question.includes('ecmps') || question.includes('submit')) {
          return `ECMPS submission process${locationStr}: 
1. DAHS generates EDR XML file per EPA schema
2. Validate using EPA's Emissions Review Tool (ERT)
3. Fix any validation errors
4. Submit via ECMPS Client Tool or web interface
5. Review EPA feedback/errors within 24-48 hours
The DAHS must store submission confirmations and track resubmissions.`
        }

        if (question.includes('xml') || question.includes('format')) {
          return `EDR XML format${locationStr}: Per 40 CFR 75.64 and ECMPS Reporting Instructions:
• Daily summary records (date, op time, loads, emissions)
• Hourly operating data by location
• QA/QC test results for the quarter
• Substitute data summary
The DAHS must format all data per current EPA XML schema version.`
        }

        // Generic but detailed response
        return `Reporting requirements${locationStr}: ${reports.map((r) => r.reportType).join(', ') || 'Quarterly EDR, Annual Compliance Certification'}. Per 40 CFR 75.64, the DAHS must:
• Generate quarterly EDR XML files (due 30 days after quarter end)
• Include hourly emissions, QA test results, substitute data flags
• Validate via EPA's ERT tool before submission
• Submit through ECMPS and archive confirmations.`
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
        const question = input.question?.toLowerCase() ?? ''

        // Specific answers for common DAHS questions
        if (question.includes('lookback') || question.includes('look-back')) {
          return `Missing data lookback period${locationStr}: Per 40 CFR 75.33-75.37, use the previous 2,160 quality-assured operating hours (approximately 90 days) of data. If less than 2,160 hours available, use all available QA hours. The DAHS must maintain running 2,160-hour blocks for each monitored parameter.`
        }

        if (question.includes('percentile') || question.includes('substitut')) {
          return `Missing data substitution values${locationStr}: Per 40 CFR 75 Subpart D:
• Hours 0-24 missing: Use 90th percentile from lookback period for emissions; maximum value for flow
• Hours 25-720 missing: Use 95th percentile for emissions; maximum for flow  
• Hours 721-8760 missing: Use maximum hourly value from lookback period
The DAHS must automatically calculate and apply these substitution algorithms.`
        }

        if (question.includes('availability') || question.includes('90%')) {
          return `Data availability requirement${locationStr}: Per 40 CFR 75.32, monitor data availability must be ≥90% per quarter. Below 90%:
• Bias adjustment factor may apply to reported emissions
• Must use substitute data per Subpart D
The DAHS must calculate and report monitor operating time and data availability.`
        }

        if (question.includes('bias') || question.includes('adjustment')) {
          return `Bias adjustment${locationStr}: Per 40 CFR 75 Appendix A, a bias adjustment factor (BAF) applies when RATA results show bias. The DAHS must:
• Store the BAF from each RATA
• Apply BAF to all emissions calculations until next RATA
• Track whether BAF is required (|avg diff| > |SD|)
• Report adjusted values in quarterly submissions.`
        }

        // Generic but still DAHS-focused response
        return `Missing data substitution${locationStr}: Part 75 Subpart D procedures apply. The DAHS must:
• Track 2,160-hour lookback period for each parameter
• Calculate 90th/95th percentile and maximum values from QA hours
• Apply appropriate substitution based on hours missing (0-24, 25-720, 721+)
• Maintain ≥90% data availability to avoid bias adjustment
• Document all substituted data hours in quarterly reports.`
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
   * Convert parameter name to EPA code (e.g., "Carbon Dioxide" -> "CO2")
   */
  private toParameterCode(param: string): string {
    const codeMap: Record<string, string> = {
      'carbon dioxide': 'CO2',
      'sulfur dioxide': 'SO2',
      'nitrogen oxides': 'NOX',
      'nitrogen oxide': 'NOX',
      nox: 'NOX',
      'heat input': 'HI',
      flow: 'FLOW',
      opacity: 'OP',
      oxygen: 'O2',
      moisture: 'H2O',
      mercury: 'HG',
      'hydrogen chloride': 'HCL',
      'hydrogen fluoride': 'HF',
      'particulate matter': 'PM',
    }
    const lower = param.toLowerCase()
    // Check if already a code
    if (param === param.toUpperCase() && param.length <= 6) {
      return param
    }
    return codeMap[lower] ?? param
  }

  /**
   * Get DAHS explanation for a monitoring method code from the monitoring plan
   */
  private explainMonitoringMethod(methodCode: string): string {
    return explainMethodForDAHS(methodCode)
  }

  /**
   * Get DAHS explanation for a formula code from the monitoring plan
   */
  private explainFormula(formulaCode: string): string {
    return explainFormulaForDAHS(formulaCode)
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
    const formulas = this.filterFormulasByLocation(plan.formulas ?? [], locationId)
    const fuels = this.filterFuelsByLocation(plan.unitFuels ?? [], locationId)
    const parameterCodes = new Set(methods.map((m) => m.parameterCode))

    // Derive fuel types for regulatory determination
    const fuelTypes = this.analyzeFuelTypes(fuels)
    const formulaInfo = this.analyzeFormulas(formulas)

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

    // Appendix D - Fuel flow if AD method OR if we have fuel-based formulas OR Appendix D formulas
    if (
      methods.some((m) => m.methodCode === 'AD') ||
      formulaInfo.hasFuelFlowFormulas ||
      formulaInfo.hasAppendixDFormulas
    ) {
      const fuelDesc = fuelTypes.fuelList.length > 0 ? ` (${fuelTypes.fuelList.join(', ')})` : ''
      const formulaDesc =
        formulaInfo.appendixDFormulas.length > 0
          ? ` Formulas: ${formulaInfo.appendixDFormulas.join(', ')}`
          : ''
      subparts.push({
        part: 75,
        subpart: 'Appendix D',
        title: 'Optional SO2 Emissions Data Protocol',
        description: `Fuel-based SO2 monitoring using fuel flow and sulfur content${fuelDesc}.${formulaDesc}`,
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

    // Subpart E - Additional provisions for peaking units
    if (qualifications.some((q) => q.qualificationTypeCode === 'PK')) {
      subparts.push({
        part: 75,
        subpart: 'E',
        title: 'Peaking Unit Provisions',
        description: 'Alternative monitoring for peaking units',
        applicableParameters: Array.from(parameterCodes),
        regulatoryBasis: '40 CFR 75 Subpart E',
      })
    }

    // Subpart F - Recordkeeping (always applies)
    subparts.push({
      part: 75,
      subpart: 'F',
      title: 'Recordkeeping Requirements',
      description: 'Data retention and electronic submission requirements',
      applicableParameters: Array.from(parameterCodes),
      regulatoryBasis: '40 CFR 75 Subpart F',
    })

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

    // Check for mercury monitoring (HAPs - MATS)
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

    // Coal-fired units have additional requirements under MATS
    if (fuelTypes.hasCoal && !parameterCodes.has('HG')) {
      subparts.push({
        part: 63,
        subpart: 'UUUUU',
        title: 'MATS - Mercury and Air Toxics Standards (Coal)',
        description: 'Coal-fired EGU may require mercury monitoring - verify MATS applicability',
        applicableParameters: ['HG', 'HCL', 'HF'],
        regulatoryBasis: '40 CFR 63 Subpart UUUUU',
      })
    }

    // Appendix A - Monitoring plan requirements
    subparts.push({
      part: 75,
      subpart: 'Appendix A',
      title: 'Monitoring Plan Requirements',
      description: 'Specifications for monitoring plan content and format',
      applicableParameters: Array.from(parameterCodes),
      regulatoryBasis: '40 CFR 75 Appendix A',
    })

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

    // Appendix E - Optional NOx emissions estimation for oil/gas peaking units
    if (methods.some((m) => m.methodCode === 'EXC') && (fuelTypes.hasOil || fuelTypes.hasGas)) {
      subparts.push({
        part: 75,
        subpart: 'Appendix E',
        title: 'Optional NOx Emissions Estimation Protocol',
        description: 'NOx emissions estimation for oil/gas peaking units',
        applicableParameters: ['NOX'],
        regulatoryBasis: '40 CFR 75 Appendix E',
      })
    }

    // Appendix F - Calculation procedures (enhanced with formula info and CFR references)
    if (parameterCodes.has('FLOW') || parameterCodes.has('HI') || formulaInfo.hasFormulas) {
      // Build description from CFR references when available
      let formulaDesc = ''
      if (formulaInfo.cfrReferences.length > 0) {
        const refList = formulaInfo.cfrReferences.slice(0, 3).map((r) => `${r.code} (${r.section})`)
        formulaDesc = ` Using formulas: ${refList.join('; ')}${formulaInfo.cfrReferences.length > 3 ? '...' : ''}`
      } else if (formulaInfo.formulaCodes.length > 0) {
        formulaDesc = ` Using formulas: ${formulaInfo.formulaCodes.slice(0, 5).join(', ')}${formulaInfo.formulaCodes.length > 5 ? '...' : ''}`
      }
      subparts.push({
        part: 75,
        subpart: 'Appendix F',
        title: 'Calculation Procedures',
        description: `Heat input, emission rate, and mass emission calculations.${formulaDesc}`,
        applicableParameters: ['FLOW', 'HI', 'SO2', 'NOX', 'CO2'].filter(
          (p) => parameterCodes.has(p) || p === 'HI'
        ),
        regulatoryBasis: '40 CFR 75 Appendix F',
      })
    }

    // Apportionment formulas (F-23, F-24, F-25, F-26) indicate common stack
    if (formulaInfo.hasApportionmentFormulas) {
      subparts.push({
        part: 75,
        subpart: 'Appendix F (§§75.16-17)',
        title: 'Common Stack Apportionment',
        description: `Emissions apportionment for common stack configurations. Using: ${formulaInfo.apportionmentFormulas.join(', ')}`,
        applicableParameters: ['SO2', 'NOX', 'CO2', 'HI'],
        regulatoryBasis: '40 CFR 75.16, 75.17',
      })
    }

    // ========================================================================
    // Part 60 NSPS Detection - Check for applicable Part 60 subparts
    // ========================================================================
    const part60Subparts = this.detectPart60Subparts(
      Array.from(parameterCodes),
      fuelTypes,
      qualifications
    )
    subparts.push(...part60Subparts)

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
   * Detect applicable Part 60 NSPS subparts based on parameters and fuel types
   *
   * Uses the pre-indexed Part 60 knowledge base to determine which NSPS
   * subparts may apply based on monitored parameters and unit characteristics.
   */
  private detectPart60Subparts(
    parameters: string[],
    fuelTypes: { hasCoal: boolean; hasOil: boolean; hasGas: boolean; fuelList: string[] },
    _qualifications: UnitQualification[]
  ): ApplicableSubpart[] {
    const subparts: ApplicableSubpart[] = []
    const addedSubparts = new Set<string>()

    // Helper to add a Part 60 subpart if not already added
    const addSubpart = (knowledge: Part60SubpartKnowledge, reason: string): void => {
      if (addedSubparts.has(knowledge.subpart)) return
      addedSubparts.add(knowledge.subpart)

      // Find applicable parameters from our monitoring that this subpart covers
      const applicableParams = parameters.filter(
        (p) =>
          knowledge.standards.some((std) => std.parameter === p) ||
          knowledge.cemsParameters?.includes(p)
      )

      subparts.push({
        part: 60,
        subpart: knowledge.subpart,
        title: knowledge.title,
        description: `${knowledge.applicability.description}. ${reason}`,
        applicableParameters:
          applicableParams.length > 0 ? applicableParams : (knowledge.cemsParameters ?? []),
        regulatoryBasis: knowledge.keyCitations.applicability,
      })
    }

    // Check for utility boiler subparts (Da, TTTT) if coal or oil fired
    if (fuelTypes.hasCoal || fuelTypes.hasOil) {
      const da = getSubpartKnowledge('Da')
      if (da) {
        addSubpart(da, 'May apply to fossil fuel-fired steam generators >250 MMBtu/hr')
      }

      // TTTT for GHG if CO2 is monitored
      if (parameters.includes('CO2')) {
        const tttt = getSubpartKnowledge('TTTT')
        if (tttt) {
          addSubpart(tttt, 'CO2 monitoring indicates potential GHG requirements')
        }
      }
    }

    // Check for gas turbine subparts (GG, KKKK) if NOX is monitored with gas
    if (fuelTypes.hasGas && parameters.includes('NOX')) {
      // Add KKKK (current rule) - applies to turbines after 2/18/2005
      const kkkk = getSubpartKnowledge('KKKK')
      if (kkkk) {
        addSubpart(kkkk, 'NOX monitoring with gas fuel - verify turbine applicability')
      }
    }

    // Check for refinery subparts if CO is monitored (FCCU indicator)
    if (parameters.includes('CO')) {
      const j = getSubpartKnowledge('J')
      if (j) {
        // Only add if this looks like a refinery (CO + SO2 or H2S would be key indicators)
        const hasRefineryIndicators = parameters.includes('SO2') || parameters.includes('H2S')
        if (hasRefineryIndicators) {
          addSubpart(j, 'CO monitoring with SO2/H2S suggests petroleum refinery equipment')
        }
      }
    }

    // For each monitored parameter, check if there are Part 60 subparts we should flag
    for (const param of parameters) {
      const matchingSubparts = findSubpartsByParameter(param)
      for (const knowledge of matchingSubparts) {
        // Only add subparts that coordinate with Part 75 (utility focus)
        if (hasPartOverlap(knowledge.subpart) && !addedSubparts.has(knowledge.subpart)) {
          addSubpart(knowledge, `Monitors ${param} which this subpart regulates`)
        }
      }
    }

    return subparts
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

  private filterFormulasByLocation(
    formulas: MonitoringFormula[],
    locationId?: string
  ): MonitoringFormula[] {
    if (locationId === undefined) return formulas
    return formulas.filter((f) => f.locationId === locationId)
  }

  private filterFuelsByLocation(fuels: UnitFuel[], locationId?: string): UnitFuel[] {
    if (locationId === undefined) return fuels
    return fuels.filter((f) => f.locationId === locationId)
  }

  /**
   * Analyze fuel types from unit fuel data to determine regulatory applicability
   */
  private analyzeFuelTypes(fuels: UnitFuel[]): {
    hasCoal: boolean
    hasOil: boolean
    hasGas: boolean
    fuelList: string[]
    primaryFuel: string | undefined
  } {
    const fuelCodes = fuels.map((f) => f.fuelCode)
    const fuelNames = fuelCodes.map((code) => {
      const name = FUEL_CODES[code as keyof typeof FUEL_CODES]
      return name ?? code
    })

    // Determine fuel categories
    const hasCoal = fuelCodes.some((f) => f === 'C' || f.startsWith('C'))
    const hasOil = fuelCodes.some((f) => f === 'OIL' || f === 'R' || f === 'DSL' || f === 'WO')
    const hasGas = fuelCodes.some(
      (f) => f === 'NFS' || f === 'PNG' || f === 'PG' || f.includes('GAS')
    )

    // Find primary fuel (indicator code 'P')
    const primaryFuelRecord = fuels.find((f) => f.indicatorCode === 'P')
    const primaryFuel = primaryFuelRecord
      ? (FUEL_CODES[primaryFuelRecord.fuelCode as keyof typeof FUEL_CODES] ??
        primaryFuelRecord.fuelCode)
      : undefined

    return {
      hasCoal,
      hasOil,
      hasGas,
      fuelList: [...new Set(fuelNames)],
      primaryFuel,
    }
  }

  /**
   * Analyze formulas from monitoring plan to determine calculation requirements
   * Uses FORMULA_TO_CFR mapping for regulatory section lookup
   */
  private analyzeFormulas(formulas: MonitoringFormula[]): {
    hasFormulas: boolean
    formulaCodes: string[]
    hasFuelFlowFormulas: boolean
    hasApportionmentFormulas: boolean
    hasAppendixDFormulas: boolean
    hasAppendixFFormulas: boolean
    apportionmentFormulas: string[]
    heatInputFormulas: string[]
    massEmissionFormulas: string[]
    appendixDFormulas: string[]
    appendixFFormulas: string[]
    cfrReferences: Array<{ code: string; section: string; description: string }>
  } {
    const formulaCodes = formulas.map((f) => f.formulaCode)
    const uniqueCodes = [...new Set(formulaCodes)]

    // Categorize by appendix using FORMULA_TO_CFR mapping
    const appendixDFormulas = uniqueCodes.filter(
      (c) => c.startsWith('D-') || FORMULA_TO_CFR[c]?.appendix === 'Appendix D'
    )
    const appendixFFormulas = uniqueCodes.filter(
      (c) =>
        c.startsWith('F-') || c.startsWith('G-') || FORMULA_TO_CFR[c]?.appendix === 'Appendix F'
    )
    const hasAppendixDFormulas = appendixDFormulas.length > 0
    const hasAppendixFFormulas = appendixFFormulas.length > 0

    // Fuel flow related formulas (Appendix D)
    const fuelFlowFormulas = ['F-21A', 'F-21B', 'F-21C', 'F-2', 'D-5', 'D-6', 'D-8']
    const hasFuelFlowFormulas = uniqueCodes.some((c) => fuelFlowFormulas.includes(c))

    // Apportionment formulas (common stack - 75.16/75.17)
    const apportionmentCodes = ['F-23', 'F-24', 'F-24A', 'F-25', 'F-26', 'D-15A', 'D-15B']
    const apportionmentFormulas = uniqueCodes.filter((c) => apportionmentCodes.includes(c))
    const hasApportionmentFormulas = apportionmentFormulas.length > 0

    // Heat input formulas
    const hiCodes = [
      'F-21',
      'F-21A',
      'F-21B',
      'F-21C',
      'F-21D',
      'F-23',
      'F-16',
      'F-17',
      'D-5',
      'D-6',
      'D-8',
      'D-15A',
    ]
    const heatInputFormulas = uniqueCodes.filter((c) => hiCodes.includes(c))

    // Mass emission formulas
    const massCodes = [
      'F-1',
      'F-5',
      'F-11',
      'F-24',
      'F-24A',
      'F-25',
      'F-26',
      'D-1',
      'D-2',
      'D-3',
      'D-12',
    ]
    const massEmissionFormulas = uniqueCodes.filter((c) => massCodes.includes(c))

    // Build CFR references from FORMULA_TO_CFR mapping
    const cfrReferences = uniqueCodes
      .map((code) => {
        const mapping = FORMULA_TO_CFR[code]
        if (mapping) {
          return {
            code,
            section: mapping.section,
            description: mapping.description,
          }
        }
        return null
      })
      .filter((ref): ref is { code: string; section: string; description: string } => ref !== null)

    return {
      hasFormulas: uniqueCodes.length > 0,
      formulaCodes: uniqueCodes,
      hasFuelFlowFormulas,
      hasApportionmentFormulas,
      hasAppendixDFormulas,
      hasAppendixFFormulas,
      apportionmentFormulas,
      heatInputFormulas,
      massEmissionFormulas,
      appendixDFormulas,
      appendixFFormulas,
      cfrReferences,
    }
  }

  // Note: getMethodDescription is defined later in the file for compliance report building

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
    return this.analyzeMonitoringPlanWithClient(orisCode, this.ecmps)
  }

  /**
   * Analyze a facility's monitoring plan with a specific ECMPS client.
   * Used when a custom API key is provided.
   *
   * @param orisCode - The facility's ORIS code
   * @param client - ECMPS client instance to use
   * @returns Structured requirements for DAHS configuration
   */
  private async analyzeMonitoringPlanWithClient(
    orisCode: number,
    client: ECMPSClient
  ): Promise<DAHSRequirements> {
    // Fetch facility info and monitoring plan from ECMPS
    const [facility, monitoringPlan, programs] = await Promise.all([
      client.getFacility(orisCode),
      client.getMonitoringPlan({ orisCode }),
      client.getFacilityPrograms(orisCode),
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

    // Also get parameters from methods for accurate parameter codes
    const methodParams = new Set(plan.methods.map((m) => m.parameterCode))

    // Map system type codes to display-friendly parameter names
    const getDisplayParameter = (systemTypeCode: string): string => {
      const displayMap: Record<string, string> = {
        GAS: 'Gas Analyzer', // Generic gas analyzer - will be refined per test
        SO2: 'SO2',
        NOX: 'NOx',
        NOXC: 'NOx (Calculated)',
        CO2: 'CO2',
        O2: 'O2',
        FLOW: 'FLOW',
        HI: 'Heat Input',
        H2O: 'Moisture',
        HG: 'Mercury',
        HCL: 'HCl',
        HF: 'HF',
        PM: 'PM',
        OP: 'Opacity',
      }
      return displayMap[systemTypeCode.toUpperCase()] ?? systemTypeCode
    }

    // Get the actual parameters a system monitors (from methods)
    const getSystemParameters = (system: { systemTypeCode: string }): string[] => {
      // GAS type systems typically monitor SO2, NOx, CO2, O2
      if (system.systemTypeCode === 'GAS') {
        // Return parameters that are actually in the monitoring plan
        const gasParams = ['SO2', 'NOX', 'CO2', 'O2'].filter((p) => methodParams.has(p))
        return gasParams.length > 0 ? gasParams : ['Gas Analyzer']
      }
      return [getDisplayParameter(system.systemTypeCode)]
    }

    // Daily calibration for all CEM systems
    for (const system of plan.systems) {
      const params = getSystemParameters(system)
      requirements.push({
        id: `qa-daily-cal-${system.systemId}`,
        testType: 'daily_calibration',
        parameterCode: params.join('/'),
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
      // Include GAS type and explicit gas analyzer types
      if (['SO2', 'NOX', 'CO2', 'O2', 'NOXC', 'GAS'].includes(system.systemTypeCode)) {
        const params = getSystemParameters(system)
        requirements.push({
          id: `qa-linearity-${system.systemId}`,
          testType: 'linearity',
          parameterCode: params.join('/'),
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
      const params = getSystemParameters(system)
      requirements.push({
        id: `qa-rata-${system.systemId}`,
        testType: 'rata',
        parameterCode: params.join('/'),
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
      if (['SO2', 'NOX', 'CO2', 'O2', 'GAS'].includes(system.systemTypeCode)) {
        const params = getSystemParameters(system)
        requirements.push({
          id: `qa-cga-${system.systemId}`,
          testType: 'quarterly_gas_audit',
          parameterCode: params.join('/'),
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
   * Derive emission limits based on programs and monitoring parameters.
   * Includes federal program limits (ARP, CSAPR, MATS) as regulatory thresholds.
   * Actual permit limits would come from facility-specific Title V permits.
   */
  private deriveEmissionLimits(plan: MonitoringPlan, programs: string[]): EmissionLimit[] {
    const limits: EmissionLimit[] = []
    const paramCodes = new Set(plan.methods.map((m) => m.parameterCode))
    const hasNOx = paramCodes.has('NOX')
    const hasSO2 = paramCodes.has('SO2')
    const hasCO2 = paramCodes.has('CO2')
    const hasHg = paramCodes.has('HG')
    const hasHCl = paramCodes.has('HCL')
    const hasPM = paramCodes.has('PM')
    const hasFlow = paramCodes.has('FLOW')

    // Normalize programs for comparison
    const hasARP = programs.some((p) => p === 'ARP' || p === 'Acid Rain')
    const hasCSAPR = programs.some(
      (p) =>
        p === 'CSAPR' || p.startsWith('CS') || p === 'CSNOX' || p === 'CSOSG1' || p === 'CSOSG2'
    )
    const hasMATS = programs.some((p) => p === 'MATS' || p === 'MATSMRP')

    // ARP NOx emission rate limit
    if (hasARP && hasNOx) {
      limits.push({
        id: 'limit-arp-nox-rate',
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

    // CSAPR SO2 allowance tracking
    if (hasCSAPR && hasSO2) {
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

    // CSAPR NOx annual and ozone season allowances
    if (hasCSAPR && hasNOx) {
      limits.push({
        id: 'limit-csapr-nox-annual',
        parameter: 'NOx',
        limitValue: 0,
        units: 'allowances',
        averagingPeriod: 'annual',
        limitType: 'mass',
        regulatoryBasis: '40 CFR 97 Subpart AAAAA',
        applicablePrograms: ['CSAPR'],
        notes: ['Annual NOx allowance tracking'],
      })
      limits.push({
        id: 'limit-csapr-nox-os',
        parameter: 'NOx',
        limitValue: 0,
        units: 'allowances',
        averagingPeriod: 'ozone-season',
        limitType: 'mass',
        regulatoryBasis: '40 CFR 97 Subpart GGGGG',
        applicablePrograms: ['CSAPR'],
        notes: ['Ozone season (May-Sept) NOx allowance tracking'],
      })
    }

    // MATS Mercury limit
    if (hasMATS && hasHg) {
      limits.push({
        id: 'limit-mats-hg',
        parameter: 'Hg',
        limitValue: 1.2,
        units: 'lb/TBtu',
        averagingPeriod: '30-day rolling',
        limitType: 'emission_rate',
        regulatoryBasis: '40 CFR 63.9991 Table 1',
        applicablePrograms: ['MATS'],
        notes: ['Coal-fired EGU limit - 1.2 lb/TBtu existing, 0.03 lb/GWh new'],
      })
    }

    // MATS HCl limit
    if (hasMATS && hasHCl) {
      limits.push({
        id: 'limit-mats-hcl',
        parameter: 'HCl',
        limitValue: 0.002,
        units: 'lb/MMBtu',
        averagingPeriod: '30-day rolling',
        limitType: 'emission_rate',
        regulatoryBasis: '40 CFR 63.9991 Table 1',
        applicablePrograms: ['MATS'],
        notes: ['Coal-fired EGU limit - 0.002 lb/MMBtu or SO2 surrogate option'],
      })
    }

    // MATS PM/filterable PM limit
    if (hasMATS && hasPM) {
      limits.push({
        id: 'limit-mats-pm',
        parameter: 'PM',
        limitValue: 0.03,
        units: 'lb/MMBtu',
        averagingPeriod: '30-day rolling',
        limitType: 'emission_rate',
        regulatoryBasis: '40 CFR 63.9991 Table 1',
        applicablePrograms: ['MATS'],
        notes: ['Filterable PM limit for coal-fired EGUs'],
      })
    }

    // Standard Part 75 data quality requirement
    if (hasFlow || hasSO2 || hasNOx || hasCO2) {
      limits.push({
        id: 'limit-part75-data-availability',
        parameter: 'All CEM',
        limitValue: 90,
        units: '% data availability',
        averagingPeriod: 'quarterly',
        limitType: 'data_quality',
        regulatoryBasis: '40 CFR 75.32',
        applicablePrograms: programs,
        notes: ['Minimum 90% quality-assured data per quarter to avoid RATA frequency increase'],
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
  // COMPLIANCE REPORT GENERATION
  // ============================================================================

  /**
   * Generate a comprehensive compliance report for user review.
   * This report includes all requirements with citations and suggested follow-up questions.
   *
   * @param orisCode - The facility's ORIS code
   * @param apiKey - Optional API key for CAMD/ECMPS API calls
   * @returns Structured compliance report for UI display and Q&A
   */
  async generateComplianceReport(orisCode: number, apiKey?: string): Promise<ComplianceReport> {
    // Use provided API key or fall back to default client
    const ecmpsClientToUse = apiKey !== undefined ? new ECMPSClient(apiKey) : this.ecmps

    // First get the full DAHSRequirements analysis
    const requirements = await this.analyzeMonitoringPlanWithClient(orisCode, ecmpsClientToUse)

    // Build citations index as we build the report
    const citations: ComplianceCitation[] = []
    let citationCounter = 1

    const addCitation = (
      cfr: string,
      title: string,
      description: string,
      source: ComplianceCitation['source'] = 'eCFR'
    ): string => {
      const id = `cite-${citationCounter++}`
      citations.push({
        id,
        cfr,
        title,
        description,
        source,
      })
      return id
    }

    // Build applicable regulations section
    const applicableRegulations = this.buildApplicableRegulations(
      requirements.programs,
      addCitation
    )

    // Build monitoring by parameter
    const monitoringByParameter = this.buildMonitoringByParameter(
      requirements.monitoringRequirements,
      addCitation
    )

    // Build QA test matrix
    const qaTestMatrix = this.buildQATestMatrix(requirements.qaRequirements, addCitation)

    // Build calculations section
    const calculations = this.buildCalculations(requirements.calculationRequirements, addCitation)

    // Build reporting schedule
    const reportingSchedule = this.buildReportingSchedule(
      requirements.reportingRequirements,
      addCitation
    )

    // Build emission limits
    const limits = this.buildEmissionLimits(requirements.emissionLimits, addCitation)

    // Build missing data procedures
    const missingDataProcedures = this.buildMissingDataProcedures(
      requirements.substitutionRequirements,
      addCitation
    )

    // Build recordkeeping section
    const recordkeeping = this.buildRecordkeeping(
      requirements.recordkeepingRequirements,
      addCitation
    )

    // Build summary
    const summary = this.buildComplianceSummary(
      requirements,
      applicableRegulations.length,
      monitoringByParameter.length,
      qaTestMatrix.length,
      calculations.length,
      reportingSchedule.length,
      limits.length
    )

    // Generate suggested follow-up questions
    const suggestedQuestions = this.generateSuggestedQuestions(requirements)

    return {
      facilityId: requirements.facilityId,
      facilityName: requirements.facilityName,
      orisCode: requirements.orisCode,
      generatedAt: new Date().toISOString(),
      summary,
      applicableRegulations,
      monitoringByParameter,
      qaTestMatrix,
      calculations,
      reportingSchedule,
      limits,
      missingDataProcedures,
      recordkeeping,
      citations,
      suggestedQuestions,
    }
  }

  /**
   * Build applicable regulations section with program details
   */
  private buildApplicableRegulations(
    programs: string[],
    addCitation: (cfr: string, title: string, desc: string) => string
  ): ComplianceReport['applicableRegulations'] {
    const regulations: ComplianceReport['applicableRegulations'] = []

    for (const program of programs) {
      if (program === 'ARP' || program === 'Acid Rain') {
        regulations.push({
          id: 'reg-arp',
          cfr: '40 CFR 75',
          title: 'Acid Rain Program',
          program: 'ARP',
          applicabilityReason: 'Fossil fuel-fired unit >25 MW capacity',
          keyRequirements: [
            'Continuous monitoring of SO2, NOx, CO2, and stack flow',
            'Daily calibration error tests',
            'Quarterly linearity checks',
            'Semi-annual RATA testing',
            'Quarterly electronic reporting',
          ],
          citationId: addCitation(
            '40 CFR 75.1',
            'Acid Rain Program Monitoring Requirements',
            'General provisions for continuous emissions monitoring'
          ),
        })
      }

      if (
        program === 'CSAPR' ||
        program === 'CSOSG1' ||
        program === 'CSOSG2' ||
        program === 'CSNOX'
      ) {
        regulations.push({
          id: 'reg-csapr',
          cfr: '40 CFR 97 Subpart CCCCC',
          title: 'Cross-State Air Pollution Rule',
          program: 'CSAPR',
          applicabilityReason: 'Located in state subject to CSAPR trading programs',
          keyRequirements: [
            'SO2 and/or NOx allowance trading compliance',
            'Part 75 monitoring requirements apply',
            'Quarterly reporting to CAMD',
            'Emission limit tracking for allowance allocation',
          ],
          citationId: addCitation(
            '40 CFR 97.506',
            'CSAPR NOx Ozone Season Group 1 Program',
            'Requirements for monitoring, reporting, and recordkeeping'
          ),
        })
      }

      if (program === 'MATS' || program === 'MATSMRP') {
        regulations.push({
          id: 'reg-mats',
          cfr: '40 CFR 63 Subpart UUUUU',
          title: 'Mercury and Air Toxics Standards',
          program: 'MATS',
          applicabilityReason: 'Coal or oil-fired electric generating unit',
          keyRequirements: [
            'Mercury (Hg) emissions monitoring',
            'Hydrogen chloride (HCl) emissions monitoring',
            'PM or filterable PM monitoring option',
            'SO2 or HCl surrogate monitoring option',
            'Initial performance testing',
            'Work practice standards for startup/shutdown',
          ],
          citationId: addCitation(
            '40 CFR 63.10000',
            'MATS Applicability and Standards',
            'Mercury, HCl, and PM emission standards for coal-fired EGUs'
          ),
        })
      }

      if (program === 'NBP' || program === 'OTC') {
        regulations.push({
          id: 'reg-nbp',
          cfr: '40 CFR 97 Subpart B',
          title: 'NOx Budget Trading Program',
          program: 'NBP',
          applicabilityReason: 'NOx SIP Call affected state',
          keyRequirements: [
            'Ozone season NOx monitoring',
            'Part 75 monitoring requirements',
            'NOx allowance tracking',
          ],
          citationId: addCitation(
            '40 CFR 97.30',
            'NOx Budget Trading Program',
            'NOx monitoring and reporting requirements'
          ),
        })
      }
    }

    // Always include Part 75 if any program requires it
    if (programs.length > 0) {
      const hasPart75 = regulations.some((r) => r.cfr.includes('75'))
      if (!hasPart75) {
        regulations.push({
          id: 'reg-part75',
          cfr: '40 CFR 75',
          title: 'Continuous Emissions Monitoring',
          program: 'Part 75',
          applicabilityReason: 'Required for all ARP/CSAPR affected sources',
          keyRequirements: [
            'CEMS certification and quality assurance',
            'Data reduction and validation procedures',
            'Missing data substitution requirements',
            'Electronic quarterly reporting',
          ],
          citationId: addCitation(
            '40 CFR 75.10',
            'General Operating Requirements',
            'CEMS operating requirements for affected sources'
          ),
        })
      }
    }

    return regulations
  }

  /**
   * Build monitoring requirements grouped by parameter
   */
  private buildMonitoringByParameter(
    requirements: MonitoringRequirement[],
    addCitation: (cfr: string, title: string, desc: string) => string
  ): MonitoringParameterGroup[] {
    const grouped = new Map<string, MonitoringMethodItem[]>()

    for (const req of requirements) {
      const methods = grouped.get(req.parameter) ?? []
      methods.push({
        methodCode: req.methodCode,
        description: this.getMethodDescription(req.methodCode),
        frequency: req.frequency,
        dataQualityRequirements: this.getDataQualityReq(req.methodCode),
        regulatoryBasis: req.regulatoryBasis,
        citationId: addCitation(
          req.regulatoryBasis,
          `${req.parameter} Monitoring`,
          `${req.methodCode} monitoring requirements for ${req.parameter}`
        ),
      })
      grouped.set(req.parameter, methods)
    }

    return Array.from(grouped.entries()).map(([parameter, methods]) => ({
      parameter,
      displayName: this.getParameterDisplayName(parameter),
      methods,
    }))
  }

  /**
   * Build QA test matrix with performance specs
   */
  private buildQATestMatrix(
    requirements: QARequirement[],
    addCitation: (cfr: string, title: string, desc: string) => string
  ): QATestMatrixItem[] {
    return requirements.map((req) => {
      const item: QATestMatrixItem = {
        testType: this.getTestTypeDisplayName(req.testType),
        testCode: req.testType.toUpperCase().replace(/_/g, ''),
        applicableParameters: [req.parameterCode],
        frequency: req.frequency,
        passCriteria: req.toleranceCriteria,
        failureConsequence: req.consequenceOfFailure,
        regulatoryBasis: req.regulatoryBasis,
        citationId: addCitation(
          req.regulatoryBasis,
          `${this.getTestTypeDisplayName(req.testType)} Requirements`,
          req.toleranceCriteria
        ),
      }
      const gracePeriod = this.getGracePeriod(req.testType)
      if (gracePeriod) item.gracePeroid = gracePeriod
      const perfSpec = this.getPerformanceSpec(req.testType, req.parameterCode)
      if (perfSpec) item.performanceSpec = perfSpec
      return item
    })
  }

  /**
   * Build calculations section with formula details
   * Includes actual equations from FORMULA_CODES with constants
   */
  private buildCalculations(
    requirements: CalculationRequirement[],
    addCitation: (cfr: string, title: string, desc: string) => string
  ): CalculationItem[] {
    return requirements.map((req) => {
      // Try to find the formula code from FORMULA_TO_CFR
      const foundFormulaCode = this.findFormulaCode(req.name, req.outputParameter)

      // Get the actual equation from FORMULA_CODES if we have a formula code
      let actualEquation = req.formula
      let dahsImplementation: string | undefined
      if (foundFormulaCode && FORMULA_CODES[foundFormulaCode]) {
        const formulaInfo = FORMULA_CODES[foundFormulaCode]
        // Use the actual equation with constants
        actualEquation = formulaInfo.equation
        dahsImplementation = formulaInfo.dahsCalculation
      }

      const item: CalculationItem = {
        name: req.name,
        description: req.notes.join('; ') || `Calculate ${req.outputParameter}`,
        inputParameters: req.inputParameters,
        outputParameter: req.outputParameter,
        outputUnits: req.outputUnits,
        frequency: req.frequency,
        regulatoryBasis: req.regulatoryBasis,
        citationId: addCitation(
          req.regulatoryBasis,
          req.name,
          actualEquation ?? `${req.outputParameter} calculation`
        ),
      }
      // Include actual equation with constants
      if (actualEquation) item.formula = actualEquation
      // Add DAHS implementation notes if available
      if (dahsImplementation) {
        item.description = `${item.description}. DAHS Implementation: ${dahsImplementation}`
      }
      if (foundFormulaCode) item.formulaCode = foundFormulaCode
      const appendix = this.getCalculationAppendix(req.regulatoryBasis)
      if (appendix) item.appendix = appendix
      return item
    })
  }

  /**
   * Build reporting schedule
   */
  private buildReportingSchedule(
    requirements: ReportingRequirement[],
    addCitation: (cfr: string, title: string, desc: string) => string
  ): ReportingScheduleItem[] {
    return requirements.map((req) => ({
      reportType: req.reportType,
      description: req.notes.join('; ') || req.reportType,
      frequency: req.frequency,
      deadline: req.submissionDeadline,
      dataElements: req.dataElements,
      submissionMethod: this.getSubmissionMethod(req.reportType),
      regulatoryBasis: req.regulatoryBasis,
      citationId: addCitation(
        req.regulatoryBasis,
        req.reportType,
        `${req.frequency} reporting requirement`
      ),
    }))
  }

  /**
   * Build emission limits with consequences
   */
  private buildEmissionLimits(
    limits: EmissionLimit[],
    addCitation: (cfr: string, title: string, desc: string) => string
  ): EmissionLimitItem[] {
    return limits.map((limit) => ({
      parameter: limit.parameter,
      limitValue: `${limit.limitValue} ${limit.units}`,
      averagingPeriod: limit.averagingPeriod,
      limitType: limit.limitType,
      program: limit.applicablePrograms.join(', '),
      exceedanceConsequence: this.getExceedanceConsequence(limit),
      regulatoryBasis: limit.regulatoryBasis,
      citationId: addCitation(
        limit.regulatoryBasis,
        `${limit.parameter} Emission Limit`,
        `${limit.limitValue} ${limit.units} ${limit.averagingPeriod}`
      ),
    }))
  }

  /**
   * Build missing data substitution procedures
   */
  private buildMissingDataProcedures(
    requirements: SubstitutionRequirement[],
    addCitation: (cfr: string, title: string, desc: string) => string
  ): MissingDataItem[] {
    const items: MissingDataItem[] = []

    for (const req of requirements) {
      // Add standard missing data scenarios
      items.push({
        parameter: req.parameter,
        scenario: 'Less than 24 hours of missing data',
        substitutionMethod: req.method,
        substitutionValue: '90th percentile of quality-assured hours',
        regulatoryBasis: req.regulatoryBasis,
        citationId: addCitation(
          req.regulatoryBasis,
          `${req.parameter} Missing Data`,
          'Standard missing data substitution procedure'
        ),
      })
    }

    return items
  }

  /**
   * Build recordkeeping section
   */
  private buildRecordkeeping(
    requirements: RecordkeepingRequirement[],
    addCitation: (cfr: string, title: string, desc: string) => string
  ): RecordkeepingItem[] {
    return requirements.map((req) => ({
      category: req.category,
      requirements: [req.description, ...req.notes],
      retentionPeriod: req.retentionPeriod,
      format: 'Electronic or paper',
      regulatoryBasis: req.regulatoryBasis,
      citationId: addCitation(
        req.regulatoryBasis,
        `${req.category} Recordkeeping`,
        `Retain for ${req.retentionPeriod}`
      ),
    }))
  }

  /**
   * Build executive summary
   */
  private buildComplianceSummary(
    requirements: DAHSRequirements,
    regCount: number,
    monCount: number,
    qaCount: number,
    calcCount: number,
    reportCount: number,
    limitCount: number
  ): ComplianceReportSummary {
    const highlights: string[] = []

    // Add key highlights based on requirements
    if (requirements.programs.includes('ARP')) {
      highlights.push(
        'Subject to Acid Rain Program (ARP) - requires continuous SO2 and NOx monitoring'
      )
    }
    if (
      requirements.programs.some(
        (p) => p.includes('CSAPR') || p.includes('CSOSG') || p.includes('CSNOX')
      )
    ) {
      highlights.push('Subject to CSAPR trading program - allowance tracking required')
    }
    if (requirements.programs.includes('MATS') || requirements.programs.includes('MATSMRP')) {
      highlights.push('Subject to MATS - mercury and HCl monitoring required')
    }
    if (requirements.qaRequirements.some((q) => q.testType === 'rata')) {
      highlights.push('Semi-annual RATA testing required for all CEMS')
    }
    if (requirements.calculationRequirements.some((c) => c.calculationType === 'heat_input')) {
      highlights.push('Heat input calculation required using Appendix F formulas')
    }

    return {
      totalRegulations: regCount,
      totalMonitoringParameters: monCount,
      totalQATests: qaCount,
      totalCalculations: calcCount,
      totalReports: reportCount,
      totalLimits: limitCount,
      programs: requirements.programs,
      highlights,
    }
  }

  /**
   * Generate suggested follow-up questions based on requirements
   */
  private generateSuggestedQuestions(requirements: DAHSRequirements): string[] {
    const questions: string[] = []

    // Add questions based on what's in the requirements
    if (requirements.qaRequirements.length > 0) {
      questions.push('What happens if a daily calibration fails?')
      questions.push('How often must I perform RATA testing?')
    }

    if (requirements.substitutionRequirements.length > 0) {
      questions.push('What substitute data procedure applies if my CEMS is down for 3 days?')
    }

    if (requirements.calculationRequirements.some((c) => c.name.includes('Heat Input'))) {
      questions.push('What F-factors should I use for heat input calculations?')
    }

    if (requirements.programs.some((p) => p.includes('CSAPR'))) {
      questions.push('How do CSAPR allowances work for my unit?')
    }

    if (requirements.emissionLimits.length > 0) {
      questions.push('What are the consequences of exceeding an emission limit?')
    }

    questions.push('What monitoring plan changes require recertification?')
    questions.push('What records must I retain and for how long?')

    return questions.slice(0, 8) // Limit to 8 questions
  }

  // Helper methods for compliance report building
  private getMethodDescription(code: string): string {
    const descriptions: Record<string, string> = {
      CEM: 'Continuous Emissions Monitoring System',
      CALC: 'Calculated from other parameters',
      AD: 'Appendix D fuel flow methodology',
      LME: 'Low Mass Emissions methodology',
      LTFF: 'Long-term fuel flow',
    }
    return descriptions[code] ?? code
  }

  private getDataQualityReq(methodCode: string): string {
    if (methodCode === 'CEM') {
      return '≥90% data availability per quarter, daily calibration within ±2.5% of span'
    }
    if (methodCode === 'AD') {
      return 'Fuel flowmeter accuracy per Appendix D section 2'
    }
    return 'Per applicable performance specification'
  }

  private getTestTypeDisplayName(testType: string): string {
    const names: Record<string, string> = {
      daily_calibration: 'Daily Calibration Error Test',
      linearity: 'Quarterly Linearity Check',
      rata: 'Relative Accuracy Test Audit (RATA)',
      cga: 'Cylinder Gas Audit',
      leak_check: 'Leak Check',
      beam_intensity: 'Beam Intensity Check',
      flow_to_load: 'Flow-to-Load Test',
      quarterly_gas_audit: 'Quarterly Gas Audit',
    }
    return names[testType] ?? testType
  }

  private getGracePeriod(testType: string): string | undefined {
    const periods: Record<string, string> = {
      daily_calibration: '26 clock hours to complete corrective action',
      rata: '720 unit operating hours grace period',
      linearity: '168 unit operating hours',
    }
    return periods[testType]
  }

  private getPerformanceSpec(testType: string, parameterCode: string): string | undefined {
    if (testType === 'rata') {
      const specs: Record<string, string> = {
        SO2: 'PS-2',
        NOX: 'PS-2',
        CO2: 'PS-3',
        O2: 'PS-3',
        FLOW: 'PS-6',
        HG: 'PS-12A',
        HCL: 'PS-18',
      }
      return specs[parameterCode]
    }
    return undefined
  }

  private findFormulaCode(name: string, outputParam: string): string | undefined {
    // Try to match based on output parameter and name
    for (const [code, info] of Object.entries(FORMULA_TO_CFR)) {
      if (
        info.parameters.includes(outputParam) ||
        name.toLowerCase().includes(info.description.toLowerCase().slice(0, 20))
      ) {
        return code
      }
    }
    return undefined
  }

  private getCalculationAppendix(basis: string): string | undefined {
    if (basis.includes('Appendix D')) return 'Appendix D'
    if (basis.includes('Appendix F')) return 'Appendix F'
    if (basis.includes('Appendix G')) return 'Appendix G'
    return undefined
  }

  private getSubmissionMethod(reportType: string): string {
    if (reportType.includes('EDR') || reportType.includes('Quarterly')) {
      return 'ECMPS Client Tool'
    }
    if (reportType.includes('Annual')) {
      return 'ECMPS Client Tool / EPA CDX'
    }
    return 'EPA CDX / State portal'
  }

  private getExceedanceConsequence(limit: EmissionLimit): string {
    if (limit.limitType === 'emission_rate') {
      return 'Excess emissions reported, potential allowance shortfall'
    }
    if (limit.limitType === 'opacity') {
      return 'Visible emission violation, enforcement action possible'
    }
    return 'Compliance deviation, recordkeeping and reporting required'
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
    // IMPORTANT: Opacity (OP) is regulated under Part 60, NOT Part 75!
    // Part 75.10 is for NOx monitoring - opacity citations depend on NSPS subpart
    if (method.parameterCode === 'OP') {
      // Default to Part 60 Appendix A, Method 9 - specific subpart citation
      // requires knowing the applicable NSPS subpart (Da: 60.42Da, Db: 60.43b, etc.)
      return '40 CFR Part 60 (see applicable NSPS subpart for opacity limit)'
    }

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
export type { RegsBotContext, RegsBotInput, RegsBotResponse } from '../../types/orchestration'
export { ECFRClient, ecfrClient } from './ecfr-client'
export { ECMPSClient, ecmpsClient } from './ecmps-client'

// Re-export Part 60 and Part 63 knowledge bases
export * from './epa-codes'
export * from './part60-knowledge'
export * from './part63-knowledge'
