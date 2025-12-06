/**
 * NERO Workflow Orchestrator
 *
 * Fluent builder for multi-agent workflow orchestration.
 * Inspired by WPF workflow patterns but extended for AI agent coordination.
 *
 * Features:
 * - Agent output chaining (context flows between agents)
 * - Parallel execution (independent agents run together)
 * - Conditional routing (if/then/else based on agent responses)
 * - "Debate" mode (agents can challenge each other's outputs)
 * - Event-driven progress tracking
 */

// ============================================================================
// TYPES
// ============================================================================

/** Unique identifier for workflow instances */
export type WorkflowId = string

/** Unique identifier for workflow steps */
export type StepId = string

/** Agent identifiers */
export type AgentId = 'regsbot' | 'requirementsbot' | 'dahsbot' | 'figmabot' | 'testingbot'

/** Status of a workflow */
export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

/** Status of a workflow step */
export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'waiting-for-input'

/** How to handle input from previous steps */
export type InputStrategy =
  | 'none' // No input from previous steps
  | 'previous' // Output from immediately previous step
  | 'all' // Accumulated outputs from all previous steps
  | 'specific' // Specific step IDs (use inputFromSteps)
  | 'latest-by-agent' // Latest output from specific agent

/** Step execution mode */
export type ExecutionMode =
  | 'sequential' // Wait for previous step to complete
  | 'parallel' // Run alongside other parallel steps
  | 'conditional' // Only run if condition is met
  | 'debate' // Challenge previous agent's output

// ============================================================================
// STEP DESCRIPTORS
// ============================================================================

/** Base descriptor for all step types */
export interface BaseStepDescriptor {
  id: StepId
  name: string
  description: string | undefined
  timeout: number | undefined // milliseconds
  required: boolean
  retryable: boolean
  maxRetries: number | undefined
}

/** Agent step - queries an agent */
export interface AgentStepDescriptor extends BaseStepDescriptor {
  type: 'agent'
  agent: AgentId
  query: string | ((context: WorkflowContext) => string)
  inputStrategy: InputStrategy
  inputFromSteps: StepId[] | undefined
  inputFromAgent: AgentId | undefined
}

/** Parallel step - runs multiple steps concurrently */
export interface ParallelStepDescriptor extends BaseStepDescriptor {
  type: 'parallel'
  steps: AgentStepDescriptor[]
  waitForAll: boolean // true = wait for all, false = proceed when first completes
}

/** Conditional step - branching logic */
export interface ConditionalStepDescriptor extends BaseStepDescriptor {
  type: 'conditional'
  condition: (context: WorkflowContext) => boolean
  ifTrue: StepDescriptor
  ifFalse: StepDescriptor | undefined
}

/** Debate step - agents challenge each other */
export interface DebateStepDescriptor extends BaseStepDescriptor {
  type: 'debate'
  challenger: AgentId
  defender: AgentId
  topic: string | ((context: WorkflowContext) => string)
  maxRounds: number
  resolutionStrategy: 'challenger-wins' | 'defender-wins' | 'consensus' | 'human-decides'
}

/** Transform step - process/combine outputs */
export interface TransformStepDescriptor extends BaseStepDescriptor {
  type: 'transform'
  transform: (context: WorkflowContext) => unknown
}

/** Human input step - wait for user decision */
export interface HumanInputStepDescriptor extends BaseStepDescriptor {
  type: 'human-input'
  prompt: string | ((context: WorkflowContext) => string)
  options: string[] | undefined
  allowFreeform: boolean
}

/** Union of all step types */
export type StepDescriptor =
  | AgentStepDescriptor
  | ParallelStepDescriptor
  | ConditionalStepDescriptor
  | DebateStepDescriptor
  | TransformStepDescriptor
  | HumanInputStepDescriptor

// ============================================================================
// STEP RESULTS
// ============================================================================

/** Result from a single step */
export interface StepResult {
  stepId: StepId
  status: StepStatus
  agent: AgentId | undefined
  output: unknown
  error: string | undefined
  duration: number // milliseconds
  timestamp: Date
  metadata?: Record<string, unknown>
}

/** Result from a debate */
export interface DebateResult {
  rounds: DebateRound[]
  winner?: AgentId
  consensus?: string
  humanDecision?: string
}

