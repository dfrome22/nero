# TestingBot

> The Validator - Ensuring requirements are testable and tested

## Overview

TestingBot generates test specifications and acceptance criteria from requirements, ensuring everything is testable and providing TDD infrastructure.

## Capabilities

### Test Plan Generation

- Generate test cases from requirements
- Define acceptance criteria
- Specify verification methods
- Map tests to requirements (trace links)

### Acceptance Criteria

- Clear, measurable criteria
- Given/When/Then format
- Edge cases and error conditions
- DAHS-specific validations

### Verification Specs

For DAHS proposals:

- Tag validation tests
- Calculation verification
- Alarm trigger conditions
- Report output validation

### Coverage Requirements

- Track requirement coverage
- Identify untested requirements
- Generate coverage reports

## Outputs

### TestPlan Artifact

```typescript
interface TestPlanData {
  testCases: TestCase[]
  acceptanceCriteria: AcceptanceCriterion[]
  verificationSpecs: VerificationSpec[]
  coverageMatrix: CoverageEntry[]
}

interface TestCase {
  id: string
  title: string
  description: string
  type: 'unit' | 'integration' | 'e2e' | 'acceptance'
  priority: 'critical' | 'high' | 'medium' | 'low'
  requirementLinks: string[]
  steps: TestStep[]
  expectedResult: string
}

interface AcceptanceCriterion {
  id: string
  requirementId: string
  given: string
  when: string
  then: string
}
```

### Trace Links

Every test traces to at least one requirement:

```typescript
interface TraceLink {
  id: string
  type: 'test-requirement'
  sourceId: string // Test ID
  targetId: string // Requirement ID
  createdAt: string
}
```

## Workflow Role

TestingBot typically receives input from RequirementsBot:

```
RequirementsBot → ApprovalGate → TestingBot → ApprovalGate → Publish
```

It can also run in parallel with FigmaBot:

```
                    ┌→ FigmaBot → ApprovalGate ─┐
RequirementsBot → ──┤                           ├→ Publish
                    └→ TestingBot → ApprovalGate┘
```

## Review Interface

For each TestPlan, BA/QA can:

- View test case list
- Check requirement coverage
- Review acceptance criteria
- Identify gaps

## TDD Integration

TestingBot supports TDD workflows:

1. Generate test specs before implementation
2. Export as test scaffolds (Vitest, Playwright)
3. Track implementation status
4. Validate against acceptance criteria

## Acceptance Criteria

- [ ] Generates test cases from requirements
- [ ] Each test links to requirements
- [ ] Acceptance criteria use Given/When/Then
- [ ] Coverage matrix shows requirement coverage
- [ ] DAHS proposals have verification specs
- [ ] Can export test scaffolds
- [ ] Identifies untested requirements
- [ ] Produces versioned TestPlan artifact
