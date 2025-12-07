/**
 * Explainer Agent
 *
 * Utilities to help an LLM-based agent generate human-readable explanations.
 * These are intentionally lightweight so Nero can plug its own prompt logic on top.
 */

import type { RequiredParameter, CheckRule } from '../../types/dahs-domain'

/**
 * Generate a human-readable explanation of a required parameter
 */
export function explainRequiredParameter(req: RequiredParameter): string {
  const methodDescription = getMethodDescription(req.method)
  const programsList = req.requiredBy.length > 0 ? req.requiredBy.join(', ') : 'N/A'

  return [
    `Location ${req.locationId} must report ${req.parameter} using method ${req.method} (${methodDescription}).`,
    `Required by programs: ${programsList}.`,
    `Reason: ${req.reason}`,
  ].join(' ')
}

/**
 * Generate a human-readable explanation of a check rule
 */
export function explainCheckRule(rule: CheckRule): string {
  return `Check ${rule.id} (${rule.severity}): ${rule.description}`
}

/**
 * Get a human-readable description of a monitoring method
 */
function getMethodDescription(method: string): string {
  const descriptions: Record<string, string> = {
    CEM: 'Continuous Emissions Monitoring',
    AMS: 'Alternative Monitoring System',
    AD: 'Appendix D fuel flow methodology',
    FSA: 'Fuel Sampling and Analysis',
    LME: 'Low Mass Emissions exemption',
    LTFF: 'Long Term Fuel Flow',
    CALC: 'Calculation-based method',
  }

  return descriptions[method] ?? method
}

/**
 * Generate explanation for a parameter requirement with context
 */
export function explainParameterWithContext(
  req: RequiredParameter,
  context?: {
    facilityName?: string
    unitName?: string
    configurations?: string[]
  }
): string {
  const baseExplanation = explainRequiredParameter(req)

  if (!context) {
    return baseExplanation
  }

  const contextParts: string[] = []

  if (context.facilityName !== undefined && context.facilityName !== '') {
    contextParts.push(`at ${context.facilityName}`)
  }

  if (context.unitName !== undefined && context.unitName !== '') {
    contextParts.push(`(${context.unitName})`)
  }

  if (context.configurations !== undefined && context.configurations.length > 0) {
    contextParts.push(`Configuration: ${context.configurations.join(', ')}`)
  }

  if (contextParts.length > 0) {
    return `${baseExplanation} Context: ${contextParts.join(' ')}`
  }

  return baseExplanation
}

/**
 * Generate a summary explanation for multiple parameters
 */
export function explainParameterSet(params: RequiredParameter[]): string {
  if (params.length === 0) {
    return 'No parameters required.'
  }

  const locationGroups = new Map<string, RequiredParameter[]>()

  for (const param of params) {
    const existing = locationGroups.get(param.locationId) ?? []
    existing.push(param)
    locationGroups.set(param.locationId, existing)
  }

  const summaries: string[] = []

  for (const [locationId, locationParams] of locationGroups) {
    const paramNames = locationParams.map((p) => p.parameter).join(', ')
    const allPrograms = new Set<string>()
    for (const param of locationParams) {
      for (const program of param.requiredBy) {
        allPrograms.add(program)
      }
    }

    summaries.push(
      `Location ${locationId}: Monitoring ${paramNames} for programs ${Array.from(allPrograms).join(', ')}`
    )
  }

  return summaries.join('\n')
}
