/**
 * ExplainerAgent - Human-Readable Explanations
 *
 * Translates technical regulatory requirements into plain English.
 */

import type {
  ExplainerInput,
  ExplainerOutput,
  ExplanationSection,
} from '../../types/part75-orchestrator'

export class ExplainerAgent {
  /**
   * Generate human-readable explanation
   */
  explain(input: ExplainerInput): ExplainerOutput {
    const { subject, item, context, detailLevel = 'detailed' } = input

    switch (subject) {
      case 'monitoring_requirement':
        return this.explainMonitoringRequirement(item, context, detailLevel)
      case 'calculation':
        return this.explainCalculation(item, context, detailLevel)
      case 'qa_requirement':
        return this.explainQARequirement(item, context, detailLevel)
      case 'compliance_rule':
        return this.explainComplianceRule(item, context, detailLevel)
      case 'regulation':
        return this.explainRegulation(item, context, detailLevel)
      case 'overall_requirements':
        return this.explainOverallRequirements(item, context, detailLevel)
      default:
        return this.createDefaultExplanation()
    }
  }

  /**
   * Explain a monitoring requirement
   */
  private explainMonitoringRequirement(
    item: unknown,
    context?: ExplainerInput['context'],
    detailLevel = 'detailed'
  ): ExplainerOutput {
    const req = item as {
      parameter: string
      methodCode: string
      frequency: string
      regulatoryBasis: string
      applicablePrograms: string[]
      notes: string[]
    }

    const facilityName = context?.facilityName ?? 'the facility'
    const locationId =
      context?.locationId !== undefined && context.locationId !== ''
        ? ` at location ${context.locationId}`
        : ''

    const title = `Monitoring Requirement: ${req.parameter}`
    const summary = `${facilityName}${locationId} must continuously monitor ${req.parameter} using ${this.getMethodName(req.methodCode)}. This is required under ${req.applicablePrograms.join(', ')} program(s).`

    const sections: ExplanationSection[] = [
      {
        heading: 'What Must Be Monitored',
        content: `**Parameter:** ${req.parameter}\n\n${this.getParameterDescription(req.parameter)}`,
      },
      {
        heading: 'How to Monitor',
        content: `**Method:** ${this.getMethodName(req.methodCode)}\n\n${this.getMethodDescription(req.methodCode)}\n\n**Frequency:** ${req.frequency}`,
      },
    ]

    if (detailLevel === 'detailed' || detailLevel === 'technical') {
      sections.push({
        heading: 'Regulatory Basis',
        content: `This requirement is mandated by **${req.regulatoryBasis}**.\n\nApplicable Programs: ${req.applicablePrograms.join(', ')}`,
      })
    }

    if (detailLevel === 'technical') {
      sections.push({
        heading: 'Implementation Details',
        content:
          req.notes.length > 0
            ? req.notes.map((n) => `- ${n}`).join('\n')
            : 'See monitoring plan for specific configuration details.',
        subsections: [
          {
            heading: 'Data Collection',
            content:
              'Monitor readings must be collected every minute and averaged hourly per Part 75 requirements.',
          },
          {
            heading: 'Quality Assurance',
            content:
              'Daily calibration checks required. System must pass quarterly linearity tests and periodic RATAs.',
          },
        ],
      })
    }

    const keyTakeaways = [
      `${req.parameter} must be monitored continuously`,
      `Uses ${this.getMethodName(req.methodCode)} technology`,
      `Subject to daily calibration and periodic QA testing`,
      'Hourly data must be recorded and reported quarterly',
    ]

    const citations = [
      {
        reference: req.regulatoryBasis,
        title: 'Monitoring Requirements',
      },
    ]

    return {
      title,
      summary,
      sections,
      keyTakeaways,
      citations,
    }
  }

