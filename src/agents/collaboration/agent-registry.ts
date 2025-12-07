/**
 * Agent Registry
 *
 * Central registry of all agents and their capabilities.
 * Used for agent discovery and routing.
 */

import type {
  AgentCapabilityDef,
  AgentInfo,
  AgentType,
  AgentCapability,
} from '../../types/agent-collaboration'

/**
 * Agent Registry - maintains list of available agents and their capabilities
 */
export class AgentRegistry {
  private agents = new Map<AgentType, AgentInfo>()

  constructor() {
    this.registerDefaultAgents()
  }

  /**
   * Register the default NERO agents
   */
  private registerDefaultAgents(): void {
    // RegsBot - EPA Regulatory Knowledge
    this.register({
      type: 'RegsBot',
      name: 'RegsBot',
      description: 'Supreme Commander of EPA Knowledge - regulatory truth and evidence library',
      domain: 'regulatory-knowledge',
      priority: 10,
      capabilities: [
        {
          capability: 'regulatory-lookup',
          description: 'Look up CFR sections, EPA guidance, and regulatory citations',
          inputTypes: ['RegsBotInput', 'ECFRQuery', 'CitationRequest'],
          outputTypes: ['RegsBotResponse', 'ECFRSection', 'RegulatoryCitation'],
        },
        {
          capability: 'permit-analysis',
          description: 'Analyze permit documents and extract obligations',
          inputTypes: ['PermitDocument', 'string'],
          outputTypes: ['PermitObligation[]', 'EvidenceLibraryData'],
        },
        {
          capability: 'obligation-extraction',
          description: 'Extract regulatory obligations from text',
          inputTypes: ['string', 'PermitDocument'],
          outputTypes: ['PermitObligation[]'],
        },
        {
          capability: 'monitoring-plan-analysis',
          description: 'Analyze EPA monitoring plans and generate DAHS requirements',
          inputTypes: ['MonitoringPlan', 'number'],
          outputTypes: ['DAHSRequirements', 'MonitoringPlanQueryResult'],
        },
        {
          capability: 'citation-anchoring',
          description: 'Create traceable citations to regulatory sources',
          inputTypes: ['string'],
          outputTypes: ['CitationAnchor[]', 'RegulatoryCitation[]'],
        },
      ],
    })

    // RequirementsBot - Requirements Engineering
    this.register({
      type: 'RequirementsBot',
      name: 'RequirementsBot',
      description: 'The Translator - converts regulations into actionable specifications',
      domain: 'requirements-engineering',
      priority: 8,
      capabilities: [
        {
          capability: 'gap-analysis',
          description: 'Analyze gaps between requirements and DAHS capabilities',
          inputTypes: ['PermitObligation[]', 'DAHSProfile'],
          outputTypes: ['GapAnalysis[]', 'DAHSProposalData'],
        },
        {
          capability: 'dahs-proposal',
          description: 'Generate DAHS configuration proposals',
          inputTypes: ['PermitObligation[]', 'GapAnalysis[]'],
          outputTypes: ['DAHSProposalData', 'DAHSConfiguration'],
        },
        {
          capability: 'requirement-generation',
          description: 'Generate functional requirements from evidence',
          inputTypes: ['EvidenceLibraryData', 'PermitObligation[]'],
          outputTypes: ['RequirementSetData', 'Requirement[]'],
        },
        {
          capability: 'development-backlog',
          description: 'Generate development work items for unsupported requirements',
          inputTypes: ['GapAnalysis[]', 'PermitObligation[]'],
          outputTypes: ['DevelopmentItem[]'],
        },
      ],
    })

    // FigmaBot - UI/UX Design
    this.register({
      type: 'FigmaBot',
      name: 'FigmaBot',
      description: 'The Designer - scaffolds compliant UI/UX experiences',
      domain: 'ui-design',
      priority: 6,
      capabilities: [
        {
          capability: 'wireframe-generation',
          description: 'Generate wireframes from requirements',
          inputTypes: ['RequirementSetData', 'Requirement[]'],
          outputTypes: ['WireframeSpec', 'ScreenInventory'],
        },
        {
          capability: 'component-mapping',
          description: 'Map requirements to UI components',
          inputTypes: ['Requirement[]', 'WorkflowDiagram[]'],
          outputTypes: ['ComponentMapping', 'WireframeSpec'],
        },
        {
          capability: 'screen-inventory',
          description: 'Generate screen inventory from workflows',
          inputTypes: ['RequirementSetData', 'WorkflowDiagram[]'],
          outputTypes: ['ScreenInventory'],
        },
      ],
    })

    // TestingBot - Testing and Validation
    this.register({
      type: 'TestingBot',
      name: 'TestingBot',
      description: 'The Validator - ensures requirements are testable and tested',
      domain: 'testing',
      priority: 7,
      capabilities: [
        {
          capability: 'test-plan-generation',
          description: 'Generate test plans from requirements',
          inputTypes: ['RequirementSetData', 'Requirement[]'],
          outputTypes: ['TestPlan', 'TestCase[]'],
        },
        {
          capability: 'acceptance-criteria',
          description: 'Create acceptance criteria for requirements',
          inputTypes: ['Requirement[]', 'DAHSProposalData'],
          outputTypes: ['AcceptanceCriteria[]', 'TestPlan'],
        },
        {
          capability: 'test-coverage',
          description: 'Analyze test coverage for requirements',
          inputTypes: ['RequirementSetData', 'TestPlan'],
          outputTypes: ['CoverageReport'],
        },
      ],
    })

    // DAHS - Product Configuration
    this.register({
      type: 'DAHS',
      name: 'DAHS Agent',
      description: 'Product knowledge agent - knows what DAHS can do',
      domain: 'product-configuration',
      priority: 9,
      capabilities: [
        {
          capability: 'capability-query',
          description: 'Query what DAHS can do',
          inputTypes: ['string', 'DAHSCapabilityQuery'],
          outputTypes: ['DAHSCapability[]', 'boolean'],
        },
        {
          capability: 'configuration-validation',
          description: 'Validate proposed DAHS configurations',
          inputTypes: ['DAHSConfiguration', 'DAHSProposalData'],
          outputTypes: ['ValidationResult', 'ConfigurationFeedback'],
        },
        {
          capability: 'feasibility-check',
          description: 'Check if requirements are feasible with DAHS',
          inputTypes: ['PermitObligation[]', 'Requirement[]'],
          outputTypes: ['FeasibilityResult', 'GapAnalysis[]'],
        },
      ],
    })
  }