export interface DebateRound {
  round: number
  challengerArgument: string
  defenderResponse: string
  challengerRebuttal?: string
}

// ============================================================================
// WORKFLOW CONTEXT
// ============================================================================

/** Accumulated context throughout workflow execution */
export interface WorkflowContext {
  workflowId: WorkflowId
  workflowName: string
  startedAt: Date
  currentStepIndex: number

  /** All step results so far */
  stepResults: Map<StepId, StepResult>

  /** Quick access to outputs by step ID */
  outputs: Map<StepId, unknown>

  /** Quick access to outputs by agent */
  agentOutputs: Map<AgentId, unknown[]>

  /** Custom data injected into workflow */
  variables: Map<string, unknown>

  /** Get output from a specific step */
  getOutput: (stepId: StepId) => unknown

  /** Get latest output from an agent */
  getAgentOutput: (agent: AgentId) => unknown

  /** Get all outputs from an agent */
  getAllAgentOutputs: (agent: AgentId) => unknown[]

  /** Get output from previous step */
  getPreviousOutput: () => unknown

  /** Get all outputs as array */
  getAllOutputs: () => unknown[]
}

// ============================================================================
// EVENTS
// ============================================================================

/** Workflow-level status change */
export interface WorkflowStatusEvent {
  workflowId: WorkflowId
  workflowName: string
  status: WorkflowStatus
  message: string | undefined
  progress: number // 0-100
  timestamp: Date
}

/** Step-level status change */
export interface StepStatusEvent {
  workflowId: WorkflowId
  stepId: StepId
  stepName: string
  status: StepStatus
  agent: AgentId | undefined
  message: string | undefined
  output?: unknown
  timestamp: Date
}

/** Debate event */
export interface DebateEvent {
  workflowId: WorkflowId
  stepId: StepId
  round: number
  speaker: AgentId
  role: 'challenger' | 'defender'
  message: string
  timestamp: Date
}

/** Event handlers */
export interface WorkflowEventHandlers {
  onWorkflowStatusChanged?: (event: WorkflowStatusEvent) => void
  onStepStatusChanged?: (event: StepStatusEvent) => void
  onDebateMessage?: (event: DebateEvent) => void
  onWorkflowCompleted?: (context: WorkflowContext) => void
  onWorkflowFailed?: (error: Error, context: WorkflowContext) => void
  onHumanInputRequired?: (
    step: HumanInputStepDescriptor,
    context: WorkflowContext
  ) => Promise<string>
}

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

/** Complete workflow definition */
export interface WorkflowDefinition {
  id: WorkflowId
  name: string
  description: string | undefined
  steps: StepDescriptor[]
  variables: Map<string, unknown>
  eventHandlers: WorkflowEventHandlers
  timeout: number | undefined
  createdAt: Date
}

// ============================================================================
// WORKFLOW BUILDER (Fluent API)
// ============================================================================

export class WorkflowBuilder {
  private id: WorkflowId
  private name: string
  private description?: string
  private steps: StepDescriptor[] = []
  private variables = new Map<string, unknown>()
  private eventHandlers: WorkflowEventHandlers = {}
  private timeout?: number
  private stepCounter = 0

  constructor(name: string, id?: WorkflowId) {
    this.name = name
    this.id = id ?? crypto.randomUUID()
  }

  /** Generate a unique step ID */
  private generateStepId(prefix: string): StepId {
    return `${prefix}-${++this.stepCounter}`
  }

  /** Add a description to the workflow */
  describe(description: string): this {
    this.description = description
    return this
  }

  /** Set workflow timeout */
  withTimeout(ms: number): this {
    this.timeout = ms
    return this
  }

  /** Add a variable to the workflow context */
  withVariable(key: string, value: unknown): this {
    this.variables.set(key, value)
    return this
  }

