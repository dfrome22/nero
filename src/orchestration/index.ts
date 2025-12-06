/**
 * NERO Workflow Orchestration
 *
 * Multi-agent workflow orchestration system inspired by fluent builder patterns.
 * Supports agent chaining, parallel execution, conditional routing, and debate mode.
 *
 * @example Basic Usage
 * ```typescript
 * import { WorkflowBuilder, createExecutor } from '@/orchestration'
 *
 * const workflow = new WorkflowBuilder('my-workflow')
 *   .describe('My Analysis')
 *   .askRegsBot('What are Part 75 requirements?', {
 *     id: 'step-1',
 *     name: 'Get Regulations',
 *     inputStrategy: 'none',
 *   })
 *   .askDAHSBot(
 *     (ctx) => `Map these: ${JSON.stringify(ctx.getPreviousOutput())}`,
 *     { id: 'step-2', name: 'Map to DAHS', inputStrategy: 'previous' }
 *   )
 *   .build()
 *
 * const executor = createExecutor(workflow)
 * const result = await executor.start()
 * ```
 *
 * @example Parallel Execution
 * ```typescript
 * builder.parallel([
 *   { agent: 'regsbot', query: 'Query 1' },
 *   { agent: 'dahsbot', query: 'Query 2' },
 * ], { waitForAll: true })
 * ```
 *
 * @example Debate Mode
 * ```typescript
 * builder.debate('regsbot', 'dahsbot', 'Can DAHS handle hourly emissions?', {
 *   maxRounds: 3,
 *   resolutionStrategy: 'consensus',
 * })
 * ```
 *
 * @example Pre-built Workflows
 * ```typescript
 * import { WORKFLOW_CATALOG, createExecutor } from '@/orchestration'
 *
 * const entry = WORKFLOW_CATALOG.find(w => w.id === 'regulatory-impact-analysis')
 * const workflow = entry.create()
 *
 * const executor = createExecutor(workflow)
 * const result = await executor.start()
 * ```
 */

// Workflow Builder
export { WorkflowBuilder } from './workflow-builder'
export type {
  // Identifiers
  AgentId,
  // Step types
  AgentStepDescriptor,
  ConditionalStepDescriptor,
  DebateEvent,
  // Debate types
  DebateResult,
  DebateRound,
  DebateStepDescriptor,
  HumanInputStepDescriptor,
  ParallelStepDescriptor,
  StepDescriptor,
  StepId,
  StepResult,
  StepStatus,
  StepStatusEvent,
  TransformStepDescriptor,
  WorkflowContext,
  // Core types
  WorkflowDefinition,
  // Handlers
  WorkflowEventHandlers,
  WorkflowId,
  WorkflowStatus,
  // Event types
  WorkflowStatusEvent,
} from './workflow-builder'

// Workflow Executor
export { WorkflowExecutor, createExecutor } from './workflow-executor'
export type { WorkflowExecutorState } from './workflow-executor'

// Example Workflows
export {
  // Catalog
  WORKFLOW_CATALOG,
  createConditionalPermitWorkflow,
  createFacilityComplianceWorkflow,
  createFullRequirementsPipelineWorkflow,
  // Workflow factories
  createRegulatoryImpactWorkflow,
  createRequirementDebateWorkflow,
  getWorkflowById,
  getWorkflowsByCategory,
  getWorkflowsForAgent,
} from './example-workflows'
export type { WorkflowCatalogEntry } from './example-workflows'
