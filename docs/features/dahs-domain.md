# DAHS Regulatory Domain Model

## Overview

The DAHS (Data Acquisition and Handling System) regulatory domain model provides TypeScript types and agent functions for working with EPA Part 75 / ECMPS monitoring plans. This complements NERO's main orchestration platform by providing specific structures for emissions monitoring system configuration.

## Purpose

Help translate EPA regulatory requirements into concrete DAHS engine configuration:

- **Input**: Part 75 Monitoring Plan (location, methods, programs)
- **Output**: Required parameters, calculations, QA tests, and ECMPS objects

## Domain Types

### Core Types (`src/types/dahs-domain.ts`)

#### Parameter Codes

```typescript
type ParameterCode =
  | 'SO2M' // SO2 Mass
  | 'NOXM' // NOx Mass
  | 'NOXR' // NOx Rate
  | 'CO2M' // CO2 Mass
  | 'BCO2' // Biogenic CO2
  | 'HIT' // Heat Input
  | 'OPTIME' // Operating Time
  | 'OPHOURS' // Operating Hours
```

#### Monitoring Methods

```typescript
type MonitoringMethodCode =
  | 'CEM' // Continuous Emissions Monitoring
  | 'AMS' // Alternative Monitoring System
  | 'AD' // Appendix D (fuel flow)
  | 'FSA' // Fuel Sampling and Analysis
  | 'LME' // Low Mass Emissions
  | 'LTFF' // Long Term Fuel Flow
  | 'CALC' // Calculation
```

#### Programs

```typescript
type ProgramCode =
  | 'ARP' // Acid Rain Program
  | 'CSAPR_SO2' // Cross-State Air Pollution Rule - SO2
  | 'CSAPR_NOX_ANN' // CSAPR NOx Annual
  | 'CSAPR_NOX_OS' // CSAPR NOx Ozone Season
  | 'MATS' // Mercury and Air Toxics Standards
  | 'STATE' // State-specific programs
  | 'NSPS' // New Source Performance Standards
```

#### Monitoring Plan

```typescript
interface MonitoringPlan {
  facilityId: string
  locations: Location[]
  methods: MethodConfig[]
  programs: ProgramCode[]
}
```

#### Required Objects (ECMPS Data Structures)

```typescript
interface RequiredObject {
  objectType:
    | 'HOURLY' // Hourly emissions/operating data
    | 'SUMMARY' // Quarterly summary values
    | 'DAILY_CO2' // Daily CO2 mass (CSAPR)
    | 'DAILY_FUEL' // Daily fuel usage
    | 'DAILY_BACKSTOP' // Daily backstop (CSAPR Group 3)
    | 'ROLLING_METRIC' // Rolling averages (NSPS)
  parameter?: ParameterCode
  locationId?: string
  explanation: string
}
```

## Agents

### 1. RegBrainAgent (`src/agents/dahs/reg-brain.ts`)

**Purpose**: Infer regulatory requirements from a monitoring plan.

**Function**: `inferRegulatoryRequirements(mp: MonitoringPlan): RegBrainOutput`

**Output**:

- `requiredParameters`: Which parameters must be monitored
- `requiredObjects`: Which ECMPS objects must be populated
- `qaRequirements`: Which QA tests are needed
- `notes`: Human-readable regulatory context

**Example**:

```typescript
import { inferRegulatoryRequirements } from '@/agents/dahs'

const plan: MonitoringPlan = {
  facilityId: 'ORIS-3',
  locations: [{ id: 'U1', type: 'UNIT', configurationType: 'SINGLE', connectedTo: [] }],
  methods: [{ locationId: 'U1', parameter: 'SO2M', methodCode: 'CEM' }],
  programs: ['ARP'],
}

const requirements = inferRegulatoryRequirements(plan)
// requirements.requiredParameters: [{ locationId: 'U1', parameter: 'SO2M', method: 'CEM', ... }]
// requirements.requiredObjects: [{ objectType: 'HOURLY', parameter: 'SO2M', ... }]
// requirements.qaRequirements: [{ testType: 'RATA', ... }, { testType: 'LINEARITY', ... }]
```

### 2. CalcPlannerAgent (`src/agents/dahs/calc-planner.ts`)

**Purpose**: Generate calculation plans and test cases for DAHS.