  /**
   * Register an agent
   */
  register(agent: AgentInfo): void {
    this.agents.set(agent.type, agent)
  }

  /**
   * Get agent information
   */
  getAgent(type: AgentType): AgentInfo | undefined {
    return this.agents.get(type)
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentInfo[] {
    return Array.from(this.agents.values())
  }

  /**
   * Find agents that have a specific capability
   */
  findAgentsByCapability(capability: AgentCapability): AgentInfo[] {
    return Array.from(this.agents.values()).filter((agent) =>
      agent.capabilities.some((cap) => cap.capability === capability)
    )
  }

  /**
   * Find agents in a specific domain
   */
  findAgentsByDomain(domain: string): AgentInfo[] {
    return Array.from(this.agents.values()).filter((agent) => agent.domain === domain)
  }

  /**
   * Get capability definition
   */
  getCapabilityDef(capability: AgentCapability): AgentCapabilityDef | undefined {
    for (const agent of this.agents.values()) {
      const cap = agent.capabilities.find((c) => c.capability === capability)
      if (cap !== undefined) {
        return cap
      }
    }
    return undefined
  }

  /**
   * Check if an agent has a capability
   */
  hasCapability(agentType: AgentType, capability: AgentCapability): boolean {
    const agent = this.agents.get(agentType)
    if (agent === undefined) return false
    return agent.capabilities.some((cap) => cap.capability === capability)
  }

  /**
   * Get all capabilities across all agents
   */
  getAllCapabilities(): AgentCapabilityDef[] {
    const capabilities: AgentCapabilityDef[] = []
    for (const agent of this.agents.values()) {
      capabilities.push(...agent.capabilities)
    }
    return capabilities
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry()
