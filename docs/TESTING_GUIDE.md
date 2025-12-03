# NERO Testing Guide

## What We've Built So Far

### Overview

NERO is a multi-agent AI orchestration platform for EPA regulatory compliance. Currently implemented:

1. **RegsBot** - EPA Regulatory Knowledge Oracle
2. **RequirementsBot** - Gap Analysis Service
3. **Core Infrastructure** - React app, routing, UI components

---

## User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NERO USER JOURNEYS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  JOURNEY 1: Regulatory Question (RegsBot)                                   │
│  ─────────────────────────────────────────                                  │
│  User has a question → RegsBot analyzes → Returns structured answer         │
│                                                                             │
│  ┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │ Question │───▶│ RegsBot   │───▶│ EPA Sources  │───▶│ Structured      │  │
│  │ (NL/JSON)│    │ ask()     │    │ (eCFR/ECMPS) │    │ Answer + Data   │  │
│  └──────────┘    └───────────┘    └──────────────┘    └─────────────────┘  │
│                                                                             │
│  Examples:                                                                  │
│  • "What QA tests are required for SO2?"                                    │
│  • "What monitoring is required under Part 75?"                             │
│  • "What subparts apply to my facility?"                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  JOURNEY 2: Monitoring Plan Analysis (RegsBot)                              │
│  ─────────────────────────────────────────────                              │
│  User provides MP → RegsBot derives DAHS requirements                       │
│                                                                             │
│  ┌──────────────┐    ┌────────────────┐    ┌────────────────────────────┐  │
│  │ Monitoring   │───▶│ RegsBot        │───▶│ DAHSRequirements:          │  │
│  │ Plan (JSON)  │    │ analyze()      │    │ • Monitoring parameters    │  │
│  │ or ORIS Code │    │                │    │ • QA/QC tests              │  │
│  └──────────────┘    └────────────────┘    │ • Calculations             │  │
│                                            │ • Reporting                │  │
│                                            │ • Emission limits          │  │
│                                            │ • Missing data rules       │  │
│                                            └────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  JOURNEY 3: Gap Analysis (RequirementsBot)                                  │
│  ─────────────────────────────────────────                                  │
│  Permit obligation → Compare to DAHS → Identify gaps                        │
│                                                                             │
│  ┌──────────────┐    ┌─────────────┐    ┌──────────────────────────────┐   │
│  │ Permit       │───▶│ Requirements│───▶│ GapAnalysisResult:           │   │
│  │ Obligation   │    │ Bot         │    │ • Matched capabilities       │   │
│  │ + DAHS       │    │ analyze()   │    │ • Development items          │   │
│  │   Profile    │    │             │    │ • Configuration proposals    │   │
│  └──────────────┘    └─────────────┘    │ • Priority ranking           │   │
│                                         └──────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Functional Requirements

### FR-1: RegsBot - Regulatory Question Answering

| ID     | Requirement                                             | Status         |
| ------ | ------------------------------------------------------- | -------------- |
| FR-1.1 | Accept natural language questions about EPA regulations | ✅ Implemented |
| FR-1.2 | Accept structured query with queryType and context      | ✅ Implemented |
| FR-1.3 | Infer query type from natural language                  | ✅ Implemented |
| FR-1.4 | Return structured answer with confidence level          | ✅ Implemented |
| FR-1.5 | Provide regulatory citations with sources               | ✅ Implemented |
| FR-1.6 | Suggest related follow-up questions                     | ✅ Implemented |
| FR-1.7 | Include warnings when context is insufficient           | ✅ Implemented |

### FR-2: RegsBot - Monitoring Plan Analysis

| ID     | Requirement                                              | Status         |
| ------ | -------------------------------------------------------- | -------------- |
| FR-2.1 | Fetch monitoring plan from ECMPS API by ORIS code        | ✅ Implemented |
| FR-2.2 | Parse monitoring plan JSON structure                     | ✅ Implemented |
| FR-2.3 | Derive monitoring requirements from methods/systems      | ✅ Implemented |
| FR-2.4 | Derive QA/QC requirements (daily cal, linearity, RATA)   | ✅ Implemented |
| FR-2.5 | Derive calculation requirements (hourly avg, heat input) | ✅ Implemented |
| FR-2.6 | Derive reporting requirements (quarterly EDR)            | ✅ Implemented |
| FR-2.7 | Identify applicable subparts (B, D, E, F, G, H)          | ✅ Implemented |

