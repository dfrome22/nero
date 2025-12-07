/**
 * CalcPlannerAgent - Calculation Planning for DAHS
 *
 * Generates comprehensive calculation plans based on monitoring requirements.
 */

import type { CalculationRequirement } from '../../types/orchestration'
import type {
  CalcPlannerInput,
  CalcPlannerOutput,
  CalculationPlanItem,
} from '../../types/part75-orchestrator'

export class CalcPlannerAgent {
  /**
   * Generate a calculation plan from monitoring requirements
   */
  plan(input: CalcPlannerInput): CalcPlannerOutput {
    const { monitoringRequirements, parameters } = input

    const parameterSet = new Set(parameters)
    const calculations: CalculationPlanItem[] = []
    let idCounter = 1

    // Step 1: Generate hourly average calculations for all CEM parameters
    for (const req of monitoringRequirements) {
      if (req.methodCode === 'CEM') {
        calculations.push({
          id: `calc-${idCounter++}`,
          name: `Hourly Average ${req.parameter}`,
          calculationType: 'hourly_average',
          inputs: [req.systemType],
          output: `${req.systemType}_HOURLY_AVG`,
          units: this.getParameterUnits(req.systemType),
          frequency: 'hourly',
          regulatoryBasis: '40 CFR 75.10',
          dependencies: [],
          executionOrder: 1,
        })
      }
    }

    // Step 2: Heat Input calculation if we have flow and diluent
    if (parameterSet.has('FLOW') && (parameterSet.has('O2') || parameterSet.has('CO2'))) {
      calculations.push({
        id: `calc-${idCounter++}`,
        name: 'Heat Input Calculation',
        calculationType: 'heat_input',
        inputs: ['FLOW_HOURLY_AVG', 'O2_HOURLY_AVG', 'Temperature'],
        output: 'HI',
        units: 'MMBtu',
        frequency: 'hourly',
        formula: 'HI = Qh × Fd × (20.9/(20.9 - %O2)) × 10^-6',
        regulatoryBasis: '40 CFR 75 Appendix F',
        dependencies: ['FLOW_HOURLY_AVG', 'O2_HOURLY_AVG'],
        executionOrder: 2,
      })
    }

    // Step 3: Mass emission calculations for ARP/CSAPR parameters
    if (parameterSet.has('SO2') && parameterSet.has('FLOW')) {
      calculations.push({
        id: `calc-${idCounter++}`,
        name: 'SO2 Mass Emissions',
        calculationType: 'mass_emission',
        inputs: ['SO2_HOURLY_AVG', 'FLOW_HOURLY_AVG'],
        output: 'SO2_MASS',
        units: 'lb/hr',
        frequency: 'hourly',
        formula: 'SO2 Mass = Concentration × Flow × K',
        regulatoryBasis: '40 CFR 75 Appendix F',
        dependencies: ['SO2_HOURLY_AVG', 'FLOW_HOURLY_AVG'],
        executionOrder: 3,
      })
    }

    if (parameterSet.has('NOX') && parameterSet.has('FLOW')) {
      calculations.push({
        id: `calc-${idCounter++}`,
        name: 'NOx Mass Emissions',
        calculationType: 'mass_emission',
        inputs: ['NOX_HOURLY_AVG', 'FLOW_HOURLY_AVG'],
        output: 'NOX_MASS',
        units: 'lb/hr',
        frequency: 'hourly',
        formula: 'NOx Mass = Concentration × Flow × K',
        regulatoryBasis: '40 CFR 75 Appendix F',
        dependencies: ['NOX_HOURLY_AVG', 'FLOW_HOURLY_AVG'],
        executionOrder: 3,
      })
    }

    if (parameterSet.has('CO2') && parameterSet.has('FLOW')) {
      calculations.push({
        id: `calc-${idCounter++}`,
        name: 'CO2 Mass Emissions',
        calculationType: 'mass_emission',
        inputs: ['CO2_HOURLY_AVG', 'FLOW_HOURLY_AVG'],
        output: 'CO2_MASS',
        units: 'tons/hr',
        frequency: 'hourly',
        regulatoryBasis: '40 CFR 75 Subpart G',
        dependencies: ['CO2_HOURLY_AVG', 'FLOW_HOURLY_AVG'],
        executionOrder: 3,
      })
    }

    // Step 4: Emission rate calculations
    if (parameterSet.has('NOX')) {
      const hasHeatInput = calculations.some((c) => c.output === 'HI')
      if (hasHeatInput) {
        calculations.push({
          id: `calc-${idCounter++}`,
          name: 'NOx Emission Rate',
          calculationType: 'emission_rate',
          inputs: ['NOX_MASS', 'HI'],
          output: 'NOX_RATE',
          units: 'lb/MMBtu',
          frequency: 'hourly',
          formula: 'NOx Rate = NOx Mass / Heat Input',
          regulatoryBasis: '40 CFR 75.10(d)',
          dependencies: ['NOX_MASS', 'HI'],
          executionOrder: 4,
        })
      }
    }

    // Step 5: Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(calculations)

    // Step 6: Sort calculations by execution order
    const executionSequence = this.topologicalSort(calculations, dependencyGraph)

    // Step 7: Build summary
    const summary = this.buildSummary(calculations)

    // Step 8: Convert to CalculationRequirement format
    const requirements = this.convertToRequirements(calculations)

    return {
      calculations,
      dependencyGraph,
      executionSequence,
      summary,
      requirements,
    }
  }

