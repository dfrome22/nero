/**
 * PQAMirrorAgent - Compliance Check Rule Generator
 *
 * Generates validation rules that mirror EPA's compliance checking.
 */

import type {
  ComplianceCheckRule,
  PQAMirrorInput,
  PQAMirrorOutput,
} from '../../types/part75-orchestrator'

export class PQAMirrorAgent {
  /**
   * Generate compliance check rules
   */
  generateRules(input: PQAMirrorInput): PQAMirrorOutput {
    const { qaRequirements, monitoringRequirements, calculationPlan, programs } = input

    const rules: ComplianceCheckRule[] = []
    let idCounter = 1

    // Generate QA result validation rules
    for (const qa of qaRequirements) {
      if (qa.testType === 'daily_calibration') {
        rules.push({
          id: `rule-${idCounter++}`,
          name: `Daily Calibration Error Check - ${qa.parameterCode}`,
          category: 'qa_result',
          description: `Verify daily calibration error is within tolerance for ${qa.parameterCode}`,
          frequency: 'daily',
          severity: 'critical',
          appliesTo: [qa.parameterCode],
          ruleLogic: `abs(measured - reference) / span <= 0.025`,
          regulatoryBasis: qa.regulatoryBasis,
          consequence: qa.consequenceOfFailure,
          remediation: 'Recalibrate within 8 hours or invalidate data',
        })
      }

      if (qa.testType === 'linearity') {
        rules.push({
          id: `rule-${idCounter++}`,
          name: `Linearity Test Validation - ${qa.parameterCode}`,
          category: 'qa_result',
          description: `Verify linearity test results are within tolerance`,
          frequency: 'quarterly',
          severity: 'error',
          appliesTo: [qa.parameterCode],
          ruleLogic: `abs(measured - reference) / reference <= 0.05`,
          regulatoryBasis: qa.regulatoryBasis,
          consequence: qa.consequenceOfFailure,
          remediation: 'Review analyzer performance, recalibrate if needed',
        })
      }

      if (qa.testType === 'rata') {
        rules.push({
          id: `rule-${idCounter++}`,
          name: `RATA Accuracy Check - ${qa.parameterCode}`,
          category: 'qa_result',
          description: `Verify RATA relative accuracy is within tolerance`,
          frequency: 'quarterly',
          severity: 'critical',
          appliesTo: [qa.parameterCode],
          ruleLogic: `relative_accuracy <= 0.10`,
          regulatoryBasis: qa.regulatoryBasis,
          consequence: qa.consequenceOfFailure,
          remediation: 'Investigate system performance, may require recertification',
        })
      }
    }

    // Generate data quality rules
    for (const mon of monitoringRequirements) {
      rules.push({
        id: `rule-${idCounter++}`,
        name: `Data Availability Check - ${mon.parameter}`,
        category: 'data_quality',
        description: `Verify data availability meets minimum threshold`,
        frequency: 'hourly',
        severity: 'warning',
        appliesTo: [mon.systemType],
        ruleLogic: `data_availability >= 0.90`,
        regulatoryBasis: '40 CFR 75 Subpart D',
        consequence: 'Excessive missing data may trigger bias adjustment',
        remediation: 'Investigate monitor downtime, address system issues',
      })

      rules.push({
        id: `rule-${idCounter++}`,
        name: `Valid Data Range Check - ${mon.parameter}`,
        category: 'data_quality',
        description: `Verify monitored values are within valid range`,
        frequency: 'real-time',
        severity: 'error',
        appliesTo: [mon.systemType],
        ruleLogic: `value >= min_valid && value <= max_valid`,
        regulatoryBasis: mon.regulatoryBasis,
        consequence: 'Out-of-range data must be flagged as invalid',
        remediation: 'Check monitor span settings and calibration',
      })
    }

    // Generate calculation result rules
    for (const calc of calculationPlan) {
      if (calc.calculationType === 'mass_emission') {
        rules.push({
          id: `rule-${idCounter++}`,
          name: `Mass Emission Result Validation - ${calc.output}`,
          category: 'calculation_result',
          description: `Verify mass emission calculation produces valid result`,
          frequency: 'hourly',
          severity: 'error',
          appliesTo: calc.inputs,
          ruleLogic: `result >= 0 && result < max_reasonable`,
          regulatoryBasis: calc.regulatoryBasis,
          consequence: 'Invalid calculation results must be investigated',
          remediation: 'Verify input parameters and formula',
        })
      }

      if (calc.calculationType === 'heat_input') {
        rules.push({
          id: `rule-${idCounter++}`,
          name: `Heat Input Calculation Validation`,
          category: 'calculation_result',
          description: `Verify heat input calculation is reasonable`,
          frequency: 'hourly',
          severity: 'warning',
          appliesTo: calc.inputs,
          ruleLogic: `result > 0 && result < max_unit_capacity * 1.1`,
          regulatoryBasis: calc.regulatoryBasis,
          consequence: 'Unreasonable heat input may indicate data issues',
          remediation: 'Check flow and diluent measurements',
        })
      }
    }

    // Generate missing data rules
    rules.push({
      id: `rule-${idCounter++}`,
      name: 'Missing Data Substitution Validation',
      category: 'missing_data',
      description: 'Verify substitute data is calculated correctly',
      frequency: 'hourly',
      severity: 'warning',
      appliesTo: monitoringRequirements.map((m) => m.systemType),
      ruleLogic: 'substitute_value = max(90th_percentile, maximum_value)',
      regulatoryBasis: '40 CFR 75 Subpart D',
      consequence: 'Incorrect substitute data affects emissions totals',
      remediation: 'Review lookback period data and substitution algorithm',
    })

    // Generate reporting rules
    if (programs.includes('ARP') || programs.includes('CSAPR')) {
      rules.push({
        id: `rule-${idCounter++}`,
        name: 'Quarterly Report Completeness Check',
        category: 'reporting',
        description: 'Verify all required data elements are present for quarterly report',
        frequency: 'quarterly',
        severity: 'critical',
        appliesTo: ['ALL'],
        ruleLogic: 'all_required_fields_present && data_availability >= 0.90',
        regulatoryBasis: '40 CFR 75.64',
        consequence: 'Incomplete reports will be rejected by ECMPS',
        remediation: 'Complete all required data fields before submission',
      })
    }

    // Group rules by category
    const rulesByCategory = this.groupRulesByCategory(rules)

    // Identify critical rules
    const criticalRules = rules.filter((r) => r.severity === 'critical')

    // Build summary
    const summary = {
      totalRules: rules.length,
      criticalRules: rules.filter((r) => r.severity === 'critical').length,
      errorRules: rules.filter((r) => r.severity === 'error').length,
      warningRules: rules.filter((r) => r.severity === 'warning').length,
    }

    // Set data quality thresholds
    const dataQualityThresholds = {
      minimumDataAvailability: 0.9, // 90% as per Part 75
      calibrationErrorTolerance: 0.025, // 2.5% of span
      rataAccuracyTolerance: 0.1, // 10% relative accuracy
    }

    return {
      rules,
      rulesByCategory,
      criticalRules,
      summary,
      dataQualityThresholds,
    }
  }

  /**
   * Group rules by category
   */
  private groupRulesByCategory(
    rules: ComplianceCheckRule[]
  ): Record<string, ComplianceCheckRule[]> {
    const grouped: Record<string, ComplianceCheckRule[]> = {}

    for (const rule of rules) {
      grouped[rule.category] ??= []
      const category = grouped[rule.category]
      if (category !== undefined) {
        category.push(rule)
      }
    }

    return grouped
  }
}
