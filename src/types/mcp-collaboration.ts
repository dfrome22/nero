/**
 * MCP Collaboration Types
 *
 * Extends agent collaboration with MCP server integration for
 * multi-turn discussions, shared context, and persistent sessions.
 */

import type { AgentType, AgentCapability, CollaborationContext } from './agent-collaboration'

// =============================================================================
// MCP SERVER CONFIGURATION
// =============================================================================

/**
 * Configuration for an MCP server connection
 */
export interface MCPServerConfig {
  name: string
  type: 'stdio' | 'http' | 'websocket'
  command?: string // For stdio: command to start server
  args?: string[] // For stdio: command arguments
  url?: string // For http/websocket: server URL
  apiKey?: string // Optional authentication
  timeout: number // Request timeout in milliseconds
  retryAttempts: number
  retryDelay: number // Milliseconds between retries
}

/**
 * MCP servers available to NERO agents
 */
export interface MCPServerRegistry {
  'epa-compliance': MCPServerConfig
  'dahs-product': MCPServerConfig
  'testing-automation': MCPServerConfig
  'requirements-engine': MCPServerConfig
}

// =============================================================================
// SHARED SESSION MANAGEMENT
// =============================================================================

/**
 * Shared session that persists across agent interactions
 */
export interface MCPSession {
  sessionId: string
  workflowId?: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'paused' | 'completed' | 'expired'
  
  // Shared context accessible to all agents
  sharedContext: CollaborationContext
  
  // Artifacts produced during the session
  artifacts: Map<string, SessionArtifact>
  
  // Discussion history
  discussions: Discussion[]
  
  // Session participants
  participants: AgentType[]
  
  // Session metadata
  metadata: {
    userId?: string
    projectId?: string
    tags?: string[]
  }
}

/**
 * An artifact produced during a session
 */
export interface SessionArtifact {
  id: string
  type: string
  name: string
  content: unknown
  producedBy: AgentType
  producedAt: string
  version: number
  citations?: string[]
  dependencies?: string[] // IDs of artifacts this depends on
}

// =============================================================================
// MULTI-TURN DISCUSSIONS
// =============================================================================

/**
 * A discussion thread between agents
 */
export interface Discussion {
  id: string
  sessionId: string
  topic: string
  startedAt: string
  completedAt?: string
  status: 'active' | 'resolved' | 'escalated' | 'deferred'
  
  // Participants in this discussion
  participants: AgentType[]
  
  // Messages exchanged
  messages: DiscussionMessage[]
  
  // Resolution if reached
  resolution?: DiscussionResolution
}

/**
 * A message in a discussion
 */
export interface DiscussionMessage {
  id: string
  discussionId: string
  timestamp: string
  speaker: AgentType
  messageType: 'statement' | 'question' | 'challenge' | 'response' | 'proposal' | 'agreement' | 'disagreement'
  content: string
  
  // References
  inResponseTo?: string // Message ID being responded to
  citations?: string[] // Regulatory or technical citations
  artifacts?: string[] // Artifact IDs referenced
  
  // Confidence and reasoning
  confidence?: number
  reasoning?: string
  
  // MCP call metadata
  mcpServer?: string
  mcpTool?: string
  mcpCallDuration?: number
}

/**
 * Resolution of a discussion
 */
export interface DiscussionResolution {
  type: 'consensus' | 'majority' | 'expert-decision' | 'human-override'
  summary: string
  agreedBy: AgentType[]
  disagreedBy?: AgentType[]
  finalDecision: string
  reasoning: string
  artifacts?: string[] // Artifacts produced as result
  actionItems?: ActionItem[]
}

/**
 * Action item from a discussion
 */
export interface ActionItem {
  id: string
  title: string
  description: string
  assignedTo: AgentType | 'human'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  dueBy?: string
  blockedReason?: string
}

// =============================================================================
// MCP TOOL INVOCATION
// =============================================================================

/**
 * Request to invoke an MCP tool
 */
export interface MCPToolRequest {
  serverId: string
  toolName: string
  arguments: Record<string, unknown>
  timeout?: number
  context?: {
    sessionId?: string
    agentId?: AgentType
    capability?: AgentCapability
  }
}

/**
 * Response from an MCP tool invocation
 */
export interface MCPToolResponse {
  success: boolean
  data?: unknown
  error?: {
    code: string
    message: string
    details?: unknown
  }
  metadata: {
    serverId: string
    toolName: string
    duration: number
    timestamp: string
    retryCount: number
  }
}

// =============================================================================
// CONTEXT MERGING
// =============================================================================

/**
 * Strategy for merging contexts from multiple MCP servers
 */
export type ContextMergeStrategy = 
  | 'union' // Combine all findings
  | 'intersection' // Only findings agreed upon by all
  | 'priority' // Use priority order of servers
  | 'expert' // Let specific agent decide conflicts

/**
 * Result of merging contexts from multiple sources
 */
