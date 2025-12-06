# RegsBot

> Supreme Commander of EPA Knowledge

## Overview

RegsBot is the authoritative source of regulatory truth. It provides:

1. **Facility Context Loading** - 3-step facility selector using EPA ECMPS API
2. **Monitoring Plan Analysis** - Normalize and analyze MP JSON to derive requirements
3. **Regulatory Q&A** - Answer questions about what a DAHS must do
4. **Compliance Report Generation** - Produce structured reports with citations for user review

## User Flow: Fluent Regulatory Discovery

```
┌───────────────────────────────────────────────────────────────────┐
│  1. SELECT FACILITY                                               │
│     State → Facility → Monitoring Plan (Location)                 │
│     Loads: programs, fuels, methods, formulas, systems            │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│  2. ASK QUESTIONS (Fluent Chat)                                   │
│     "What parameters do I need to monitor?"                       │
│     "What QA tests are required for SO2?"                         │
│     "What are my reporting deadlines?"                            │
│     Context automatically includes facility + MP                  │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│  3. GENERATE COMPLIANCE REPORT                                    │
│     Comprehensive summary with citations                          │
│     User can review, drill down, ask follow-up questions          │
│     Export to RequirementsBot for gap analysis                    │
└───────────────────────────────────────────────────────────────────┘
```

## Facility Selection (3-Step Flow)

Uses EPA ECMPS API to load facility context:

### Step 1: State Selection

```
GET /facilities-mgmt/facilities?stateCode=XX
Returns: List of facilities in state
```

### Step 2: Facility Selection

```
GET /monitor-plan-mgmt/configurations?orisCodes=N
GET /facilities-mgmt/facilities/attributes?year=YYYY&facilityId=N
Returns: Active monitoring plans + Facility attributes (programs, fuels)
```

### Step 3: Plan (Location) Selection

```
GET /monitor-plan-mgmt/plans/export?planId=XXX&reportedValuesOnly=true
Returns: Full monitoring plan JSON with all methods, formulas, systems
```

### Facility Info Extracted

- **Program Codes**: ARP, CSAPR, MATS, NBP, etc.
- **Primary Fuels**: Coal, Natural Gas, Oil, etc.
- **MATS Applicability**: Detected from coal/oil + MATS program

### Location Info Extracted (After Plan Selection)

- **Location ID**: Unit ID or Stack/Pipe ID
- **Parameters**: SO2, NOx, CO2, FLOW, HI, etc.
- **Methods**: CEM, CALC, AD, LME
- **Systems**: SO2, NOX, FLOW, H2O, etc.

## Monitoring Plan Normalization

The EPA API returns nested structure (`monitoringLocationData[].monitoringMethodData[]`).  
RegsBot normalizes to flat internal format for analysis:

```typescript
// API Export Format (nested)
MonitoringPlanExport {
  monitoringLocationData: [{
    unitId: "6B",
    monitoringMethodData: [...],
    monitoringSystemData: [...],
    monitoringFormulaData: [...],
  }]
}

// Internal Format (flat)
MonitoringPlan {
  locations: MonitoringLocation[]
  methods: MonitoringMethod[]
  systems: MonitoringSystem[]
  formulas: MonitoringFormula[]
}
```

## Query Types

RegsBot answers 9 types of regulatory questions:

| Query Type               | Description                     | Example                       |
| ------------------------ | ------------------------------- | ----------------------------- |
| `what-to-monitor`        | Parameters requiring monitoring | "What must I monitor?"        |
| `qa-requirements`        | QA/QC tests required            | "What QA tests for SO2?"      |
| `what-to-calculate`      | Emission calculations           | "What calculations needed?"   |
| `reporting-requirements` | Report types and deadlines      | "Quarterly report deadlines?" |
| `applicable-regulations` | Subparts and CFR sections       | "What regulations apply?"     |
| `emission-limits`        | Limits to track                 | "What are my NOx limits?"     |
| `missing-data`           | Substitute data procedures      | "Missing data rules?"         |
| `what-to-record`         | Recordkeeping requirements      | "What records to keep?"       |
| `general`                | Open-ended questions            | Any other question            |

## Formula-to-CFR Mapping

RegsBot includes mapping from ECMPS formula codes to CFR sections:

```typescript
FORMULA_TO_CFR = {
  // Appendix D (fuel-based)
  'D-1': { section: '40 CFR 75 Appendix D §3.3.1', description: 'SO2 from gas fuel' },
  'D-5': { section: '40 CFR 75 Appendix D §3.4.1', description: 'Heat input from gas' },

  // Appendix F (CEMS-based)
  'F-1': { section: '40 CFR 75 Appendix F §3.1', description: 'SO2 mass from CEM' },
  'F-21A': { section: '40 CFR 75 Appendix F §5.2', description: 'Heat input from gas' },
  // ... 36 formulas mapped
}
```

## Compliance Report Generation

`generateComplianceReport(orisCode)` produces a structured report:

```typescript
interface ComplianceReport {
  // Executive Summary
  summary: {
    totalRegulations: number
    totalMonitoringParameters: number
    totalQATests: number
    programs: string[]
    highlights: string[]
  }

  // Detailed Sections (all with citations)
  applicableRegulations: ApplicableRegulationItem[]
  monitoringByParameter: MonitoringParameterGroup[]
  qaTestMatrix: QATestMatrixItem[]
  calculations: CalculationItem[]
  reportingSchedule: ReportingScheduleItem[]
  limits: EmissionLimitItem[]
  missingDataProcedures: MissingDataItem[]
  recordkeeping: RecordkeepingItem[]

  // All Citations
  citations: ComplianceCitation[]

  // Follow-up Questions
  suggestedQuestions: string[]
}
```

## DAHSRequirements Output

For workflow integration, RegsBot produces `DAHSRequirements`:

```typescript
interface DAHSRequirements {
  facilityId: string
  facilityName: string
  orisCode: number
  programs: string[]
  analyzedAt: string

  monitoringRequirements: MonitoringRequirement[]
  calculationRequirements: CalculationRequirement[]
  qaRequirements: QARequirement[]
  reportingRequirements: ReportingRequirement[]
  emissionLimits: EmissionLimit[]
  substitutionRequirements: SubstitutionRequirement[]
  recordkeepingRequirements: RecordkeepingRequirement[]
}
```

## Workflow Integration

### Standalone Chat Mode

User selects facility → asks questions → gets answers with citations.

### Compliance Report Mode

User selects facility → generates full report → reviews and asks follow-ups.

### Pipeline Mode (Fluent Workflow)

```
FacilitySelector → RegsBot (context) → User Chat → ComplianceReport → RequirementsBot
```

The ComplianceReport becomes input to RequirementsBot for gap analysis.

---

## Secondary Capability: Permit Processing

RegsBot also supports permit PDF ingestion for facilities not in ECMPS:

### Permit-to-Obligations Pipeline

```
Upload PDF → OCR → Detect Regulatory Language → Extract Obligations → Human Review
```

### Extracted Obligation Structure

```typescript
interface PermitObligation {
  id: string
  permitId: string
  pageReference: string // "Page 3, Section 2.1"
  originalText: string // Exact permit language
  obligationType: ObligationType
  summary: string // Plain-language summary
  regulatoryBasis?: string // "40 CFR 60.4" if cited
  frequency?: string // "hourly", "daily", "quarterly"
  parameters?: string[]
  thresholds?: Record<string, string>
  confidence: number
  confirmedByHuman: boolean
}
```

---

## API Integrations

### EPA ECMPS API (Primary)

**Base URL**: `https://api.epa.gov/easey/beta`

Used for facility selection and monitoring plan analysis:

| Endpoint                                     | Purpose                      |
| -------------------------------------------- | ---------------------------- |
| `GET /facilities-mgmt/facilities`            | List facilities by state     |
| `GET /facilities-mgmt/facilities/attributes` | Get facility programs, fuels |
| `GET /monitor-plan-mgmt/configurations`      | Get active MP configurations |
| `GET /monitor-plan-mgmt/plans/export`        | Get full MP JSON             |

### eCFR API (Secondary)

**Base URL**: `https://www.ecfr.gov/api/versioner/v1`

Used for citation lookups:

| Endpoint                             | Purpose                |
| ------------------------------------ | ---------------------- |
| `GET /full/{date}/title-40/part-{p}` | Get CFR part text      |
| `GET /search`                        | Search regulatory text |

---

## Supported Regulatory Programs

| Program | CFR Reference           | Description                        |
| ------- | ----------------------- | ---------------------------------- |
| Part 75 | 40 CFR 75               | Continuous Emission Monitoring     |
| ARP     | 40 CFR 72-73            | Acid Rain Program                  |
| CSAPR   | 40 CFR 97               | Cross-State Air Pollution Rule     |
| MATS    | 40 CFR 63 Subpart UUUUU | Mercury and Air Toxics Standards   |
| NBP     | 40 CFR 97               | NOx Budget Program (legacy)        |
| RGGI    | 40 CFR 98               | Regional Greenhouse Gas Initiative |

---

## UI Components

### ComplianceReportDisplay

A structured React component that renders the full ComplianceReport with collapsible sections:

**Location**: `src/components/ComplianceReport.tsx`

**Sections Rendered**:
| Section | Component | Features |
|---------|-----------|----------|
| Facility Info | Header card | Facility name, ORIS code, EPA unit IDs |
| Applicable Regulations | ApplicableRegulationsSection | Program badges (ARP, MATS, etc.), CFR citations |
| Monitoring Requirements | MonitoringSection | Methods with calculation mappings |
| QA/Test Matrix | QATestMatrixSection | RATA, linearity, flow tests with intervals |
| Calculations | CalculationsSection | Equations with CFR references |
| Reporting Schedule | ReportingScheduleSection | Quarterly/annual deadlines |
| Emission Limits | EmissionLimitsSection | Limits with units and sources |
| Missing Data | MissingDataSection | Substitution procedures |
| Recordkeeping | RecordkeepingSection | Retention requirements |

