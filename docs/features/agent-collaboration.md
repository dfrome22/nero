# Agent Collaboration System

> Multi-agent workflow automation inspired by Activepieces

## Overview

The Agent Collaboration System enables NERO agents to work together seamlessly in automated workflows with human approval gates. This implements the vision described in the problem statement where agents collaborate based on their capabilities and the needs of the workflow.

## Core Concepts

### Agent Registry

The Agent Registry maintains information about all available agents and their capabilities:

- **RegsBot**: Regulatory knowledge (eCFR, EPA guidance, permits)
- **RequirementsBot**: Requirements engineering (gap analysis, DAHS proposals)
- **FigmaBot**: UI/UX design (wireframes, components)
- **TestingBot**: Testing and validation (test plans, acceptance criteria)
- **DAHS**: Product configuration (capability queries, validation)

### Agent Router

The Agent Router determines which agent should handle a specific task based on:

- **Intent analysis**: Natural language processing of the request
- **Capability matching**: Finding agents with required capabilities
- **Context awareness**: Considering the current workflow phase
- **Priority resolution**: Selecting the best agent when multiple match

### Collaboration Orchestrator

The Collaboration Orchestrator manages multi-agent workflows:

- **Sequential execution**: Agents execute in order
- **Human approval gates**: Pause for review at critical points
- **Dynamic workflows**: Build workflows on-the-fly based on intent
- **State management**: Track artifacts and progress
- **Agent handoffs**: One agent delegates to another

## Example Workflow

### Permit-to-DAHS Configuration Workflow

This example shows how agents collaborate to analyze a permit and generate a DAHS configuration:

```typescript
import { collaborationOrchestrator } from '@/agents/collaboration'
import type { CollaborationWorkflow } from '@/types/agent-collaboration'

const workflow: CollaborationWorkflow = {
  id: 'permit-to-dahs',
  name: 'Permit to DAHS Configuration',
  description: 'Analyze permit and generate DAHS configuration proposal',
  pattern: 'sequential',
  steps: [
    {
      id: 'step-1-extract-obligations',
      agent: 'RegsBot',
      capability: 'permit-analysis',
      inputs: ['permit-document'],
      outputs: ['permit-obligations'],
      continueOnFailure: false,
      requiresApproval: true,
    },
    {
      id: 'step-2-gap-analysis',
      agent: 'RequirementsBot',
      capability: 'gap-analysis',
      inputs: ['permit-obligations', 'dahs-profile'],
      outputs: ['gap-analysis-results'],
      continueOnFailure: false,
      requiresApproval: true,
    },
    {
      id: 'step-3-generate-proposal',
      agent: 'RequirementsBot',
      capability: 'dahs-proposal',
      inputs: ['gap-analysis-results'],
      outputs: ['dahs-proposal'],
      continueOnFailure: false,
      requiresApproval: true,
    },
    {
      id: 'step-4-generate-tests',
      agent: 'TestingBot',
      capability: 'test-plan-generation',
      inputs: ['dahs-proposal'],
      outputs: ['test-plan'],
      continueOnFailure: false,
      requiresApproval: true,
    },
  ],
  approvalGates: [
    {
      id: 'gate-1',
      afterStep: 'step-1-extract-obligations',
      title: 'Review Permit Obligations',
      description: 'Verify extracted obligations are accurate and complete',
      approvalCriteria: [
        'All obligations extracted',
        'Citations are correct',
        'No false positives',
      ],
    },
    {
      id: 'gate-2',
      afterStep: 'step-2-gap-analysis',
      title: 'Review Gap Analysis',
      description: 'Review the gap analysis between obligations and DAHS capabilities',
      approvalCriteria: [
        'Gap analysis is accurate',
        'All obligations categorized',
        'Recommendations are reasonable',
      ],
    },
    {
      id: 'gate-3',
      afterStep: 'step-3-generate-proposal',
      title: 'Review DAHS Proposal',
      description: 'Review the proposed DAHS configuration',
      approvalCriteria: [
        'Configuration is valid',
        'Addresses all requirements',
        'No conflicts or errors',
      ],
    },
    {
      id: 'gate-4',
      afterStep: 'step-4-generate-tests',
      title: 'Review Test Plan',
      description: 'Review the test plan for the DAHS configuration',
      approvalCriteria: [
        'Tests cover all requirements',
        'Acceptance criteria are clear',
        'Test plan is executable',
      ],
    },
  ],
}

// Execute the workflow
const execution = orchestrator.startWorkflow(workflow, {
  sessionId: 'session-123',
  artifacts: {
    'permit-document': permitDoc,
    'dahs-profile': dahsProfile,
  },
})

// Execute steps with approval
let step1 = await orchestrator.executeNextStep(execution.id, workflow)
// (Paused at gate-1, waiting for approval)

orchestrator.approveStep(execution.id, 'Obligations look good')

let step2 = await orchestrator.executeNextStep(execution.id, workflow)
// (Paused at gate-2, waiting for approval)

// ... continue through remaining steps
```

