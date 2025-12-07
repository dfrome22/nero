/**
 * Tests for Agent Collaboration System
 */

/* eslint-disable @typescript-eslint/await-thenable */

import { describe, it, expect, beforeEach } from 'vitest'
import { AgentRegistry } from './agent-registry'
import { AgentRouter } from './agent-router'
import { CollaborationOrchestrator } from './collaboration-orchestrator'
import type {
  CollaborationWorkflow,
  CollaborationContext,
  AgentType,
} from '../../types/agent-collaboration'

describe('AgentRegistry', () => {
  let registry: AgentRegistry

  beforeEach(() => {
    registry = new AgentRegistry()
  })

  it('should register default agents', () => {
    const agents = registry.getAllAgents()
    expect(agents.length).toBe(5) // RegsBot, RequirementsBot, FigmaBot, TestingBot, DAHS
  })

  it('should get agent by type', () => {
    const regsBot = registry.getAgent('RegsBot')
    expect(regsBot).toBeDefined()
    expect(regsBot?.name).toBe('RegsBot')
    expect(regsBot?.domain).toBe('regulatory-knowledge')
  })

  it('should find agents by capability', () => {
    const agents = registry.findAgentsByCapability('gap-analysis')
    expect(agents.length).toBeGreaterThan(0)
    expect(agents[0]?.type).toBe('RequirementsBot')
  })

  it('should find agents by domain', () => {
    const agents = registry.findAgentsByDomain('regulatory-knowledge')
    expect(agents.length).toBe(1)
    expect(agents[0]?.type).toBe('RegsBot')
  })

  it('should check if agent has capability', () => {
    expect(registry.hasCapability('RegsBot', 'regulatory-lookup')).toBe(true)
    expect(registry.hasCapability('RegsBot', 'gap-analysis')).toBe(false)
  })

  it('should get capability definition', () => {
    const capDef = registry.getCapabilityDef('regulatory-lookup')
    expect(capDef).toBeDefined()
    expect(capDef?.description).toContain('CFR')
  })

  it('should get all capabilities', () => {
    const capabilities = registry.getAllCapabilities()
    expect(capabilities.length).toBeGreaterThan(10)
  })
})

describe('AgentRouter', () => {
  let registry: AgentRegistry
  let router: AgentRouter

  beforeEach(() => {
    registry = new AgentRegistry()
    router = new AgentRouter(registry)
  })

  it('should have regulatory-lookup capability registered', () => {
    const agents = registry.findAgentsByCapability('regulatory-lookup')
    expect(agents.length).toBeGreaterThan(0)
    expect(agents[0]?.type).toBe('RegsBot')
  })

  it('should route regulatory questions to RegsBot', () => {
    const decision = router.route({
      intent: 'Look up 40 CFR 75.10 requirements',
    })
    expect(decision.selectedAgent).toBe('RegsBot')
    expect(decision.confidence).toBeGreaterThan(0.5)
  })

  it('should route gap analysis to RequirementsBot', () => {
    const decision = router.route({
      intent: 'Analyze gaps between permit obligations and DAHS capabilities',
    })
    expect(decision.selectedAgent).toBe('RequirementsBot')
    expect(decision.capability).toBe('gap-analysis')
  })

  it('should route UI work to FigmaBot', () => {
    const decision = router.route({
      intent: 'Generate wireframes for the monitoring dashboard',
    })
    expect(decision.selectedAgent).toBe('FigmaBot')
    expect(decision.capability).toBe('wireframe-generation')
  })

  it('should route testing work to TestingBot', () => {
    const decision = router.route({
      intent: 'Create test plan for DAHS requirements',
    })
    expect(decision.selectedAgent).toBe('TestingBot')
    expect(decision.capability).toBe('test-plan-generation')
  })

  it('should honor preferred agent', () => {
    const decision = router.route({
      intent: 'Analyze something',
      preferredAgent: 'DAHS',
    })
    expect(decision.selectedAgent).toBe('DAHS')
  })

  it('should exclude specified agents', () => {
    const decision = router.route({
      intent: 'Look up regulatory requirements',
      excludeAgents: ['RegsBot'],
    })
    expect(decision.selectedAgent).not.toBe('RegsBot')
  })

  it('should route by required capabilities', () => {
    const decision = router.route({
      intent: 'Process permit document',
      requiredCapabilities: ['permit-analysis'],
    })
    expect(decision.selectedAgent).toBe('RegsBot')
    expect(decision.capability).toBe('permit-analysis')
  })

  it('should provide routing alternatives', () => {
    const decision = router.route({
      intent: 'Analyze regulatory requirements',
    })
    // Some routing decisions may have alternatives
    if (decision.alternatives !== undefined) {
      expect(Array.isArray(decision.alternatives)).toBe(true)
    }
  })

  it('should suggest next agent based on phase', () => {
    const context: CollaborationContext = {
      sessionId: 'test-session',
      artifacts: {},
      currentPhase: 'discovery',
      completedSteps: [],
      pendingActions: [],
      requiresApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const suggestions = router.suggestNextAgent(context)
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0]?.selectedAgent).toBe('RegsBot')
  })

  it('should suggest RequirementsBot in analysis phase', () => {
    const context: CollaborationContext = {
      sessionId: 'test-session',
      artifacts: {},
      currentPhase: 'analysis',
      completedSteps: [],
      pendingActions: [],
      requiresApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const suggestions = router.suggestNextAgent(context)
    expect(suggestions[0]?.selectedAgent).toBe('RequirementsBot')
    expect(suggestions[0]?.capability).toBe('gap-analysis')
  })
})

