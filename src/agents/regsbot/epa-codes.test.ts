import { describe, expect, it } from 'vitest'
import {
  FORMULA_CODES,
  MONITORING_METHOD_CODES,
  PARAMETER_CODES,
  QA_REQUIREMENTS,
  QUALIFICATION_CODES,
  SUBSTITUTE_DATA_CODES,
  SUBSTITUTE_DATA_PERCENTILE_TIERS,
  explainFormulaForDAHS,
  explainMethodForDAHS,
  findFormulasByParameter,
  findMethodsByParameter,
  getFormula,
  getFormulaCFR,
  getMethodCFR,
  getMonitoringMethod,
  getParameter,
  getPercentileTier,
  getPercentileTiers,
  getQARequirements,
} from './epa-codes'

describe('EPA Monitoring Method Codes', () => {
  describe('MONITORING_METHOD_CODES', () => {
    it('contains CEM method with correct CFR reference', () => {
      const cem = MONITORING_METHOD_CODES.CEM
      expect(cem).toBeDefined()
      if (!cem) throw new Error('CEM not found')
      expect(cem.code).toBe('CEM')
      expect(cem.cfr).toContain('40 CFR 75')
      expect(cem.parameters).toContain('SO2')
      expect(cem.parameters).toContain('NOX')
      expect(cem.dahsRequirements).toContain('DAHS')
    })

    it('contains AD (Appendix D) method for fuel-based monitoring', () => {
      const ad = MONITORING_METHOD_CODES.AD
      expect(ad).toBeDefined()
      if (!ad) throw new Error('AD not found')
      expect(ad.code).toBe('AD')
      expect(ad.cfr).toContain('Appendix D')
      expect(ad.parameters).toContain('SO2')
      expect(ad.parameters).toContain('CO2')
      expect(ad.parameters).toContain('HI')
    })

    it('contains LME (Low Mass Emissions) method with §75.19 reference', () => {
      const lme = MONITORING_METHOD_CODES.LME
      expect(lme).toBeDefined()
      if (!lme) throw new Error('LME not found')
      expect(lme.cfr).toContain('75.19')
      expect(lme.dahsRequirements).toContain('fuel-based')
    })

    it('contains NOXR method with §75.12 reference', () => {
      const noxr = MONITORING_METHOD_CODES.NOXR
      expect(noxr).toBeDefined()
      if (!noxr) throw new Error('NOXR not found')
      expect(noxr.cfr).toContain('75.12')
      expect(noxr.parameters).toContain('NOX')
    })

    it('has DAHS requirements for each method', () => {
      for (const [, method] of Object.entries(MONITORING_METHOD_CODES)) {
        expect(method.dahsRequirements).toBeTruthy()
        expect(method.dahsRequirements.length).toBeGreaterThan(20)
      }
    })
  })

  describe('FORMULA_CODES', () => {
    it('contains D-5 SO2 formula for gas default rate', () => {
      const d5 = FORMULA_CODES['D-5']
      expect(d5).toBeDefined()
      if (!d5) throw new Error('D-5 not found')
      expect(d5.appendix).toBe('Appendix D')
      expect(d5.parameters).toContain('SO2')
      expect(d5.dahsCalculation).toContain('0.0006')
    })

    it('contains F-20 heat input formula', () => {
      const f20 = FORMULA_CODES['F-20']
      expect(f20).toBeDefined()
      if (!f20) throw new Error('F-20 not found')
      expect(f20.appendix).toBe('Appendix F')
      expect(f20.parameters).toContain('HI')
      expect(f20.dahsCalculation).toContain('GCV')
    })

    it('contains G-4 CO2 formula from fuel', () => {
      const g4 = FORMULA_CODES['G-4']
      expect(g4).toBeDefined()
      if (!g4) throw new Error('G-4 not found')
      expect(g4.appendix).toBe('Appendix G')
      expect(g4.parameters).toContain('CO2')
      expect(g4.dahsCalculation).toContain('1040')
    })

    it('contains 19-1 NOx rate formula', () => {
      const f191 = FORMULA_CODES['19-1']
      expect(f191).toBeDefined()
      if (!f191) throw new Error('19-1 not found')
      expect(f191.cfr).toContain('Appendix F')
      expect(f191.parameters).toContain('NOXR')
    })

    it('contains F-24A NOx mass formula', () => {
      const f24a = FORMULA_CODES['F-24A']
      expect(f24a).toBeDefined()
      if (!f24a) throw new Error('F-24A not found')
      expect(f24a.equation).toContain('NOXR')
      expect(f24a.equation).toContain('HI')
    })

    it('has calculation instructions for each formula', () => {
      for (const [, formula] of Object.entries(FORMULA_CODES)) {
        expect(formula.dahsCalculation).toBeTruthy()
        expect(formula.dahsCalculation.length).toBeGreaterThan(20)
      }
    })
  })

  describe('PARAMETER_CODES', () => {
    it('contains SO2 parameter with §75.11 reference', () => {
      const so2 = PARAMETER_CODES.SO2
      expect(so2).toBeDefined()
      if (!so2) throw new Error('SO2 not found')
      expect(so2.cfr).toContain('75.11')
      expect(so2.units).toContain('lb')
    })

    it('contains NOX parameter with §75.12 reference', () => {
      const nox = PARAMETER_CODES.NOX
      expect(nox).toBeDefined()
      if (!nox) throw new Error('NOX not found')
      expect(nox.cfr).toContain('75.12')
    })

    it('contains NOXR parameter with emission rate units', () => {
      const noxr = PARAMETER_CODES.NOXR
      expect(noxr).toBeDefined()
      if (!noxr) throw new Error('NOXR not found')
      expect(noxr.units).toContain('lb/mmBtu')
    })

    it('contains HI parameter with heat input units', () => {
      const hi = PARAMETER_CODES.HI
      expect(hi).toBeDefined()
      if (!hi) throw new Error('HI not found')
      expect(hi.units).toContain('mmBtu')
    })

    it('contains OP operating time parameter', () => {
      const op = PARAMETER_CODES.OP
      expect(op).toBeDefined()
      if (!op) throw new Error('OP not found')
      expect(op.cfr).toContain('75.57')
    })
  })

  describe('SUBSTITUTE_DATA_CODES', () => {
    it('contains SPTS with Subpart D reference', () => {
      const spts = SUBSTITUTE_DATA_CODES.SPTS
      expect(spts).toBeDefined()
      if (!spts) throw new Error('SPTS not found')
      expect(spts.cfr).toContain('Subpart D')
      expect(spts.dahsRequirements).toContain('90th percentile')
      expect(spts.dahsRequirements).toContain('2,160')
    })
  })

  describe('QUALIFICATION_CODES', () => {
    it('contains GF gas-fired qualification with §75.19', () => {
      const gf = QUALIFICATION_CODES.GF
      expect(gf).toBeDefined()
      if (!gf) throw new Error('GF not found')
      expect(gf.cfr).toContain('75.19')
      expect(gf.benefits).toContain('90%')
    })
  })
})

