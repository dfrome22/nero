/**
 * NERO Workflow Executor
 *
 * Executes workflow definitions with full support for:
 * - Sequential and parallel step execution
 * - Agent output chaining
 * - Conditional routing
 * - Debate mode
 * - Event publishing
 * - Cancellation and retry
 */

import type {
  AgentId,
  AgentStepDescriptor,
  ConditionalStepDescriptor,
  DebateEvent,
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
  WorkflowDefinition,
  WorkflowStatus,
  WorkflowStatusEvent,
} from './workflow-builder'

import { DAHSBotService } from '../agents/dahsbot'
import { RegsBotService } from '../agents/regsbot'
// Note: RequirementsBotService requires DAHSProfile - will be registered externally
// import { FigmaBotService } from '../agents/figmabot'
// import { TestingBotService } from '../agents/testingbot'

// ============================================================================
// AGENT REGISTRY
// ============================================================================

interface AgentInterface {
  query: (input: string, context?: unknown) => Promise<unknown>
}

/** Registry of available agents */
class AgentRegistry {
  private agents = new Map<AgentId, AgentInterface>()

  constructor() {
    // Register default agents
    this.registerAgent('regsbot', this.createRegsBotAdapter())
    this.registerAgent('dahsbot', this.createDAHSBotAdapter())
    // RequirementsBot requires DAHSProfile - can be registered via registerAgent
    this.registerAgent('requirementsbot', this.createSimpleRequirementsBotAdapter())
    // TODO: Add figmabot and testingbot when ready
  }

  private createRegsBotAdapter(): AgentInterface {
    const service = new RegsBotService()
    return {
      query: async (input: string): Promise<unknown> => {
        return await service.ask({ question: input })
      },
    }
  }

  private createSimpleRequirementsBotAdapter(): AgentInterface {
    // Simple adapter that does text-based requirements analysis
    // For full capability analysis, register with DAHSProfile
    return {
      query: (_input: string): Promise<unknown> => {
        return Promise.resolve({
          answer: `Requirements analysis for: ${_input}`,
          type: 'requirements' as const,
          source: 'requirementsbot',
          note: 'For full gap analysis, configure RequirementsBotService with DAHSProfile',
        })
      },
    }
  }

  private createDAHSBotAdapter(): AgentInterface {
    const service = new DAHSBotService()
    return {
      query: async (input: string): Promise<unknown> => {
        return await service.query(input)
      },
    }
  }

  registerAgent(id: AgentId, agent: AgentInterface): void {
    this.agents.set(id, agent)
  }

  getAgent(id: AgentId): AgentInterface | undefined {
    return this.agents.get(id)
  }
}

// ============================================================================
// WORKFLOW CONTEXT IMPLEMENTATION
// ============================================================================

function createWorkflowContext(definition: WorkflowDefinition): WorkflowContext {
  const stepResults = new Map<StepId, StepResult>()
  const outputs = new Map<StepId, unknown>()
  const agentOutputs = new Map<AgentId, unknown[]>()
  const variables = new Map(definition.variables)

  const context: WorkflowContext = {
    workflowId: definition.id,
    workflowName: definition.name,
    startedAt: new Date(),
    currentStepIndex: 0,
    stepResults,
    outputs,
    agentOutputs,
    variables,

    getOutput: (stepId: StepId) => outputs.get(stepId),

    getAgentOutput: (agent: AgentId) => {
      const agentOuts = agentOutputs.get(agent)
      return agentOuts?.[agentOuts.length - 1]
    },

    getAllAgentOutputs: (agent: AgentId) => agentOutputs.get(agent) ?? [],

    getPreviousOutput: () => {
      const idx = context.currentStepIndex
      if (idx === 0) return undefined
      const previousStep = definition.steps[idx - 1]
      return previousStep ? outputs.get(previousStep.id) : undefined
    },

    getAllOutputs: () => Array.from(outputs.values()),
  }

  return context
}

// ============================================================================
// WORKFLOW EXECUTOR
// ============================================================================

export interface WorkflowExecutorState {
  status: WorkflowStatus
  currentStepIndex: number
  progress: number
  canRetry: boolean
  canCancel: boolean
}