  /**
   * Explain a calculation
   */
  private explainCalculation(
    item: unknown,
    _context?: ExplainerInput['context'],
    detailLevel = 'detailed'
  ): ExplainerOutput {
    const calc = item as {
      name: string
      calculationType: string
      inputs: string[]
      output: string
      units: string
      frequency: string
      formula?: string
      regulatoryBasis: string
    }

    const title = `Calculation: ${calc.name}`
    const summary = `The DAHS must calculate ${calc.name} ${calc.frequency} using ${this.getCalculationTypeDescription(calc.calculationType)} methodology.`

    const sections: ExplanationSection[] = [
      {
        heading: 'Purpose',
        content: `This calculation determines ${calc.output} in ${calc.units}. ${this.getCalculationPurpose(calc.calculationType)}`,
      },
      {
        heading: 'Inputs Required',
        content: calc.inputs.map((i) => `- ${i}`).join('\n'),
      },
    ]

    if (
      calc.formula !== undefined &&
      calc.formula !== '' &&
      (detailLevel === 'detailed' || detailLevel === 'technical')
    ) {
      const formulaSection: ExplanationSection = {
        heading: 'Formula',
        content: `\`\`\`\n${calc.formula}\n\`\`\``,
      }
      if (detailLevel === 'technical') {
        formulaSection.subsections = [
          {
            heading: 'Formula Explanation',
            content: this.explainFormula(calc.formula),
          },
        ]
      }
      sections.push(formulaSection)
    }

    sections.push({
      heading: 'When to Calculate',
      content: `Frequency: ${calc.frequency}\n\nThis calculation must be performed ${this.getFrequencyDescription(calc.frequency)}.`,
    })

    const keyTakeaways = [
      `Calculates ${calc.output} in ${calc.units}`,
      `Performed ${calc.frequency}`,
      `Required by ${calc.regulatoryBasis}`,
      `Inputs: ${calc.inputs.join(', ')}`,
    ]

    const citations = [
      {
        reference: calc.regulatoryBasis,
        title: 'Calculation Procedures',
      },
    ]

    return {
      title,
      summary,
      sections,
      keyTakeaways,
      citations,
    }
  }

  /**
   * Explain a QA requirement
   */
  private explainQARequirement(
    item: unknown,
    _context?: ExplainerInput['context'],
    detailLevel = 'detailed'
  ): ExplainerOutput {
    const qa = item as {
      testType: string
      parameterCode: string
      frequency: string
      toleranceCriteria: string
      regulatoryBasis: string
      consequenceOfFailure: string
      notes: string[]
    }

    const title = `QA Test: ${this.formatTestType(qa.testType)} for ${qa.parameterCode}`
    const summary = `${qa.parameterCode} monitoring systems must undergo ${this.formatTestType(qa.testType)} ${qa.frequency}. The test must meet a tolerance of ${qa.toleranceCriteria}.`

    const sections: ExplanationSection[] = [
      {
        heading: 'Test Overview',
        content: `**Test Type:** ${this.formatTestType(qa.testType)}\n\n${this.getTestDescription(qa.testType)}`,
      },
      {
        heading: 'Test Frequency',
        content: `This test must be performed ${qa.frequency}.`,
      },
      {
        heading: 'Pass/Fail Criteria',
        content: `**Tolerance:** ${qa.toleranceCriteria}\n\nThe test passes if results are within this tolerance.`,
      },
    ]

    if (detailLevel === 'detailed' || detailLevel === 'technical') {
      sections.push({
        heading: 'What Happens If the Test Fails',
        content: qa.consequenceOfFailure,
      })
    }

    if (detailLevel === 'technical' && qa.notes.length > 0) {
      sections.push({
        heading: 'Technical Notes',
        content: qa.notes.map((n) => `- ${n}`).join('\n'),
      })
    }

    const keyTakeaways = [
      `${this.formatTestType(qa.testType)} required ${qa.frequency}`,
      `Must meet ${qa.toleranceCriteria} tolerance`,
      `Failure consequence: ${qa.consequenceOfFailure}`,
    ]

    return {
      title,
      summary,
      sections,
      keyTakeaways,
      citations: [{ reference: qa.regulatoryBasis, title: 'QA/QC Requirements' }],
    }
  }

