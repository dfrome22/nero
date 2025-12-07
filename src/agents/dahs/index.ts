/**
 * DAHS Regulatory Domain Agents
 *
 * These agents work with Part 75/ECMPS monitoring plans to help configure
 * DAHS (Data Acquisition and Handling System) for emissions monitoring.
 *
 * @module agents/dahs
 */

// Reg-Brain Agent - Infer regulatory requirements from monitoring plans
export { inferRegulatoryRequirements } from './reg-brain'
export type {
  RegBrainOutput,
  RequiredParameter,
  QARequirement,
  RequiredObject,
} from '../../types/dahs-domain'

// Calc Planner Agent - Generate calculation plans and test cases
export { createCalculationPlan } from './calc-planner'
export type { CalculationPlan, MethodPlan, TestCase } from '../../types/dahs-domain'

// PQA Mirror Agent - ECMPS compliance check rules
export {
  checkRuleRegistry,
  explainCheckRule as explainPQACheckRule,
  getCheckRulesForObjectType,
  getCheckRulesBySeverity,
  hasCheckRule,
} from './pqa-mirror'
export type { CheckRule } from '../../types/dahs-domain'

// Explainer Agent - Human-readable explanations
export {
  explainRequiredParameter,
  explainCheckRule,
  explainParameterWithContext,
  explainParameterSet,
} from './explainer'

// Re-export domain types
export type {
  MonitoringPlan,
  Location,
  MethodConfig,
  ParameterCode,
  MonitoringMethodCode,
  ProgramCode,
  LocationType,
  ConfigurationType,
} from '../../types/dahs-domain'