export class WorkflowExecutor {
  private definition: WorkflowDefinition
  private context: WorkflowContext
  private agentRegistry: AgentRegistry
  private status: WorkflowStatus = 'pending'
  private currentStepIndex = 0
  private abortController: AbortController | null = null
  private lastError: Error | null = null

  constructor(definition: WorkflowDefinition, agentRegistry?: AgentRegistry) {
    this.definition = definition
    this.context = createWorkflowContext(definition)
    this.agentRegistry = agentRegistry ?? new AgentRegistry()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  /** Get current executor state */
  getState(): WorkflowExecutorState {
    return {
      status: this.status,
      currentStepIndex: this.currentStepIndex,
      progress: this.calculateProgress(),
      canRetry: this.canRetry(),
      canCancel: this.canCancel(),
    }
  }

  /** Start workflow execution */
  async start(): Promise<WorkflowContext> {
    if (this.status === 'running') {
      throw new Error('Workflow is already running')
    }

    this.status = 'running'
    this.abortController = new AbortController()
    this.publishWorkflowStatus('running', 'Workflow started')

    try {
      await this.executeSteps()
      this.status = 'completed'
      this.publishWorkflowStatus('completed', 'Workflow completed successfully')
      this.definition.eventHandlers.onWorkflowCompleted?.(this.context)
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error))
      this.status = 'failed'
      this.publishWorkflowStatus('failed', this.lastError.message)
      this.definition.eventHandlers.onWorkflowFailed?.(this.lastError, this.context)
    }