describe('Helper Functions', () => {
  describe('getMonitoringMethod', () => {
    it('returns method by exact code', () => {
      const cem = getMonitoringMethod('CEM')
      expect(cem?.code).toBe('CEM')
    })

    it('handles lowercase codes', () => {
      const ad = getMonitoringMethod('ad')
      expect(ad?.code).toBe('AD')
    })

    it('returns undefined for unknown codes', () => {
      expect(getMonitoringMethod('UNKNOWN')).toBeUndefined()
    })
  })

  describe('getFormula', () => {
    it('returns formula by code with hyphen', () => {
      const d5 = getFormula('D-5')
      expect(d5?.code).toBe('D-5')
    })

    it('returns formula by numeric code', () => {
      const f191 = getFormula('19-1')
      expect(f191?.code).toBe('19-1')
    })

    it('returns undefined for unknown codes', () => {
      expect(getFormula('X-99')).toBeUndefined()
    })
  })

  describe('getParameter', () => {
    it('returns parameter by code', () => {
      const so2 = getParameter('SO2')
      expect(so2?.code).toBe('SO2')
    })

    it('handles lowercase', () => {
      const nox = getParameter('nox')
      expect(nox?.code).toBe('NOX')
    })
  })

  describe('findMethodsByParameter', () => {
    it('finds methods for SO2', () => {
      const methods = findMethodsByParameter('SO2')
      expect(methods.length).toBeGreaterThan(0)
      expect(methods.some((m) => m.code === 'CEM')).toBe(true)
      expect(methods.some((m) => m.code === 'AD')).toBe(true)
    })

    it('finds methods for NOX', () => {
      const methods = findMethodsByParameter('NOX')
      expect(methods.length).toBeGreaterThan(0)
      expect(methods.some((m) => m.code === 'CEM')).toBe(true)
    })

    it('finds methods for HI', () => {
      const methods = findMethodsByParameter('HI')
      expect(methods.length).toBeGreaterThan(0)
      expect(methods.some((m) => m.code === 'AD')).toBe(true)
    })
  })

  describe('findFormulasByParameter', () => {
    it('finds formulas for SO2', () => {
      const formulas = findFormulasByParameter('SO2')
      expect(formulas.length).toBeGreaterThan(0)
      expect(formulas.some((f) => f.code === 'D-5')).toBe(true)
    })

    it('finds formulas for NOXR', () => {
      const formulas = findFormulasByParameter('NOXR')
      expect(formulas.length).toBeGreaterThan(0)
      expect(formulas.some((f) => f.code === 'F-1' || f.code === '19-1')).toBe(true)
    })

    it('finds formulas for HI', () => {
      const formulas = findFormulasByParameter('HI')
      expect(formulas.length).toBeGreaterThan(0)
      expect(formulas.some((f) => f.code === 'F-20')).toBe(true)
    })
  })

  describe('getMethodCFR', () => {
    it('returns CFR for known method', () => {
      expect(getMethodCFR('CEM')).toContain('40 CFR 75')
    })

    it('returns default for unknown method', () => {
      expect(getMethodCFR('UNKNOWN')).toContain('40 CFR 75')
    })
  })

  describe('getFormulaCFR', () => {
    it('returns CFR for known formula', () => {
      expect(getFormulaCFR('D-5')).toContain('Appendix D')
    })

    it('returns default for unknown formula', () => {
      expect(getFormulaCFR('X-99')).toContain('Appendix F')
    })
  })

  describe('explainMethodForDAHS', () => {
    it('explains CEM method with DAHS requirements', () => {
      const explanation = explainMethodForDAHS('CEM')
      expect(explanation).toContain('CEM')
      expect(explanation).toContain('Continuous Emission Monitoring')
      expect(explanation).toContain('40 CFR 75')
      expect(explanation).toContain('DAHS')
    })

    it('explains AD method with fuel-based context', () => {
      const explanation = explainMethodForDAHS('AD')
      expect(explanation).toContain('Appendix D')
      expect(explanation).toContain('fuel flow')
    })

    it('returns message for unknown code', () => {
      const explanation = explainMethodForDAHS('UNKNOWN')
      expect(explanation).toContain('Unknown')
    })
  })

  describe('explainFormulaForDAHS', () => {
    it('explains D-5 formula with SO2 calculation', () => {
      const explanation = explainFormulaForDAHS('D-5')
      expect(explanation).toContain('D-5')
      expect(explanation).toContain('SO2')
      expect(explanation).toContain('Appendix D')
    })

    it('explains F-20 formula with heat input calculation', () => {
      const explanation = explainFormulaForDAHS('F-20')
      expect(explanation).toContain('F-20')
      expect(explanation).toContain('Heat Input')
      expect(explanation).toContain('GCV')
    })

    it('returns message for unknown code', () => {
      const explanation = explainFormulaForDAHS('X-99')
      expect(explanation).toContain('Unknown')
    })
  })
})

