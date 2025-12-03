/**
 * RequirementsBotService - Gap Analysis and DAHS Proposal Generation
 *
 * This service analyzes permit obligations against DAHS capabilities
 * to determine what's supported, what needs configuration, and what
 * requires development work.
 */

import type {
  AlarmConfiguration,
  CalculationConfiguration,
  CalculationType,
  DAHSCapability,
  DAHSConfiguration,
  DAHSProfile,
  DAHSProposalData,
  DevelopmentItem,
  GapAnalysis,
  GapStatus,
  ObligationType,
  PermitObligation,
  QAWorkflowConfiguration,
  ReportConfiguration,
  TagConfiguration,
} from '../../types/orchestration'

export class RequirementsBotService {
  private profile: DAHSProfile

  constructor(profile: DAHSProfile) {
    this.profile = profile
  }

  /**
   * Analyze a single obligation against DAHS capabilities
   */
  analyzeObligation(obligation: PermitObligation): GapAnalysis {
    const matchingCapability = this.findMatchingCapability(
      obligation.obligationType,
      obligation.parameters ?? []
    )

    // Check for low confidence requiring review
    if (obligation.confidence < 0.6 || obligation.obligationType === 'other') {
      return this.createGapAnalysis(obligation, 'needs-review', undefined, {
        gapDescription: 'Obligation requires human review due to ambiguity',
        notes: [
          'Low confidence or ambiguous obligation type',
          'Manual review recommended before processing',
        ],
      })
    }

    // Manual processes stay manual
    if (obligation.obligationType === 'notification') {
      return this.createGapAnalysis(obligation, 'manual-process', undefined, {
        gapDescription: 'Notification obligations require human notification',
        notes: [
          'DAHS can generate alerts but human notification is required',
          'Consider setting up alarm triggers for awareness',
        ],
      })
    }

    // Check parameter support
    const unsupportedParams = this.findUnsupportedParameters(obligation.parameters ?? [])
    if (unsupportedParams.length > 0) {
      return this.createGapAnalysis(obligation, 'not-supported', undefined, {
        gapDescription: `Unsupported parameter(s): ${unsupportedParams.join(', ')}`,
        recommendedSolution: `Add support for ${unsupportedParams.join(', ')} monitoring`,
        developmentEffort: this.estimateEffort(unsupportedParams.length),
        notes: [
          `Parameter(s) not in DAHS profile: ${unsupportedParams.join(', ')}`,
          'Development required to add parameter support',
        ],
      })
    }

    // Check for partial support FIRST (custom format reporting, etc.)
    // This needs to be before capability matching to catch custom requirements
    if (this.hasPartialSupport(obligation)) {
      return this.createGapAnalysis(obligation, 'partial-support', undefined, {
        gapDescription: 'DAHS has similar capability but needs enhancement',
        recommendedSolution: 'Extend existing capability to meet requirement',
        developmentEffort: this.estimatePartialEffort(obligation),
        notes: ['Base capability exists', 'Custom modifications needed to fully support'],
      })
    }

    // Check if capability exists
    if (matchingCapability !== undefined) {
      // Check if it needs configuration
      if (this.needsConfiguration(obligation, matchingCapability)) {
        return this.createGapAnalysis(obligation, 'config-required', matchingCapability.id, {
          recommendedSolution: this.generateConfigurationAdvice(obligation, matchingCapability),
          developmentEffort: 'configuration',
          notes: [
            'Capability exists but requires configuration',
            `Configure ${matchingCapability.name} for specific requirements`,
          ],
        })
      }

      // Fully supported
      return this.createGapAnalysis(obligation, 'fully-supported', matchingCapability.id, {
        developmentEffort: 'none',
        notes: ['Fully supported by existing DAHS capability'],
      })
    }

    // Not supported
    return this.createGapAnalysis(obligation, 'not-supported', undefined, {
      gapDescription: `No matching capability for ${obligation.obligationType}`,
      recommendedSolution: `Develop new ${obligation.obligationType} capability`,
      developmentEffort: 'moderate',
      notes: ['No existing capability matches this obligation'],
    })
  }

  /**
   * Analyze multiple obligations
   */
  analyzeAllObligations(obligations: PermitObligation[]): GapAnalysis[] {
    return obligations.map((obligation) => this.analyzeObligation(obligation))
  }

