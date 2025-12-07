import { describe, it, expect } from 'vitest'
import { checkRuleRegistry, explainCheckRule } from './pqa-mirror'

describe('PQAMirrorAgent', () => {
  describe('checkRuleRegistry', () => {
    it('should have at least one check rule', () => {
      expect(checkRuleRegistry.length).toBeGreaterThan(0)
    })

    it('should include SUMVAL_MISMATCH rule', () => {
      const rule = checkRuleRegistry.find((r) => r.id === 'SUMVAL_MISMATCH')
      expect(rule).toBeDefined()
      expect(rule?.objectType).toBe('SUMMARY')
      expect(rule?.severity).toBe('ERROR')
    })

    it('should include HOUR_NEGATIVE_VALUE rule', () => {
      const rule = checkRuleRegistry.find((r) => r.id === 'HOUR_NEGATIVE_VALUE')
      expect(rule).toBeDefined()
      expect(rule?.objectType).toBe('HOURLY')
      expect(rule?.severity).toBe('CRITICAL')
    })

    it('should have rules for different object types', () => {
      const objectTypes = new Set(checkRuleRegistry.map((r) => r.objectType))
      expect(objectTypes.has('HOURLY')).toBe(true)
      expect(objectTypes.has('SUMMARY')).toBe(true)
    })

    it('should have rules with different severity levels', () => {
      const severities = new Set(checkRuleRegistry.map((r) => r.severity))
      expect(severities.size).toBeGreaterThan(1)
    })

    it('should include data completeness checks', () => {
      const hasCompletenessCheck = checkRuleRegistry.some(
        (r) =>
          r.description.toLowerCase().includes('complete') ||
          r.description.toLowerCase().includes('missing')
      )
      expect(hasCompletenessCheck).toBe(true)
    })

    it('should include QA test result checks', () => {
      const hasQACheck = checkRuleRegistry.some(
        (r) =>
          r.description.toLowerCase().includes('calibration') ||
          r.description.toLowerCase().includes('rata') ||
          r.description.toLowerCase().includes('qa')
      )
      expect(hasQACheck).toBe(true)
    })

    it('should include emission limit checks', () => {
      const hasLimitCheck = checkRuleRegistry.some(
        (r) =>
          r.description.toLowerCase().includes('limit') ||
          r.description.toLowerCase().includes('exceed')
      )
      expect(hasLimitCheck).toBe(true)
    })
  })

  describe('explainCheckRule', () => {
    it('should format rule explanation correctly', () => {
      const rule = checkRuleRegistry[0]
      if (rule === undefined) {
        throw new Error('Expected at least one rule in registry')
      }
      const explanation = explainCheckRule(rule)

      expect(explanation).toContain(rule.id)
      expect(explanation).toContain(rule.severity)
      expect(explanation).toContain(rule.description)
    })

    it('should include severity in explanation', () => {
      const criticalRule = checkRuleRegistry.find((r) => r.severity === 'CRITICAL')
      if (criticalRule) {
        const explanation = explainCheckRule(criticalRule)
        expect(explanation).toContain('CRITICAL')
      }
    })

    it('should include rule ID and description', () => {
      const rule = checkRuleRegistry.find((r) => r.id === 'SUMVAL_MISMATCH')
      if (rule) {
        const explanation = explainCheckRule(rule)
        expect(explanation).toContain('SUMVAL_MISMATCH')
        expect(explanation).toContain(rule.description)
      }
    })
  })
})
