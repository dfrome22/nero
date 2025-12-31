/**
 * MCP-Enhanced Collaboration Orchestrator
 *
 * Extends the base collaboration orchestrator with MCP server integration,
 * multi-turn discussions, and shared context management.
 */

import type {
  AgentType,
  CollaborationContext,
  CollaborationWorkflow,
  CollaborationExecution,
} from '@/types/agent-collaboration'
import type {
  MCPSession,
  Discussion,
  DiscussionMessage,
  DiscussionResolution,
  SessionArtifact,
  MCPToolRequest,
  MergedContext,
  ContextMergeStrategy,
  DiscussionLogEntry,
} from '@/types/mcp-collaboration'
import { AGENT_MCP_REGISTRY } from '@/types/mcp-collaboration'
import { CollaborationOrchestrator } from './collaboration-orchestrator'
import { mcpClientManager } from '@/services/mcp-client'

/**
 * MCP-Enhanced Collaboration Orchestrator
 * 
 * Adds MCP integration, multi-turn discussions, and shared session management
 * to the base collaboration orchestrator.
 */
export class MCPCollaborationOrchestrator extends CollaborationOrchestrator {
  private sessions = new Map<string, MCPSession>()
  private discussionLogs: DiscussionLogEntry[] = []

  // =============================================================================
  // SESSION MANAGEMENT
  // =============================================================================

  /**
   * Create a new MCP session
   */
  createSession(
    workflowId: string,
    initialContext: Partial<CollaborationContext>,
    metadata?: { userId?: string; projectId?: string; tags?: string[] }
  ): MCPSession {
    const sessionId = this.generateSessionId()
    
    const session: MCPSession = {
      sessionId,
      workflowId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      sharedContext: {
        sessionId,
        workflowId,
        artifacts: initialContext.artifacts ?? {},
        currentPhase: 'initialization',
        completedSteps: [],
        pendingActions: [],
        requiresApproval: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...initialContext,
      } as CollaborationContext,
      artifacts: new Map(),
      discussions: [],
      participants: [],
      metadata: metadata ?? {},
    }

    this.sessions.set(sessionId, session)
    return session
  }

  /**
   * Get an existing session
   */
  getSession(sessionId: string): MCPSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Update session context
   */
  updateSessionContext(sessionId: string, updates: Partial<CollaborationContext>): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    session.sharedContext = {
      ...session.sharedContext,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    session.updatedAt = new Date().toISOString()
  }

  // =============================================================================
  // ARTIFACT MANAGEMENT
  // =============================================================================

  /**
   * Store an artifact in the session
   */
  storeArtifact(
    sessionId: string,
    artifact: Omit<SessionArtifact, 'id' | 'producedAt' | 'version'>
  ): SessionArtifact {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const artifactId = this.generateArtifactId()
    const fullArtifact: SessionArtifact = {
      ...artifact,
      id: artifactId,
      producedAt: new Date().toISOString(),
      version: 1,
    }

    session.artifacts.set(artifactId, fullArtifact)
    session.updatedAt = new Date().toISOString()

    return fullArtifact
  }

  /**
   * Get an artifact from the session
   */
  getArtifact(sessionId: string, artifactId: string): SessionArtifact | undefined {
    const session = this.sessions.get(sessionId)
    return session?.artifacts.get(artifactId)
  }

  /**
   * Get all artifacts from a session
   */
  getSessionArtifacts(sessionId: string): SessionArtifact[] {
    const session = this.sessions.get(sessionId)
    return session ? Array.from(session.artifacts.values()) : []
  }

  // =============================================================================
  // MULTI-TURN DISCUSSIONS
  // =============================================================================

