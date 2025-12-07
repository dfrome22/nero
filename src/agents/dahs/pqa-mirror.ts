/**
 * PQA Mirror Agent
 *
 * Mirrors ECMPS Program Quality Assurance checks and rules.
 * The idea is that a Nero agent can:
 * - Read ECMPS Emissions Check Specifications
 * - Translate them into CheckRule definitions
 * - Provide explanations or drive DAHS-side ComplianceChecker implementation
 */

import type { CheckRule, RequiredObject } from '../../types/dahs-domain'

/**
 * Registry of ECMPS-style checks that DAHS must implement.
 * These are based on EPA's ECMPS Check Specifications.
 */
export const checkRuleRegistry: CheckRule[] = [
  {
    id: 'SUMVAL_MISMATCH',
    description: 'SummaryValue mass does not reconcile with hourly values within tolerance.',
    objectType: 'SUMMARY',
    severity: 'ERROR',
  },
  {
    id: 'HOUR_NEGATIVE_VALUE',
    description: 'Negative heat input or mass value in hourly data.',
    objectType: 'HOURLY',
    severity: 'CRITICAL',
  },
  {
    id: 'HOURLY_INCOMPLETE',
    description: 'Hourly record missing required data elements.',
    objectType: 'HOURLY',
    severity: 'ERROR',
  },
  {
    id: 'DAILY_CO2_AGGREGATE',
    description: 'Daily CO2 mass does not match sum of hourly CO2 mass.',
    objectType: 'DAILY_CO2',
    severity: 'ERROR',
  },
  {
    id: 'CALIBRATION_FAILED',
    description: 'Daily calibration error exceeds ±2.5% of span.',
    objectType: 'HOURLY',
    severity: 'CRITICAL',
  },
  {
    id: 'RATA_OVERDUE',
    description: 'RATA test is overdue based on grace period rules.',
    objectType: 'HOURLY',
    severity: 'WARNING',
  },
  {
    id: 'LINEARITY_FAILED',
    description: 'Quarterly linearity test failed tolerance criteria.',
    objectType: 'SUMMARY',
    severity: 'ERROR',
  },
  {
    id: 'DATA_AVAILABILITY_LOW',
    description: 'Monitor data availability below 90% threshold.',
    objectType: 'SUMMARY',
    severity: 'WARNING',
  },
  {
    id: 'SUBSTITUTE_DATA_EXCESSIVE',
    description: 'Excessive use of substitute data in reporting period.',
    objectType: 'SUMMARY',
    severity: 'WARNING',
  },
  {
    id: 'EMISSION_LIMIT_EXCEEDED',
    description: 'Emission value exceeds permit limit or allowance allocation.',
    objectType: 'SUMMARY',
    severity: 'CRITICAL',
  },
  {
    id: 'BACKSTOP_THRESHOLD_EXCEEDED',
    description: 'Daily emissions exceed backstop threshold (CSAPR Group 3).',
    objectType: 'DAILY_BACKSTOP',
    severity: 'ERROR',
  },
  {
    id: 'FLOW_RATE_ANOMALY',
    description: 'Flow rate value outside expected range based on unit load.',
    objectType: 'HOURLY',
    severity: 'WARNING',
  },
  {
    id: 'HEAT_INPUT_ZERO_WITH_LOAD',
    description: 'Heat input is zero but unit is operating.',
    objectType: 'HOURLY',
    severity: 'ERROR',
  },
  {
    id: 'OPERATING_TIME_MISMATCH',
    description: 'Operating time does not match operating hours calculation.',
    objectType: 'HOURLY',
    severity: 'INFO',
  },
  {
    id: 'FUEL_DATA_MISSING',
    description: 'Daily fuel usage data missing for Appendix D unit.',
    objectType: 'DAILY_FUEL',
    severity: 'ERROR',
  },
]

/**
 * Generate a human-readable explanation of a check rule
 */
export function explainCheckRule(rule: CheckRule): string {
  return `Check ${rule.id} (${rule.severity}): ${rule.description}`
}

/**
 * Get all check rules applicable to a specific object type
 */
export function getCheckRulesForObjectType(objectType: RequiredObject['objectType']): CheckRule[] {
  return checkRuleRegistry.filter((rule) => rule.objectType === objectType)
}

/**
 * Get check rules by severity level
 */
export function getCheckRulesBySeverity(severity: CheckRule['severity']): CheckRule[] {
  return checkRuleRegistry.filter((rule) => rule.severity === severity)
}

/**
 * Check if a rule ID exists in the registry
 */
export function hasCheckRule(id: string): boolean {
  return checkRuleRegistry.some((rule) => rule.id === id)
}