  /**
   * Find a DAHS capability matching the obligation type and parameters
   */
  findMatchingCapability(
    obligationType: ObligationType,
    parameters: string[]
  ): DAHSCapability | undefined {
    const categoryMap: Record<ObligationType, DAHSCapability['category'][]> = {
      monitoring: ['monitoring'],
      calculation: ['calculation'],
      reporting: ['reporting'],
      recordkeeping: ['reporting'],
      limit: ['monitoring', 'alarm'],
      calibration: ['qa'],
      notification: [],
      testing: ['qa'],
      other: [],
    }

    const relevantCategories = categoryMap[obligationType]
    const normalizedParams = parameters.map((p) => p.toLowerCase())

    return this.profile.capabilities.find((cap) => {
      if (!relevantCategories.includes(cap.category)) {
        return false
      }

      // If capability has parameters, check for overlap
      if (cap.parameters !== undefined && cap.parameters.length > 0) {
        const capParams = cap.parameters.map((p) => p.toLowerCase())
        return normalizedParams.some((p) => capParams.includes(p))
      }

      // Capability without specific parameters matches any
      return true
    })
  }

  /**
   * Check if a parameter is supported by the DAHS profile
   */
  isParameterSupported(parameter: string): boolean {
    const normalizedParam = parameter.toLowerCase()
    return this.profile.supportedParameters.some((p) => p.toLowerCase() === normalizedParam)
  }

  /**
   * Check if a calculation type is supported
   */
  isCalculationSupported(calcType: CalculationType): boolean {
    return this.profile.supportedCalculations.includes(calcType)
  }

  /**
   * Generate a development item for a gap
   */
  generateDevelopmentItem(gapAnalysis: GapAnalysis): DevelopmentItem | undefined {
    // No dev item needed for fully supported or config-only
    if (gapAnalysis.status === 'fully-supported' || gapAnalysis.status === 'config-required') {
      return undefined
    }

    // No dev item for manual processes
    if (gapAnalysis.status === 'manual-process') {
      return undefined
    }

    const obligation = gapAnalysis.obligation

    return {
      id: `dev-${obligation.id}`,
      title: this.generateDevItemTitle(gapAnalysis),
      description: gapAnalysis.gapDescription ?? 'Development required',
      obligationLinks: [obligation.id],
      effort: this.mapDevelopmentEffort(gapAnalysis.developmentEffort),
      priority: this.calculatePriority(gapAnalysis),
      notes: gapAnalysis.notes,
    }
  }

  /**
   * Generate tag configuration for a monitoring obligation
   */
  generateTagConfiguration(obligation: PermitObligation): TagConfiguration | undefined {
    if (obligation.obligationType !== 'monitoring') {
      return undefined
    }

    const parameter = obligation.parameters?.[0]
    if (parameter === undefined) {
      return undefined
    }

    return {
      tagName: `${parameter}_MONITOR`,
      parameter,
      unit: this.inferUnit(parameter),
      source: 'CEMS',
      frequency: obligation.frequency ?? 'hourly',
      obligationLinks: [obligation.id],
    }
  }

  /**
   * Generate calculation configuration for a calculation obligation
   */
  generateCalculationConfiguration(
    obligation: PermitObligation
  ): CalculationConfiguration | undefined {
    if (obligation.obligationType !== 'calculation' && obligation.obligationType !== 'limit') {
      return undefined
    }

    const calcType = this.inferCalculationType(obligation)
    const inputs = obligation.parameters ?? []

    return {
      name: `${inputs.join('_')}_${calcType}`.toUpperCase(),
      type: calcType,
      inputs,
      schedule: obligation.frequency ?? 'hourly',
      obligationLinks: [obligation.id],
    }
  }

  /**
   * Generate a complete DAHS proposal for a permit
   */
  generateDAHSProposal(permitId: string, obligations: PermitObligation[]): DAHSProposalData {
    const gapAnalysis = this.analyzeAllObligations(obligations)
    const developmentItems = gapAnalysis
      .map((gap) => this.generateDevelopmentItem(gap))
      .filter((item): item is DevelopmentItem => item !== undefined)

    const configuration = this.generateConfiguration(obligations, gapAnalysis)
    const summary = this.calculateSummary(gapAnalysis)

    return {
      permitId,
      dahsProfileId: this.profile.id,
      obligations,
      gapAnalysis,
      proposedConfiguration: configuration,
      developmentItems,
      summary,
    }
  }