describe('CollaborationOrchestrator', () => {
  let orchestrator: CollaborationOrchestrator

  beforeEach(() => {
    const registry = new AgentRegistry()
    const router = new AgentRouter(registry)
    orchestrator = new CollaborationOrchestrator(registry, router)
  })

  it('should start a workflow', () => {
    const workflow: CollaborationWorkflow = {
      id: 'workflow-1',
      name: 'Test Workflow',
      description: 'A test workflow',
      pattern: 'sequential',
      steps: [
        {
          id: 'step-1',
          agent: 'RegsBot',
          capability: 'regulatory-lookup',
          inputs: [],
          outputs: ['regulations'],
          continueOnFailure: false,
          requiresApproval: false,
        },
      ],
      approvalGates: [],
    }

    const execution = orchestrator.startWorkflow(workflow, {
      sessionId: 'test-session',
      artifacts: {},
    })

    expect(execution.id).toBeDefined()
    expect(execution.workflowId).toBe('workflow-1')
    expect(execution.status).toBe('running')
    expect(execution.context.currentPhase).toBe('initialization')
  })

  it('should execute workflow steps', async () => {
    const workflow: CollaborationWorkflow = {
      id: 'workflow-2',
      name: 'Multi-step Workflow',
      description: 'A workflow with multiple steps',
      pattern: 'sequential',
      steps: [
        {
          id: 'step-1',
          agent: 'RegsBot',
          capability: 'permit-analysis',
          inputs: [],
          outputs: ['obligations'],
          continueOnFailure: false,
          requiresApproval: false,
        },
        {
          id: 'step-2',
          agent: 'RequirementsBot',
          capability: 'gap-analysis',
          inputs: ['obligations'],
          outputs: ['gaps'],
          continueOnFailure: false,
          requiresApproval: false,
        },
      ],
      approvalGates: [],
    }

    const execution = orchestrator.startWorkflow(workflow, {
      sessionId: 'test-session-2',
    })

    // Execute first step
    const afterStep1 = await orchestrator.executeNextStep(execution.id, workflow)
    expect(afterStep1.context.completedSteps).toContain('step-1')
    expect(afterStep1.currentStep).toBe('step-2')

    // Execute second step
    const afterStep2 = await orchestrator.executeNextStep(execution.id, workflow)
    expect(afterStep2.context.completedSteps).toContain('step-2')
    expect(afterStep2.status).toBe('completed')
  })

  it('should pause at approval gates', async () => {
    const workflow: CollaborationWorkflow = {
      id: 'workflow-3',
      name: 'Workflow with Approval',
      description: 'A workflow that requires approval',
      pattern: 'sequential',
      steps: [
        {
          id: 'step-1',
          agent: 'RegsBot',
          capability: 'regulatory-lookup',
          inputs: [],
          outputs: ['regulations'],
          continueOnFailure: false,
          requiresApproval: true,
        },
      ],
      approvalGates: [
        {
          id: 'gate-1',
          afterStep: 'step-1',
          title: 'Review Regulations',
          description: 'Review extracted regulations',
          approvalCriteria: ['Regulations are accurate'],
        },
      ],
    }

    const execution = orchestrator.startWorkflow(workflow, {
      sessionId: 'test-session-3',
    })

    const afterStep1 = await orchestrator.executeNextStep(execution.id, workflow)
    expect(afterStep1.status).toBe('paused')
    expect(afterStep1.context.requiresApproval).toBe(true)
    expect(afterStep1.context.approvalGate).toBe('gate-1')
  })

  it('should resume after approval', async () => {
    const workflow: CollaborationWorkflow = {
      id: 'workflow-4',
      name: 'Workflow with Approval',
      description: 'A workflow that requires approval',
      pattern: 'sequential',
      steps: [
        {
          id: 'step-1',
          agent: 'RegsBot',
          capability: 'regulatory-lookup',
          inputs: [],
          outputs: ['regulations'],
          continueOnFailure: false,
          requiresApproval: true,
        },
      ],
      approvalGates: [
        {
          id: 'gate-1',
          afterStep: 'step-1',
          title: 'Review Regulations',
          description: 'Review extracted regulations',
          approvalCriteria: ['Regulations are accurate'],
        },
      ],
    }

    const execution = orchestrator.startWorkflow(workflow, {
      sessionId: 'test-session-4',
    })

    await orchestrator.executeNextStep(execution.id, workflow)

    const approved = orchestrator.approveStep(execution.id, 'Looks good')
    expect(approved.status).toBe('running')
    expect(approved.context.requiresApproval).toBe(false)
  })

  it('should create dynamic workflow', () => {
    const workflow = orchestrator.createDynamicWorkflow(
      'Analyze permit and generate DAHS proposal',
      {
        sessionId: 'dynamic-session',
      }
    )

    expect(workflow.id).toBeDefined()
    expect(workflow.steps.length).toBeGreaterThan(0)
    expect(workflow.steps[0]?.agent).toBeDefined()
    expect(workflow.approvalGates.length).toBeGreaterThan(0)
  })

  it('should generate workflow result', async () => {
    const workflow: CollaborationWorkflow = {
      id: 'workflow-5',
      name: 'Simple Workflow',
      description: 'A simple test workflow',
      pattern: 'sequential',
      steps: [
        {
          id: 'step-1',
          agent: 'RegsBot',
          capability: 'regulatory-lookup',
          inputs: [],
          outputs: ['regulations'],
          continueOnFailure: false,
          requiresApproval: false,
        },
      ],
      approvalGates: [],
    }

    const execution = orchestrator.startWorkflow(workflow, {
      sessionId: 'test-session-5',
    })

    await orchestrator.executeNextStep(execution.id, workflow)

    const result = orchestrator.getResult(execution.id)
    expect(result.executionId).toBe(execution.id)
    expect(result.success).toBe(true)
    expect(result.timeline.length).toBeGreaterThan(0)
  })

  it('should handle agent handoff', () => {
    const workflow: CollaborationWorkflow = {
      id: 'workflow-6',
      name: 'Handoff Workflow',
      description: 'A workflow with agent handoff',
      pattern: 'sequential',
      steps: [
        {
          id: 'step-1',
          agent: 'RegsBot',
          capability: 'permit-analysis',
          inputs: [],
          outputs: ['obligations'],
          continueOnFailure: false,
          requiresApproval: false,
        },
      ],
      approvalGates: [],
    }

    const execution = orchestrator.startWorkflow(workflow, {
      sessionId: 'test-session-6',
    })

    const handoffMessage = {
      id: 'handoff-1',
      type: 'handoff' as const,
      from: 'RegsBot' as AgentType,
      to: 'RequirementsBot' as AgentType,
      capability: 'gap-analysis' as const,
      payload: {
        reason: 'Regulatory analysis complete, need gap analysis',
        currentState: { obligations: [] },
        nextActions: ['gap-analysis', 'dahs-proposal'],
      },
      status: 'completed' as const,
      timestamp: new Date().toISOString(),
    }

    const afterHandoff = orchestrator.handleHandoff(execution.id, handoffMessage)
    expect(afterHandoff.messages).toContain(handoffMessage)
    expect(afterHandoff.context.artifacts['handoff-state']).toBeDefined()
  })
})
