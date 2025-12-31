/**
 * Agent Collaboration System
 *
 * Exports the multi-agent collaboration infrastructure for NERO.
 * Enables Activepieces-style workflow automation with agent routing,
 * dynamic workflows, and human approval gates.
 * 
 * Enhanced with MCP integration for multi-turn discussions and shared context.
 */

// Core components
export { AgentRegistry, agentRegistry } from './agent-registry'
export { AgentRouter, createAgentRouter } from './agent-router'
export {
  CollaborationOrchestrator,
  createCollaborationOrchestrator,
  collaborationOrchestrator,
} from './collaboration-orchestrator'

// MCP-enhanced components
export { MCPCollaborationOrchestrator, mcpOrchestrator } from './mcp-orchestrator'

// Re-export types
export type * from '../../types/agent-collaboration'
export type * from '../../types/mcp-collaboration'
