/**
 * Agent Router
 *
 * Routes requests to the appropriate agent based on capabilities and context.
 * Implements intelligent routing similar to Activepieces workflow automation.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import type {
  AgentType,
  AgentCapability,
  AgentInfo,
  RoutingDecision,
  RoutingQuery,
  CollaborationContext,
} from '../../types/agent-collaboration'
import { AgentRegistry } from './agent-registry'

/**
 * Agent Router - determines which agent should handle a request
 */
export class AgentRouter {
  private registry: AgentRegistry

  constructor(registry: AgentRegistry) {
    this.registry = registry
  }

  /**
   * Route a query to the appropriate agent
   */
  route(query: RoutingQuery): RoutingDecision {
    const { intent, context, requiredCapabilities, preferredAgent, excludeAgents } = query

    // If preferred agent is specified and available, use it
    if (preferredAgent !== undefined && !excludeAgents?.includes(preferredAgent)) {
      const agent = this.registry.getAgent(preferredAgent)
      if (agent !== undefined) {
        return {
          selectedAgent: preferredAgent,
          capability: this.selectCapabilityForIntent(preferredAgent, intent),
          reason: `Preferred agent ${preferredAgent} was requested`,
          confidence: 0.9,
        }
      }
    }

    // If required capabilities are specified, filter to agents with those capabilities
    if (requiredCapabilities !== undefined && requiredCapabilities.length > 0) {
      const candidates = this.findAgentsWithCapabilities(requiredCapabilities, excludeAgents)
      if (candidates.length > 0) {
        const selected = this.selectBestAgent(candidates, intent, context, requiredCapabilities[0])
        return selected
      }
    }

    // Infer capability from intent
    const inferredCapability = this.inferCapabilityFromIntent(intent)
    if (inferredCapability !== undefined) {
      const candidates = this.registry
        .findAgentsByCapability(inferredCapability)
        .filter((agent) => !excludeAgents?.includes(agent.type))

      if (candidates.length > 0) {
        const selected = this.selectBestAgent(candidates, intent, context)
        return selected
      }
    }

    // Fallback: analyze intent keywords to find best match
    return this.routeByIntentAnalysis(intent, context, excludeAgents)
  }

  /**
   * Find agents that have all required capabilities
   */
  private findAgentsWithCapabilities(
    capabilities: AgentCapability[],
    excludeAgents?: AgentType[]
  ): AgentInfo[] {
    const agents = this.registry.getAllAgents()
    const candidates: AgentInfo[] = []

    for (const agent of agents) {
      if (excludeAgents?.includes(agent.type)) continue

      const matchedCapabilities: AgentCapability[] = []
      for (const required of capabilities) {
        if (this.registry.hasCapability(agent.type, required)) {
          matchedCapabilities.push(required)
        }
      }

      if (matchedCapabilities.length > 0) {
        candidates.push(agent)
      }
    }

    return candidates
  }

  /**
   * Select the best agent from candidates
   */
  private selectBestAgent(
    candidates: AgentInfo[],
    _intent: string,
    context?: CollaborationContext,
    preferredCapability?: AgentCapability
  ): RoutingDecision {
    // Sort by priority and number of matching capabilities
    const sorted = candidates.slice().sort((a: AgentInfo, b: AgentInfo) => {
      const priorityDiff = b.priority - a.priority
      if (priorityDiff !== 0) return priorityDiff
      return b.capabilities.length - a.capabilities.length
    })

    const best = sorted[0]

    if (best === undefined) {
      // This should not happen, but return a fallback
      return {
        selectedAgent: 'RegsBot',
        capability: 'regulatory-lookup',
        reason: 'Fallback to RegsBot',
        confidence: 0.3,
      }
    }

    // Determine which capability to use
    let capability: AgentCapability
    if (
      preferredCapability !== undefined &&
      best.capabilities.some((c) => c.capability === preferredCapability)
    ) {
      capability = preferredCapability
    } else {
      const firstCap = best.capabilities[0]
      capability = firstCap !== undefined ? firstCap.capability : 'regulatory-lookup'
    }

    // Consider context phase for confidence adjustment
    let confidence = 0.8
    if (context !== undefined) {
      if (
        (context.currentPhase === 'discovery' && best.domain === 'regulatory-knowledge') ||
        (context.currentPhase === 'analysis' && best.domain === 'requirements-engineering') ||
        (context.currentPhase === 'proposal' && best.domain === 'requirements-engineering') ||
        (context.currentPhase === 'validation' && best.domain === 'testing')
      ) {
        confidence = 0.95
      }
    }

    // Build alternatives
    const alternatives = sorted.slice(1, 3).map((candidate: AgentInfo) => {
      const firstCap = candidate.capabilities[0]
      return {
        agent: candidate.type,
        capability: firstCap !== undefined ? firstCap.capability : 'regulatory-lookup',
        reason: `Has ${candidate.capabilities.length} matching capability/capabilities`,
      }
    })

    return {
      selectedAgent: best.type,
      capability,
      reason: `Agent has ${best.capabilities.length} matching capability/capabilities, priority ${best.priority}`,
      confidence,
      ...(alternatives.length > 0 && { alternatives }),
    }
  }