  /**
   * Build dependency graph from calculations
   */
  private buildDependencyGraph(calculations: CalculationPlanItem[]): Record<string, string[]> {
    const graph: Record<string, string[]> = {}

    for (const calc of calculations) {
      graph[calc.id] = []

      // Find calculations that produce inputs this calculation needs
      const calcGraph = graph[calc.id]
      if (calcGraph !== undefined) {
        for (const dep of calc.dependencies) {
          const provider = calculations.find((c) => c.output === dep)
          if (provider !== undefined) {
            calcGraph.push(provider.id)
          }
        }
      }
    }

    return graph
  }

  /**
   * Topological sort to determine execution order
   */
  private topologicalSort(
    calculations: CalculationPlanItem[],
    dependencyGraph: Record<string, string[]>
  ): string[] {
    const sorted: string[] = []
    const visited = new Set<string>()

    const visit = (calcId: string): void => {
      if (visited.has(calcId)) return
      visited.add(calcId)

      // Visit dependencies first
      const deps = dependencyGraph[calcId] ?? []
      for (const dep of deps) {
        visit(dep)
      }

      sorted.push(calcId)
    }

    // Visit all calculations
    for (const calc of calculations) {
      visit(calc.id)
    }

    return sorted
  }

  /**
   * Build summary statistics
   */
  private buildSummary(calculations: CalculationPlanItem[]): CalcPlannerOutput['summary'] {
    return {
      hourlyAverages: calculations.filter((c) => c.calculationType === 'hourly_average').length,
      heatInputCalcs: calculations.filter((c) => c.calculationType === 'heat_input').length,
      massEmissionCalcs: calculations.filter((c) => c.calculationType === 'mass_emission').length,
      emissionRateCalcs: calculations.filter((c) => c.calculationType === 'emission_rate').length,
      qaCalcs: calculations.filter((c) => c.calculationType === 'qa_calculation').length,
      other: calculations.filter(
        (c) =>
          ![
            'hourly_average',
            'heat_input',
            'mass_emission',
            'emission_rate',
            'qa_calculation',
          ].includes(c.calculationType)
      ).length,
    }
  }

  /**
   * Convert calculation plan items to CalculationRequirement format
   */
  private convertToRequirements(calculations: CalculationPlanItem[]): CalculationRequirement[] {
    return calculations.map((calc) => {
      const req: CalculationRequirement = {
        id: calc.id,
        name: calc.name,
        calculationType: calc.calculationType as
          | 'hourly_average'
          | 'heat_input'
          | 'mass_emission'
          | 'emission_rate'
          | 'custom',
        inputParameters: calc.inputs,
        outputParameter: calc.output,
        outputUnits: calc.units,
        frequency:
          calc.frequency === 'continuous' || calc.frequency === 'on_demand'
            ? 'hourly'
            : calc.frequency,
        regulatoryBasis: calc.regulatoryBasis,
        notes: [],
      }
      if (calc.formula !== undefined) req.formula = calc.formula
      return req
    })
  }

  /**
   * Get units for parameter
   */
  private getParameterUnits(code: string): string {
    const units: Record<string, string> = {
      SO2: 'ppm',
      NOX: 'ppm',
      CO2: 'percent',
      O2: 'percent',
      FLOW: 'scfh',
      H2O: 'percent',
      HG: 'µg/scm',
      HCL: 'ppm',
    }
    return units[code] ?? 'units'
  }
}
