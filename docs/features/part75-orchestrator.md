# Part 75/ECMPS Regulatory Orchestrator

> Multi-Agent System for DAHS Requirement Analysis

## Overview

The Part 75/ECMPS Regulatory Orchestrator is a sophisticated multi-agent system that analyzes EPA Part 75 monitoring plans and generates comprehensive DAHS (Data Acquisition and Handling System) requirements. It consists of four specialized agents working in concert:

1. **RegBrainAgent** - Infers regulatory requirements from monitoring plans
2. **CalcPlannerAgent** - Generates calculation plans
3. **PQAMirrorAgent** - Creates compliance check rules
4. **ExplainerAgent** - Provides human-readable explanations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Part75Orchestrator                         │
│         Coordinates all agents and manages workflow          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│ RegBrainAgent│  →   │CalcPlanner   │  →  │ PQAMirror    │
│              │      │   Agent      │     │   Agent      │
│ Infers       │      │ Generates    │     │ Creates      │
│ regulatory   │      │ calculation  │     │ compliance   │
│ requirements │      │ plans        │     │ check rules  │
└──────────────┘      └──────────────┘     └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │ Explainer    │
                      │   Agent      │
                      │ Generates    │
                      │ explanations │
                      └──────────────┘
```

## RegBrainAgent

### Purpose

Acts as the "regulatory brain" that understands Part 75 rules and infers what a DAHS must do based on a facility's monitoring plan.

### Capabilities

- **Program Inference**: Identifies applicable regulatory programs (ARP, CSAPR, MATS)
- **Monitoring Requirements**: Derives what parameters must be monitored
- **Applicable Regulations**: Identifies relevant CFR sections
- **QA Requirements**: Infers required QA/QC tests based on system types
- **Confidence Assessment**: Evaluates confidence in the analysis

### Input

```typescript
{
  orisCode?: number,              // ORIS code to fetch from ECMPS API
  monitoringPlan?: MonitoringPlan, // Or provide plan directly
  locationId?: string,             // Filter to specific location
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive'
}
```

### Output

```typescript
{
  facilityInfo: {
    orisCode: number,
    facilityName: string,
    stateCode: string,
    programs: string[]
  },
  locations: LocationInfo[],
  monitoringRequirements: MonitoringRequirement[],
  applicableRegulations: ApplicableRegulation[],
  qaRequirements: QARequirement[],
  confidence: 'high' | 'medium' | 'low',
  warnings: string[],
  analyzedAt: string
}
```

## CalcPlannerAgent

### Purpose

Generates comprehensive calculation plans that specify what calculations the DAHS must perform, in what order, and with what dependencies.

### Capabilities

- **Hourly Averaging**: Generates hourly average calculations for CEM parameters
- **Heat Input**: Creates F-factor heat input calculations
- **Mass Emissions**: Generates mass emission calculations (SO2, NOx, CO2)
- **Emission Rates**: Creates emission rate calculations (lb/MMBtu)
- **Dependency Management**: Builds dependency graph and execution sequence

### Input

```typescript
{
  monitoringRequirements: MonitoringRequirement[],
  programs: string[],
  parameters: string[]
}
```

### Output

```typescript
{
  calculations: CalculationPlanItem[],
  dependencyGraph: Record<string, string[]>,
  executionSequence: string[],
  summary: {
    hourlyAverages: number,
    heatInputCalcs: number,
    massEmissionCalcs: number,
    emissionRateCalcs: number,
    qaCalcs: number,
    other: number
  },
  requirements: CalculationRequirement[]
}
```

## PQAMirrorAgent

### Purpose

Creates validation rules that mirror EPA's compliance checking. PQA stands for "Post-QA" - these rules ensure data quality and regulatory compliance before submission.

### Capabilities

- **QA Result Validation**: Daily calibration error checks, linearity validation, RATA accuracy
- **Data Quality Checks**: Data availability, valid range checking
- **Calculation Validation**: Mass emission results, heat input reasonableness
- **Missing Data Rules**: Substitute data validation
- **Reporting Checks**: Quarterly report completeness

### Rule Categories

1. `data_quality` - Data validity and availability checks
2. `qa_result` - QA/QC test result validation
3. `calculation_result` - Calculation output validation
4. `missing_data` - Missing data substitution validation
5. `exceedance` - Emission limit exceedance tracking
6. `reporting` - Report completeness and submission checks
7. `system_status` - Monitoring system status verification

### Input

```typescript
{
  qaRequirements: QARequirement[],
  monitoringRequirements: MonitoringRequirement[],
  calculationPlan: CalculationPlanItem[],
  programs: string[]
}
```

### Output

```typescript
{
  rules: ComplianceCheckRule[],
  rulesByCategory: Record<string, ComplianceCheckRule[]>,
  criticalRules: ComplianceCheckRule[],
  summary: {
    totalRules: number,
    criticalRules: number,
    errorRules: number,
    warningRules: number
  },
  dataQualityThresholds: {
    minimumDataAvailability: 0.90,
    calibrationErrorTolerance: 0.025,
    rataAccuracyTolerance: 0.10
  }
}
```

## ExplainerAgent

### Purpose

Translates technical regulatory requirements into plain English for business analysts and facility operators.

### Capabilities

- **Contextual Explanations**: Uses facility and location context
- **Multiple Detail Levels**: Summary, detailed, and technical explanations
- **Structured Output**: Title, summary, sections, key takeaways, citations
- **Subject Coverage**: Monitoring requirements, calculations, QA requirements, compliance rules, regulations

### Detail Levels

- **Summary**: Brief overview with 2-3 key sections
- **Detailed**: Comprehensive explanation with examples
- **Technical**: In-depth with formulas, subsections, and implementation notes

### Input

```typescript
{
  subject: 'monitoring_requirement' | 'calculation' | 'qa_requirement' |
           'compliance_rule' | 'regulation' | 'overall_requirements',
  item?: unknown,
  context?: {
    facilityName?: string,
    locationId?: string,
    parameterCode?: string,
    programs?: string[]
  },
  detailLevel?: 'summary' | 'detailed' | 'technical'
}
```

### Output

```typescript
{
  title: string,
  summary: string,
  sections: ExplanationSection[],
  keyTakeaways: string[],
  citations: Array<{ reference: string, title: string, url?: string }>,
  examples?: string[],
  pitfalls?: string[]
}
```

## Part75Orchestrator

### Usage

```typescript
import { Part75Orchestrator } from '@/agents/part75-orchestrator'