  /**
   * Start a new discussion among agents
   */
  startDiscussion(
    sessionId: string,
    topic: string,
    participants: AgentType[]
  ): Discussion {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const discussion: Discussion = {
      id: this.generateDiscussionId(),
      sessionId,
      topic,
      startedAt: new Date().toISOString(),
      status: 'active',
      participants,
      messages: [],
    }

    session.discussions.push(discussion)
    
    // Add participants to session if not already present
    participants.forEach((p) => {
      if (!session.participants.includes(p)) {
        session.participants.push(p)
      }
    })

    const firstParticipant = participants[0]
    if (firstParticipant !== undefined) {
      this.logDiscussionEvent({
        timestamp: new Date().toISOString(),
        sessionId,
        discussionId: discussion.id,
        agentId: firstParticipant,
        action: 'started',
        details: { topic, participants },
      })
    }

    return discussion
  }

  /**
   * Add a message to a discussion
   */
  async addDiscussionMessage(
    sessionId: string,
    discussionId: string,
    speaker: AgentType,
    messageType: DiscussionMessage['messageType'],
    content: string,
    options?: {
      inResponseTo?: string
      citations?: string[]
      confidence?: number
      reasoning?: string
      useMCP?: boolean
    }
  ): Promise<DiscussionMessage> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const discussion = session.discussions.find((d) => d.id === discussionId)
    if (!discussion) {
      throw new Error(`Discussion ${discussionId} not found`)
    }

    // Optionally enhance with MCP call
    let mcpMetadata: {
      mcpServer?: string
      mcpTool?: string
      mcpCallDuration?: number
    } = {}

    if (options?.useMCP === true) {
      const mcpResult = await this.callMCPForAgent(speaker, content)
      if (mcpResult !== null) {
        mcpMetadata = mcpResult
      }
    }

    const message: DiscussionMessage = {
      id: this.generateMessageId(),
      discussionId,
      timestamp: new Date().toISOString(),
      speaker,
      messageType,
      content,
      inResponseTo: options?.inResponseTo,
      citations: options?.citations,
      confidence: options?.confidence,
      reasoning: options?.reasoning,
      ...mcpMetadata,
    }

    discussion.messages.push(message)
    session.updatedAt = new Date().toISOString()

    this.logDiscussionEvent({
      timestamp: message.timestamp,
      sessionId,
      discussionId,
      agentId: speaker,
      action: 'message-sent',
      details: { messageType, contentPreview: content.slice(0, 100) },
    })