  /** Add multiple variables */
  withVariables(vars: Record<string, unknown>): this {
    for (const [key, value] of Object.entries(vars)) {
      this.variables.set(key, value)
    }
    return this
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP BUILDERS
  // ─────────────────────────────────────────────────────────────────────────

  /** Add an agent query step */
  askAgent(
    agent: AgentId,
    query: string | ((ctx: WorkflowContext) => string),
    options?: Partial<Omit<AgentStepDescriptor, 'type' | 'agent' | 'query'>>
  ): this {
    const step: AgentStepDescriptor = {
      id: options?.id ?? this.generateStepId(agent),
      name: options?.name ?? `Ask ${agent}`,
      type: 'agent',
      agent,
      query,
      inputStrategy: options?.inputStrategy ?? 'previous',
      inputFromSteps: options?.inputFromSteps ?? undefined,
      inputFromAgent: options?.inputFromAgent ?? undefined,
      required: options?.required ?? true,
      retryable: options?.retryable ?? true,
      maxRetries: options?.maxRetries ?? undefined,
      timeout: options?.timeout ?? undefined,
      description: options?.description ?? undefined,
    }
    this.steps.push(step)
    return this
  }

  /** Shorthand for common agents */
  askRegsBot(
    query: string | ((ctx: WorkflowContext) => string),
    options?: Partial<Omit<AgentStepDescriptor, 'type' | 'agent' | 'query'>>
  ): this {
    return this.askAgent('regsbot', query, { name: 'RegsBot Query', ...options })
  }

  askRequirementsBot(
    query: string | ((ctx: WorkflowContext) => string),
    options?: Partial<Omit<AgentStepDescriptor, 'type' | 'agent' | 'query'>>
  ): this {
    return this.askAgent('requirementsbot', query, { name: 'RequirementsBot Query', ...options })
  }

  askDAHSBot(
    query: string | ((ctx: WorkflowContext) => string),
    options?: Partial<Omit<AgentStepDescriptor, 'type' | 'agent' | 'query'>>
  ): this {
    return this.askAgent('dahsbot', query, { name: 'DAHSBot Query', ...options })
  }

  askFigmaBot(
    query: string | ((ctx: WorkflowContext) => string),
    options?: Partial<Omit<AgentStepDescriptor, 'type' | 'agent' | 'query'>>
  ): this {
    return this.askAgent('figmabot', query, { name: 'FigmaBot Query', ...options })
  }

  askTestingBot(
    query: string | ((ctx: WorkflowContext) => string),
    options?: Partial<Omit<AgentStepDescriptor, 'type' | 'agent' | 'query'>>
  ): this {
    return this.askAgent('testingbot', query, { name: 'TestingBot Query', ...options })
  }

  /** Run multiple agents in parallel */
  parallel(
    steps: { agent: AgentId; query: string | ((ctx: WorkflowContext) => string); name?: string }[],
    options?: { name?: string; waitForAll?: boolean; timeout?: number }
  ): this {
    const parallelSteps: AgentStepDescriptor[] = steps.map((s) => ({
      id: this.generateStepId(`parallel-${s.agent}`),
      name: s.name ?? `Ask ${s.agent}`,
      type: 'agent' as const,
      agent: s.agent,
      query: s.query,
      inputStrategy: 'previous' as const,
      inputFromSteps: undefined,
      inputFromAgent: undefined,
      required: true,
      retryable: true,
      maxRetries: undefined,
      timeout: undefined,
      description: undefined,
    }))

    const step: ParallelStepDescriptor = {
      id: this.generateStepId('parallel'),
      name: options?.name ?? 'Parallel Queries',
      type: 'parallel',
      steps: parallelSteps,
      waitForAll: options?.waitForAll ?? true,
      required: true,
      retryable: true,
      timeout: options?.timeout ?? undefined,
      description: undefined,
      maxRetries: undefined,
    }
    this.steps.push(step)
    return this
  }

  /** Add a conditional branch */
  ifThen(
    condition: (ctx: WorkflowContext) => boolean,
    ifTrue: (builder: WorkflowBuilder) => WorkflowBuilder,
    ifFalse?: (builder: WorkflowBuilder) => WorkflowBuilder,
    options?: { name?: string }
  ): this {
    // Build the "if true" branch
    const trueBranchBuilder = new WorkflowBuilder('if-true-branch')
    ifTrue(trueBranchBuilder)
    const trueBranchSteps = trueBranchBuilder.steps

    // Build the "if false" branch if provided
    let falseBranchStep: StepDescriptor | undefined
    if (ifFalse) {
      const falseBranchBuilder = new WorkflowBuilder('if-false-branch')
      ifFalse(falseBranchBuilder)
      const falseBranchSteps = falseBranchBuilder.steps
      if (falseBranchSteps.length > 0) {
        falseBranchStep = falseBranchSteps[0]
      }
    }

    const noopStep: TransformStepDescriptor = {
      id: 'noop',
      name: 'No-op',
      type: 'transform',
      transform: () => null,
      required: false,
      retryable: false,
      description: undefined,
      timeout: undefined,
      maxRetries: undefined,
    }

    const step: ConditionalStepDescriptor = {
      id: this.generateStepId('condition'),
      name: options?.name ?? 'Conditional',
      type: 'conditional',
      condition,
      ifTrue: trueBranchSteps[0] ?? noopStep,
      ifFalse: falseBranchStep ?? undefined,
      required: true,
      retryable: false,
      description: undefined,
      timeout: undefined,
      maxRetries: undefined,
    }
    this.steps.push(step)
    return this
  }

  /** Add a debate between two agents */
  debate(
    challenger: AgentId,
    defender: AgentId,
    topic: string | ((ctx: WorkflowContext) => string),
    options?: {
      name?: string
      maxRounds?: number
      resolutionStrategy?: DebateStepDescriptor['resolutionStrategy']
      timeout?: number
    }
  ): this {
    const step: DebateStepDescriptor = {
      id: this.generateStepId('debate'),
      name: options?.name ?? `Debate: ${challenger} vs ${defender}`,
      type: 'debate',
      challenger,
      defender,
      topic,
      maxRounds: options?.maxRounds ?? 3,
      resolutionStrategy: options?.resolutionStrategy ?? 'consensus',
      required: true,
      retryable: false,
      timeout: options?.timeout ?? undefined,
      description: undefined,
      maxRetries: undefined,
    }
    this.steps.push(step)
    return this
  }

  /** Transform/combine outputs from previous steps */
  transform(
    transformer: (ctx: WorkflowContext) => unknown,
    options?: { name?: string; id?: string }
  ): this {
    const step: TransformStepDescriptor = {
      id: options?.id ?? this.generateStepId('transform'),
      name: options?.name ?? 'Transform',
      type: 'transform',
      transform: transformer,
      required: true,
      retryable: false,
      description: undefined,
      timeout: undefined,
      maxRetries: undefined,
    }
    this.steps.push(step)
    return this
  }

  /** Wait for human input */
  waitForHuman(
    prompt: string | ((ctx: WorkflowContext) => string),
    options?: { name?: string; choices?: string[]; allowFreeform?: boolean; timeout?: number }
  ): this {
    const step: HumanInputStepDescriptor = {
      id: this.generateStepId('human'),
      name: options?.name ?? 'Human Decision',
      type: 'human-input',
      prompt,
      options: options?.choices ?? undefined,
      allowFreeform: options?.allowFreeform ?? true,
      required: true,
      retryable: false,
      timeout: options?.timeout ?? undefined,
      description: undefined,
      maxRetries: undefined,
    }
    this.steps.push(step)
    return this
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  onStatusChanged(handler: (event: WorkflowStatusEvent) => void): this {
    this.eventHandlers.onWorkflowStatusChanged = handler
    return this
  }

  onStepChanged(handler: (event: StepStatusEvent) => void): this {
    this.eventHandlers.onStepStatusChanged = handler
    return this
  }

  onDebate(handler: (event: DebateEvent) => void): this {
    this.eventHandlers.onDebateMessage = handler
    return this
  }

  onCompleted(handler: (context: WorkflowContext) => void): this {
    this.eventHandlers.onWorkflowCompleted = handler
    return this
  }

  onFailed(handler: (error: Error, context: WorkflowContext) => void): this {
    this.eventHandlers.onWorkflowFailed = handler
    return this
  }

  onHumanInput(
    handler: (step: HumanInputStepDescriptor, context: WorkflowContext) => Promise<string>
  ): this {
    this.eventHandlers.onHumanInputRequired = handler
    return this
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────

  /** Build the workflow definition */
  build(): WorkflowDefinition {
    return {
      id: this.id,
      name: this.name,
      description: this.description ?? undefined,
      steps: [...this.steps],
      variables: new Map(this.variables),
      eventHandlers: { ...this.eventHandlers },
      timeout: this.timeout ?? undefined,
      createdAt: new Date(),
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/** Create a new workflow builder */
export function createWorkflow(name: string, id?: WorkflowId): WorkflowBuilder {
  return new WorkflowBuilder(name, id)
}