const orchestrator = new Part75Orchestrator()

// Analyze a monitoring plan
const result = await orchestrator.analyze(
  {
    monitoringPlan: jsonMonitoringPlan,
    locationId: 'CS1', // optional
  },
  {
    includeExplanations: true,
    explanationDetail: 'detailed',
    validateRules: true,
  }
)

// Access results
console.log('Monitoring Requirements:', result.regulatoryAnalysis.monitoringRequirements)
console.log('Calculation Plan:', result.calculationPlan.calculations)
console.log('Compliance Rules:', result.complianceRules.rules)
console.log('Explanation:', result.explanation.summary)
```

### Complete Output

```typescript
{
  input: {
    orisCode?: number,
    facilityName: string,
    locationId?: string,
    analyzedAt: string
  },
  regulatoryAnalysis: RegBrainOutput,
  calculationPlan: CalcPlannerOutput,
  complianceRules: PQAMirrorOutput,
  explanation: ExplainerOutput,
  overallConfidence: 'high' | 'medium' | 'low',
  notes: string[]
}
```

## Testing

The orchestrator has comprehensive test coverage:

- **RegBrainAgent**: 11 tests covering monitoring plan analysis, program inference, confidence assessment
- **CalcPlannerAgent**: 9 tests covering calculation generation, dependency resolution, execution sequencing
- **PQAMirrorAgent**: 9 tests covering rule generation, categorization, severity assignment
- **ExplainerAgent**: 9 tests covering explanation generation, detail levels, context awareness
- **Part75Orchestrator**: 12 integration tests covering full orchestration workflow

**Total: 50 tests** ensuring reliability and correctness.

## Integration with RegsBot

The Part 75 Orchestrator extends RegsBot's capabilities:

- **RegsBot** provides raw regulatory data and API access (eCFR, ECMPS)
- **Part75Orchestrator** adds intelligent interpretation and requirement synthesis
- **Together** they provide comprehensive regulatory intelligence for DAHS implementation

### Workflow Integration

```
RegsBot → Part75Orchestrator → RequirementsBot → DAHS Configuration
  ↓            ↓                      ↓                 ↓
eCFR       Infer Reqs           Gap Analysis      Implementable
ECMPS      + Plans              + Proposals       Requirements
```

## Use Cases

### 1. New Facility Configuration

When setting up a new DAHS for a facility:

1. Fetch monitoring plan from ECMPS
2. Run Part75Orchestrator to get complete requirements
3. Use calculation plan to configure DAHS algorithms
4. Implement compliance rules in the DAHS validation engine
5. Provide explanations to operators and BAs

### 2. Permit Compliance Review

When a facility receives a new permit:

1. Analyze monitoring plan changes
2. Identify new monitoring requirements
3. Generate updated calculation plans
4. Update compliance check rules
5. Provide explanations of what changed

### 3. DAHS Validation

Before going live with a DAHS:

1. Run orchestrator against facility monitoring plan
2. Verify DAHS implements all monitoring requirements
3. Check that all calculations match the plan
4. Ensure all compliance rules are in place
5. Validate against Part 75 requirements

## Regulatory Compliance

The orchestrator ensures compliance with:

- **40 CFR 75** - Continuous Emission Monitoring
- **40 CFR 75 Appendix B** - QA/QC Procedures
- **40 CFR 75 Appendix F** - Calculation Procedures
- **40 CFR 75 Subpart D** - Missing Data Substitution
- **40 CFR 63 Subpart UUUUU** - MATS (when applicable)

## Future Enhancements

- [ ] ORIS code fetching via ECMPS API
- [ ] State-specific Title V requirements
- [ ] NSPS/NESHAP program support
- [ ] Calculation formula validation
- [ ] Visual dependency graphs
- [ ] Export to ADO work items
- [ ] Integration with TestingBot for verification specs