  /**
   * Explain a compliance rule
   */
  private explainComplianceRule(
    item: unknown,
    _context?: ExplainerInput['context'],
    _detailLevel = 'detailed'
  ): ExplainerOutput {
    const rule = item as {
      name: string
      description: string
      category: string
      severity: string
      consequence: string
      remediation?: string
    }

    return {
      title: `Compliance Rule: ${rule.name}`,
      summary: rule.description,
      sections: [
        {
          heading: 'What This Rule Checks',
          content: rule.description,
        },
        {
          heading: 'Severity',
          content: `**Level:** ${rule.severity}\n\nThis indicates the importance of this check.`,
        },
        {
          heading: 'If This Check Fails',
          content: rule.consequence,
        },
      ],
      keyTakeaways: [
        `Category: ${rule.category}`,
        `Severity: ${rule.severity}`,
        ...(rule.remediation !== undefined && rule.remediation !== ''
          ? [`Remediation: ${rule.remediation}`]
          : []),
      ],
      citations: [],
    }
  }

  /**
   * Explain a regulation
   */
  private explainRegulation(
    item: unknown,
    _context?: ExplainerInput['context'],
    _detailLevel = 'detailed'
  ): ExplainerOutput {
    const reg = item as {
      cfr: string
      title: string
      description: string
      applicability: string
    }

    return {
      title: `Regulation: ${reg.cfr}`,
      summary: reg.description,
      sections: [
        {
          heading: 'Title',
          content: reg.title,
        },
        {
          heading: 'Description',
          content: reg.description,
        },
        {
          heading: 'Applicability',
          content: reg.applicability,
        },
      ],
      keyTakeaways: [reg.cfr, reg.title],
      citations: [{ reference: reg.cfr, title: reg.title }],
    }
  }

  /**
   * Explain overall requirements
   */
  private explainOverallRequirements(
    _item: unknown,
    context?: ExplainerInput['context'],
    _detailLevel = 'detailed'
  ): ExplainerOutput {
    const facilityName = context?.facilityName ?? 'Your facility'

    return {
      title: 'Part 75 Requirements Overview',
      summary: `${facilityName} is subject to EPA Part 75 continuous emissions monitoring requirements. This means the DAHS must continuously monitor emissions, perform required calculations, conduct QA tests, and submit quarterly reports.`,
      sections: [
        {
          heading: 'What You Must Monitor',
          content:
            'Typically: SO2, NOx, CO2, O2, and stack gas flow rate. Each parameter requires continuous monitoring with hourly averaging.',
        },
        {
          heading: 'What You Must Calculate',
          content:
            'Hourly averages, heat input, mass emissions, emission rates. All calculations must follow Part 75 Appendix F formulas.',
        },
        {
          heading: 'QA/QC Testing',
          content:
            'Daily calibration checks, quarterly linearity tests, and periodic Relative Accuracy Test Audits (RATAs) are required.',
        },
        {
          heading: 'Reporting',
          content:
            'Submit quarterly Electronic Data Reports (EDR) via ECMPS within 30 days of quarter end. Annual compliance certification also required.',
        },
      ],
      keyTakeaways: [
        'Continuous emissions monitoring is required',
        'Daily calibrations and periodic QA tests are mandatory',
        'Hourly data must be calculated per Part 75 Appendix F',
        'Quarterly EDR reports due 30 days after quarter end',
        'Data availability must be ≥90% to avoid bias adjustment',
      ],
      citations: [
        { reference: '40 CFR 75', title: 'Part 75 Core Requirements' },
        { reference: '40 CFR 75 Appendix B', title: 'QA/QC Procedures' },
        { reference: '40 CFR 75 Appendix F', title: 'Calculation Procedures' },
      ],
    }
  }