  /**
   * Infer capability from intent string
   */
  private inferCapabilityFromIntent(intent: string): AgentCapability | undefined {
    const lower = intent.toLowerCase()

    // Gap analysis - check FIRST as it's very specific
    if (lower.includes('gap')) {
      return 'gap-analysis'
    }

    // Testing keywords - also specific
    if (lower.includes('test plan') || (lower.includes('test') && lower.includes('create'))) {
      return 'test-plan-generation'
    }

    // UI/UX keywords - specific
    if (
      lower.includes('wireframe') ||
      lower.includes('screen inventory') ||
      lower.includes('component mapping')
    ) {
      return 'wireframe-generation'
    }

    // DAHS proposal keywords
    if (lower.includes('dahs proposal') || lower.includes('dahs config')) {
      return 'dahs-proposal'
    }

    // Requirements generation
    if (lower.includes('requirement') && (lower.includes('generate') || lower.includes('create'))) {
      return 'requirement-generation'
    }

    // Regulatory keywords - more general, check after specific ones
    if (
      lower.includes('regulation') ||
      lower.includes('cfr') ||
      lower.includes('epa') ||
      lower.includes('permit')
    ) {
      if (lower.includes('obligation') || lower.includes('extract')) {
        return 'obligation-extraction'
      }
      if (lower.includes('permit') && !lower.includes('gap')) {
        return 'permit-analysis'
      }
      if (lower.includes('monitoring plan')) {
        return 'monitoring-plan-analysis'
      }
      return 'regulatory-lookup'
    }

    // Other UI/UX keywords
    if (lower.includes('ui') || lower.includes('ux') || lower.includes('design')) {
      return 'wireframe-generation'
    }

    // Other testing keywords
    if (lower.includes('test') || lower.includes('validation') || lower.includes('acceptance')) {
      return 'test-plan-generation'
    }

    // Capability/support keywords (general)
    if (lower.includes('capability') || lower.includes('support')) {
      return 'gap-analysis'
    }

    return undefined
  }

  /**
   * Select appropriate capability for an agent based on intent
   */
  private selectCapabilityForIntent(agent: AgentType, intent: string): AgentCapability {
    const agentInfo = this.registry.getAgent(agent)
    if (agentInfo === undefined || agentInfo.capabilities.length === 0) {
      // Fallback
      return 'regulatory-lookup'
    }

    // Try to match intent to capability
    const inferred = this.inferCapabilityFromIntent(intent)
    if (inferred !== undefined && this.registry.hasCapability(agent, inferred)) {
      return inferred
    }

    // Return first capability as fallback
    const firstCap = agentInfo.capabilities[0]
    return firstCap !== undefined ? firstCap.capability : 'regulatory-lookup'
  }