describe('Monitoring Plan JSON Compatibility', () => {
  // These tests verify our codes match real monitoring plan data structure
  it('method codes match monitoringMethodData.monitoringMethodCode pattern', () => {
    const sampleCodes = ['CEM', 'AD', 'AE', 'LME', 'NOXR', 'EXP']
    for (const code of sampleCodes) {
      expect(MONITORING_METHOD_CODES[code]).toBeDefined()
    }
  })

  it('formula codes match monitoringFormulaData.formulaCode pattern', () => {
    const sampleCodes = ['D-5', 'F-20', 'G-4', '19-1', 'F-24A', 'N-GAS']
    for (const code of sampleCodes) {
      expect(FORMULA_CODES[code]).toBeDefined()
    }
  })

  it('parameter codes match monitoringMethodData.parameterCode pattern', () => {
    const sampleCodes = ['SO2', 'NOX', 'NOXR', 'CO2', 'HI', 'OP', 'FLOW']
    for (const code of sampleCodes) {
      expect(PARAMETER_CODES[code]).toBeDefined()
    }
  })

  it('substitute data codes match monitoringMethodData.substituteDataCode pattern', () => {
    expect(SUBSTITUTE_DATA_CODES.SPTS).toBeDefined()
    expect(SUBSTITUTE_DATA_CODES.MHHI).toBeDefined()
  })

  it('qualification codes match monitoringQualificationData.qualificationTypeCode pattern', () => {
    expect(QUALIFICATION_CODES.GF).toBeDefined()
  })
})

