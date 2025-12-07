# TODO

Current development tasks and roadmap for NERO.

## P0 Definition of Done

- [ ] BA can create a workflow with at least 3 nodes (Regs → Requirements → Tests)
- [ ] BA can attach documents at project and node scope
- [ ] System validates the workflow before running
- [ ] Run produces versioned artifacts
- [ ] Approval gate blocks downstream steps until approved
- [ ] Publish step can export a requirements pack

---

## Current Sprint

### In Progress

- [ ] Create Workflow Builder canvas component

### Up Next

- [ ] Implement Node palette (agent + control nodes)
- [ ] Build Node Inspector panel
- [ ] Set up Run Console (timeline, logs, outputs)

### Recently Completed

- [x] Enhanced Calculation Engine for ECMPS/Title V (85 tests)
  - [x] Formula validation with syntax, semantics, units, and regulatory checking
  - [x] Configuration management with full audit trails
  - [x] Dependency tracking with upstream/downstream analysis
  - [x] Formula registry with standard ECMPS/Part 75 formulas
  - [x] Impact analysis for configuration changes
  - [x] Comprehensive documentation in `docs/features/calculation-engine.md`
- [x] Define core TypeScript types for orchestration
- [x] Implement RegsBotService with eCFR/ECMPS API clients (24 tests)
- [x] Implement RequirementsBotService with gap analysis (27 tests)
- [x] Implement Part 75/ECMPS Regulatory Orchestrator (50 tests)
  - [x] RegBrainAgent - Infers regulatory requirements from monitoring plans
  - [x] CalcPlannerAgent - Generates calculation plans with dependency resolution
  - [x] PQAMirrorAgent - Creates compliance check rules mirroring EPA validation
  - [x] ExplainerAgent - Provides human-readable explanations of requirements
  - [x] Part75Orchestrator - Coordinates all four agents in unified workflow

---

## Orchestration Layer (P0)

### Workflow Builder

- [ ] Canvas graph (nodes + edges) with drag/drop
- [ ] Node palette (RegsBot, RequirementsBot, FigmaBot, TestingBot)
- [ ] Control nodes (Start, End, Approval Gate, Router, Transform)
- [ ] Node Inspector (inputs, context scope, outputs, policies)
- [ ] Workflow validation before run
- **Feature Doc**: `docs/features/orchestration.md`

### Run Engine

- [ ] Execute nodes in order (including branching)
- [ ] Maintain shared run state with controlled patches
- [ ] Pause/resume at Approval Gates
- [ ] Record run timeline for console view
- [ ] Persist versioned artifacts and trace links

### Artifact Registry

- [ ] Store typed artifacts (RequirementSet, TestPlan, WireframeSpec, etc.)
- [ ] Version artifacts on change (immutable approved versions)
- [ ] Maintain trace links (Requirement→Evidence, Test→Requirement)

---

## Agent Nodes (P0)

### RegsBot

- [x] eCFR API client integration
- [x] ECMPS/CAMD API client integration
- [x] Regulatory language scanning
- [x] Citation extraction with location anchors
- [x] Obligation extraction and classification
- [x] Part 75/ECMPS Regulatory Orchestrator (multi-agent system)
- [ ] Evidence Library builder (eCFR, EPA docs, permits)
- [ ] OCR ingestion with confidence tracking
- [ ] Evidence scoping (project-wide vs node-scoped)
- **Feature Doc**: `docs/features/regsbot.md`, `docs/features/part75-orchestrator.md`

### RequirementsBot

- [x] Gap analysis (DAHS capability matching)
- [x] Development item generation
- [x] DAHS configuration proposal generation
- [x] DAHS proposal artifact generation
- [ ] Generate Requirement Sets from evidence
- [ ] User persona and workflow generation
- [ ] Trace link generation to evidence
- **Feature Doc**: `docs/features/requirementsbot.md`

### FigmaBot

- [ ] Screen inventory from requirements
- [ ] Wireframe spec generation
- [ ] Component mapping
- [ ] Requirement ID linking in frames
- **Feature Doc**: `docs/features/figmabot.md`

### TestingBot

- [ ] Test Plan generation from requirements
- [ ] Acceptance criteria with trace links
- [ ] Verification spec for DAHS proposals
- [ ] Coverage requirement tracking
- **Feature Doc**: `docs/features/testingbot.md`

---

## Control Nodes (P0)

- [ ] **Start / End**: Entry and exit points
- [ ] **Approval Gate**: Pause run, capture approver + timestamp + comment
- [ ] **Router**: Branch by rule or classifier
- [ ] **Transform/Validate**: Schema validation, merge/split
- [ ] **Output/Publish**: Export to ADO/wiki/Figma, generate files

---

## P1 Features

### Integrations

- [ ] Azure DevOps (work items + wiki)
- [ ] Figma API (frame creation/updates)
- [ ] Source code references (read-only context)
- [ ] Permit OCR import with confidence UI

### Additional Nodes

- [ ] Comparer/Diff (artifact/evidence versions)
- [ ] Critic/Reviewer (maker-checker loop)
- [ ] Selector (pick best of N drafts)

### Workflow Templates

- [ ] Template A: Reg-to-Dev Requirements
- [ ] Template B: Permit OCR → DAHS Solution Proposal
- [ ] Template C: UX Scaffold

---

## Completed

- [x] Project scaffolding (React + TypeScript + Vite)
- [x] TDD infrastructure (Vitest + Playwright)
- [x] Left-nav layout with sidebar
- [x] Dashboard with agent cards
- [x] Agent placeholder pages
- [x] Strict linting configuration
- [x] GitHub repo + CI pipeline
- [x] Core documentation (VISION, CHANGELOG, TODO)
- [x] Core orchestration types (Workflow, Run, Artifact, Evidence, Requirement)
- [x] Permit processing types (PermitDocument, PermitObligation, DAHSProfile)
- [x] RegsBotService with eCFR/ECMPS API clients (24 tests)
- [x] RequirementsBotService with gap analysis (27 tests)

---

## Open Questions

- What are the minimum evidence types for P0 (text paste, PDF upload, URL)?
- What is the initial DAHS "baseline profile" format?
- Which publish targets are highest priority: ADO work items, ADO wiki, or file exports?
