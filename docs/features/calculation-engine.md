# Calculation Engine

Enhanced calculation service with formula validation, configuration management, audit trails, and dependency tracking for ECMPS and Title V permit calculations.

## Overview

The Calculation Engine provides a comprehensive solution for managing, validating, and executing emissions calculations in compliance with EPA Part 75 and ECMPS requirements. It addresses key needs for:

- **Formula Validation**: Syntax, semantics, units, and regulatory compliance checking
- **Configuration Management**: Versioned calculation configurations with approval workflows
- **Audit Trails**: Complete history of who changed what, when, and why
- **Dependency Tracking**: Upstream and downstream calculation dependencies with impact analysis

## Architecture

```
calculation-engine/
├── formula-validator.ts       # Formula validation and input checking
├── configuration-service.ts   # Config CRUD, audit trails, impact analysis
├── dependency-tracker.ts      # Dependency graphs and execution ordering
├── formula-registry.ts        # Standard ECMPS/Part 75 formulas
└── index.ts                   # Public API exports
```

## Core Components

### 1. Formula Validator

Validates formulas for correctness and compliance before they can be used in calculations.

**Features:**

- Syntax validation (parentheses, operators, division by zero)
- Parameter validation (undefined references, unused parameters)
- Units consistency checking
- Regulatory basis verification
- Input value validation against parameter definitions

**Example:**

```typescript
import { validateFormula, type Formula, type ValidationContext } from '@/agents/calculation-engine'

const formula: Formula = {
  id: 'heat-input-appendix-f',
  name: 'Heat Input (Appendix F)',
  version: '1.0.0',
  expression: 'Qh * Fd * (20.9 / (20.9 - O2)) * 1e-6',
  syntax: 'algebraic',
  inputParameters: [
    {
      name: 'Qh',
      description: 'Stack gas flow rate',
      type: 'number',
      units: 'scfh',
      required: true,
      range: { min: 0 },
    },
    {
      name: 'O2',
      description: 'Oxygen concentration',
      type: 'number',
      units: 'percent',
      required: true,
      range: { min: 0, max: 20.9 },
    },
    {
      name: 'Fd',
      description: 'F-factor for fuel type',
      type: 'number',
      units: 'dimensionless',
      required: true,
      defaultValue: 1040,
    },
  ],
  outputParameter: {
    name: 'HI',
    description: 'Heat input',
    type: 'number',
    units: 'MMBtu',
    required: true,
  },
  validationRules: [],
  regulatoryBasis: '40 CFR 75 Appendix F, Section 3.3.6',
  description: 'Calculates heat input using Appendix F methodology',
}

const context: ValidationContext = {
  strictMode: true,
  availableParameters: ['Qh', 'O2', 'Fd'],
  regulatoryRequirements: ['PART75'],
}

const results = validateFormula(formula, context)

// Check for errors
const errors = results.filter((r) => r.severity === 'error' && !r.passed)
if (errors.length > 0) {
  console.error('Formula validation failed:', errors)
}
```

### 2. Configuration Service

Manages calculation configurations with full audit trails and change tracking.

**Features:**

- Create/update calculation configurations
- Status management (active, inactive, deprecated, testing)
- Approval workflow with comments
- Complete audit trail with timestamps and user tracking
- Field-level change history
- Impact analysis for proposed changes
- Export configurations with full history

**Example:**

```typescript
import {
  createCalculationConfig,
  updateCalculationConfig,
  analyzeImpact,
} from '@/agents/calculation-engine'

// Create a new configuration
const config = createCalculationConfig(
  {
    name: 'SO2 Mass Emission - Unit 1',
    formulaId: 'so2-mass-emission',
    formulaVersion: '1.0.0',
    frequency: 'hourly',
    parameterMappings: {
      SO2_conc: 'source:so2-analyzer-1',
      Qh: 'source:flow-monitor-1',
      K: 'constant:1.66e-7',
    },
    status: 'testing',
    locationId: 'unit-1',
    programs: ['ARP', 'CSAPR_SO2'],
    satisfiesRequirements: ['req-so2-mass-monitoring'],
    validationRuleIds: ['so2-mass-positive'],
    metadata: {
      description: 'SO2 mass emission calculation for Unit 1',
      notes: ['Uses CEM data', 'Required for ARP and CSAPR compliance'],
    },
  },
  'user123',
  'John Smith'
)

// Update configuration
const updated = updateCalculationConfig(
  config,
  { status: 'active' },
  'user123',
  'John Smith',
  'Activating after successful testing'
)

// Analyze impact of proposed changes
const impact = analyzeImpact(config.id, { formulaId: 'so2-mass-emission-v2' }, allConfigs)

console.log('Risk level:', impact.riskLevel)
console.log('Affected calculations:', impact.totalImpactCount)
console.log('Recommendations:', impact.recommendations)
```