  /**
   * Route by analyzing intent keywords when other methods fail
   */
  private routeByIntentAnalysis(
    intent: string,
    context?: CollaborationContext,
    excludeAgents?: AgentType[]
  ): RoutingDecision {
    const lower = intent.toLowerCase()

    // Testing domain - check first as it's more specific
    if (
      lower.includes('test plan') ||
      (lower.includes('test') && !lower.includes('request')) ||
      lower.includes('validation') ||
      lower.includes('acceptance') ||
      lower.includes('coverage')
    ) {
      if (!excludeAgents?.includes('TestingBot')) {
        return {
          selectedAgent: 'TestingBot',
          capability: 'test-plan-generation',
          reason: 'Intent matches testing domain',
          confidence: 0.8,
        }
      }
    }

    // UI/UX domain
    if (
      lower.includes('wireframe') ||
      lower.includes('screen') ||
      lower.includes('ui') ||
      lower.includes('ux') ||
      lower.includes('design') ||
      lower.includes('component')
    ) {
      if (!excludeAgents?.includes('FigmaBot')) {
        return {
          selectedAgent: 'FigmaBot',
          capability: 'wireframe-generation',
          reason: 'Intent matches UI/UX design domain',
          confidence: 0.8,
        }
      }
    }

    // Requirements engineering domain - check before regulatory as it's more specific
    if (
      lower.includes('gap') ||
      lower.includes('dahs proposal') ||
      lower.includes('development backlog') ||
      (lower.includes('requirement') && lower.includes('generate'))
    ) {
      if (!excludeAgents?.includes('RequirementsBot')) {
        return {
          selectedAgent: 'RequirementsBot',
          capability: 'gap-analysis',
          reason: 'Intent matches requirements engineering domain',
          confidence: 0.8,
        }
      }
    }

    // Regulatory knowledge domain
    if (
      lower.includes('regulation') ||
      lower.includes('cfr') ||
      lower.includes('epa') ||
      lower.includes('permit') ||
      lower.includes('obligation') ||
      lower.includes('monitoring plan') ||
      lower.includes('look up')
    ) {
      if (!excludeAgents?.includes('RegsBot')) {
        return {
          selectedAgent: 'RegsBot',
          capability: 'regulatory-lookup',
          reason: 'Intent matches regulatory knowledge domain',
          confidence: 0.8,
        }
      }
    }

    // Product/configuration domain
    if (
      lower.includes('dahs can') ||
      lower.includes('feasible') ||
      lower.includes('validate config') ||
      lower.includes('capability query')
    ) {
      if (!excludeAgents?.includes('DAHS')) {
        return {
          selectedAgent: 'DAHS',
          capability: 'capability-query',
          reason: 'Intent matches product configuration domain',
          confidence: 0.8,
        }
      }
    }

    // Fallback based on current phase
    if (context !== undefined) {
      if (context.currentPhase === 'discovery' && !excludeAgents?.includes('RegsBot')) {
        return {
          selectedAgent: 'RegsBot',
          capability: 'regulatory-lookup',
          reason: 'Fallback to RegsBot for discovery phase',
          confidence: 0.5,
        }
      }
      if (context.currentPhase === 'analysis' && !excludeAgents?.includes('RequirementsBot')) {
        return {
          selectedAgent: 'RequirementsBot',
          capability: 'gap-analysis',
          reason: 'Fallback to RequirementsBot for analysis phase',
          confidence: 0.5,
        }
      }
    }

    // Final fallback - try to find any non-excluded agent
    const allAgents: AgentType[] = ['RequirementsBot', 'TestingBot', 'FigmaBot', 'DAHS', 'RegsBot']
    for (const agent of allAgents) {
      if (!excludeAgents?.includes(agent)) {
        const agentInfo = this.registry.getAgent(agent)
        if (agentInfo !== undefined && agentInfo.capabilities.length > 0) {
          const firstCap = agentInfo.capabilities[0]
          return {
            selectedAgent: agent,
            capability: firstCap !== undefined ? firstCap.capability : 'regulatory-lookup',
            reason: `Fallback to ${agent}`,
            confidence: 0.3,
          }
        }
      }
    }

    // Absolute last resort
    return {
      selectedAgent: 'RegsBot',
      capability: 'regulatory-lookup',
      reason: 'Default fallback to RegsBot',
      confidence: 0.3,
    }
  }

  /**
   * Get routing suggestions for a given context
   */
  suggestNextAgent(context: CollaborationContext): RoutingDecision[] {
    const suggestions: RoutingDecision[] = []

    // Based on current phase
    switch (context.currentPhase) {
      case 'initialization':
      case 'discovery':
        suggestions.push({
          selectedAgent: 'RegsBot',
          capability: 'permit-analysis',
          reason: 'Start with regulatory analysis',
          confidence: 0.9,
        })
        break

      case 'analysis':
        suggestions.push({
          selectedAgent: 'RequirementsBot',
          capability: 'gap-analysis',
          reason: 'Analyze gaps after discovery',
          confidence: 0.9,
        })
        break

      case 'proposal':
        suggestions.push({
          selectedAgent: 'RequirementsBot',
          capability: 'dahs-proposal',
          reason: 'Generate DAHS proposal',
          confidence: 0.9,
        })
        if (context.artifacts['requirementSet'] !== undefined) {
          suggestions.push({
            selectedAgent: 'FigmaBot',
            capability: 'wireframe-generation',
            reason: 'Generate UI wireframes',
            confidence: 0.8,
          })
        }
        break

      case 'validation':
        suggestions.push({
          selectedAgent: 'TestingBot',
          capability: 'test-plan-generation',
          reason: 'Create test validation',
          confidence: 0.9,
        })
        break
    }

    return suggestions
  }
}

// Export factory function
export function createAgentRouter(registry: AgentRegistry): AgentRouter {
  return new AgentRouter(registry)
}