    return message
  }

  /**
   * Resolve a discussion
   */
  resolveDiscussion(
    sessionId: string,
    discussionId: string,
    resolution: DiscussionResolution
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const discussion = session.discussions.find((d) => d.id === discussionId)
    if (!discussion) {
      throw new Error(`Discussion ${discussionId} not found`)
    }

    discussion.resolution = resolution
    discussion.status = 'resolved'
    discussion.completedAt = new Date().toISOString()
    session.updatedAt = new Date().toISOString()

    const firstAgreedAgent = resolution.agreedBy[0]
    if (firstAgreedAgent !== undefined) {
      this.logDiscussionEvent({
        timestamp: new Date().toISOString(),
        sessionId,
        discussionId,
        agentId: firstAgreedAgent,
        action: 'agreement-reached',
        details: { type: resolution.type, summary: resolution.summary },
      })
    }
  }

  // =============================================================================
  // CONTEXT MERGING
  // =============================================================================

  /**
   * Merge contexts from multiple agents/MCP servers
   */
  mergeContexts(
    baseContext: CollaborationContext,
    additionalContexts: { agentId: AgentType; context: Partial<CollaborationContext> }[],
    strategy: ContextMergeStrategy = 'union'
  ): MergedContext {
    const mergedContext: MergedContext = {
      baseContext: { ...baseContext },
      sources: additionalContexts.map((c) => ({
        serverId: this.getAgentMCPServer(c.agentId),
        agentId: c.agentId,
        contributedAt: new Date().toISOString(),
      })),
      conflicts: [],
      strategy,
      mergedAt: new Date().toISOString(),
    }

    // Simple merge strategy implementations
    switch (strategy) {
      case 'union':
        // Combine all artifacts
        additionalContexts.forEach((c) => {
          if (c.context.artifacts) {
            mergedContext.baseContext.artifacts = {
              ...mergedContext.baseContext.artifacts,
              ...c.context.artifacts,
            }
          }
        })
        break

      case 'priority':
        // First context wins for conflicts
        additionalContexts.forEach((c) => {
          if (c.context.artifacts) {
            Object.entries(c.context.artifacts).forEach(([key, value]) => {
              if (!(key in mergedContext.baseContext.artifacts)) {
                mergedContext.baseContext.artifacts[key] = value
              }
            })
          }
        })
        break

      // Other strategies can be implemented as needed
      default:
        break
    }

    return mergedContext
  }

  // =============================================================================
  // MCP INTEGRATION
  // =============================================================================

  /**
   * Call MCP tool for an agent
   */
  private async callMCPForAgent(
    agentId: AgentType,
    query: string
  ): Promise<{ mcpServer: string; mcpTool: string; mcpCallDuration: number } | null> {
    const serverName = this.getAgentMCPServer(agentId)
    if (!serverName) return null

    const startTime = Date.now()

    // Determine appropriate tool based on agent and query
    const toolName = this.selectToolForQuery(agentId, query)

    const request: MCPToolRequest = {
      serverId: serverName,
      toolName,
      arguments: { query },
    }

    const response = await mcpClientManager.callTool(request)
    const duration = Date.now() - startTime

    if (response.success) {
      return {
        mcpServer: serverName,
        mcpTool: toolName,
        mcpCallDuration: duration,
      }
    }

    return null
  }

  /**
   * Get MCP server for an agent
   */
  private getAgentMCPServer(agentId: AgentType): string {
    return AGENT_MCP_REGISTRY[agentId].primaryServer
  }

  /**
   * Select appropriate MCP tool based on agent and query
   */
  private selectToolForQuery(_agentId: AgentType, _query: string): string {
    // Simple tool selection logic
    // In a real implementation, this would use NLP or predefined patterns
    return 'query'
  }

  // =============================================================================
  // ENHANCED WORKFLOW EXECUTION
  // =============================================================================

  /**
   * Start workflow with MCP session
   */
  startWorkflowWithSession(
    workflow: CollaborationWorkflow,
    metadata?: { userId?: string; projectId?: string; tags?: string[] }
  ): { execution: CollaborationExecution; session: MCPSession } {
    const session = this.createSession(workflow.id, {}, metadata)
    const execution = this.startWorkflow(workflow, { sessionId: session.sessionId })

    return { execution, session }
  }

  // =============================================================================
  // LOGGING & MONITORING
  // =============================================================================

  /**
   * Log a discussion event
   */
  private logDiscussionEvent(entry: DiscussionLogEntry): void {
    this.discussionLogs.push(entry)
  }

  /**
   * Get discussion logs
   */
  getDiscussionLogs(
    sessionId?: string,
    limit = 100
  ): DiscussionLogEntry[] {
    let logs = this.discussionLogs

    if (sessionId !== undefined && sessionId !== '') {
      logs = logs.filter((l) => l.sessionId === sessionId)
    }

    return logs.slice(-limit)
  }

  /**
   * Get MCP metrics for all servers
   */
  getMCPMetrics(): ReturnType<typeof mcpClientManager.getAllMetrics> {
    return mcpClientManager.getAllMetrics()
  }

  // =============================================================================
  // ID GENERATION
  // =============================================================================

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  private generateDiscussionId(): string {
    return `discussion-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  private generateMessageId(): string {
    return `message-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  private generateArtifactId(): string {
    return `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }
}

// Create enhanced orchestrator instance
import { agentRegistry } from './agent-registry'
import { createAgentRouter } from './agent-router'

export const mcpOrchestrator = new MCPCollaborationOrchestrator(
  agentRegistry,
  createAgentRouter(agentRegistry)
)