### FR-3: RequirementsBot - Gap Analysis

| ID     | Requirement                                          | Status         |
| ------ | ---------------------------------------------------- | -------------- |
| FR-3.1 | Accept permit obligation and DAHS profile            | ✅ Implemented |
| FR-3.2 | Match obligations to existing DAHS capabilities      | ✅ Implemented |
| FR-3.3 | Identify gaps (missing capabilities)                 | ✅ Implemented |
| FR-3.4 | Generate development items for gaps                  | ✅ Implemented |
| FR-3.5 | Propose configuration changes for configurable items | ✅ Implemented |
| FR-3.6 | Assign priority based on obligation type             | ✅ Implemented |

### FR-4: Permit Text Processing

| ID     | Requirement                                                | Status         |
| ------ | ---------------------------------------------------------- | -------------- |
| FR-4.1 | Scan text for regulatory language patterns                 | ✅ Implemented |
| FR-4.2 | Extract CFR citations (40 CFR 75.10, etc.)                 | ✅ Implemented |
| FR-4.3 | Classify obligations by type (monitoring, reporting, etc.) | ✅ Implemented |
| FR-4.4 | Extract obligations from permit text                       | ✅ Implemented |
| FR-4.5 | Build evidence library from extracted items                | ✅ Implemented |

---

## Manual Test Procedures

### Test 1: Run the Application

**Purpose**: Verify the React application starts and displays correctly.

**Steps**:

1. Open terminal in `C:\Nero`
2. Run: `npm run dev`
3. Open browser to `http://localhost:5173`

**Expected Results**:

- Dashboard page loads with NERO branding
- Left sidebar shows navigation links
- Agent cards display (RegsBot, RequirementsBot, FigmaBot, TestingBot)

---

### Test 2: RegsBot - Natural Language Query (Unit Test Verification)

**Purpose**: Verify RegsBot answers natural language questions correctly.

**Steps**:

1. Open terminal in `C:\Nero`
2. Run: `npm run test:run -- --grep "answers natural language"`

**Expected Results**:

```
✓ answers natural language question about QA requirements
```

**What This Tests**:

- RegsBot accepts `{ question: "What QA tests are required for SO2?" }`
- Returns structured response with:
  - `answer`: Natural language explanation
  - `data.qaRequirements`: Array of QA test specifications
  - `citations`: Regulatory references
  - `relatedQuestions`: Suggested follow-ups

---

### Test 3: RegsBot - Monitoring Plan Analysis (Unit Test Verification)

**Purpose**: Verify RegsBot can analyze a monitoring plan and derive DAHS requirements.

**Steps**:

1. Open terminal in `C:\Nero`
2. Run: `npm run test:run -- --grep "analyzes a monitoring plan"`

**Expected Results**:

```
✓ analyzes a monitoring plan and returns DAHS requirements
```

**What This Tests**:

- Given a monitoring plan with SO2, NOX, FLOW, O2 systems
- RegsBot returns `DAHSRequirements`:
  - `monitoringRequirements`: 4 parameters to monitor
  - `qaRequirements`: Daily calibration, linearity, RATA for each system
  - `calculationRequirements`: Hourly averages, heat input, mass emissions
  - `reportingRequirements`: Quarterly EDR, annual certification

---

### Test 4: RequirementsBot - Gap Analysis (Unit Test Verification)

**Purpose**: Verify RequirementsBot identifies gaps between permit and DAHS capabilities.

**Steps**:

1. Open terminal in `C:\Nero`
2. Run: `npm run test:run -- --grep "identifies gaps"`

**Expected Results**:

```
✓ identifies gaps when capability not found
```

**What This Tests**:

- Given a permit obligation for "Mercury monitoring"
- And a DAHS profile without mercury capability
- RequirementsBot returns:
  - `gapFound: true`
  - `developmentItem`: Feature request for mercury monitoring

---

### Test 5: Full Test Suite

**Purpose**: Run all 90 tests to verify complete system integrity.

**Steps**:

1. Open terminal in `C:\Nero`
2. Run: `npm run test:run`

**Expected Results**:

```
Test Files  7 passed (7)
     Tests  90 passed (90)
```

**Test Breakdown**:
| Component | Tests |
|-----------|-------|
| RegsBot | 42 |
| RequirementsBot | 27 |
| UI Components | 21 |

---

### Test 6: Interactive Console Testing (Advanced)

**Purpose**: Manually invoke RegsBot methods in a Node.js console.

**Steps**:

1. Create a test script `C:\Nero\test-regsbot.ts`:

```typescript
import { RegsBotService } from './src/agents/regsbot/index'

async function main() {
  const regsBot = new RegsBotService()

  // Test 1: Natural language question
  console.log('\n=== Test 1: Natural Language Question ===')
  const answer1 = await regsBot.ask({
    question: 'What QA tests are required for SO2 CEMS?',
  })
  console.log('Answer:', answer1.answer)
  console.log('Confidence:', answer1.confidence)
  console.log('QA Tests:', answer1.data.qaRequirements?.length ?? 0)

  // Test 2: Structured query
  console.log('\n=== Test 2: Structured Query ===')
  const answer2 = await regsBot.ask({
    queryType: 'what-to-calculate',
    context: { programs: ['ARP'] },
  })
  console.log('Answer:', answer2.answer)
  console.log('Calculations:', answer2.data.calculationRequirements?.length ?? 0)

  // Test 3: Applicable regulations
  console.log('\n=== Test 3: Applicable Regulations ===')
  const answer3 = await regsBot.ask({
    queryType: 'applicable-regulations',
  })
  console.log('Answer:', answer3.answer)
  console.log('Regulations:', answer3.data.regulations?.map((r) => r.cfr).join(', '))
}

main()
```

2. Run with: `npx tsx test-regsbot.ts`

**Expected Output**:

```
=== Test 1: Natural Language Question ===
Answer: Required QA/QC tests: daily_calibration, linearity, rata...
Confidence: low
QA Tests: 3

=== Test 2: Structured Query ===
Answer: The DAHS must perform these calculations: Hourly Average, Heat Input...
Calculations: 3

=== Test 3: Applicable Regulations ===
Answer: Applicable regulations: 40 CFR 75.10, 40 CFR 75 Subpart B...
Regulations: 40 CFR 75.10, 40 CFR 75 Subpart B, 40 CFR 75 Appendix B...
```

---

## Code Coverage Summary

Run `npm run test:coverage` to see coverage report.

| File                                | Coverage         |
| ----------------------------------- | ---------------- |
| src/agents/regsbot/index.ts         | ~85%             |
| src/agents/requirementsbot/index.ts | ~90%             |
| src/types/orchestration.ts          | N/A (types only) |

---

## Known Limitations

1. **API Mocking**: ECMPS/eCFR API calls are mocked in tests; real API integration not tested
2. **UI Not Wired**: Agent pages exist but don't invoke agent services yet
3. **No Persistence**: No database; all data in memory
4. **No LLM Integration**: Agents produce structured JSON but no LLM orchestration yet

---

## Next Steps for Testing

1. **Wire UI to Agents**: Create RegsBot page with input form that calls `regsBot.ask()`
2. **Real API Testing**: Test with actual ECMPS API for a known ORIS code
3. **E2E Tests**: Add Playwright tests for user workflows
4. **Integration Tests**: Test RegsBot → RequirementsBot pipeline

---

## Quick Reference

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm test

# Run specific test file
npm run test:run -- src/agents/regsbot/regsbot.test.ts

# Run tests matching pattern
npm run test:run -- --grep "ask()"

# Run with coverage
npm run test:coverage

# Full validation (typecheck + lint + tests)
npm run validate

# Start dev server
npm run dev
```
