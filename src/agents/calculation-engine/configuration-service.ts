/**
 * Calculation Configuration Service
 *
 * Manages calculation configurations with audit trail, versioning,
 * and validation.
 */

import type {
  AuditAction,
  AuditLogEntry,
  CalculationConfig,
  CalculationStatus,
  ImpactAnalysis,
  ImpactedCalculation,
} from '../../types/calculation-engine'
import { buildDependencyGraph, getDownstreamDependents } from './dependency-tracker'

/**
 * Create a new calculation configuration
 */
export function createCalculationConfig(
  config: Omit<CalculationConfig, 'id' | 'audit'>,
  userId: string,
  userName: string
): CalculationConfig {
  const now = new Date().toISOString()
  const id = generateConfigId(config.name)

  const auditEntry: AuditLogEntry = {
    timestamp: now,
    action: 'created',
    userId,
    userName,
    reason: 'Initial configuration creation',
  }

  return {
    ...config,
    id,
    audit: {
      createdAt: now,
      createdBy: userId,
      createdByName: userName,
      lastModifiedAt: now,
      lastModifiedBy: userId,
      lastModifiedByName: userName,
      history: [auditEntry],
    },
  }
}

/**
 * Update an existing calculation configuration
 */
export function updateCalculationConfig(
  config: CalculationConfig,
  updates: Partial<Omit<CalculationConfig, 'id' | 'audit'>>,
  userId: string,
  userName: string,
  reason: string
): CalculationConfig {
  const now = new Date().toISOString()

  // Track what changed
  const changes: Record<string, { old: unknown; new: unknown }> = {}
  for (const [key, newValue] of Object.entries(updates)) {
    const oldValue = config[key as keyof CalculationConfig]
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { old: oldValue, new: newValue }
    }
  }

  const auditEntry: AuditLogEntry = {
    timestamp: now,
    action: 'updated',
    userId,
    userName,
    changes,
    reason,
  }

  return {
    ...config,
    ...updates,
    audit: {
      ...config.audit,
      lastModifiedAt: now,
      lastModifiedBy: userId,
      lastModifiedByName: userName,
      history: [...config.audit.history, auditEntry],
    },
  }
}

/**
 * Change calculation configuration status
 */
export function changeConfigStatus(
  config: CalculationConfig,
  newStatus: CalculationStatus,
  userId: string,
  userName: string,
  reason: string
): CalculationConfig {
  const now = new Date().toISOString()
  const action: AuditAction = newStatus === 'active' ? 'activated' : 'deactivated'

  const auditEntry: AuditLogEntry = {
    timestamp: now,
    action,
    userId,
    userName,
    changes: {
      status: { old: config.status, new: newStatus },
    },
    reason,
  }

  return {
    ...config,
    status: newStatus,
    audit: {
      ...config.audit,
      lastModifiedAt: now,
      lastModifiedBy: userId,
      lastModifiedByName: userName,
      history: [...config.audit.history, auditEntry],
    },
  }
}

/**
 * Approve a calculation configuration
 */
export function approveConfig(
  config: CalculationConfig,
  userId: string,
  userName: string,
  comment: string
): CalculationConfig {
  const now = new Date().toISOString()

  const auditEntry: AuditLogEntry = {
    timestamp: now,
    action: 'validated',
    userId,
    userName,
    reason: `Configuration approved: ${comment}`,
  }

  return {
    ...config,
    audit: {
      ...config.audit,
      approvedAt: now,
      approvedBy: userId,
      approvedByName: userName,
      approvalComment: comment,
      history: [...config.audit.history, auditEntry],
    },
  }
}

/**
 * Get audit history for a configuration
 */
export function getAuditHistory(config: CalculationConfig): AuditLogEntry[] {
  return [...config.audit.history]
}

/**
 * Get audit entries by action type
 */
export function getAuditEntriesByAction(
  config: CalculationConfig,
  action: AuditAction
): AuditLogEntry[] {
  return config.audit.history.filter((entry) => entry.action === action)
}

/**
 * Get changes made to a specific field
 */
export function getFieldHistory(
  config: CalculationConfig,
  fieldName: string
): { timestamp: string; oldValue: unknown; newValue: unknown; userName: string }[] {
  const history: {
    timestamp: string
    oldValue: unknown
    newValue: unknown
    userName: string
  }[] = []

  for (const entry of config.audit.history) {
    if (entry.changes && fieldName in entry.changes) {
      const change = entry.changes[fieldName]
      if (change) {
        history.push({
          timestamp: entry.timestamp,
          oldValue: change.old,
          newValue: change.new,
          userName: entry.userName,
        })
      }
    }
  }

  return history
}

/**
 * Analyze impact of changing a configuration
 */
