# Orchestration Layer

> The control plane for NERO's multi-agent workflows

## Overview

The Orchestration Layer enables Business Analysts to:

- Connect specialized agents into **repeatable flows** (drag/drop nodes + link edges)
- Attach **scoped context** (eCFR, EPA guidance, permits, DAHS specs, code refs)
- Run workflows in a **deterministic, reviewable** manner
- Enforce **human approvals** at critical points
- Produce **traceable, exportable** deliverables

## UX Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        HEADER / TOOLBAR                          │
├─────────────────────────────────────┬───────────────────────────┤
│                                     │                           │
│         CANVAS GRAPH                │     NODE INSPECTOR        │
│         (nodes + edges)             │     - Inputs              │
│                                     │     - Context scope       │
│                                     │     - Outputs             │
│                                     │     - Policies            │
│                                     │                           │
├─────────────────────────────────────┴───────────────────────────┤
│                        RUN CONSOLE                               │
│         Timeline | Logs | Approvals | Outputs                    │
└─────────────────────────────────────────────────────────────────┘
```

## Node Types

### Agent Nodes (P0)

| Node            | Purpose                | Input        | Output          |
| --------------- | ---------------------- | ------------ | --------------- |
| RegsBot         | Build Evidence Library | Sources      | EvidenceLibrary |
| RequirementsBot | Generate requirements  | Evidence     | RequirementSet  |
| FigmaBot        | Create wireframes      | Requirements | WireframeSpec   |
| TestingBot      | Generate test plans    | Requirements | TestPlan        |

### Control Nodes (P0)

| Node         | Purpose                   |
| ------------ | ------------------------- |
| Start        | Entry point               |
| End          | Exit point                |
| ApprovalGate | Pause for human approval  |
| Router       | Branch by condition       |
| Transform    | Validate/merge/split data |
| Publish      | Export to ADO/wiki/Figma  |

## Node Configuration

Each node is configurable with:

### Inputs

- Artifact references (from earlier nodes)
- Document references (from evidence library)
- Freeform BA notes

### Context Scope

- **Project scope**: All approved evidence
- **Node scope**: Selected docs only
- **Restricted scope**: Only "authoritative" sources

### Output Contract

- Output artifact type + version
- Required schema/shape
- Required citation density

### Policies

- Tool permissions
- Approval requirements
- Redaction rules

## Workflow Templates

### Template A: Reg-to-Dev Requirements

```
Start → RegsBot → ApprovalGate → RequirementsBot → ApprovalGate → TestingBot → ApprovalGate → Publish → End
```

### Template B: Permit OCR → DAHS Solution

```
Start → Import → RegsBot → ApprovalGate → RequirementsBot → SolutionMapper → TestingBot → Publish → End
```

### Template C: UX Scaffold

```
Start → RequirementsBot → FigmaBot → ApprovalGate → Publish → End
```

## Cross-Agent Context Sharing

Agents communicate through typed context envelopes that carry artifacts between steps.

### Context Types

| Type                                 | Description                                                         |
| ------------------------------------ | ------------------------------------------------------------------- |
| `AgentContext<T>`                    | Generic envelope with source/target agents, artifact data, metadata |
| `RegsBotToRequirementsBotContext`    | ComplianceReport + extracted obligations                            |
| `RegsBotToFigmaBotContext`           | ComplianceReport + UI requirements                                  |
| `RequirementsBotToTestingBotContext` | DAHSProposal + testable requirements                                |

### Agent Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         RegsBot                                  │
│   Monitoring Plan → ComplianceReport + PermitObligations        │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│      RequirementsBot        │   │         FigmaBot            │
│  Obligations → GapAnalysis  │   │ ComplianceReport → Wireframes │
│  → DAHSProposal             │   │                             │
└──────────────┬──────────────┘   └─────────────────────────────┘
               │
               ▼
┌─────────────────────────────┐
│        TestingBot           │
│  DAHSProposal → TestPlan    │
└─────────────────────────────┘
```

### Helper Functions

```typescript
// Create a context envelope for agent communication
createAgentContext<T>(
  sourceAgent: AgentType,
  targetAgents: AgentType[],
  artifactType: SharedArtifactType,
  data: T,
  facility: { id: string; orisCode: number },
  citationIds?: string[]
): AgentContext<T>

// Extract PermitObligations from a ComplianceReport for RequirementsBot
extractObligationsFromReport(report: ComplianceReport): PermitObligation[]
```

### Test Coverage

Cross-agent context sharing has **11 tests** covering:

- Context envelope creation
- Obligation extraction from ComplianceReport
- All obligation types (monitoring, QA, calculation, reporting, limits, recordkeeping)

## Implementation

### Key Components

- `WorkflowBuilder.tsx` - Main canvas component
- `NodePalette.tsx` - Draggable node list
- `NodeInspector.tsx` - Configuration panel
- `RunConsole.tsx` - Execution timeline and logs
- `ApprovalDialog.tsx` - Human approval UI

### State Management

- Workflow state (nodes, edges, config)
- Run state (status, current step, outputs)
- Artifact registry (versioned outputs)

### Types

See `src/types/orchestration.ts` for:

- `Workflow`, `NodeConfig`, `WorkflowEdge`
- `Run`, `RunStep`, `RunStatus`
- `Artifact`, `ArtifactType`
- `Approval`, `ApprovalAction`
- `AgentContext`, `AgentType`, `SharedArtifactType` (cross-agent sharing)
- `extractObligationsFromReport()` (ComplianceReport → PermitObligations)

## Acceptance Criteria

- [x] Typed context envelopes for agent communication
- [x] ComplianceReport to PermitObligation extraction
- [x] 11 tests for context sharing
- [ ] BA can drag nodes onto canvas
- [ ] BA can connect nodes with edges
- [ ] BA can configure node inputs/outputs
- [ ] System validates workflow before run
- [ ] Approval gates pause execution
- [ ] Artifacts are versioned on change
- [ ] Run timeline shows progress
- [ ] Trace links are generated
