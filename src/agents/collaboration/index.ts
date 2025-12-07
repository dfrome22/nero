/**
 * Agent Collaboration System
 *
 * Exports the multi-agent collaboration infrastructure for NERO.
 * Enables Activepieces-style workflow automation with agent routing,
 * dynamic workflows, and human approval gates.
 */

// Core components
export { AgentRegistry, agentRegistry } from './agent-registry'
export { AgentRouter, createAgentRouter } from './agent-router'
export {
  CollaborationOrchestrator,
  createCollaborationOrchestrator,
  collaborationOrchestrator,
} from './collaboration-orchestrator'

// Re-export types
export type * from '../../types/agent-collaboration'
