import { describe, it, expect } from 'vitest'
import { explainRequiredParameter, explainCheckRule } from './explainer'
import type { RequiredParameter, CheckRule } from '../../types/dahs-domain'

describe('ExplainerAgent', () => {
  describe('explainRequiredParameter', () => {
    it('should explain a simple CEM parameter requirement', () => {
      const req: RequiredParameter = {
        locationId: 'U1',
        parameter: 'SO2M',
        method: 'CEM',
        requiredBy: ['ARP'],
        reason: 'Continuous monitoring required for SO2M under ARP',
      }

      const explanation = explainRequiredParameter(req)

      expect(explanation).toContain('U1')
      expect(explanation).toContain('SO2M')
      expect(explanation).toContain('CEM')
      expect(explanation).toContain('ARP')
    })

    it('should include all required programs', () => {
      const req: RequiredParameter = {
        locationId: 'U1',
        parameter: 'NOXM',
        method: 'CEM',
        requiredBy: ['ARP', 'CSAPR_NOX_ANN', 'CSAPR_NOX_OS'],
        reason: 'Multi-program requirement',
      }

      const explanation = explainRequiredParameter(req)

      expect(explanation).toContain('ARP')
      expect(explanation).toContain('CSAPR_NOX_ANN')
      expect(explanation).toContain('CSAPR_NOX_OS')
    })

    it('should include the reason', () => {
      const req: RequiredParameter = {
        locationId: 'CS1',
        parameter: 'CO2M',
        method: 'CEM',
        requiredBy: ['CSAPR_SO2'],
        reason: 'CO2 required for heat input calculation',
      }

      const explanation = explainRequiredParameter(req)

      expect(explanation).toContain('heat input')
    })

    it('should explain Appendix D methodology', () => {
      const req: RequiredParameter = {
        locationId: 'U2',
        parameter: 'SO2M',
        method: 'AD',
        requiredBy: ['ARP'],
        reason: 'Appendix D fuel flow methodology for SO2M under ARP',
      }

      const explanation = explainRequiredParameter(req)

      expect(explanation).toContain('AD')
      expect(explanation).toContain('fuel flow')
    })

    it('should explain LME exemption', () => {
      const req: RequiredParameter = {
        locationId: 'U3',
        parameter: 'NOXR',
        method: 'LME',
        requiredBy: ['ARP'],
        reason: 'Low Mass Emissions exemption for NOXR under ARP',
      }

      const explanation = explainRequiredParameter(req)

      expect(explanation).toContain('LME')
      expect(explanation).toContain('Low Mass')
    })

    it('should handle empty programs array', () => {
      const req: RequiredParameter = {
        locationId: 'U1',
        parameter: 'HIT',
        method: 'CALC',
        requiredBy: [],
        reason: 'Heat input calculation',
      }

      const explanation = explainRequiredParameter(req)

      expect(explanation).toContain('N/A')
    })
  })

  describe('explainCheckRule', () => {
    it('should format check rule explanation', () => {
      const rule: CheckRule = {
        id: 'TEST_RULE',
        description: 'Test check rule description',
        objectType: 'HOURLY',
        severity: 'ERROR',
      }

      const explanation = explainCheckRule(rule)

      expect(explanation).toContain('TEST_RULE')
      expect(explanation).toContain('ERROR')
      expect(explanation).toContain('Test check rule description')
    })

    it('should explain CRITICAL severity', () => {
      const rule: CheckRule = {
        id: 'CRITICAL_FAILURE',
        description: 'Critical system failure detected',
        objectType: 'HOURLY',
        severity: 'CRITICAL',
      }

      const explanation = explainCheckRule(rule)

      expect(explanation).toContain('CRITICAL')
    })

    it('should explain WARNING severity', () => {
      const rule: CheckRule = {
        id: 'DATA_WARNING',
        description: 'Data quality warning',
        objectType: 'SUMMARY',
        severity: 'WARNING',
      }

      const explanation = explainCheckRule(rule)

      expect(explanation).toContain('WARNING')
    })

    it('should explain INFO severity', () => {
      const rule: CheckRule = {
        id: 'INFO_MESSAGE',
        description: 'Informational message',
        objectType: 'HOURLY',
        severity: 'INFO',
      }

      const explanation = explainCheckRule(rule)

      expect(explanation).toContain('INFO')
    })
  })

  describe('integration', () => {
    it('should produce clear explanations for regulatory workflows', () => {
      const req: RequiredParameter = {
        locationId: 'U1',
        parameter: 'SO2M',
        method: 'CEM',
        requiredBy: ['ARP', 'CSAPR_SO2'],
        reason: 'SO2 mass monitoring required for compliance',
      }

      const rule: CheckRule = {
        id: 'SUMVAL_MISMATCH',
        description: 'Summary value does not reconcile with hourly data',
        objectType: 'SUMMARY',
        severity: 'ERROR',
      }

      const reqExplanation = explainRequiredParameter(req)
      const ruleExplanation = explainCheckRule(rule)

      // Both should be readable strings
      expect(reqExplanation.length).toBeGreaterThan(50)
      expect(ruleExplanation.length).toBeGreaterThan(20)

      // Both should contain key information
      expect(reqExplanation).toContain('report')
      expect(ruleExplanation).toContain('Check')
    })
  })
})
