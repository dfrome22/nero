# NERO Vision

> **N**etworked **E**PA **R**egulatory **O**rchestration

## Mission

Build a multi-agent AI system that automates the journey from EPA regulatory requirements to tested, compliant software specifications—with full traceability and human approval gates.

## Primary User: Business Analyst

### Job-to-be-done

> "Given regulations/permits and product constraints, I need to generate dev-ready requirements, UX scaffolds, and tests—with citations and approvals—so development can proceed confidently."

### Core Workflows

1. **Fluent Regulatory Discovery**: Select facility → Ask questions → Generate report → Share to pipeline
2. **Reg-to-Dev Pipeline**: Ingest sources → extract obligations → draft requirements → generate tests → publish to ADO/wiki
3. **Permit-to-Config Pipeline**: OCR permit → extract conditions → map to regs → propose DAHS tags/calcs → create implementation stories
4. **Change-impact Pipeline**: New regulation/permit → diff against prior evidence → identify impacted requirements/tests → publish change set

---

## Fluent Workflow (RegsBot)

The **Fluent Workflow** enables natural regulatory discovery through conversation:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. SELECT FACILITY                                             │
│     FacilitySelector: State → Facility → Monitoring Plan        │
│     Context loads automatically: programs, methods, formulas    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ASK QUESTIONS (Conversational)                              │
│     "What parameters need monitoring?"                          │
│     "What QA tests are required?"                               │
│     "What are my reporting deadlines?"                          │
│     Each answer includes regulatory citations                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. GENERATE COMPLIANCE REPORT                                  │
│     Comprehensive structured document                           │
│     All sections: monitoring, QA, calcs, reporting, limits      │
│     User can drill down, ask follow-ups                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. SHARE TO PIPELINE                                           │
│     Export to RequirementsBot for gap analysis                  │
│     Or export to workflow for formal processing                 │
└─────────────────────────────────────────────────────────────────┘
```

This approach lets the BA explore and understand requirements naturally before formalizing them into the orchestration pipeline.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  ORCHESTRATION LAYER (Workflow Builder)          │
│     Drag/drop canvas • Node configuration • Run console          │
│     Approval gates • Artifact versioning • Trace links           │
└─────────────────────────────────────────────────────────────────┘
                                │
    ┌───────────────────────────┼───────────────────────────┐
    ▼                           ▼                           ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│  REGSBOT    │    →     │ REQUIREMENTS│    →     │  FIGMABOT   │
│             │          │    BOT      │          │             │
│ • eCFR/EPA  │          │ • Personas  │          │ • Wireframes│
│ • Permits   │          │ • Workflows │          │ • Components│
│ • Evidence  │          │ • User      │          │ • Screen    │
│   Library   │          │   Journeys  │          │   Inventory │
│ • Citations │          │ • Func Reqs │          │ • A11y      │
└─────────────┘          └─────────────┘          └─────────────┘
                                │
                                ▼
                         ┌─────────────┐
                         │ TESTINGBOT  │
                         │             │
                         │ • Test Specs│
                         │ • Acceptance│
                         │   Criteria  │
                         │ • TDD       │
                         │   Contracts │
                         └─────────────┘
```

---

## Orchestration Layer

The **control plane** that enables:

- **Workflow Builder**: Drag/drop nodes (agents, gates, transforms) + link edges
- **Scoped Context**: Attach eCFR, EPA guidance, permits/OCR, DAHS specs, code refs
- **Deterministic Runs**: Typed inputs/outputs, reproducible from versions
- **Human Approvals**: Pause runs at critical points for review
- **Traceable Artifacts**: Every requirement → evidence, test → requirement, screen → workflow

### Node Types

**Agent Nodes** (P0): RegsBot, RequirementsBot, FigmaBot, TestingBot

**Control Nodes** (P0):

- Start / End
- Approval Gate (pause until approved)
- Router (branch by rule)
- Transform/Validate (schema validation)
- Output/Publish (ADO/wiki/Figma export)

**Optional Nodes** (P1): Comparer/Diff, Critic/Reviewer, Selector

---

## Agent Specifications

### RegsBot - "Supreme Commander of EPA Knowledge"

- **Purpose**: Authoritative source of regulatory truth + Evidence Library
- **Inputs**: Facility selection, monitoring plans, eCFR, permits
- **Outputs**: DAHSRequirements, ComplianceReport, cited regulatory extracts
- **Capabilities**:
  - Facility selection (state → facility → monitoring plan)
  - Monitoring plan analysis and normalization
  - Formula-to-CFR mapping (36 formulas)
  - Compliance report generation with citations
  - Q&A for 9 query types (monitoring, QA, calculations, reporting, etc.)
  - OCR permit ingestion (planned)

### RequirementsBot - "The Translator"

- **Purpose**: Convert regulations into actionable specifications
- **Inputs**: RegsBot ComplianceReport, DAHSRequirements
- **Outputs**: Requirement Sets, gap analysis, development items
- **Capabilities**:
  - DAHS capability matching and gap analysis
  - Configuration proposal generation
  - Trace link generation to evidence

### FigmaBot - "The Designer"

- **Purpose**: Scaffold compliant UI/UX experiences
- **Inputs**: RequirementsBot screen inventory, workflows
- **Outputs**: Wireframe Specs, component mapping, Figma frames
- **Capabilities**: Accessibility validation, requirement linking

### TestingBot - "The Validator"

- **Purpose**: Ensure requirements are testable and tested
- **Inputs**: Requirement Sets from RequirementsBot
- **Outputs**: Test Plans, acceptance criteria, verification specs
- **Capabilities**: TDD scaffolding, coverage requirements

---

## Core Concepts

| Term            | Definition                                                                    |
| --------------- | ----------------------------------------------------------------------------- |
| **Workflow**    | Saved directed graph representing an executable process                       |
| **Run**         | Single execution of a workflow against specific inputs/context                |
| **Artifact**    | Typed output (Evidence Library, Requirement Set, Test Plan, Wireframe Spec)   |
| **Evidence**    | Source material (reg text, guidance, permit pages) as citeable excerpts       |
| **Trace Links** | Explicit links: Requirement → Evidence, Test → Requirement, Screen → Workflow |

---

## Architecture Principles

1. **Agent Autonomy**: Each agent owns its domain expertise
2. **Shared Context**: Agents communicate through structured protocols
3. **Human-in-the-Loop**: Approval gates at critical decision points
4. **Traceability**: Every output traces back to source requirements
5. **TDD First**: Testing requirements defined before implementation
6. **Reproducibility**: Runs reproducible from workflow + artifact + evidence versions
7. **Safety/Control**: Publish actions gated and reversible

---

## Integration Targets

- **eCFR & EPA Guidance**: Citation sources with location anchors
- **Permit OCR**: PDF/image import with confidence tracking
- **Azure DevOps**: Work items + wiki publishing
- **Source Code**: Read-only context for implementation references
- **Figma**: Frame creation/updates linked to requirements
- **DAHS**: Solution mapping (tags, calcs, alarms, reports)

---

## Non-Functional Requirements

- **Reproducibility**: Runs reproducible from versions
- **Traceability**: All artifacts linked to sources
- **Auditability**: Immutable run logs
- **Safety**: Publish actions gated and reversible
- **Offline-capable**: Support for disconnected evidence packs
