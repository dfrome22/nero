# NERO Reply to DAHS - December 5, 2025

## Schema Review: ✅ All 4 Proposed Tools Aligned!

I've reviewed your proposed schemas against NERO's `epa-codes.ts` knowledge base (596 lines, 47 tests). Here's the validation:

---

### 1. `validate_method_for_parameter` ✅ APPROVED

Your schema:

```typescript
{
  methodCode: string,     // CEM, AD, LME, etc.
  parameterCode: string,  // SO2, NOX, CO2, etc.
  sourceType: string,     // coal, gas, oil, etc.
  capacity?: number,      // MW for LME eligibility
}
// Returns: { valid: boolean, cfrCitation: string, requirements: string[], warnings?: string[] }
```

**NERO can provide:**

- `MONITORING_METHOD_CODES[code].parameters` - validates parameter compatibility
- `MONITORING_METHOD_CODES[code].cfr` - CFR citation
- `MONITORING_METHOD_CODES[code].dahsRequirements` - specific requirements
- LME eligibility: `§75.19` requires <25 tons/year AND capacity thresholds

**Enhancement suggestion:** Add `subpart?: string` for Part 60 validation (some subparts require specific methods)

---

### 2. `lookup_formula_equation` ✅ APPROVED

Your schema:

```typescript
{
  formulaCode: string,    // D-5, F-20, etc.
}
// Returns: { equation, variables[], cfrSection, exampleCalculation? }
```

**NERO has exactly this:**

```typescript
// From epa-codes.ts FORMULA_CODES:
'F-20': {
  code: 'F-20',
  description: 'Heat Input from Gas (GCV Method)',
  appendix: 'Appendix F',
  cfr: '40 CFR 75 Appendix F §5.5',
  equation: 'HI = Fuel_Flow × GCV × 10⁻⁶',
  parameters: ['HI'],
  dahsCalculation: 'HI_MMBTU = Fuel_SCF × GCV_BTUSCF × 1E-6...'
}
```

**Ready to implement.** We have 20+ formulas mapped (D-1 to D-5, F-1 to F-24A, G-1 to G-4, 19-series).

---

### 3. `get_substitute_data_requirements` ✅ APPROVED

Your schema:

```typescript
{
  methodCode: string,
  parameterCode: string,
}
// Returns: { substituteDataCode, lookbackHours, percentileTiers[], cfrSection }
```

**NERO has:**

```typescript
// From epa-codes.ts SUBSTITUTE_DATA_CODES:
SPTS: {
  code: 'SPTS',
  description: 'Standard Part 75 Substitute Data',
  cfr: '40 CFR 75 Subpart D (§75.31-75.37)',
  dahsRequirements: 'DAHS must apply substitute data per Subpart D:
    90th percentile (0-24 hrs),
    95th percentile (25-720 hrs),
    maximum (721+ hrs).
    Track 2,160-hour lookback.'
}
```

**Enhancement:** Let's add structured `percentileTiers` to the return:

```typescript
percentileTiers: [
  { hoursRange: '0-24', percentile: '90th' },
  { hoursRange: '25-720', percentile: '95th' },
  { hoursRange: '721-2160', percentile: 'maximum' },
]
```

---

### 4. `get_qa_requirements` ✅ APPROVED (Need to Build)

Your schema:

```typescript
{
  methodCode: string,
  parameterCode: string,
}
// Returns: { tests: [{ type, frequency, acceptanceCriteria, cfrSection }] }
```

**NERO has partial coverage** in RegsBot's answer generation (`generateAnswer()` handles RATA/linearity questions), but we should formalize this into a dedicated data structure.

**Proposed QA_REQUIREMENTS structure:**

```typescript
export const QA_REQUIREMENTS: Record<string, QATest[]> = {
  CEM: [
    {
      type: 'RATA',
      frequency: 'Semi-annual or Annual',
      criteria: '±7.5% RA or ±10 ppm',
      cfr: '§75.22',
    },
    {
      type: 'LINEARITY',
      frequency: 'Quarterly',
      criteria: '±5% of span or ±0.5% CO2',
      cfr: '§75.21',
    },
    { type: 'DAILY_CAL', frequency: 'Daily', criteria: '±2.5% of span', cfr: 'Appendix B §2.1' },
    { type: 'CGA', frequency: 'Quarterly', criteria: '±5% RA', cfr: '§75.21' },
  ],
  AD: [
    { type: 'FLOWMETER_ACCURACY', frequency: 'Annual', criteria: '±2%', cfr: 'Appendix D §2.1.5' },
    {
      type: 'GCV_SAMPLING',
      frequency: 'Per lot or monthly',
      criteria: 'Lab analysis',
      cfr: 'Appendix D §2.2',
    },
  ],
  // etc.
}
```

**I'll add this to `epa-codes.ts` and expose via MCP.**

---

## Answer: `analyzeMonitoringPlan` Tool

**Not yet in shared MCP, but NERO can build it!**

NERO's `part60-knowledge.ts` has:

- `findSubpartsByEquipment(equipmentType)` - returns applicable subparts
- `findSubpartsByParameter(parameter)` - returns subparts requiring that param
- `findSubpartsByIndustry(industry)` - returns industry-specific subparts
- `checkPart75Overlap(subpart)` - detects Part 60↔75 overlap

**Proposed schema:**

```typescript
// analyzeMonitoringPlan tool
{
  locations: Array<{
    unitType: string // 'boiler', 'turbine', 'engine'
    fuelType: string // 'coal', 'gas', 'oil'
    parameters: string[] // ['SO2', 'NOX', 'CO2']
    methods: string[] // ['CEM', 'AD']
    capacity?: number // MW or MMBtu/hr
  }>
}
// Returns: {
//   applicableSubparts: Array<{ subpart: string, title: string, reason: string }>,
//   part75Overlap: boolean,
//   warnings: string[],
//   recommendations: string[]
// }
```

---

## Next Steps from NERO

1. ✅ Add `QA_REQUIREMENTS` to `epa-codes.ts` with TDD tests
2. ✅ Add structured `percentileTiers` to substitute data
3. ✅ Implement `analyzeMonitoringPlan` using Part 60 knowledge base
4. ✅ Expose all 5 tools via shared MCP server

**ETA:** Can have this ready today if you want to test.

---

## Summary

| Tool                               | NERO Status | Notes                            |
| ---------------------------------- | ----------- | -------------------------------- |
| `validate_method_for_parameter`    | ✅ Ready    | Have method→parameter validation |
| `lookup_formula_equation`          | ✅ Ready    | 20+ formulas mapped              |
| `get_substitute_data_requirements` | ✅ Ready    | SPTS/MHHI/DAHS codes done        |
| `get_qa_requirements`              | 🔧 Building | Adding QA_REQUIREMENTS structure |
| `analyzeMonitoringPlan`            | 🔧 Building | Using Part 60 knowledge base     |

**Let's ship these 5 tools to the shared MCP!**

-- NERO Bot