### 3. Dependency Tracker

Builds and analyzes dependency graphs for calculation chains.

**Features:**

- Automatic dependency detection from parameter mappings
- Execution order calculation via topological sort
- Circular dependency detection
- Upstream and downstream traversal
- Critical path calculation
- Graph validation

**Example:**

```typescript
import { buildDependencyGraph, getDownstreamDependents } from '@/agents/calculation-engine'

// Build dependency graph from all configurations
const graph = buildDependencyGraph(allConfigs)

// Check execution order
console.log('Execution order:', graph.executionOrder)

// Find all calculations that depend on a specific one
const dependents = getDownstreamDependents('calc-heat-input', graph)
console.log('Downstream dependents:', dependents)

// Validate graph for issues
const validation = validateDependencyGraph(graph)
if (!validation.valid) {
  console.error('Graph validation errors:', validation.errors)
}

// Detect circular dependencies
if (graph.cycles.length > 0) {
  console.error('Circular dependencies detected:', graph.cycles)
}
```

### 4. Formula Registry

Pre-defined standard formulas for common ECMPS/Part 75 calculations.

**Features:**

- Standard heat input calculations (Appendix F)
- Mass emission formulas (SO2, NOx, CO2)
- Emission rate calculations
- LME methodology formulas
- Appendix D fuel-based calculations
- Formula categories by regulatory context
- Search and retrieval functions

**Example:**

```typescript
import { getFormulaById, getFormulasByCategory, searchFormulas } from '@/agents/calculation-engine'

// Get specific formula
const heatInputFormula = getFormulaById('heat-input-appendix-f')

// Get all mass emission formulas
const massEmissions = getFormulasByCategory('mass-emissions')

// Search for formulas
const noxFormulas = searchFormulas('NOx')
```

## Audit Trail

Every configuration change is tracked with complete audit information:

```typescript
interface AuditTrail {
  createdAt: string
  createdBy: string
  createdByName: string
  lastModifiedAt: string
  lastModifiedBy: string
  lastModifiedByName: string
  approvedAt?: string
  approvedBy?: string
  approvedByName?: string
  approvalComment?: string
  history: AuditLogEntry[]
}

interface AuditLogEntry {
  timestamp: string
  action:
    | 'created'
    | 'updated'
    | 'activated'
    | 'deactivated'
    | 'deprecated'
    | 'validated'
    | 'executed'
    | 'failed'
  userId: string
  userName: string
  changes?: Record<string, { old: unknown; new: unknown }>
  reason?: string
  source?: string
}
```

**Query Audit History:**

```typescript
import {
  getAuditHistory,
  getFieldHistory,
  getAuditEntriesByAction,
} from '@/agents/calculation-engine'

// Get complete history
const history = getAuditHistory(config)

// Get history for a specific field
const nameChanges = getFieldHistory(config, 'name')
console.log('Name changed from:', nameChanges[0]?.oldValue)
console.log('Name changed to:', nameChanges[0]?.newValue)
console.log('Changed by:', nameChanges[0]?.userName)

// Get all updates
const updates = getAuditEntriesByAction(config, 'updated')
```

## Impact Analysis

Analyze the impact of proposed configuration changes before applying them:

```typescript
const impact = analyzeImpact(configId, proposedChanges, allConfigs)

// Risk assessment
console.log('Risk level:', impact.riskLevel) // low | medium | high | critical

// Direct impacts
impact.directImpacts.forEach((impact) => {
  console.log(`${impact.name}: ${impact.impactType}`)
  console.log('  Severity:', impact.severity)
  console.log('  Actions:', impact.requiredActions)
})

// Indirect impacts (downstream)
impact.indirectImpacts.forEach((impact) => {
  console.log(`Indirect impact on ${impact.name}`)
})

// Recommendations
impact.recommendations.forEach((rec) => {
  console.log('Recommendation:', rec)
})

// Required validations
impact.requiredValidations.forEach((val) => {
  console.log('Required validation:', val)
})
```

## Standard Formulas

### Heat Input (Appendix F)

```
HI = Qh × Fd × (20.9/(20.9 - %O2)) × 10^-6
```

**Inputs:**

- `Qh`: Stack gas flow rate (scfh)
- `Fd`: F-factor for fuel type (dimensionless)
- `O2`: Oxygen concentration (percent)

**Output:** Heat input (MMBtu)

### SO2 Mass Emission

```
SO2_mass = SO2_conc × Qh × K
```

**Inputs:**

- `SO2_conc`: SO2 concentration (ppm)
- `Qh`: Stack gas flow rate (scfh)
- `K`: Conversion factor (1.66e-7)

**Output:** SO2 mass emission rate (lb/hr)

### NOx Emission Rate

```
NOX_rate = NOX_mass / HI
```