## Dynamic Workflows

The orchestrator can also create workflows dynamically based on natural language intents:

```typescript
// Create a dynamic workflow from intent
const workflow = orchestrator.createDynamicWorkflow('Analyze permit and generate DAHS proposal', {
  sessionId: 'session-456',
  artifacts: {
    'permit-document': permitDoc,
  },
})

// The orchestrator automatically:
// 1. Routes to RegsBot for permit analysis
// 2. Routes to RequirementsBot for gap analysis and proposal
// 3. Adds appropriate approval gates
```

## Agent Routing Examples

### Route by Intent

```typescript
import { agentRegistry, createAgentRouter } from '@/agents/collaboration'

const router = createAgentRouter(agentRegistry)

// Route regulatory questions to RegsBot
const decision1 = router.route({
  intent: 'Look up 40 CFR 75.10 requirements',
})
// Result: { selectedAgent: 'RegsBot', capability: 'regulatory-lookup', confidence: 0.8 }

// Route gap analysis to RequirementsBot
const decision2 = router.route({
  intent: 'Analyze gaps between permit obligations and DAHS capabilities',
})
// Result: { selectedAgent: 'RequirementsBot', capability: 'gap-analysis', confidence: 0.8 }

// Route UI work to FigmaBot
const decision3 = router.route({
  intent: 'Generate wireframes for the monitoring dashboard',
})
// Result: { selectedAgent: 'FigmaBot', capability: 'wireframe-generation', confidence: 0.8 }

// Route testing work to TestingBot
const decision4 = router.route({
  intent: 'Create test plan for DAHS requirements',
})
// Result: { selectedAgent: 'TestingBot', capability: 'test-plan-generation', confidence: 0.8 }
```

### Route by Required Capabilities

```typescript
// Find agent with specific capability
const decision = router.route({
  intent: 'Process permit document',
  requiredCapabilities: ['permit-analysis'],
})
// Result: { selectedAgent: 'RegsBot', capability: 'permit-analysis', ... }
```

### Context-Aware Routing

```typescript
// Router considers current workflow phase
const context: CollaborationContext = {
  sessionId: 'session-789',
  artifacts: {},
  currentPhase: 'analysis',
  completedSteps: ['discovery'],
  pendingActions: [],
  requiresApproval: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const decision = router.route({
  intent: 'Continue analysis',
  context,
})
// Result: Routes to RequirementsBot because phase is 'analysis'
```

## Agent Handoffs

Agents can delegate work to other agents:

```typescript
// RegsBot discovers it needs requirements analysis
const handoffMessage: HandoffMessage = {
  id: 'handoff-1',
  type: 'handoff',
  from: 'RegsBot',
  to: 'RequirementsBot',
  capability: 'gap-analysis',
  payload: {
    reason: 'Regulatory analysis complete, need gap analysis',
    currentState: {
      obligations: extractedObligations,
    },
    nextActions: ['gap-analysis', 'dahs-proposal'],
  },
  status: 'completed',
  timestamp: new Date().toISOString(),
}

await orchestrator.handleHandoff(executionId, handoffMessage)
```

