/**
 * Configuration Service Tests
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { CalculationConfig } from '../../types/calculation-engine'
import {
  analyzeImpact,
  approveConfig,
  changeConfigStatus,
  createCalculationConfig,
  getAuditEntriesByAction,
  getAuditHistory,
  getFieldHistory,
  updateCalculationConfig,
} from './configuration-service'

describe('ConfigurationService', () => {
  const userId = 'user123'
  const userName = 'Test User'

  describe('createCalculationConfig', () => {
    it('should create a new configuration with audit trail', () => {
      const config = createCalculationConfig(
        {
          name: 'Test Calculation',
          formulaId: 'heat-input-appendix-f',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {
            Qh: 'source:flow',
            O2: 'source:o2',
            Fd: 'constant:1040',
          },
          status: 'active',
          programs: ['ARP'],
          satisfiesRequirements: ['req-1'],
          validationRuleIds: [],
          metadata: {
            description: 'Heat input calculation',
          },
        },
        userId,
        userName
      )

      expect(config.id).toBeDefined()
      expect(config.name).toBe('Test Calculation')
      expect(config.audit.createdBy).toBe(userId)
      expect(config.audit.createdByName).toBe(userName)
      expect(config.audit.history).toHaveLength(1)
      expect(config.audit.history[0]?.action).toBe('created')
    })

    it('should generate unique IDs', async () => {
      const config1 = createCalculationConfig(
        {
          name: 'Test Calculation',
          formulaId: 'formula-1',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {},
          status: 'active',
          programs: [],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Test' },
        },
        userId,
        userName
      )

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 2))

      const config2 = createCalculationConfig(
        {
          name: 'Test Calculation',
          formulaId: 'formula-1',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {},
          status: 'active',
          programs: [],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Test' },
        },
        userId,
        userName
      )

      expect(config1.id).not.toBe(config2.id)
    })
  })

  describe('updateCalculationConfig', () => {
    let config: CalculationConfig

    beforeEach(() => {
      config = createCalculationConfig(
        {
          name: 'Test Calculation',
          formulaId: 'formula-1',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: { param1: 'value1' },
          status: 'active',
          programs: ['ARP'],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Original' },
        },
        userId,
        userName
      )
    })

    it('should update configuration and record changes', () => {
      const updated = updateCalculationConfig(
        config,
        {
          name: 'Updated Calculation',
          metadata: { description: 'Updated' },
        },
        userId,
        userName,
        'Updating name and description'
      )

      expect(updated.name).toBe('Updated Calculation')
      expect(updated.metadata.description).toBe('Updated')
      expect(updated.audit.history.length).toBe(config.audit.history.length + 1)

      const lastEntry = updated.audit.history[updated.audit.history.length - 1]
      expect(lastEntry?.action).toBe('updated')
      expect(lastEntry?.reason).toBe('Updating name and description')
      expect(lastEntry?.changes).toBeDefined()
    })

    it('should track specific field changes', () => {
      const updated = updateCalculationConfig(
        config,
        { frequency: 'daily' },
        userId,
        userName,
        'Changing frequency'
      )

      const lastEntry = updated.audit.history[updated.audit.history.length - 1]
      expect(lastEntry?.changes?.frequency).toBeDefined()
      expect(lastEntry?.changes?.frequency?.old).toBe('hourly')
      expect(lastEntry?.changes?.frequency?.new).toBe('daily')
    })

    it('should update lastModified fields', async () => {
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 2))

      const updated = updateCalculationConfig(
        config,
        { name: 'New Name' },
        'user456',
        'Another User',
        'Change name'
      )

      expect(updated.audit.lastModifiedBy).toBe('user456')
      expect(updated.audit.lastModifiedByName).toBe('Another User')
      expect(updated.audit.lastModifiedAt).not.toBe(config.audit.lastModifiedAt)
    })
  })

  describe('changeConfigStatus', () => {
    let config: CalculationConfig

    beforeEach(() => {
      config = createCalculationConfig(
        {
          name: 'Test Calculation',
          formulaId: 'formula-1',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {},
          status: 'active',
          programs: [],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Test' },
        },
        userId,
        userName
      )
    })

    it('should change status to inactive', () => {
      const updated = changeConfigStatus(
        config,
        'inactive',
        userId,
        userName,
        'Deactivating for testing'
      )

      expect(updated.status).toBe('inactive')
      const lastEntry = updated.audit.history[updated.audit.history.length - 1]
      expect(lastEntry?.action).toBe('deactivated')
    })

    it('should change status to active', () => {
      const inactive = changeConfigStatus(config, 'inactive', userId, userName, 'Deactivate')
      const active = changeConfigStatus(inactive, 'active', userId, userName, 'Reactivate')

      expect(active.status).toBe('active')
      const lastEntry = active.audit.history[active.audit.history.length - 1]
      expect(lastEntry?.action).toBe('activated')
    })

    it('should record status change reason', () => {
      const reason = 'Maintenance window'
      const updated = changeConfigStatus(config, 'inactive', userId, userName, reason)

      const lastEntry = updated.audit.history[updated.audit.history.length - 1]
      expect(lastEntry?.reason).toBe(reason)
    })
  })

  describe('approveConfig', () => {
    let config: CalculationConfig

    beforeEach(() => {
      config = createCalculationConfig(
        {
          name: 'Test Calculation',
          formulaId: 'formula-1',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {},
          status: 'testing',
          programs: [],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Test' },
        },
        userId,
        userName
      )
    })

    it('should approve configuration', () => {
      const approved = approveConfig(
        config,
        'approver123',
        'Approver Name',
        'Reviewed and approved'
      )

      expect(approved.audit.approvedBy).toBe('approver123')
      expect(approved.audit.approvedByName).toBe('Approver Name')
      expect(approved.audit.approvalComment).toBe('Reviewed and approved')
      expect(approved.audit.approvedAt).toBeDefined()
    })

    it('should record approval in history', () => {
      const approved = approveConfig(config, userId, userName, 'Approved')

      const lastEntry = approved.audit.history[approved.audit.history.length - 1]
      expect(lastEntry?.action).toBe('validated')
      expect(lastEntry?.reason).toContain('approved')
    })
  })

  describe('getAuditHistory', () => {
    it('should return complete audit history', () => {
      let config = createCalculationConfig(
        {
          name: 'Test',
          formulaId: 'f1',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {},
          status: 'active',
          programs: [],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Test' },
        },
        userId,
        userName
      )

      config = updateCalculationConfig(config, { name: 'Updated' }, userId, userName, 'Update 1')
      config = updateCalculationConfig(config, { name: 'Updated 2' }, userId, userName, 'Update 2')

      const history = getAuditHistory(config)

      expect(history).toHaveLength(3) // created + 2 updates
      expect(history[0]?.action).toBe('created')
      expect(history[1]?.action).toBe('updated')
      expect(history[2]?.action).toBe('updated')
    })
  })

  describe('getAuditEntriesByAction', () => {
    it('should filter entries by action type', () => {
      let config = createCalculationConfig(
        {
          name: 'Test',
          formulaId: 'f1',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {},
          status: 'active',
          programs: [],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Test' },
        },
        userId,
        userName
      )

      config = updateCalculationConfig(config, { name: 'Updated' }, userId, userName, 'Update')
      config = changeConfigStatus(config, 'inactive', userId, userName, 'Deactivate')

      const updates = getAuditEntriesByAction(config, 'updated')
      const deactivations = getAuditEntriesByAction(config, 'deactivated')

      expect(updates).toHaveLength(1)
      expect(deactivations).toHaveLength(1)
    })
  })

  describe('getFieldHistory', () => {
    it('should track changes to specific field', () => {
      let config = createCalculationConfig(
        {
          name: 'Original Name',
          formulaId: 'f1',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {},
          status: 'active',
          programs: [],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Test' },
        },
        userId,
        userName
      )

      config = updateCalculationConfig(config, { name: 'Name v2' }, userId, userName, 'Update 1')
      config = updateCalculationConfig(config, { name: 'Name v3' }, 'user2', 'User Two', 'Update 2')

      const nameHistory = getFieldHistory(config, 'name')

      expect(nameHistory).toHaveLength(2)
      expect(nameHistory[0]?.oldValue).toBe('Original Name')
      expect(nameHistory[0]?.newValue).toBe('Name v2')
      expect(nameHistory[1]?.oldValue).toBe('Name v2')
      expect(nameHistory[1]?.newValue).toBe('Name v3')
      expect(nameHistory[1]?.userName).toBe('User Two')
    })

    it('should return empty array for unchanged field', () => {
      const config = createCalculationConfig(
        {
          name: 'Test',
          formulaId: 'f1',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {},
          status: 'active',
          programs: [],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Test' },
        },
        userId,
        userName
      )

      const history = getFieldHistory(config, 'frequency')

      expect(history).toHaveLength(0)
    })
  })

  describe('analyzeImpact', () => {
    it('should analyze impact of formula change', () => {
      const configs = [
        createCalculationConfig(
          {
            name: 'Calc A',
            formulaId: 'formula-1',
            formulaVersion: '1.0.0',
            frequency: 'hourly',
            parameterMappings: {},
            status: 'active',
            programs: ['ARP'],
            satisfiesRequirements: [],
            validationRuleIds: [],
            metadata: { description: 'Test' },
          },
          userId,
          userName
        ),
      ]

      if (!configs[0]) {
        throw new Error('Config not found')
      }

      const impact = analyzeImpact(configs[0].id, { formulaId: 'formula-2' }, configs)

      expect(impact.configurationId).toBe(configs[0].id)
      expect(impact.changeDescription).toContain('formula-1')
      expect(impact.changeDescription).toContain('formula-2')
      expect(impact.riskLevel).toBe('critical')
      expect(impact.recommendations.length).toBeGreaterThan(0)
    })

    it('should identify downstream impacts', () => {
      const configs: CalculationConfig[] = []

      const calcA = createCalculationConfig(
        {
          name: 'Calc A',
          formulaId: 'formula-1',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {},
          status: 'active',
          programs: ['ARP'],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Test' },
        },
        userId,
        userName
      )
      configs.push(calcA)

      const calcB = createCalculationConfig(
        {
          name: 'Calc B',
          formulaId: 'formula-2',
          formulaVersion: '1.0.0',
          frequency: 'hourly',
          parameterMappings: {
            input: `calc:${calcA.id}:output`,
          },
          status: 'active',
          programs: ['ARP'],
          satisfiesRequirements: [],
          validationRuleIds: [],
          metadata: { description: 'Test' },
        },
        userId,
        userName
      )
      configs.push(calcB)

      const impact = analyzeImpact(calcA.id, { formulaId: 'formula-new' }, configs)

      expect(impact.totalImpactCount).toBeGreaterThan(0)
      expect(impact.indirectImpacts.length).toBeGreaterThan(0)
    })

    it('should assess risk level based on changes', () => {
      const configs = [
        createCalculationConfig(
          {
            name: 'Test',
            formulaId: 'formula-1',
            formulaVersion: '1.0.0',
            frequency: 'hourly',
            parameterMappings: {},
            status: 'active',
            programs: [],
            satisfiesRequirements: [],
            validationRuleIds: [],
            metadata: { description: 'Test' },
          },
          userId,
          userName
        ),
      ]

      // Minor change (metadata only)
      if (!configs[0]) {
        throw new Error('Config not found')
      }

      const minorImpact = analyzeImpact(
        configs[0].id,
        { metadata: { description: 'Updated description' } },
        configs
      )

      // Should be low risk for metadata-only changes
      expect(['low', 'medium']).toContain(minorImpact.riskLevel)
    })
  })
})