describe('QA Test Requirements', () => {
  describe('QA_REQUIREMENTS structure', () => {
    it('has QA requirements for CEM method', () => {
      const cemQA = QA_REQUIREMENTS.CEM
      expect(cemQA).toBeDefined()
      if (!cemQA) throw new Error('CEM QA not found')
      expect(cemQA.length).toBeGreaterThan(0)
    })

    it('CEM requires RATA test with semi-annual frequency', () => {
      const cemQA = QA_REQUIREMENTS.CEM
      if (!cemQA) throw new Error('CEM QA not found')
      const rata = cemQA.find((t) => t.type === 'RATA')
      expect(rata).toBeDefined()
      if (!rata) throw new Error('RATA not found')
      expect(rata.frequency).toContain('Semi-annual')
      expect(rata.acceptanceCriteria).toContain('7.5%')
      expect(rata.cfr).toContain('75.22')
    })

    it('CEM requires LINEARITY test quarterly', () => {
      const cemQA = QA_REQUIREMENTS.CEM
      if (!cemQA) throw new Error('CEM QA not found')
      const linearity = cemQA.find((t) => t.type === 'LINEARITY')
      expect(linearity).toBeDefined()
      if (!linearity) throw new Error('LINEARITY not found')
      expect(linearity.frequency).toContain('Quarterly')
      expect(linearity.acceptanceCriteria).toContain('5%')
      expect(linearity.cfr).toContain('75.21')
    })

    it('CEM requires DAILY_CAL test daily', () => {
      const cemQA = QA_REQUIREMENTS.CEM
      if (!cemQA) throw new Error('CEM QA not found')
      const dailyCal = cemQA.find((t) => t.type === 'DAILY_CAL')
      expect(dailyCal).toBeDefined()
      if (!dailyCal) throw new Error('DAILY_CAL not found')
      expect(dailyCal.frequency).toContain('Daily')
      expect(dailyCal.acceptanceCriteria).toContain('2.5%')
      expect(dailyCal.cfr).toContain('Appendix B')
    })

    it('has QA requirements for AD method', () => {
      const adQA = QA_REQUIREMENTS.AD
      expect(adQA).toBeDefined()
      if (!adQA) throw new Error('AD QA not found')
      expect(adQA.length).toBeGreaterThan(0)
    })

    it('AD requires annual flowmeter accuracy test', () => {
      const adQA = QA_REQUIREMENTS.AD
      if (!adQA) throw new Error('AD QA not found')
      const flowmeter = adQA.find((t) => t.type === 'FLOWMETER_ACCURACY')
      expect(flowmeter).toBeDefined()
      if (!flowmeter) throw new Error('FLOWMETER_ACCURACY not found')
      expect(flowmeter.frequency).toContain('Annual')
      expect(flowmeter.acceptanceCriteria).toContain('2%')
      expect(flowmeter.cfr).toContain('Appendix D')
    })

    it('AD requires GCV sampling per lot or monthly', () => {
      const adQA = QA_REQUIREMENTS.AD
      if (!adQA) throw new Error('AD QA not found')
      const gcv = adQA.find((t) => t.type === 'GCV_SAMPLING')
      expect(gcv).toBeDefined()
      if (!gcv) throw new Error('GCV_SAMPLING not found')
      expect(gcv.frequency).toMatch(/lot|Monthly/i)
      expect(gcv.cfr).toContain('Appendix D')
    })

    it('has QA requirements for LME method', () => {
      const lmeQA = QA_REQUIREMENTS.LME
      expect(lmeQA).toBeDefined()
      if (!lmeQA) throw new Error('LME QA not found')
      expect(lmeQA.length).toBeGreaterThan(0)
    })

    it('LME requires eligibility verification', () => {
      const lmeQA = QA_REQUIREMENTS.LME
      if (!lmeQA) throw new Error('LME QA not found')
      const eligibility = lmeQA.find((t) => t.type === 'LME_ELIGIBILITY')
      expect(eligibility).toBeDefined()
      if (!eligibility) throw new Error('LME_ELIGIBILITY not found')
      expect(eligibility.acceptanceCriteria).toContain('25 tons')
      expect(eligibility.cfr).toContain('75.19')
    })
  })

  describe('getQARequirements helper', () => {
    it('returns QA tests for CEM method', () => {
      const tests = getQARequirements('CEM')
      expect(tests.length).toBeGreaterThan(0)
      expect(tests.some((t) => t.type === 'RATA')).toBe(true)
    })

    it('handles lowercase method codes', () => {
      const tests = getQARequirements('cem')
      expect(tests.length).toBeGreaterThan(0)
    })

    it('returns empty array for unknown method', () => {
      const tests = getQARequirements('UNKNOWN')
      expect(tests).toEqual([])
    })
  })
})