## Collaboration Patterns

### Sequential Pattern

Agents execute in a fixed order:

```
RegsBot → RequirementsBot → TestingBot → FigmaBot
```

### Conditional Pattern

Execution branches based on conditions:

```
RegsBot → RequirementsBot
             ├─ (if gaps exist) → DevelopmentBacklog
             └─ (if all supported) → TestingBot
```

### Collaborative Pattern

Multiple agents work together on the same task:

```
RegsBot (provides regulations)
  ↓
RequirementsBot (analyzes requirements)
  ↓
DAHS (validates feasibility)
  ↓
Back to RequirementsBot (generates proposal)
```

## Human-in-the-Loop

Approval gates pause workflows for human review:

```typescript
// Check if workflow is paused for approval
if (execution.status === 'paused' && execution.context.requiresApproval) {
  // Display approval UI to user
  const gate = workflow.approvalGates.find((g) => g.id === execution.context.approvalGate)

  // User reviews and approves
  orchestrator.approveStep(execution.id, 'Approved - looks good')

  // Workflow resumes
  await orchestrator.executeNextStep(execution.id, workflow)
}
```

## Benefits

1. **Separation of Concerns**: Each agent focuses on its domain expertise
2. **Reusability**: Agents can be combined in different workflows
3. **Traceability**: Full audit trail of agent interactions
4. **Human Control**: Approval gates at critical decision points
5. **Flexibility**: Dynamic workflows adapt to changing requirements
6. **Safety**: Controlled execution with validation and rollback

## Usage in NERO

The collaboration system is used throughout NERO:

- **Dashboard**: Display available agents and their capabilities
- **Workflow Builder**: Drag-and-drop workflow creation
- **Run Console**: Monitor and control workflow execution
- **Approval Gates**: Review and approve agent outputs
- **Artifact Registry**: Store and version agent outputs

## API Reference

### AgentRegistry

```typescript
class AgentRegistry {
  register(agent: AgentInfo): void
  getAgent(type: AgentType): AgentInfo | undefined
  getAllAgents(): AgentInfo[]
  findAgentsByCapability(capability: AgentCapability): AgentInfo[]
  hasCapability(agentType: AgentType, capability: AgentCapability): boolean
}
```

### AgentRouter

```typescript
class AgentRouter {
  route(query: RoutingQuery): RoutingDecision
  suggestNextAgent(context: CollaborationContext): RoutingDecision[]
}
```

### CollaborationOrchestrator

```typescript
class CollaborationOrchestrator {
  startWorkflow(
    workflow: CollaborationWorkflow,
    context: Partial<CollaborationContext>
  ): CollaborationExecution
  executeNextStep(executionId: string, workflow: CollaborationWorkflow): CollaborationExecution
  approveStep(executionId: string, comment: string): CollaborationExecution
  createDynamicWorkflow(
    intent: string,
    context: Partial<CollaborationContext>
  ): CollaborationWorkflow
  handleHandoff(executionId: string, handoffMessage: HandoffMessage): CollaborationExecution
  getResult(executionId: string): CollaborationResult
}
```

## Testing

The collaboration system includes comprehensive tests:

```bash
npm run test:run -- src/agents/collaboration
```

Tests cover:

- Agent registration and discovery
- Intent-based routing
- Capability-based routing
- Context-aware routing
- Workflow execution
- Approval gates
- Dynamic workflow creation
- Agent handoffs

## Future Enhancements

- **Parallel Execution**: Multiple agents working simultaneously
- **Retry Logic**: Automatic retry on transient failures
- **Workflow Templates**: Pre-built workflows for common scenarios
- **Visual Workflow Builder**: Drag-and-drop UI for creating workflows
- **Workflow Versioning**: Track and manage workflow versions
- **Performance Monitoring**: Track agent performance and bottlenecks
