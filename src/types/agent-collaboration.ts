/**
 * Agent Collaboration Types
 *
 * Defines how agents communicate and collaborate with each other
 * in an Activepieces-style workflow system.
 */

// ============================================================================
// AGENT CAPABILITIES & REGISTRY
// ============================================================================

/**
 * Agent types in the NERO system
 */
export type AgentType = 'RegsBot' | 'RequirementsBot' | 'FigmaBot' | 'TestingBot' | 'DAHS'

/**
 * Domain areas each agent can handle
 */
export type AgentDomain =
  | 'regulatory-knowledge' // RegsBot: eCFR, EPA guidance, permits
  | 'requirements-engineering' // RequirementsBot: gap analysis, DAHS proposals
  | 'ui-design' // FigmaBot: wireframes, components
  | 'testing' // TestingBot: test plans, acceptance criteria
  | 'product-configuration' // DAHS: system capabilities, configuration

/**
 * Specific capabilities an agent provides
 */
export type AgentCapability =
  // RegsBot capabilities
  | 'regulatory-lookup' // Look up CFR sections, EPA guidance
  | 'permit-analysis' // Analyze permit documents
  | 'obligation-extraction' // Extract regulatory obligations
  | 'monitoring-plan-analysis' // Analyze monitoring plans
  | 'citation-anchoring' // Create traceable citations
  // RequirementsBot capabilities
  | 'gap-analysis' // Analyze DAHS capability gaps
  | 'dahs-proposal' // Generate DAHS configuration proposals
  | 'requirement-generation' // Generate functional requirements
  | 'development-backlog' // Generate development work items
  // FigmaBot capabilities
  | 'wireframe-generation' // Create wireframes from requirements
  | 'component-mapping' // Map requirements to UI components
  | 'screen-inventory' // Generate screen inventory
  // TestingBot capabilities
  | 'test-plan-generation' // Generate test plans
  | 'acceptance-criteria' // Create acceptance criteria
  | 'test-coverage' // Analyze test coverage
  // DAHS capabilities
  | 'capability-query' // Query what DAHS can do
  | 'configuration-validation' // Validate proposed configurations
  | 'feasibility-check' // Check if requirements are feasible

/**
 * Agent capability definition
 */
export interface AgentCapabilityDef {
  capability: AgentCapability
  description: string
  inputTypes: string[] // Types of inputs it accepts
  outputTypes: string[] // Types of outputs it produces
}

/**
 * Agent registration information
 */
export interface AgentInfo {
  type: AgentType
  name: string
  description: string
  domain: AgentDomain
  capabilities: AgentCapabilityDef[]
  priority: number // For capability conflict resolution (higher = preferred)
}

// ============================================================================
// AGENT MESSAGES & COMMUNICATION
// ============================================================================

/**
 * Message types for inter-agent communication
 */
export type MessageType =
  | 'query' // Ask another agent for information
  | 'request' // Request another agent to perform work
  | 'response' // Response to a query or request
  | 'notification' // Notify another agent of a state change
  | 'handoff' // Transfer control to another agent

/**
 * Message status
 */
export type MessageStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

/**
 * Base message structure for agent communication
 */
export interface AgentMessage {
  id: string
  type: MessageType
  from: AgentType
  to: AgentType
  capability: AgentCapability
  payload: unknown
  context?: CollaborationContext
  status: MessageStatus
  timestamp: string
  responseToId?: string // If this is a response to another message
}

/**
 * Query message - ask for information
 */
export interface QueryMessage extends AgentMessage {
  type: 'query'
  payload: {
    question: string
    parameters?: Record<string, unknown>
  }
}

/**
 * Request message - ask for work to be done
 */
export interface RequestMessage extends AgentMessage {
  type: 'request'
  payload: {
    action: string
    inputs: Record<string, unknown>
    requirements?: string[]
  }
}

/**
 * Response message - answer to query/request
 */
export interface ResponseMessage extends AgentMessage {
  type: 'response'
  payload: {
    success: boolean
    data?: unknown
    error?: string
    citations?: string[]
  }
}