**Inputs:**

- `NOX_mass`: NOx mass emission (lb)
- `HI`: Heat input (MMBtu)

**Output:** NOx emission rate (lb/MMBtu)

### LME NOx Rate (Quarterly)

```
NOX_rate_quarterly = sum_NOX_mass / sum_HI
```

**Inputs:**

- `sum_NOX_mass`: Sum of NOx mass for quarter (lb)
- `sum_HI`: Sum of heat input for quarter (MMBtu)

**Output:** Quarterly average NOx emission rate (lb/MMBtu)

## Integration Examples

### Using with Part 75 Orchestrator

```typescript
import { Part75Orchestrator } from '@/agents/part75-orchestrator'
import { getFormulaById, createCalculationConfig } from '@/agents/calculation-engine'

// Get monitoring requirements from orchestrator
const orchestrator = new Part75Orchestrator()
const analysis = await orchestrator.analyzeMonitoringPlan(orisCode)

// Create calculation configs based on requirements
for (const calcReq of analysis.calculationPlan.requirements) {
  const formula = getFormulaById(calcReq.calculationType)

  if (formula) {
    const config = createCalculationConfig(
      {
        name: calcReq.name,
        formulaId: formula.id,
        formulaVersion: formula.version,
        frequency: calcReq.frequency,
        parameterMappings: mapParameters(calcReq),
        status: 'testing',
        programs: analysis.regulatoryAnalysis.facilityInfo.programs,
        satisfiesRequirements: [calcReq.id],
        validationRuleIds: formula.validationRules.map((r) => r.id),
        metadata: {
          description: calcReq.name,
        },
      },
      userId,
      userName
    )
  }
}
```

## Validation Rules

Formulas can have multiple validation rules that are checked automatically:

```typescript
const validationRules = [
  {
    id: 'hi-appendix-f-o2-range',
    description: 'O2 must be less than 20.9%',
    type: 'semantic',
    validator: 'O2 < 20.9',
    severity: 'error',
  },
  {
    id: 'nox-rate-reasonable',
    description: 'NOx rate should be within reasonable range',
    type: 'semantic',
    validator: 'NOX_rate < 10',
    severity: 'warning',
  },
]
```

## Best Practices

1. **Always validate formulas** before creating configurations
2. **Use impact analysis** before making changes to active configurations
3. **Maintain audit trail** by providing meaningful reasons for changes
4. **Check dependencies** before deactivating calculations
5. **Use standard formulas** from the registry when possible
6. **Test configurations** in testing status before activating
7. **Document changes** in metadata notes
8. **Review approvals** for critical calculations
9. **Monitor execution** results for unexpected values
10. **Validate graphs** regularly to detect circular dependencies

## Testing

The calculation engine has comprehensive test coverage:

- Formula Validator: 15 tests
- Dependency Tracker: 21 tests
- Configuration Service: 17 tests
- Formula Registry: 32 tests
- **Total: 85 tests**

Run tests:

```bash
npm test -- src/agents/calculation-engine
```

## Type Safety

All components are fully typed with TypeScript for compile-time safety:

```typescript
import type {
  Formula,
  CalculationConfig,
  DependencyGraph,
  ValidationResult,
  AuditTrail,
  ImpactAnalysis,
} from '@/types/calculation-engine'
```

## Performance Considerations

- Dependency graph building: O(n²) worst case for n calculations
- Topological sort: O(n + e) for n nodes and e edges
- Cycle detection: O(n + e) using DFS
- Impact analysis: O(n) for direct impacts, O(n²) for downstream

For large calculation systems (>1000 configs), consider:

- Caching dependency graphs
- Incremental graph updates
- Parallel validation
- Database-backed audit storage

## Regulatory Compliance

All formulas and calculations are based on:

- **40 CFR Part 75**: Acid Rain Program monitoring requirements
- **40 CFR 75 Appendix B**: QA/QC procedures and validation requirements
- **40 CFR 75 Appendix D**: Fuel-based calculation methodologies
- **40 CFR 75 Appendix E**: Low Mass Emissions methodology
- **40 CFR 75 Appendix F**: Heat input and mass emission calculations
- **ECMPS**: EPA's Emissions Collection and Monitoring Plan System

## Future Enhancements

Potential improvements for future releases:

- Real-time calculation execution engine
- Machine learning for anomaly detection
- Advanced formula optimization
- Visual dependency graph editor
- Automated test case generation
- Integration with external DAHS systems
- Real-time data validation
- Performance profiling and optimization
- Formula versioning and migration tools
- Advanced impact analysis with simulation

## Support

For questions or issues with the calculation engine, see:

- TypeScript type definitions in `src/types/calculation-engine.ts`
- Test files for usage examples
- ECMPS/Part 75 regulatory references
- DAHS integration documentation