export function analyzeImpact(
  configId: string,
  proposedChanges: Partial<CalculationConfig>,
  allConfigs: CalculationConfig[]
): ImpactAnalysis {
  const config = allConfigs.find((c) => c.id === configId)
  if (!config) {
    throw new Error(`Configuration ${configId} not found`)
  }

  // Build dependency graph
  const graph = buildDependencyGraph(allConfigs)

  // Find all downstream dependents
  const downstreamNodes = getDownstreamDependents(configId, graph)

  // Assess direct impacts
  const directImpacts: ImpactedCalculation[] = []
  const changeDescription = describeChanges(config, proposedChanges)

  // Check if formula is changing
  if (proposedChanges.formulaId !== undefined && proposedChanges.formulaId !== config.formulaId) {
    for (const nodeId of config.locationId !== undefined ? [config.locationId] : []) {
      const impactedConfig = allConfigs.find((c) => c.locationId === nodeId)
      if (impactedConfig) {
        directImpacts.push({
          id: impactedConfig.id,
          name: impactedConfig.name,
          impactType: 'formula-change',
          description: `Formula change from ${config.formulaId} to ${proposedChanges.formulaId}`,
          severity: 'high',
          affectedPrograms: impactedConfig.programs,
          requiredActions: [
            'Revalidate calculation',
            'Update test cases',
            'Review regulatory compliance',
          ],
        })
      }
    }
  }

  // Check if parameter mappings are changing
  if (proposedChanges.parameterMappings !== undefined) {
    directImpacts.push({
      id: config.id,
      name: config.name,
      impactType: 'parameter-change',
      description: 'Parameter mappings modified',
      severity: 'medium',
      affectedPrograms: config.programs,
      requiredActions: ['Verify data sources', 'Update dependencies', 'Run validation tests'],
    })
  }

  // Assess indirect impacts (downstream)
  const indirectImpacts: ImpactedCalculation[] = downstreamNodes.map((node) => {
    const impactedConfig = allConfigs.find((c) => c.id === node.id)
    return {
      id: node.id,
      name: node.name,
      impactType: 'dependency-change',
      description: `Depends on ${config.name} which is being modified`,
      severity: 'medium',
      affectedPrograms: impactedConfig?.programs ?? [],
      requiredActions: ['Review calculation results', 'Verify data consistency'],
    }
  })

  // Calculate risk level
  const totalImpacts = directImpacts.length + indirectImpacts.length
  const hasFormulaChange = proposedChanges.formulaId !== undefined
  const hasHighSeverity = [...directImpacts, ...indirectImpacts].some((i) => i.severity === 'high')

  let riskLevel: ImpactAnalysis['riskLevel'] = 'low'
  if (hasFormulaChange || hasHighSeverity) {
    riskLevel = 'critical'
  } else if (totalImpacts > 5) {
    riskLevel = 'high'
  } else if (totalImpacts > 2) {
    riskLevel = 'medium'
  }

  // Generate recommendations
  const recommendations: string[] = []
  if (hasFormulaChange) {
    recommendations.push('Conduct thorough testing with historical data')
    recommendations.push('Review regulatory compliance of new formula')
    recommendations.push('Update documentation and training materials')
  }
  if (totalImpacts > 3) {
    recommendations.push('Coordinate with downstream calculation owners')
    recommendations.push('Schedule maintenance window for validation')
  }
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('Require approval from regulatory compliance team')
    recommendations.push('Create rollback plan')
  }

  // Required validations
  const requiredValidations = [
    'Formula syntax validation',
    'Parameter type validation',
    'Unit consistency check',
  ]
  if (hasFormulaChange) {
    requiredValidations.push('Regulatory basis verification')
    requiredValidations.push('Test case execution')
  }
  if (downstreamNodes.length > 0) {
    requiredValidations.push('Downstream calculation validation')
  }

  return {
    configurationId: configId,
    changeDescription,
    directImpacts,
    indirectImpacts,
    totalImpactCount: totalImpacts,
    riskLevel,
    recommendations,
    requiredValidations,
  }
}

/**
 * Generate a unique configuration ID
 */
function generateConfigId(name: string): string {
  const timestamp = Date.now()
  const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return `calc-${sanitized}-${timestamp}`
}

/**
 * Describe changes in human-readable format
 */
function describeChanges(config: CalculationConfig, changes: Partial<CalculationConfig>): string {
  const descriptions: string[] = []

  if (changes.formulaId !== undefined) {
    descriptions.push(`Formula: ${config.formulaId} → ${changes.formulaId}`)
  }
  if (changes.status !== undefined) {
    descriptions.push(`Status: ${config.status} → ${changes.status}`)
  }
  if (changes.frequency !== undefined) {
    descriptions.push(`Frequency: ${config.frequency} → ${changes.frequency}`)
  }
  if (changes.parameterMappings !== undefined) {
    descriptions.push('Parameter mappings updated')
  }
  if (changes.validationRuleIds !== undefined) {
    descriptions.push('Validation rules updated')
  }

  return descriptions.join('; ')
}

/**
 * Export configuration with full audit trail
 */
export function exportConfig(config: CalculationConfig): string {
  return JSON.stringify(
    {
      configuration: {
        id: config.id,
        name: config.name,
        formulaId: config.formulaId,
        formulaVersion: config.formulaVersion,
        frequency: config.frequency,
        status: config.status,
        parameterMappings: config.parameterMappings,
        locationId: config.locationId,
        programs: config.programs,
        satisfiesRequirements: config.satisfiesRequirements,
        validationRuleIds: config.validationRuleIds,
        metadata: config.metadata,
      },
      audit: config.audit,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  )
}
