# RequirementsBot

> The Translator - Converting regulations into actionable specifications

## Overview

RequirementsBot transforms permit obligations and evidence into structured requirements, and performs **Gap Analysis** against DAHS capabilities to determine what can be configured vs. what needs development.

## Primary Use Case: Gap Analysis

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Permit Obligations│ →   │  Compare Against │ →   │   Gap Analysis   │
│   from RegsBot   │     │   DAHS Profile   │     │     Results      │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
         ┌────────────────────────────────────────────────┼────────────────┐
         ▼                    ▼                           ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ FULLY SUPPORTED │  │ CONFIG REQUIRED │  │ PARTIAL SUPPORT │  │  NOT SUPPORTED  │
│                 │  │                 │  │                 │  │                 │
│ DAHS does this  │  │ DAHS can do it  │  │ DAHS partially  │  │ Needs custom    │
│ out of the box  │  │ with setup      │  │ supports, needs │  │ development     │
│                 │  │                 │  │ enhancement     │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
   Document only      DAHS Config          Dev Backlog          Dev Backlog
                      Proposal             (minor effort)       (major effort)
```

## Capabilities

### 1. Obligation Analysis

For each PermitObligation from RegsBot:

- Parse obligation type (monitoring, reporting, limit, etc.)
- Identify required parameters, frequencies, thresholds
- Map to potential DAHS features

### 2. DAHS Profile Matching

Compare obligations against DAHS capability profile:

```typescript
interface DAHSProfile {
  id: string
  name: string
  version: string
  capabilities: DAHSCapability[]
  supportedParameters: string[]
  supportedCalculations: CalculationType[]
  supportedReports: ReportType[]
}
```

### 3. Gap Analysis

For each obligation, determine:

| Status            | Meaning                           | Action               |
| ----------------- | --------------------------------- | -------------------- |
| `fully-supported` | DAHS does this out of the box     | Document only        |
| `config-required` | DAHS can do it with configuration | Generate config spec |
| `partial-support` | DAHS partially supports           | Minor dev + config   |
| `not-supported`   | DAHS cannot do this               | Development required |
| `manual-process`  | Will remain manual                | Document procedure   |
| `needs-review`    | Unclear, needs human analysis     | Flag for BA          |

### 4. Solution Proposal Generation

For supported/configurable obligations, generate:

- **Tag configurations**: Parameters to monitor
- **Calculation configurations**: Averages, emissions calcs
- **Alarm configurations**: Threshold exceedances
- **Report configurations**: Quarterly/annual reports
- **QA workflow configurations**: Calibrations, RATAs

### 5. Development Backlog Generation

For unsupported obligations, generate:

```typescript
interface DevelopmentItem {
  id: string
  title: string
  description: string
  obligationLinks: string[]
  effort: 'minor' | 'moderate' | 'major'
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedHours?: number
  notes: string[]
}
```

## Outputs

### DAHSProposal Artifact

```typescript
interface DAHSProposalData {
  permitId: string
  dahsProfileId: string
  obligations: PermitObligation[]
  gapAnalysis: GapAnalysis[]
  proposedConfiguration: DAHSConfiguration
  developmentItems: DevelopmentItem[]
  summary: {
    fullySupported: number
    configRequired: number
    partialSupport: number
    notSupported: number
    manualProcess: number
    needsReview: number
  }
}
```

### RequirementSet Artifact

Traditional requirements for UI/UX and testing:

- Functional requirements
- User personas (facility operator, compliance manager, etc.)
- Workflow diagrams
- Trace links to obligations

## Workflow Integration

### Permit-to-Config Pipeline

```
RegsBot → ApprovalGate → RequirementsBot → ApprovalGate → [TestingBot | FigmaBot | Publish]
```

1. RegsBot extracts obligations
2. BA approves obligation extraction
3. **RequirementsBot performs gap analysis**
4. BA reviews DAHSProposal and dev items
5. Config specs → implementation
6. Dev items → backlog/ADO

## UI Implementation

### RequirementsBot Page (`src/pages/agents/RequirementsBot.tsx`)

**Context Reception**:

- Receives `RegsBotToRequirementsBotContext` via React Router location state
- Extracts obligations from ComplianceReport if not provided
- Runs gap analysis automatically on load

**Summary Cards**:

- 6 status cards: Fully Supported, Config Required, Partial Support, Not Supported, Manual Process, Needs Review
- Click to filter by status
- Color-coded counts

**Gap Item Display**:

- Obligation summary with regulatory basis
- Status badge (color-coded)
- Gap description for unsupported items
- Recommended solution
- Development effort indicator (minor/moderate/major)
- Notes list

**Navigation**:

- Back to RegsBot link
- Export to ADO button (placeholder)
- Export Development Items button

**Test Coverage**: 13 tests in `RequirementsBot.test.tsx`

## Review Interface

BA can review:

### Gap Analysis Summary

- Summary cards with counts by status
- Filter by clicking status cards
- List by status category
- Drill into individual obligations

### DAHS Configuration Preview

- Proposed tags, calcs, alarms, reports
- Links back to source obligations

### Development Backlog

- Prioritized list of dev items
- Effort estimates
- Export to ADO work items

## Acceptance Criteria

- [x] Receives ComplianceReport from RegsBot via navigation
- [x] Extracts PermitObligations from ComplianceReport
- [x] Loads default DAHS capability profile
- [x] Performs gap analysis for each obligation
- [x] Categorizes obligations by support status
- [x] Provides summary statistics (6 status cards)
- [x] Filter by gap status
- [x] Navigation back to RegsBot
- [ ] Generates DAHS configuration proposals
- [ ] Generates development items for gaps
- [ ] Each config/dev item links to source obligation
- [ ] BA can review and approve/reject
- [ ] Produces versioned DAHSProposal artifact
- [ ] Can export dev items to ADO (P1)