**Function**: `createCalculationPlan(mp: MonitoringPlan, required: RequiredParameter[]): CalculationPlan`

**Output**:

- `methodPlans`: Configuration plans for each monitoring method
- `testCases`: Proposed unit tests for calculations

**Example**:

```typescript
import { createCalculationPlan } from '@/agents/dahs'

const calcPlan = createCalculationPlan(plan, requirements.requiredParameters)
// calcPlan.methodPlans: [{ locationId: 'U1', parameter: 'SO2M', method: 'CEM', notes: [...] }]
// calcPlan.testCases: [{ name: 'example-so2m-summary-test', ... }]
```

### 3. PQAMirrorAgent (`src/agents/dahs/pqa-mirror.ts`)

**Purpose**: Mirror ECMPS Program Quality Assurance check rules.

**Registry**: `checkRuleRegistry: CheckRule[]`

Contains check rules like:

- `SUMVAL_MISMATCH`: Summary doesn't reconcile with hourly
- `HOUR_NEGATIVE_VALUE`: Negative values in data
- `CALIBRATION_FAILED`: Calibration error exceeds tolerance
- `RATA_OVERDUE`: RATA test overdue
- etc.

**Example**:

```typescript
import { checkRuleRegistry, getCheckRulesBySeverity } from '@/agents/dahs'

const criticalChecks = getCheckRulesBySeverity('CRITICAL')
// [{ id: 'HOUR_NEGATIVE_VALUE', severity: 'CRITICAL', ... }]
```

### 4. ExplainerAgent (`src/agents/dahs/explainer.ts`)

**Purpose**: Generate human-readable explanations.

**Functions**:

- `explainRequiredParameter(req: RequiredParameter): string`
- `explainCheckRule(rule: CheckRule): string`
- `explainParameterSet(params: RequiredParameter[]): string`

**Example**:

```typescript
import { explainRequiredParameter } from '@/agents/dahs'

const explanation = explainRequiredParameter(requirements.requiredParameters[0])
// "Location U1 must report SO2M using method CEM (Continuous Emissions Monitoring). Required by programs: ARP. Reason: ..."
```

## Integration with NERO

The DAHS domain model integrates with NERO's orchestration platform:

1. **RegsBot** can use these agents to analyze monitoring plans
2. **RequirementsBot** can translate DAHS requirements into development items
3. **TestingBot** can use the calculation test cases
4. **Orchestration workflows** can include DAHS analysis nodes

## Regulatory References

- **40 CFR Part 75**: Continuous Emission Monitoring
- **40 CFR Part 75 Appendix B**: QA/QC Procedures
- **40 CFR Part 75 Appendix D**: Optional SO2 Emissions Data Protocol
- **40 CFR Part 75 Appendix F**: Calculation Procedures
- **ECMPS**: EPA's Emissions Collection and Monitoring Plan System

## Testing

All agents are fully tested using TDD:

```bash
npm run test:run -- src/agents/dahs
```

Total test coverage: 45 tests across 4 agent modules.

## Example Workflow

```typescript
import {
  inferRegulatoryRequirements,
  createCalculationPlan,
  explainParameterSet,
} from '@/agents/dahs'

// 1. Analyze monitoring plan
const regOutput = inferRegulatoryRequirements(monitoringPlan)

// 2. Generate calculation plan
const calcPlan = createCalculationPlan(monitoringPlan, regOutput.requiredParameters)

// 3. Explain to stakeholders
const summary = explainParameterSet(regOutput.requiredParameters)

console.log(summary)
// Output:
// Location U1: Monitoring SO2M, NOXM, CO2M for programs ARP
// Location CS1: Monitoring SO2M for programs ARP, CSAPR_SO2
```

## Future Enhancements

- **LLM Integration**: Use LLM for more sophisticated requirement inference
- **Permit OCR**: Extract monitoring plans from permit documents
- **ECMPS API**: Fetch live monitoring plans from EPA's CAMD API
- **Configuration Export**: Generate DAHS config files directly
- **Validation**: Validate monitoring plans against Part 75 rules

## Related Documentation

- [RegsBot Feature](./regsbot.md) - Main regulatory knowledge agent
- [RequirementsBot Feature](./requirementsbot.md) - Gap analysis and proposal generation
- [Orchestration](./orchestration.md) - Workflow integration