**Interactivity**:

- Each section is collapsible (chevron toggle)
- All sections expanded by default
- StatCard components for key metrics
- ProgramBadge component for program display
- **Send to RequirementsBot** button for gap analysis handoff

**Integration in RegsBot**:

- View toggle: Chat ↔ Report
- Generate Report button triggers report generation
- Quick question buttons about report sections
- Report updates when facility selection changes
- Send to RequirementsBot navigates with full context

**Test Coverage**: 39 tests in `ComplianceReport.test.tsx`

### Send to RequirementsBot Flow

```
ComplianceReport (RegsBot)
        │
        ▼
┌───────────────────────────┐
│ "Send to RequirementsBot" │
│       button click        │
└───────────────────────────┘
        │
        ▼  navigate('/agents/requirements', { state: context })
┌───────────────────────────┐
│   RequirementsBot Page    │
│ - Receives context        │
│ - Extracts obligations    │
│ - Runs gap analysis       │
│ - Shows summary cards     │
└───────────────────────────┘
```

---

## MCP Integration

RegsBot integrates with the shared EPA Compliance MCP server for enhanced regulatory intelligence.

### MCP Server Location

```
C:\WebApp\shared\epa-compliance-mcp\
```

### MCP Tools Used

| Tool                       | Purpose                                   |
| -------------------------- | ----------------------------------------- |
| `getApplicableRegulations` | Regulations by state, programs, fuel type |
| `getApplicableLimits`      | Emission limits (ARP, CSAPR, MATS, NSPS)  |
| `getCSAPRProgramsForState` | State-specific CSAPR programs             |
| `analyzeMonitoringPlan`    | Gap analysis, method recommendations      |

### Enhanced ComplianceReport Sections

The ComplianceReport component uses MCP data to render:

1. **Compliance Gaps Section** - Gaps grouped by category with severity colors
   - High severity (red): Missing required components
   - Medium severity (yellow): Configuration needed
   - Low severity (green): Optional improvements

2. **Method Recommendations Section** - Method options with pros/cons
   - Recommended vs alternative methods
   - CFR appendix references

3. **QA Requirements Section** - Required QA tests
   - Test types, frequencies, CFR citations
   - Grouped by parameter

4. **Suggested Formulas Section** - Formula recommendations
   - Formula codes with appendix references
   - Applicability conditions

### getFacilityContext Integration

The `ECMPSClient.getFacilityContext()` method consolidates 4 CAMD API calls:

```typescript
async getFacilityContext(input: GetFacilityContextInput): Promise<FacilityContext> {
  // 1. Get facility info (name, state)
  const facilityInfo = await this.getFacility(orisCode)

  // 2. Get facility attributes (programs, fuels)
  const attributes = await this.getFacilityAttributes(facilityId, year)

  // 3. Get units and systems from MP
  const mp = await this.getMonitoringPlan(monitorPlanId)

  // 4. Enrich with MCP data
  const regulations = getApplicableRegulations(stateCode, programCodes, ...)
  const limits = getApplicableLimits(stateCode, programCodes, fuelTypes)

  return { facility, programs, monitoringPlan, units, applicableRegulations, limits }
}
```

This enables seamless MCP-powered analysis without separate tool calls.

---

## Implementation Status

### ✅ Implemented (Tested)

- [x] Facility selector (state → facility → plan)
- [x] Monitoring plan export loading from API
- [x] MP normalization (API format → internal format)
- [x] Location info extraction (parameters, methods, systems)
- [x] Answer 9 query types with citations
- [x] Formula-to-CFR mapping (36 formulas)
- [x] DAHSRequirements generation
- [x] ComplianceReport generation
- [x] ComplianceReportDisplay UI component
- [x] RegsBot view toggle (Chat/Report)
- [x] Send to RequirementsBot button + navigation
- [x] Cross-agent context sharing protocol
- [x] MCP integration - `getFacilityContext()` method
- [x] MCP-enhanced ComplianceReport sections:
  - [x] ComplianceGapsSection (gaps by category, severity colors)
  - [x] MethodRecommendationsSection (pros/cons, recommendations)
  - [x] MCPQARequirementsSection (test requirements table)
  - [x] SuggestedFormulasSection (formula suggestions with appendix)

### 📋 Planned

- [ ] Permit PDF upload + OCR
- [ ] eCFR citation lookups
- [ ] Part 60 NSPS rules
- [ ] MATS-specific requirements
- [ ] PS-1 through PS-18 specs

---

## Test Coverage

| Component               | Tests | Coverage                                       |
| ----------------------- | ----- | ---------------------------------------------- |
| RegsBotService          | 54+   | MP analysis, queries, citations, requirements  |
| ComplianceReportDisplay | 39    | All sections, interactivity, edge cases        |
| FacilitySelector        | 33    | State/facility/plan selection, API integration |

**Total RegsBot Tests**: 126+
