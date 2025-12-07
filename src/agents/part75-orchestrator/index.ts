/**
 * Part 75/ECMPS Regulatory Orchestrator
 *
 * Multi-agent system for analyzing monitoring plans and generating DAHS requirements.
 */

import type { MonitoringPlan } from '../../types/ecmps-api'
import type {
  OrchestratorOptions,
  Part75OrchestrationResult,
} from '../../types/part75-orchestrator'
import { CalcPlannerAgent } from './calcplanner-agent'
import { ExplainerAgent } from './explainer-agent'
import { PQAMirrorAgent } from './pqamirror-agent'
import { RegBrainAgent } from './regbrain-agent'

/**
 * Part 75 Orchestrator - Coordinates all four agents
 */
export class Part75Orchestrator {
  private regBrain: RegBrainAgent
  private calcPlanner: CalcPlannerAgent
  private pqaMirror: PQAMirrorAgent
  private explainer: ExplainerAgent

  constructor() {
    this.regBrain = new RegBrainAgent()
    this.calcPlanner = new CalcPlannerAgent()
    this.pqaMirror = new PQAMirrorAgent()
    this.explainer = new ExplainerAgent()
  }

  /**
   * Orchestrate all agents to analyze a monitoring plan
   */
  analyze(
    input: { orisCode?: number; monitoringPlan?: MonitoringPlan; locationId?: string },
    options: OrchestratorOptions = {}
  ): Part75OrchestrationResult {
    // Step 1: RegBrainAgent - Infer regulatory requirements
    const regBrainInput: {
      monitoringPlan?: MonitoringPlan
      orisCode?: number
      locationId?: string
      analysisDepth: 'comprehensive'
    } = {
      analysisDepth: 'comprehensive',
    }
    if (input.orisCode !== undefined) regBrainInput.orisCode = input.orisCode
    if (input.monitoringPlan !== undefined) regBrainInput.monitoringPlan = input.monitoringPlan
    if (input.locationId !== undefined) regBrainInput.locationId = input.locationId

    const regulatoryAnalysis = this.regBrain.analyze(regBrainInput)

    // Step 2: CalcPlannerAgent - Generate calculation plan
    const calculationPlan = this.calcPlanner.plan({
      monitoringRequirements: regulatoryAnalysis.monitoringRequirements,
      programs: regulatoryAnalysis.facilityInfo.programs,
      parameters: regulatoryAnalysis.locations.flatMap((l) => l.parameters),
    })

    // Step 3: PQAMirrorAgent - Generate compliance rules
    const complianceRules = this.pqaMirror.generateRules({
      qaRequirements: regulatoryAnalysis.qaRequirements,
      monitoringRequirements: regulatoryAnalysis.monitoringRequirements,
      calculationPlan: calculationPlan.calculations,
      programs: regulatoryAnalysis.facilityInfo.programs,
    })

    // Step 4: ExplainerAgent - Generate explanation (if requested)
    let explanation
    if (options.includeExplanations !== false) {
      const explainerContext: { facilityName: string; locationId?: string; programs: string[] } = {
        facilityName: regulatoryAnalysis.facilityInfo.facilityName,
        programs: regulatoryAnalysis.facilityInfo.programs,
      }
      if (input.locationId !== undefined) explainerContext.locationId = input.locationId

      explanation = this.explainer.explain({
        subject: 'overall_requirements',
        context: explainerContext,
        detailLevel: options.explanationDetail ?? 'detailed',
      })
    } else {
      // Provide minimal explanation
      explanation = {
        title: 'Part 75 Requirements',
        summary: 'Analysis complete. Enable explanations for detailed information.',
        sections: [],
        keyTakeaways: [],
        citations: [],
      }
    }

    // Combine results
    const resultInput: {
      orisCode?: number
      facilityName: string
      locationId?: string
      analyzedAt: string
    } = {
      facilityName: regulatoryAnalysis.facilityInfo.facilityName,
      analyzedAt: regulatoryAnalysis.analyzedAt,
    }
    if (input.orisCode !== undefined) resultInput.orisCode = input.orisCode
    if (input.locationId !== undefined) resultInput.locationId = input.locationId

    return {
      input: resultInput,
      regulatoryAnalysis,
      calculationPlan,
      complianceRules,
      explanation,
      overallConfidence: regulatoryAnalysis.confidence,
      notes: [
        ...regulatoryAnalysis.warnings,
        `Total monitoring requirements: ${regulatoryAnalysis.monitoringRequirements.length}`,
        `Total calculations: ${calculationPlan.calculations.length}`,
        `Total compliance rules: ${complianceRules.rules.length}`,
      ],
    }
  }
}

// Export singleton instance
export const part75Orchestrator = new Part75Orchestrator()

// Export individual agents
export { RegBrainAgent } from './regbrain-agent'
export { CalcPlannerAgent } from './calcplanner-agent'
export { PQAMirrorAgent } from './pqamirror-agent'
export { ExplainerAgent } from './explainer-agent'

// Export types
export type * from '../../types/part75-orchestrator'