    return this.context
  }

  /** Cancel workflow execution */
  cancel(): void {
    if (this.status !== 'running') return
    this.abortController?.abort()
    this.status = 'cancelled'
    this.publishWorkflowStatus('cancelled', 'Workflow cancelled by user')
  }

  /** Retry from last failed step */
  async retry(): Promise<WorkflowContext> {
    if (!this.canRetry()) {
      throw new Error('Cannot retry: workflow is not in a retryable state')
    }

    this.status = 'running'
    this.abortController = new AbortController()
    this.publishWorkflowStatus('running', 'Retrying from failed step')

    try {
      await this.executeSteps()
      this.status = 'completed'
      this.publishWorkflowStatus('completed', 'Workflow completed successfully')
      this.definition.eventHandlers.onWorkflowCompleted?.(this.context)
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error))
      this.status = 'failed'
      this.publishWorkflowStatus('failed', this.lastError.message)
      this.definition.eventHandlers.onWorkflowFailed?.(this.lastError, this.context)
    }

    return this.context
  }

  /** Check if workflow can be retried */
  canRetry(): boolean {
    if (this.status !== 'failed') return false
    const failedStep = this.definition.steps[this.currentStepIndex]
    return failedStep?.retryable ?? false
  }

  /** Check if workflow can be cancelled */
  canCancel(): boolean {
    return this.status === 'running'
  }

  /** Provide human input for a waiting step */
  async provideHumanInput(_input: string): Promise<void> {
    // This would be called when a human-input step is waiting
    // For now, we'll handle this through the event handler
    await Promise.resolve()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXECUTION ENGINE
  // ─────────────────────────────────────────────────────────────────────────

  private async executeSteps(): Promise<void> {
    for (let i = this.currentStepIndex; i < this.definition.steps.length; i++) {
      // Check for cancellation
      if (this.abortController?.signal.aborted === true) {
        throw new Error('Workflow cancelled')
      }

      this.currentStepIndex = i
      this.context.currentStepIndex = i
      const step = this.definition.steps[i]

      if (step === undefined) continue

      this.publishStepStatus(step.id, step.name, 'running', undefined, 'Executing step')

      try {
        const result = await this.executeStep(step)

        // Store result
        this.context.stepResults.set(step.id, result)
        this.context.outputs.set(step.id, result.output)

        // Track agent outputs
        if ('agent' in step) {
          const agentOutputs = this.context.agentOutputs.get(step.agent) ?? []
          agentOutputs.push(result.output)
          this.context.agentOutputs.set(step.agent, agentOutputs)
        }

        this.publishStepStatus(step.id, step.name, result.status, result.agent, 'Step completed')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        if (step.required) {
          this.publishStepStatus(step.id, step.name, 'failed', undefined, errorMessage)
          throw error
        } else {
          // Non-required step failed, continue with workflow
          this.publishStepStatus(
            step.id,
            step.name,
            'skipped',
            undefined,
            `Skipped: ${errorMessage}`
          )
        }
      }
    }
  }

  private async executeStep(step: StepDescriptor): Promise<StepResult> {
    const startTime = Date.now()

    let output: unknown
    let agent: AgentId | undefined

    switch (step.type) {
      case 'agent':
        output = await this.executeAgentStep(step)
        agent = step.agent
        break

      case 'parallel':
        output = await this.executeParallelStep(step)
        break

      case 'conditional':
        output = await this.executeConditionalStep(step)
        break

      case 'debate':
        output = await this.executeDebateStep(step)
        break

      case 'transform':
        output = await this.executeTransformStep(step)
        break

      case 'human-input':
        output = await this.executeHumanInputStep(step)
        break

      default:
        throw new Error(`Unknown step type: ${(step as StepDescriptor).type}`)
    }

    return {
      stepId: step.id,
      status: 'completed',
      agent: agent ?? undefined,
      output,
      error: undefined,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP EXECUTORS
  // ─────────────────────────────────────────────────────────────────────────

  private async executeAgentStep(step: AgentStepDescriptor): Promise<unknown> {
    const agent = this.agentRegistry.getAgent(step.agent)
    if (!agent) {
      throw new Error(`Agent not found: ${step.agent}`)
    }

    // Resolve query (could be string or function)
    const query = typeof step.query === 'function' ? step.query(this.context) : step.query

    // Build context based on input strategy
    const inputContext = this.buildInputContext(step)

    // Execute with timeout
    const result = await this.withTimeout(agent.query(query, inputContext), step.timeout ?? 30000)

    return result
  }

  private async executeParallelStep(step: ParallelStepDescriptor): Promise<unknown[]> {
    const promises = step.steps.map(async (agentStep) => {
      const agent = this.agentRegistry.getAgent(agentStep.agent)
      if (!agent) {
        throw new Error(`Agent not found: ${agentStep.agent}`)
      }

      const query =
        typeof agentStep.query === 'function' ? agentStep.query(this.context) : agentStep.query

      const inputContext = this.buildInputContext(agentStep)
      return agent.query(query, inputContext)
    })

    if (step.waitForAll) {
      return Promise.all(promises)
    } else {
      // Return first completed result
      const result = await Promise.race(promises)
      return [result]
    }
  }

  private async executeConditionalStep(step: ConditionalStepDescriptor): Promise<unknown> {
    const conditionResult = step.condition(this.context)

    if (conditionResult) {
      return this.executeStep(step.ifTrue)
    } else if (step.ifFalse) {
      return this.executeStep(step.ifFalse)
    } else {
      return null
    }
  }

  private async executeDebateStep(step: DebateStepDescriptor): Promise<DebateResult> {
    const challenger = this.agentRegistry.getAgent(step.challenger)
    const defender = this.agentRegistry.getAgent(step.defender)

    if (!challenger || !defender) {
      throw new Error(`Debate agents not found: ${step.challenger} or ${step.defender}`)
    }

    const topic = typeof step.topic === 'function' ? step.topic(this.context) : step.topic
    const rounds: DebateRound[] = []

    for (let round = 1; round <= step.maxRounds; round++) {
      // Challenger makes argument
      const challengerPrompt =
        round === 1
          ? `Challenge this position: ${topic}. Previous context: ${JSON.stringify(this.context.getPreviousOutput())}`
          : `Respond to defender's argument: ${rounds[round - 2]?.defenderResponse}. Original topic: ${topic}`

      const challengerArgument = (await challenger.query(challengerPrompt)) as { answer?: string }

      this.publishDebateEvent(
        step.id,
        round,
        step.challenger,
        'challenger',
        typeof challengerArgument === 'string'
          ? challengerArgument
          : (challengerArgument.answer ?? JSON.stringify(challengerArgument))
      )

      // Defender responds
      const defenderPrompt = `Defend against this challenge: ${typeof challengerArgument === 'string' ? challengerArgument : challengerArgument.answer}. Topic: ${topic}`
      const defenderResponse = (await defender.query(defenderPrompt)) as { answer?: string }

      this.publishDebateEvent(
        step.id,
        round,
        step.defender,
        'defender',
        typeof defenderResponse === 'string'
          ? defenderResponse
          : (defenderResponse.answer ?? JSON.stringify(defenderResponse))
      )

      rounds.push({
        round,
        challengerArgument:
          typeof challengerArgument === 'string'
            ? challengerArgument
            : (challengerArgument.answer ?? ''),
        defenderResponse:
          typeof defenderResponse === 'string' ? defenderResponse : (defenderResponse.answer ?? ''),
      })
    }

    // Determine winner based on strategy
    const result: DebateResult = { rounds }

    switch (step.resolutionStrategy) {
      case 'challenger-wins':
        result.winner = step.challenger
        break
      case 'defender-wins':
        result.winner = step.defender
        break
      case 'consensus':
        result.consensus = `Debate concluded after ${step.maxRounds} rounds on: ${topic}`
        break
      case 'human-decides':
        // Would wait for human input here
        break
    }

    return result
  }

  private executeTransformStep(step: TransformStepDescriptor): unknown {
    return step.transform(this.context)
  }

  private async executeHumanInputStep(step: HumanInputStepDescriptor): Promise<string> {
    this.publishStepStatus(step.id, step.name, 'waiting-for-input')

    const handler = this.definition.eventHandlers.onHumanInputRequired
    if (!handler) {
      throw new Error('No human input handler registered')
    }

    const prompt = typeof step.prompt === 'function' ? step.prompt(this.context) : step.prompt
    const inputStep = { ...step, prompt }

    return handler(inputStep, this.context)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private buildInputContext(step: AgentStepDescriptor): unknown {
    switch (step.inputStrategy) {
      case 'none':
        return undefined

      case 'previous':
        return this.context.getPreviousOutput()

      case 'all':
        return this.context.getAllOutputs()

      case 'specific':
        return step.inputFromSteps?.map((id) => this.context.getOutput(id))

      case 'latest-by-agent':
        return step.inputFromAgent ? this.context.getAgentOutput(step.inputFromAgent) : undefined

      default:
        return undefined
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Step timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }

  private calculateProgress(): number {
    if (this.definition.steps.length === 0) return 100
    return Math.round((this.currentStepIndex / this.definition.steps.length) * 100)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT PUBLISHING
  // ─────────────────────────────────────────────────────────────────────────

  private publishWorkflowStatus(status: WorkflowStatus, message?: string): void {
    const event: WorkflowStatusEvent = {
      workflowId: this.definition.id,
      workflowName: this.definition.name,
      status,
      message,
      progress: this.calculateProgress(),
      timestamp: new Date(),
    }

    this.definition.eventHandlers.onWorkflowStatusChanged?.(event)
  }

  private publishStepStatus(
    stepId: StepId,
    stepName: string,
    status: StepStatus,
    agent?: AgentId,
    message?: string
  ): void {
    const event: StepStatusEvent = {
      workflowId: this.definition.id,
      stepId,
      stepName,
      status,
      agent,
      message,
      timestamp: new Date(),
    }

    this.definition.eventHandlers.onStepStatusChanged?.(event)
  }

  private publishDebateEvent(
    stepId: StepId,
    round: number,
    speaker: AgentId,
    role: 'challenger' | 'defender',
    message: string
  ): void {
    const event: DebateEvent = {
      workflowId: this.definition.id,
      stepId,
      round,
      speaker,
      role,
      message,
      timestamp: new Date(),
    }

    this.definition.eventHandlers.onDebateMessage?.(event)
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/** Create an executor for a workflow definition */
export function createExecutor(definition: WorkflowDefinition): WorkflowExecutor {
  return new WorkflowExecutor(definition)
}