/**
 * Handoff message - transfer control to another agent
 */
export interface HandoffMessage extends AgentMessage {
  type: 'handoff'
  payload: {
    reason: string
    currentState: Record<string, unknown>
    nextActions: string[]
  }
}

// ============================================================================
// COLLABORATION CONTEXT
// ============================================================================

/**
 * Shared context for agent collaboration
 */
export interface CollaborationContext {
  sessionId: string
  workflowId?: string
  projectId?: string
  userId?: string

  // Shared artifacts
  artifacts: Record<string, unknown>

  // Evidence and source documents
  evidence?: {
    permitId?: string
    orisCode?: number
    regulatoryReferences?: string[]
  }

  // Current state
  currentPhase: CollaborationPhase
  completedSteps: string[]
  pendingActions: string[]

  // Human interaction
  requiresApproval: boolean
  approvalGate?: string

  // Metadata
  createdAt: string
  updatedAt: string
}

/**
 * Phases of agent collaboration
 */
export type CollaborationPhase =
  | 'initialization' // Starting up
  | 'discovery' // Understanding requirements
  | 'analysis' // Analyzing gaps and feasibility
  | 'proposal' // Generating proposals
  | 'review' // Human review
  | 'execution' // Implementing
  | 'validation' // Testing and verification
  | 'completion' // Done

// ============================================================================
// COLLABORATION PATTERNS
// ============================================================================

/**
 * Collaboration pattern types
 */
export type CollaborationPattern =
  | 'sequential' // Agents execute in order: A -> B -> C
  | 'conditional' // Agents execute based on conditions
  | 'parallel' // Multiple agents work simultaneously
  | 'delegated' // One agent delegates to others
  | 'collaborative' // Agents work together on same task

/**
 * A collaboration workflow defines how agents work together
 */
export interface CollaborationWorkflow {
  id: string
  name: string
  description: string
  pattern: CollaborationPattern
  steps: CollaborationStep[]
  approvalGates: ApprovalGate[]
}

/**
 * A single step in a collaboration workflow
 */
export interface CollaborationStep {
  id: string
  agent: AgentType
  capability: AgentCapability
  inputs: string[] // References to artifacts or previous outputs
  outputs: string[] // What this step produces
  condition?: string // Condition for executing this step
  continueOnFailure: boolean
  requiresApproval: boolean
}

/**
 * An approval gate where human intervention is required
 */
export interface ApprovalGate {
  id: string
  afterStep: string
  title: string
  description: string
  approvalCriteria: string[]
}

// ============================================================================
// COLLABORATION EXECUTION
// ============================================================================

/**
 * Execution status for a collaboration workflow
 */
export interface CollaborationExecution {
  id: string
  workflowId: string
  context: CollaborationContext
  status: 'running' | 'paused' | 'completed' | 'failed'
  currentStep?: string
  startedAt: string
  completedAt?: string
  results: Record<string, unknown>
  messages: AgentMessage[]
}

/**
 * Result of a collaboration workflow execution
 */
export interface CollaborationResult {
  executionId: string
  success: boolean
  artifacts: Record<string, unknown>
  timeline: CollaborationEvent[]
  summary: string
  recommendations?: string[]
  error?: string
}

/**
 * Event in the collaboration timeline
 */
export interface CollaborationEvent {
  timestamp: string
  agent: AgentType
  action: string
  status: 'started' | 'completed' | 'failed'
  details?: string
}

// ============================================================================
// AGENT ROUTER
// ============================================================================

/**
 * Routing decision for which agent to invoke
 */
export interface RoutingDecision {
  selectedAgent: AgentType
  capability: AgentCapability
  reason: string
  confidence: number
  alternatives?: {
    agent: AgentType
    capability: AgentCapability
    reason: string
  }[]
}

/**
 * Routing query to find the right agent
 */
export interface RoutingQuery {
  intent: string // What needs to be done
  context?: CollaborationContext
  requiredCapabilities?: AgentCapability[]
  preferredAgent?: AgentType
  excludeAgents?: AgentType[]
}