  /**
   * Create default explanation when subject is unknown
   */
  private createDefaultExplanation(): ExplainerOutput {
    return {
      title: 'Information',
      summary: 'No specific explanation available.',
      sections: [],
      keyTakeaways: [],
      citations: [],
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getMethodName(code: string): string {
    const names: Record<string, string> = {
      CEM: 'Continuous Emission Monitoring (CEM)',
      CALC: 'Calculation-based methodology',
      AD: 'Appendix D fuel flow methodology',
      LME: 'Low Mass Emissions exemption',
    }
    return names[code] ?? code
  }

  private getMethodDescription(code: string): string {
    const descriptions: Record<string, string> = {
      CEM: 'Uses electronic analyzers to continuously measure emissions in real-time. Data is collected every minute and averaged hourly.',
      CALC: 'Emissions are calculated based on measured parameters rather than directly monitored.',
      AD: 'Uses fuel flow meters and fuel analysis to estimate emissions. Common for gas-fired units.',
      LME: 'Simplified monitoring for units with very low emissions.',
    }
    return descriptions[code] ?? 'See Part 75 for methodology details.'
  }

  private getParameterDescription(param: string): string {
    const descriptions: Record<string, string> = {
      'Sulfur Dioxide':
        'SO2 is a byproduct of burning sulfur-containing fuels. Regulated under the Acid Rain Program.',
      'Nitrogen Oxides':
        'NOx contributes to smog and acid rain. Part 75 requires both concentration and rate monitoring.',
      'Carbon Dioxide': 'CO2 monitoring is required for heat input calculations and GHG reporting.',
      Oxygen: 'O2 (or CO2) is used as a diluent for calculating emission rates and heat input.',
      'Stack Gas Flow':
        'Flow rate is essential for calculating mass emissions from concentration measurements.',
    }
    return descriptions[param] ?? `Monitoring of ${param} is required by regulation.`
  }

  private getCalculationTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      hourly_average: 'hourly averaging',
      heat_input: 'F-factor heat input',
      mass_emission: 'mass emission',
      emission_rate: 'emission rate',
    }
    return descriptions[type] ?? type
  }

  private getCalculationPurpose(type: string): string {
    const purposes: Record<string, string> = {
      hourly_average:
        'Hourly averages smooth out minute-to-minute fluctuations and provide representative values for the hour.',
      heat_input:
        'Heat input is the measure of fuel energy consumed by the unit, required for emission rate calculations.',
      mass_emission: 'Mass emissions (in lb/hr or tons/hr) are the total pollutant discharged.',
      emission_rate: 'Emission rates (in lb/MMBtu) normalize emissions to fuel consumption.',
    }
    return purposes[type] ?? 'This calculation is required by Part 75.'
  }

  private getFrequencyDescription(freq: string): string {
    if (freq === 'hourly') return 'every hour using the hourly average values'
    if (freq === 'continuous') return 'continuously as data is collected'
    return freq
  }

  private explainFormula(formula: string): string {
    if (formula.includes('20.9')) {
      return 'This is the F-factor formula. 20.9 is the O2 percentage in ambient air. The formula corrects flow to dry standard conditions and calculates heat content.'
    }
    return 'Formula details available in Part 75 Appendix F.'
  }

  private formatTestType(type: string): string {
    const names: Record<string, string> = {
      daily_calibration: 'Daily Calibration Check',
      linearity: 'Linearity Test',
      rata: 'Relative Accuracy Test Audit (RATA)',
      quarterly_gas_audit: 'Cylinder Gas Audit (CGA)',
    }
    return names[type] ?? type
  }

  private getTestDescription(type: string): string {
    const descriptions: Record<string, string> = {
      daily_calibration:
        'Zero and span calibration gases are injected to verify the analyzer is reading accurately.',
      linearity:
        'Low, mid, and high concentration gases are tested to ensure the analyzer responds linearly across its range.',
      rata: 'The CEM is compared to EPA reference method measurements to verify overall system accuracy.',
      quarterly_gas_audit:
        'An independent audit gas is tested to verify the CEM is accurately calibrated.',
    }
    return descriptions[type] ?? 'See Part 75 Appendix B for test procedures.'
  }
}