export interface MergedContext {
  baseContext: CollaborationContext
  sources: {
    serverId: string
    agentId: AgentType
    contributedAt: string
  }[]
  conflicts?: ContextConflict[]
  strategy: ContextMergeStrategy
  mergedAt: string
}

/**
 * A conflict discovered when merging contexts
 */
export interface ContextConflict {
  id: string
  type: 'data-mismatch' | 'opinion-difference' | 'citation-conflict'
  description: string
  sources: {
    agentId: AgentType
    value: unknown
    reasoning?: string
    confidence?: number
  }[]
  resolution?: {
    resolvedBy: AgentType | 'human'
    selectedValue: unknown
    reasoning: string
  }
}

// =============================================================================
// ERROR HANDLING & MONITORING
// =============================================================================

/**
 * Error from MCP server interaction
 */
export interface MCPError {
  type: 'connection' | 'timeout' | 'authentication' | 'server-error' | 'tool-error' | 'conflict'
  serverId: string
  message: string
  details?: unknown
  timestamp: string
  retryable: boolean
  retryCount: number
}

/**
 * Metrics for MCP server performance
 */
export interface MCPMetrics {
  serverId: string
  timeWindow: {
    start: string
    end: string
  }
  
  // Request metrics
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  errorRate: number
  
  // Performance metrics
  averageLatency: number
  p95Latency: number
  p99Latency: number
  slowestTool?: string
  slowestLatency?: number
  
  // Cache metrics (if applicable)
  cacheHits?: number
  cacheMisses?: number
  cacheHitRate?: number
  
  // Tool usage
  toolUsage: Record<string, number>
}

/**
 * Log entry for agent discussion
 */
export interface DiscussionLogEntry {
  timestamp: string
  sessionId: string
  discussionId: string
  agentId: AgentType
  action: 'started' | 'message-sent' | 'tool-called' | 'agreement-reached' | 'escalated' | 'completed'
  details: unknown
  duration?: number
}

// =============================================================================
// AGENT MCP CAPABILITIES
// =============================================================================

/**
 * MCP server and tools an agent can use
 */
export interface AgentMCPCapabilities {
  agentType: AgentType
  
  // Primary MCP server for this agent
  primaryServer: string
  
  // Additional servers this agent can query
  additionalServers?: string[]
  
  // Tools this agent commonly uses
  commonTools: {
    serverId: string
    toolName: string
    purpose: string
  }[]
  
  // Capabilities enhanced by MCP
  enhancedCapabilities: AgentCapability[]
}

/**
 * Registry of agent MCP capabilities
 */
export const AGENT_MCP_REGISTRY: Record<AgentType, AgentMCPCapabilities> = {
  RegsBot: {
    agentType: 'RegsBot',
    primaryServer: 'epa-compliance',
    commonTools: [
      { serverId: 'epa-compliance', toolName: 'getRegulation', purpose: 'Look up CFR sections' },
      { serverId: 'epa-compliance', toolName: 'getFormulaMapping', purpose: 'Find Part 75 formulas' },
      { serverId: 'epa-compliance', toolName: 'matchEmissionLimits', purpose: 'Find emission limits' },
    ],
    enhancedCapabilities: ['regulatory-lookup', 'permit-analysis', 'citation-anchoring'],
  },
  RequirementsBot: {
    agentType: 'RequirementsBot',
    primaryServer: 'requirements-engine',
    additionalServers: ['epa-compliance', 'dahs-product'],
    commonTools: [
      { serverId: 'requirements-engine', toolName: 'analyzeGaps', purpose: 'Gap analysis' },
      { serverId: 'dahs-product', toolName: 'queryCapabilities', purpose: 'Check DAHS capabilities' },
    ],
    enhancedCapabilities: ['gap-analysis', 'dahs-proposal', 'requirement-generation'],
  },
  FigmaBot: {
    agentType: 'FigmaBot',
    primaryServer: 'requirements-engine',
    commonTools: [
      { serverId: 'requirements-engine', toolName: 'generateWireframes', purpose: 'Create UI wireframes' },
    ],
    enhancedCapabilities: ['wireframe-generation', 'component-mapping'],
  },
  TestingBot: {
    agentType: 'TestingBot',
    primaryServer: 'testing-automation',
    additionalServers: ['requirements-engine'],
    commonTools: [
      { serverId: 'testing-automation', toolName: 'generateTestPlan', purpose: 'Create test plans' },
      { serverId: 'testing-automation', toolName: 'generateAcceptanceCriteria', purpose: 'Define acceptance criteria' },
    ],
    enhancedCapabilities: ['test-plan-generation', 'acceptance-criteria', 'test-coverage'],
  },
  DAHS: {
    agentType: 'DAHS',
    primaryServer: 'dahs-product',
    commonTools: [
      { serverId: 'dahs-product', toolName: 'queryCapabilities', purpose: 'Query product capabilities' },
      { serverId: 'dahs-product', toolName: 'validateConfiguration', purpose: 'Validate configurations' },
    ],
    enhancedCapabilities: ['capability-query', 'configuration-validation', 'feasibility-check'],
  },
}