  /**
   * Calculate summary statistics for gap analysis
   */
  calculateSummary(gapAnalysis: GapAnalysis[]): DAHSProposalData['summary'] {
    return {
      fullySupported: gapAnalysis.filter((g) => g.status === 'fully-supported').length,
      configRequired: gapAnalysis.filter((g) => g.status === 'config-required').length,
      partialSupport: gapAnalysis.filter((g) => g.status === 'partial-support').length,
      notSupported: gapAnalysis.filter((g) => g.status === 'not-supported').length,
      manualProcess: gapAnalysis.filter((g) => g.status === 'manual-process').length,
      needsReview: gapAnalysis.filter((g) => g.status === 'needs-review').length,
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private createGapAnalysis(
    obligation: PermitObligation,
    status: GapStatus,
    dahsCapabilityId: string | undefined,
    options: Partial<GapAnalysis>
  ): GapAnalysis {
    const result: GapAnalysis = {
      obligationId: obligation.id,
      obligation,
      status,
      notes: options.notes ?? [],
    }

    if (dahsCapabilityId !== undefined) {
      result.dahsCapabilityId = dahsCapabilityId
    }
    if (options.gapDescription !== undefined) {
      result.gapDescription = options.gapDescription
    }
    if (options.recommendedSolution !== undefined) {
      result.recommendedSolution = options.recommendedSolution
    }
    if (options.developmentEffort !== undefined) {
      result.developmentEffort = options.developmentEffort
    }

    return result
  }

  private findUnsupportedParameters(parameters: string[]): string[] {
    return parameters.filter((p) => !this.isParameterSupported(p))
  }

  private needsConfiguration(obligation: PermitObligation, _capability: DAHSCapability): boolean {
    // If obligation has specific frequency, thresholds, or custom requirements
    // it needs configuration
    const hasSpecificFrequency =
      obligation.frequency !== undefined && obligation.frequency !== 'hourly'
    const hasThresholds =
      obligation.thresholds !== undefined && Object.keys(obligation.thresholds).length > 0
    const hasRollingText =
      obligation.originalText.toLowerCase().includes('rolling') ||
      obligation.summary.toLowerCase().includes('rolling')

    return hasSpecificFrequency || hasThresholds || hasRollingText
  }

  private generateConfigurationAdvice(
    obligation: PermitObligation,
    capability: DAHSCapability
  ): string {
    const parts: string[] = [`Configure ${capability.name}`]

    if (obligation.frequency !== undefined) {
      parts.push(`with ${obligation.frequency} frequency`)
    }

    if (obligation.parameters !== undefined && obligation.parameters.length > 0) {
      parts.push(`for ${obligation.parameters.join(', ')}`)
    }

    return parts.join(' ')
  }

  private hasPartialSupport(obligation: PermitObligation): boolean {
    // Check if there's a similar capability category
    const hasReportingBase =
      obligation.obligationType === 'reporting' && this.profile.supportedReports.length > 0

    const hasCustomKeyword =
      obligation.originalText.toLowerCase().includes('custom') ||
      obligation.originalText.toLowerCase().includes('specific format') ||
      obligation.summary.toLowerCase().includes('custom')

    return hasReportingBase && hasCustomKeyword
  }

  private estimateEffort(unsupportedCount: number): 'minor' | 'moderate' | 'major' {
    if (unsupportedCount === 1) return 'minor'
    if (unsupportedCount <= 3) return 'moderate'
    return 'major'
  }

  private estimatePartialEffort(_obligation: PermitObligation): 'minor' | 'moderate' {
    // Partial support typically needs minor to moderate work
    return 'minor'
  }

  private mapDevelopmentEffort(
    effort: GapAnalysis['developmentEffort']
  ): DevelopmentItem['effort'] {
    switch (effort) {
      case 'minor':
        return 'minor'
      case 'moderate':
        return 'moderate'
      case 'major':
        return 'major'
      case 'configuration':
        return 'minor'
      case 'none':
      default:
        return 'minor'
    }
  }

  private calculatePriority(gapAnalysis: GapAnalysis): DevelopmentItem['priority'] {
    const obligation = gapAnalysis.obligation

    // Critical: limits and calculations are typically compliance-critical
    if (obligation.obligationType === 'limit' || obligation.obligationType === 'calculation') {
      return 'critical'
    }

    // High: monitoring and reporting
    if (obligation.obligationType === 'monitoring' || obligation.obligationType === 'reporting') {
      return 'high'
    }

    // Medium: QA activities
    if (obligation.obligationType === 'calibration' || obligation.obligationType === 'testing') {
      return 'medium'
    }

    // Low: recordkeeping and other
    return 'low'
  }

  private generateDevItemTitle(gapAnalysis: GapAnalysis): string {
    const obligation = gapAnalysis.obligation
    const params = obligation.parameters ?? []

    if (params.length > 0) {
      const paramNames = params.map((p) => this.getParameterDisplayName(p)).join(', ')
      return `Add ${paramNames} ${obligation.obligationType} capability`
    }

    return `Implement ${obligation.obligationType} for ${obligation.summary.slice(0, 50)}`
  }

  private getParameterDisplayName(param: string): string {
    const displayNames: Record<string, string> = {
      Hg: 'Mercury',
      'PM2.5': 'Fine Particulate',
      VOC: 'VOC',
      SO2: 'SO2',
      NOx: 'NOx',
      CO: 'CO',
    }
    return displayNames[param] ?? param
  }

  private inferUnit(parameter: string): string {
    const units: Record<string, string> = {
      SO2: 'ppm',
      NOx: 'ppm',
      CO: 'ppm',
      O2: '%',
      Flow: 'scfm',
      Temperature: '°F',
      Hg: 'µg/m³',
    }
    return units[parameter] ?? 'units'
  }

  private inferCalculationType(obligation: PermitObligation): CalculationType {
    const text = `${obligation.originalText} ${obligation.summary}`.toLowerCase()

    if (text.includes('rolling')) return 'rolling_average'
    if (text.includes('daily')) return 'daily_average'
    if (text.includes('block')) return 'block_average'
    if (text.includes('heat input')) return 'heat_input'
    if (text.includes('emission rate')) return 'emission_rate'
    if (text.includes('mass')) return 'mass_emission'

    return 'hourly_average'
  }

  private generateConfiguration(
    obligations: PermitObligation[],
    gapAnalysis: GapAnalysis[]
  ): DAHSConfiguration {
    const supportedObligations = obligations.filter((obl) => {
      const gap = gapAnalysis.find((g) => g.obligationId === obl.id)
      return gap?.status === 'fully-supported' || gap?.status === 'config-required'
    })

    const tags: TagConfiguration[] = []
    const calculations: CalculationConfiguration[] = []
    const alarms: AlarmConfiguration[] = []
    const reports: ReportConfiguration[] = []
    const qaWorkflows: QAWorkflowConfiguration[] = []

    for (const obligation of supportedObligations) {
      const tagConfig = this.generateTagConfiguration(obligation)
      if (tagConfig !== undefined) {
        tags.push(tagConfig)
      }

      const calcConfig = this.generateCalculationConfiguration(obligation)
      if (calcConfig !== undefined) {
        calculations.push(calcConfig)
      }

      // Add more configuration generators as needed
      if (obligation.obligationType === 'limit' && obligation.thresholds !== undefined) {
        for (const [param, threshold] of Object.entries(obligation.thresholds)) {
          alarms.push({
            name: `${param}_LIMIT_ALARM`,
            condition: 'exceeds',
            threshold,
            action: 'notify',
            obligationLinks: [obligation.id],
          })
        }
      }

      if (obligation.obligationType === 'reporting') {
        reports.push({
          name: `${obligation.id}_REPORT`,
          type: 'quarterly_excess',
          schedule: obligation.frequency ?? 'quarterly',
          parameters: obligation.parameters ?? [],
          obligationLinks: [obligation.id],
        })
      }

      if (obligation.obligationType === 'calibration') {
        qaWorkflows.push({
          name: `${obligation.id}_CALIBRATION`,
          type: 'calibration',
          schedule: obligation.frequency ?? 'daily',
          requirements: [obligation.originalText],
          obligationLinks: [obligation.id],
        })
      }
    }

    return {
      tags,
      calculations,
      alarms,
      reports,
      qaWorkflows,
    }
  }
}

export default RequirementsBotService
