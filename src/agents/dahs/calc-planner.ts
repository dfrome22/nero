/**
 * Calc Planner Agent
 *
 * Turns abstract regulatory requirements into concrete plans for the DAHS calculation engine.
 *
 * A Nero agent uses this to:
 * - Inspect RequiredParameter entries from Reg-Brain
 * - Decide between CEM vs AD vs LME vs FSA paths
 * - Emit MethodConfig entries for the DAHS MonitoringPlan
 * - Propose unit tests for edge cases (e.g., LME NOXR = sum(NOXM) / sum(HI))
 */

import type {
  MonitoringPlan,
  RequiredParameter,
  MethodPlan,
  TestCase,
  CalculationPlan,
} from '../../types/dahs-domain'

export function createCalculationPlan(
  mp: MonitoringPlan,
  required: RequiredParameter[]
): CalculationPlan {
  const methodPlans: MethodPlan[] = []
  const testCases: TestCase[] = []

  // Create method plans from required parameters
  for (const req of required) {
    methodPlans.push({
      locationId: req.locationId,
      parameter: req.parameter,
      method: req.method,
      notes: [req.reason, `Required by programs: ${req.requiredBy.join(', ')}`],
    })
  }

  // Generate test cases based on monitoring plan and requirements
  testCases.push(...generateTestCases(mp, required))

  return { methodPlans, testCases }
}

function generateTestCases(mp: MonitoringPlan, required: RequiredParameter[]): TestCase[] {
  const testCases: TestCase[] = []

  // Add standard test cases based on parameters
  const parameterSet = new Set(required.map((r) => r.parameter))

  // SO2M test cases
  if (parameterSet.has('SO2M')) {
    testCases.push({
      name: 'example-so2m-summary-test',
      description: 'Checks that quarterly SO2M summary equals sum of hourly SO2M / 2000.',
      inputs: {
        hourlyData: [
          { hour: 1, so2Mass: 100 },
          { hour: 2, so2Mass: 150 },
        ],
      },
      expected: {
        quarterlySummary: 0.125, // (100 + 150) / 2000
      },
    })
  }

  // Heat Input test cases
  if (parameterSet.has('HIT')) {
    testCases.push({
      name: 'heat-input-calculation-test',
      description: 'Verifies heat input calculation using F-factor methodology.',
      inputs: {
        flow: 100000, // scfh
        o2Pct: 3.0,
        fFactor: 1040, // Fd for natural gas
      },
      expected: {
        heatInput: 'calculated per 40 CFR 75 Appendix F',
      },
    })
  }

  // NOx Rate test cases
  if (parameterSet.has('NOXR')) {
    testCases.push({
      name: 'nox-rate-calculation-test',
      description:
        'Verifies NOx emission rate calculation (lb/MMBtu) from NOx mass and heat input.',
      inputs: {
        noxMass: 50, // lb
        heatInput: 1000, // MMBtu
      },
      expected: {
        noxRate: 0.05, // 50 / 1000
      },
    })
  }

  // LME-specific test cases
  const lmeMethods = mp.methods.filter((m) => (m.isLME ?? false) || m.methodCode === 'LME')
  if (lmeMethods.length > 0) {
    for (const method of lmeMethods) {
      if (method.parameter === 'NOXR') {
        testCases.push({
          name: 'lme-noxr-calculation-test',
          description: 'LME NOXR = sum(NOXM) / sum(HI) for the quarter',
          inputs: {
            quarterlyNoxMass: 1000, // lb
            quarterlyHeatInput: 50000, // MMBtu
          },
          expected: {
            noxRate: 0.02, // 1000 / 50000
          },
        })
      }
    }
  }

  // Appendix D test cases
  const appendixDMethods = mp.methods.filter((m) => m.methodCode === 'AD')
  if (appendixDMethods.length > 0) {
    testCases.push({
      name: 'appendix-d-so2-calculation-test',
      description: 'Appendix D SO2 calculation from fuel flow and sulfur content',
      inputs: {
        fuelFlow: 1000, // gallons or cf
        sulfurContent: 0.0015, // percent by weight
        fuelFactor: 'K factor for fuel type',
      },
      expected: {
        so2Mass: 'calculated per Appendix D equations',
      },
    })
  }

  // CSAPR-specific test cases
  if (mp.programs.includes('CSAPR_SO2') || mp.programs.includes('CSAPR_NOX_ANN')) {
    testCases.push({
      name: 'csapr-daily-aggregation-test',
      description: 'Verifies daily aggregation of hourly data for CSAPR reporting',
      inputs: {
        hourlyData: Array(24)
          .fill(0)
          .map((_, i) => ({ hour: i, mass: 10 })),
      },
      expected: {
        dailyTotal: 240, // 24 * 10
      },
    })
  }

  return testCases
}
