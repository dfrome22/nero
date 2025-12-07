/**
 * Collaboration Orchestrator
 *
 * Manages multi-agent collaboration workflows with human approval gates.
 * Similar to Activepieces workflow automation but tailored for NERO agents.
 */

import type {
  AgentType,
  AgentCapability,
  AgentMessage,
  CollaborationContext,
  CollaborationWorkflow,
  CollaborationExecution,
  CollaborationResult,
  CollaborationEvent,
  CollaborationPhase,
  HandoffMessage,
  RequestMessage,
  ResponseMessage,
} from '../../types/agent-collaboration'
import { AgentRegistry } from './agent-registry'
import { AgentRouter } from './agent-router'

/**
 * Collaboration Orchestrator - manages agent workflows
 */
export class CollaborationOrchestrator {
  private registry: AgentRegistry
  private router: AgentRouter
  private executions = new Map<string, CollaborationExecution>()

  constructor(registry: AgentRegistry, router: AgentRouter) {
    this.registry = registry
    this.router = router
  }

  /**
   * Start a collaboration workflow
   */
  startWorkflow(
    workflow: CollaborationWorkflow,
    initialContext: Partial<CollaborationContext>
  ): CollaborationExecution {
    const executionId = this.generateId()

    const context: CollaborationContext = {
      sessionId: initialContext.sessionId ?? this.generateId(),
      workflowId: workflow.id,
      projectId: initialContext.projectId,
      userId: initialContext.userId,
      artifacts: initialContext.artifacts ?? {},
      evidence: initialContext.evidence,
      currentPhase: 'initialization',
      completedSteps: [],
      pendingActions: workflow.steps.map((s) => s.id),
      requiresApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const execution: CollaborationExecution = {
      id: executionId,
      workflowId: workflow.id,
      context,
      status: 'running',
      currentStep: workflow.steps[0]?.id,
      startedAt: new Date().toISOString(),
      results: {},
      messages: [],
    }

    this.executions.set(executionId, execution)
    return execution
  }

  /**
   * Execute next step in the workflow
   */
  executeNextStep(executionId: string, workflow: CollaborationWorkflow): CollaborationExecution {
    const execution = this.executions.get(executionId)
    if (execution === undefined) {
      throw new Error(`Execution ${executionId} not found`)
    }

    if (execution.status !== 'running') {
      return execution
    }

    const currentStep = workflow.steps.find((s) => s.id === execution.currentStep)
    if (currentStep === undefined) {
      // No more steps, mark as completed
      execution.status = 'completed'
      execution.completedAt = new Date().toISOString()
      return execution
    }

    // Check if step requires approval
    const approvalGate = workflow.approvalGates.find((g) => g.afterStep === currentStep.id)
    if (approvalGate !== undefined && !execution.context.requiresApproval) {
      // Pause for approval
      execution.status = 'paused'
      execution.context.requiresApproval = true
      execution.context.approvalGate = approvalGate.id
      execution.context.updatedAt = new Date().toISOString()
      return execution
    }

    // Execute step
    const event: CollaborationEvent = {
      timestamp: new Date().toISOString(),
      agent: currentStep.agent,
      action: `Execute capability: ${currentStep.capability}`,
      status: 'started',
    }

    try {
      // Create request message
      const message = this.createRequestMessage(currentStep, execution.context)
      execution.messages.push(message)

      // Simulate agent execution (in real implementation, this would invoke the actual agent)
      const response = this.invokeAgent(currentStep.agent, currentStep.capability, message)
      execution.messages.push(response)

      // Store results
      if (response.payload.success) {
        for (const output of currentStep.outputs) {
          execution.results[output] = response.payload.data
          execution.context.artifacts[output] = response.payload.data
        }
        event.status = 'completed'
      } else {
        event.status = 'failed'
        event.details = response.payload.error
        if (!currentStep.continueOnFailure) {
          execution.status = 'failed'
        }
      }
    } catch (error) {
      event.status = 'failed'
      event.details = error instanceof Error ? error.message : 'Unknown error'
      if (!currentStep.continueOnFailure) {
        execution.status = 'failed'
      }
    }

    // Mark step as completed
    execution.context.completedSteps.push(currentStep.id)
    execution.context.pendingActions = execution.context.pendingActions.filter(
      (a) => a !== currentStep.id
    )

    // Move to next step
    const currentIndex = workflow.steps.findIndex((s) => s.id === currentStep.id)
    const nextStep = workflow.steps[currentIndex + 1]
    if (nextStep !== undefined) {
      execution.currentStep = nextStep.id
      execution.context.currentPhase = this.inferPhaseFromStep(nextStep)
    } else {
      execution.status = 'completed'
      execution.completedAt = new Date().toISOString()
      execution.context.currentPhase = 'completion'
    }

    execution.context.updatedAt = new Date().toISOString()
    return execution
  }

  /**
   * Approve a paused workflow
   */
  approveStep(executionId: string, comment: string): CollaborationExecution {
    const execution = this.executions.get(executionId)
    if (execution === undefined) {
      throw new Error(`Execution ${executionId} not found`)
    }

    if (execution.status !== 'paused') {
      throw new Error('Execution is not paused for approval')
    }

    execution.status = 'running'
    execution.context.requiresApproval = false
    execution.context.approvalGate = undefined
    execution.context.updatedAt = new Date().toISOString()

    // Add approval event
    const event: CollaborationEvent = {
      timestamp: new Date().toISOString(),
      agent: 'DAHS', // Placeholder for human approver
      action: 'Approved',
      status: 'completed',
      details: comment,
    }
    execution.messages.push(this.createNotificationMessage('Workflow approved', { comment, event }))

    return execution
  }

  /**
   * Create a dynamic workflow using agent routing
   */
  createDynamicWorkflow(
    intent: string,
    context: Partial<CollaborationContext>
  ): CollaborationWorkflow {
    const workflowId = this.generateId()

    // Build context
    const fullContext: CollaborationContext = {
      sessionId: context.sessionId ?? this.generateId(),
      workflowId,
      projectId: context.projectId,
      userId: context.userId,
      artifacts: context.artifacts ?? {},
      evidence: context.evidence,
      currentPhase: 'initialization',
      completedSteps: [],
      pendingActions: [],
      requiresApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Determine initial agent
    const initialRoute = this.router.route({
      intent,
      context: fullContext,
    })

    // Build workflow based on intent and routing
    const workflow: CollaborationWorkflow = {
      id: workflowId,
      name: `Dynamic workflow for: ${intent}`,
      description: `Auto-generated workflow based on intent analysis`,
      pattern: 'sequential',
      steps: [
        {
          id: 'step-1',
          agent: initialRoute.selectedAgent,
          capability: initialRoute.capability,
          inputs: [],
          outputs: ['step1-output'],
          continueOnFailure: false,
          requiresApproval: true,
        },
      ],
      approvalGates: [
        {
          id: 'gate-1',
          afterStep: 'step-1',
          title: 'Review Initial Analysis',
          description: 'Review the output before proceeding',
          approvalCriteria: ['Output is accurate', 'Citations are valid', 'Ready to proceed'],
        },
      ],
    }

    // Add follow-up steps based on agent type
    if (initialRoute.selectedAgent === 'RegsBot') {
      // After RegsBot, typically go to RequirementsBot
      workflow.steps.push({
        id: 'step-2',
        agent: 'RequirementsBot',
        capability: 'gap-analysis',
        inputs: ['step1-output'],
        outputs: ['gap-analysis'],
        continueOnFailure: false,
        requiresApproval: true,
      })
      workflow.approvalGates.push({
        id: 'gate-2',
        afterStep: 'step-2',
        title: 'Review Gap Analysis',
        description: 'Review the gap analysis before generating proposals',
        approvalCriteria: ['Gap analysis is accurate', 'All obligations analyzed'],
      })

      workflow.steps.push({
        id: 'step-3',
        agent: 'RequirementsBot',
        capability: 'dahs-proposal',
        inputs: ['gap-analysis'],
        outputs: ['dahs-proposal'],
        continueOnFailure: false,
        requiresApproval: true,
      })
      workflow.approvalGates.push({
        id: 'gate-3',
        afterStep: 'step-3',
        title: 'Review DAHS Proposal',
        description: 'Review the DAHS configuration proposal',
        approvalCriteria: ['Configuration is valid', 'Addresses all requirements'],
      })
    }

    return workflow
  }

  /**
   * Handle agent handoff (agent delegates to another agent)
   */
  handleHandoff(executionId: string, handoffMessage: HandoffMessage): CollaborationExecution {
    const execution = this.executions.get(executionId)
    if (execution === undefined) {
      throw new Error(`Execution ${executionId} not found`)
    }

    // Add handoff message to execution
    execution.messages.push(handoffMessage)

    // Update context with handoff state
    execution.context.artifacts['handoff-state'] = handoffMessage.payload.currentState
    execution.context.pendingActions = handoffMessage.payload.nextActions
    execution.context.updatedAt = new Date().toISOString()

    return execution
  }

  /**
   * Get execution result
   */
  getResult(executionId: string): CollaborationResult {
    const execution = this.executions.get(executionId)
    if (execution === undefined) {
      throw new Error(`Execution ${executionId} not found`)
    }

    const timeline: CollaborationEvent[] = execution.messages.map((msg) => ({
      timestamp: msg.timestamp,
      agent: msg.from,
      action: msg.type,
      status: msg.status === 'completed' ? 'completed' : 'failed',
      details: JSON.stringify(msg.payload),
    }))

    return {
      executionId: execution.id,
      success: execution.status === 'completed',
      artifacts: execution.context.artifacts,
      timeline,
      summary: this.generateSummary(execution),
      error: execution.status === 'failed' ? 'Workflow failed' : undefined,
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private createRequestMessage(
    step: CollaborationWorkflow['steps'][0],
    context: CollaborationContext
  ): RequestMessage {
    const inputs: Record<string, unknown> = {}
    for (const inputKey of step.inputs) {
      inputs[inputKey] = context.artifacts[inputKey]
    }

    return {
      id: this.generateId(),
      type: 'request',
      from: 'DAHS', // Orchestrator
      to: step.agent,
      capability: step.capability,
      payload: {
        action: step.capability,
        inputs,
      },
      context,
      status: 'pending',
      timestamp: new Date().toISOString(),
    }
  }

  private createNotificationMessage(message: string, data: Record<string, unknown>): AgentMessage {
    return {
      id: this.generateId(),
      type: 'notification',
      from: 'DAHS',
      to: 'DAHS',
      capability: 'capability-query',
      payload: { message, ...data },
      status: 'completed',
      timestamp: new Date().toISOString(),
    }
  }

  private invokeAgent(
    _agent: AgentType,
    _capability: AgentCapability,
    _message: RequestMessage
  ): ResponseMessage {
    // Placeholder for actual agent invocation
    // In real implementation, this would:
    // 1. Load the agent service (RegsBot, RequirementsBot, etc.)
    // 2. Call the appropriate method based on capability
    // 3. Return the result

    // For now, return a mock success response
    return {
      id: this.generateId(),
      type: 'response',
      from: _agent,
      to: 'DAHS',
      capability: _capability,
      payload: {
        success: true,
        data: { message: 'Mock agent response' },
      },
      status: 'completed',
      timestamp: new Date().toISOString(),
      responseToId: _message.id,
    }
  }

  private inferPhaseFromStep(step: CollaborationWorkflow['steps'][0]): CollaborationPhase {
    const capability = step.capability

    if (
      capability === 'regulatory-lookup' ||
      capability === 'permit-analysis' ||
      capability === 'obligation-extraction'
    ) {
      return 'discovery'
    }

    if (capability === 'gap-analysis' || capability === 'feasibility-check') {
      return 'analysis'
    }

    if (
      capability === 'dahs-proposal' ||
      capability === 'requirement-generation' ||
      capability === 'wireframe-generation'
    ) {
      return 'proposal'
    }

    if (
      capability === 'test-plan-generation' ||
      capability === 'acceptance-criteria' ||
      capability === 'test-coverage'
    ) {
      return 'validation'
    }

    return 'execution'
  }

  private generateSummary(execution: CollaborationExecution): string {
    const stepCount = execution.context.completedSteps.length
    const artifactCount = Object.keys(execution.context.artifacts).length

    return `Workflow executed ${stepCount} steps and produced ${artifactCount} artifacts. Status: ${execution.status}`
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }
}

/**
 * Factory function to create orchestrator with dependencies
 */
export function createCollaborationOrchestrator(): CollaborationOrchestrator {
  const registry = new AgentRegistry()
  const router = new AgentRouter(registry)
  return new CollaborationOrchestrator(registry, router)
}

// Export singleton instance
export const collaborationOrchestrator = createCollaborationOrchestrator()