describe('Substitute Data Percentile Tiers', () => {
  describe('SUBSTITUTE_DATA_PERCENTILE_TIERS structure', () => {
    it('has 3 tiers covering 0-2160 hours', () => {
      expect(SUBSTITUTE_DATA_PERCENTILE_TIERS.length).toBe(3)
    })

    it('first tier (0-24 hours) uses 90th percentile', () => {
      const tier1 = SUBSTITUTE_DATA_PERCENTILE_TIERS[0]
      if (!tier1) throw new Error('tier1 not found')
      expect(tier1.hoursRange).toBe('0-24')
      expect(tier1.minHours).toBe(0)
      expect(tier1.maxHours).toBe(24)
      expect(tier1.percentile).toBe('90th')
    })

    it('second tier (25-720 hours) uses 95th percentile', () => {
      const tier2 = SUBSTITUTE_DATA_PERCENTILE_TIERS[1]
      if (!tier2) throw new Error('tier2 not found')
      expect(tier2.hoursRange).toBe('25-720')
      expect(tier2.minHours).toBe(25)
      expect(tier2.maxHours).toBe(720)
      expect(tier2.percentile).toBe('95th')
    })

    it('third tier (721-2160 hours) uses maximum', () => {
      const tier3 = SUBSTITUTE_DATA_PERCENTILE_TIERS[2]
      if (!tier3) throw new Error('tier3 not found')
      expect(tier3.hoursRange).toBe('721-2160')
      expect(tier3.minHours).toBe(721)
      expect(tier3.maxHours).toBe(2160)
      expect(tier3.percentile).toBe('maximum')
    })
  })

  describe('getPercentileTier helper', () => {
    it('returns 90th percentile tier for 10 missing hours', () => {
      const tier = getPercentileTier(10)
      expect(tier).toBeDefined()
      if (!tier) throw new Error('tier not found')
      expect(tier.percentile).toBe('90th')
    })

    it('returns 95th percentile tier for 100 missing hours', () => {
      const tier = getPercentileTier(100)
      expect(tier).toBeDefined()
      if (!tier) throw new Error('tier not found')
      expect(tier.percentile).toBe('95th')
    })

    it('returns maximum tier for 1000 missing hours', () => {
      const tier = getPercentileTier(1000)
      expect(tier).toBeDefined()
      if (!tier) throw new Error('tier not found')
      expect(tier.percentile).toBe('maximum')
    })

    it('returns undefined for hours beyond 2160', () => {
      const tier = getPercentileTier(3000)
      expect(tier).toBeUndefined()
    })
  })

  describe('getPercentileTiers helper', () => {
    it('returns all 3 tiers', () => {
      const tiers = getPercentileTiers()
      expect(tiers.length).toBe(3)
    })
  })
})
