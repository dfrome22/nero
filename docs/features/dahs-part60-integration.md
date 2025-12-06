# DAHS Part 60 NSPS Integration Requirements

This document specifies how NERO (Regulatory Knowledge) and DAHS (Operational Compliance) collaborate for Part 60 NSPS compliance. NERO provides the regulatory source of truth; DAHS handles operational configuration and data handling.

> **Key Insight**: NERO and DAHS are **complementary, not duplicative**.
>
> - **NERO** answers: "What does CFR require?"
> - **DAHS** answers: "Is my system configured correctly?"

## What's New (January 2025)

### Phase 4 Complete: LDAR & Storage Subparts

NERO now indexes **14 Part 60 subparts** (up from 10):

- **VV** - SOCMI Equipment Leaks (1983) - LDAR with Method 21
- **VVa** - SOCMI Equipment Leaks (2006+) - LDAR with OGI option
- **Kb** - VOL Storage Vessels - Tank controls
- **OOOOa** - Oil & Natural Gas (2016+) - Wellheads, compressors, LDAR

### Clarified Collaboration Model

Per discussion with DAHS team, the integration focuses on:

1. **Validation Oracle** - NERO validates DAHS configurations against CFR
2. **Formula Verification** - NERO provides exact equations for DAHS to verify
3. **Regulatory Reference** - NERO supplies CFR citations for audit/help text

DAHS retains its own `ecmps-code-tables.ts` for operational purposes (MP Editor UI, dropdowns, validation). NERO adds regulatory intelligence on top.

## What's New (December 2024)

### EPA Monitoring Method Codes → CFR Mapping

NERO now provides a comprehensive EPA codes database that maps monitoring plan codes directly to CFR requirements. This enables DAHS to:

1. **Look up any method code** (CEM, AD, LME, etc.) and get the exact CFR reference
2. **Look up any formula code** (D-5, F-20, F-24A, etc.) and get calculation requirements
3. **Get DAHS-specific instructions** for each code

**New Files:**

- `src/agents/regsbot/epa-codes.ts` - 590 lines of EPA code mappings
- `src/agents/regsbot/epa-codes.test.ts` - 47 TDD tests

**Available Functions for DAHS Integration:**

```typescript
import {
  getMonitoringMethod, // Get method details by code (CEM, AD, LME, etc.)
  getFormula, // Get formula details by code (D-5, F-20, etc.)
  getParameter, // Get parameter details (SO2, NOX, HI, etc.)
  findMethodsByParameter, // Find all methods for a parameter
  findFormulasByParameter, // Find all formulas for a parameter
  explainMethodForDAHS, // Get DAHS-specific explanation
  explainFormulaForDAHS, // Get DAHS-specific calculation instructions
} from './epa-codes'
```

### Indexed Method Codes

| Code | Description                    | CFR Reference             | DAHS Requirements                                                             |
| ---- | ------------------------------ | ------------------------- | ----------------------------------------------------------------------------- |
| CEM  | Continuous Emission Monitoring | 40 CFR 75.10-75.18        | Record hourly concentrations, apply calibration factors, QA/QC per Appendix B |
| AD   | Appendix D (Fuel Sampling)     | 40 CFR 75 Appendix D      | Record fuel flow, GCV, sulfur content. Calculate via D-2 through D-12         |
| AE   | Appendix E (NOx Rate)          | 40 CFR 75 Appendix E      | Use correlation curves, interpolate NOx rate from heat input                  |
| AG   | Appendix G (CO2 Gas-Fired)     | 40 CFR 75 Appendix G      | Calculate CO2 from fuel carbon content and flow                               |
| LME  | Low Mass Emissions             | 40 CFR 75.19              | Fuel-based calculations, simplified monitoring for <25 tons/year              |
| NOXR | NOx Rate Method                | 40 CFR 75.12              | Calculate NOx mass from NOXR × HI                                             |
| CALC | Calculation Method             | 40 CFR 97 / Subpart GGGGG | Calculate NOx mass from rate × heat input                                     |
| PEMS | Predictive Emission Monitoring | 40 CFR 75.48              | Use certified PEMS correlations, periodic RATA/CGA                            |

### Indexed Formula Codes

| Code  | Description                   | Appendix   | DAHS Calculation                                          |
| ----- | ----------------------------- | ---------- | --------------------------------------------------------- |
| D-5   | SO2 from Gas (Default Rate)   | Appendix D | SO2_LB = HI_MMBTU × 0.0006 (pipeline natural gas)         |
| F-1   | NOx Rate (O2 diluent, dry)    | Appendix F | NOXR = 1.194E-7 × NOx_PPM × Fd × (20.9 / (20.9 - O2_PCT)) |
| F-2   | NOx Rate (CO2 diluent, dry)   | Appendix F | NOXR = 1.194E-7 × NOx_PPM × Fc × (100 / CO2_PCT)          |
| F-20  | Heat Input from Gas           | Appendix F | HI_MMBTU = Fuel_SCF × GCV_BTUSCF × 1E-6                   |
| F-21  | Heat Input from Oil           | Appendix F | HI_MMBTU = Fuel_LB × GCV_BTULB × 1E-6                     |
| F-23  | SO2 for Low Sulfur Fuel       | Appendix F | SO2_LB = HI_MMBTU × Default_Rate                          |
| F-24A | NOx Mass from Rate × HI       | Appendix F | NOX_LB = NOXR_LBMMBTU × HI_MMBTU                          |
| G-4   | CO2 from Fuel (Carbon Factor) | Appendix G | CO2_TON = 1040 × HI_MMBTU × (1/385.3) × 44 / 2000         |

### Substitute Data Codes

| Code | Description                 | CFR Reference            | DAHS Requirements                                                                   |
| ---- | --------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| SPTS | Standard Part 75 Substitute | Subpart D (§75.31-75.37) | 90th percentile (0-24 hrs), 95th (25-720 hrs), max (721+ hrs). 2,160-hour lookback. |
| MHHI | Maximum Hourly Heat Input   | Subpart D                | Substitute max HI from lookback period                                              |

### Test Coverage

**417 total tests passing:**

- 122 Part 60 knowledge base tests
- 47 EPA codes mapping tests
- 67 RegsBot service tests (including EPA code lookup)
- 181 other component tests

---

## Overview

NERO's Part 60 knowledge base enables automatic detection of applicable NSPS subparts based on facility equipment and parameters. When a facility has Part 60 obligations, DAHS must support the specific monitoring, calculation, and reporting requirements for each subpart.

## Indexed Subparts (14 Total)

The following subparts are indexed in NERO's Part 60 knowledge base with full regulatory specifications:

| Subpart | Title                             | Equipment Type                 | Key Parameters      |
| ------- | --------------------------------- | ------------------------------ | ------------------- |
| Da      | Electric Utility Steam Generators | Boilers ≥250 MMBtu/hr          | SO2, NOX, PM        |
| Db      | Industrial Steam Generators       | Boilers >100 MMBtu/hr          | SO2, NOX, PM        |
| Dc      | Small Industrial Boilers          | Boilers 10-100 MMBtu/hr        | SO2, PM/Opacity     |
| TTTT    | Greenhouse Gas for EGUs           | Electric Generating Units      | CO2                 |
| GG      | Stationary Gas Turbines (Legacy)  | Gas Turbines (pre-2006)        | NOX, SO2            |
| KKKK    | Stationary Combustion Turbines    | Gas Turbines (2006+)           | NOX, SO2            |
| J       | Petroleum Refineries (Legacy)     | FCCUs, Claus Units, Fuel Gas   | PM, SO2, CO, H2S    |
| Ja      | Petroleum Refineries (2008+)      | FCCUs, Process Heaters, Flares | PM, SO2, NOX, CO    |
| IIII    | Stationary CI Engines             | Diesel Engines                 | NOX+NMHC, PM, CO    |
| JJJJ    | Stationary SI Engines             | Natural Gas/LPG Engines        | NOX, CO, VOC        |
| VV      | SOCMI Equipment Leaks (1983)      | Valves, Pumps, Compressors     | VOC (LDAR)          |
| VVa     | SOCMI Equipment Leaks (2006+)     | Valves, Pumps, Connectors      | VOC (LDAR)          |
| Kb      | VOL Storage Vessels               | Storage Tanks ≥75 m³           | VOC                 |
| OOOOa   | Oil & Natural Gas (2016+)         | Wellheads, Compressors, Tanks  | Methane, VOC (LDAR) |

---

## Subpart Da - Electric Utility Steam Generators

### Monitoring Requirements

| Parameter | Method                         | Data Recovery     | Reference |
| --------- | ------------------------------ | ----------------- | --------- |
| SO2       | CEMS (Method 7E or equivalent) | ≥95% per quarter  | §60.47Da  |
| NOX       | CEMS                           | ≥95% per quarter  | §60.47Da  |
| PM        | Method 5, 5B, or CEMS          | Per test schedule | §60.47Da  |

### DAHS Calculation Requirements

1. **30-Day Rolling Average for SO2**
   - Calculate based on hourly emission data
   - Must handle missing data substitution per Part 75 procedures
   - Track against emission limit: 1.2 lb/MMBtu or 90% reduction

2. **30-Day Rolling Average for NOX**
   - Same methodology as SO2
   - Track against applicable standard

3. **Excess Emissions Tracking**
   - Flag any hour exceeding emission limit
   - Accumulate for semiannual reporting
   - Include duration, magnitude, and cause codes

### Reporting Requirements

| Report                        | Frequency     | Content                     |
| ----------------------------- | ------------- | --------------------------- |
| Excess Emissions              | Semiannual    | All exceedances with causes |
| Monitoring System Performance | Semiannual    | Downtime, QA failures       |
| Electronic Reporting          | Per state/EPA | CEDRI or state system       |

### Cross-Reference: Part 75 Overlap

Subpart Da sources typically also have Part 75 Acid Rain obligations. DAHS should:

- Use Part 75 CEMS data for Part 60 Da compliance
- Apply stricter data substitution rules (Part 75 has more detailed substitution)
- Generate both Part 75 EDR and Part 60 excess emissions reports

---

## Subpart KKKK - Stationary Combustion Turbines (2006+)

### Monitoring Requirements

| Parameter | Method                         | Frequency            | Reference |
| --------- | ------------------------------ | -------------------- | --------- |
| NOX       | CEMS or Method 20              | Continuous or annual | §60.4340  |
| SO2       | Fuel sulfur monitoring or CEMS | Per fuel delivery    | §60.4330  |

### DAHS Calculation Requirements

1. **4-Hour Rolling Average for NOX**
   - Calculate from CEMS data
   - Different methodology than Part 75 (which uses hourly)
   - Must maintain 4-hour history for rolling calculation

2. **Startup/Shutdown Tracking**
   - Identify and flag startup/shutdown periods
   - Exclude from emission limit compliance (per KKKK provisions)
   - Track duration for reporting

3. **Output-Based Limit Calculation**
   - Convert lb/hr to lb/MWh using gross output
   - Track against applicable limit (varies by turbine type)

### Fuel Sulfur Monitoring

- Track fuel sulfur content per delivery
- Calculate weighted average sulfur for reporting period
- Flag if any delivery exceeds 0.060 lb SO2/MMBtu threshold

---

## Subpart GG - Stationary Gas Turbines (Legacy, Pre-2006)

### Monitoring Requirements

| Parameter | Method                          | Frequency            | Reference |
| --------- | ------------------------------- | -------------------- | --------- |
| NOX       | CEMS or annual performance test | Continuous or annual | §60.334   |
| SO2       | Fuel sulfur monitoring          | Per delivery         | §60.334   |

### DAHS Calculation Requirements

1. **Annual Performance Test Tracking**
   - Store test results
   - Calculate annual average if multiple tests
   - Flag when retest is due

2. **Fuel Sulfur Monitoring**
   - Same as KKKK
   - Track against 0.8% sulfur (by weight) limit for oil
   - Track against 50 ppm limit for gaseous fuel

### Note on GG vs KKKK

- GG applies to turbines constructed before February 18, 2005
- KKKK applies to turbines constructed after February 18, 2005
- Some facilities may have both GG and KKKK sources
- DAHS should track which standard applies to each unit

---

## Subpart TTTT - Greenhouse Gas for EGUs

### Monitoring Requirements

| Parameter    | Method                  | Data Recovery    | Reference |
| ------------ | ----------------------- | ---------------- | --------- |
| CO2          | CEMS or Part 75 methods | ≥90% per quarter | §60.5535  |
| Heat Input   | Part 75 Appendix D or F | ≥90% per quarter | §60.5535  |
| Gross Output | Direct measurement      | ≥90% per quarter | §60.5535  |

### DAHS Calculation Requirements

1. **CO2 Emission Rate (lb/MWh)**
   - Calculate from CO2 mass and gross output
   - 12-month rolling average
   - Track against applicable standard (varies by subcategory)

2. **Part 75 Integration**
   - TTTT explicitly allows Part 75 methods for CO2 monitoring
   - Use existing Part 75 CEMS data where available
   - Apply Part 75 data substitution for missing data

### Subcategory Tracking

DAHS must track unit subcategory for correct limit application:

- Existing coal-fired EGU
- New coal-fired EGU
- Existing natural gas EGU
- New natural gas EGU

---

## Subpart J - Petroleum Refineries

### Applicability

Subpart J applies to:

- Fluid Catalytic Cracking Units (FCCUs)
- Claus Sulfur Recovery Units
- Fuel Gas Combustion Devices

### FCCU Monitoring Requirements

| Parameter          | Method                     | Frequency  | Reference |
| ------------------ | -------------------------- | ---------- | --------- |
| PM (coke burn-off) | Calculation from coke rate | Continuous | §60.104   |
| CO                 | CEMS                       | Continuous | §60.105   |
| SO2                | CEMS                       | Continuous | §60.104   |

### DAHS Calculation Requirements

1. **Coke Burn-Off Rate Calculation**
   - Calculate from air rate and O2/CO2 concentrations
   - Formula: Rc = K × Qa × (CO2 + CO) × (1 + (% O2 - % CO / 2) / (% CO2 + % CO))
   - Track against PM limit (1.0 kg/Mg coke or alternative)

2. **Fuel Gas H2S Monitoring**
   - Continuous monitoring of H2S in fuel gas
   - Calculate 3-hour rolling average
   - Limit: 230 mg/dscm (0.10 gr/dscf) for Claus tail gas
   - Limit: 160 ppmv for fuel gas

3. **Claus Unit SO2 Monitoring**
   - CEMS for SO2 in tail gas
   - Calculate 12-hour rolling average
   - Track against 250 ppm limit (or 99.8% recovery)

### Cross-Reference: Part 60 Subpart Ja

Subpart Ja (2008+) has additional requirements:

- More stringent limits
- Additional LDAR requirements
- Flare monitoring requirements

---

## Subpart Db - Industrial Steam Generators (>100 MMBtu/hr)

### Monitoring Requirements

| Parameter   | Method        | Data Recovery    | Reference  |
| ----------- | ------------- | ---------------- | ---------- |
| SO2         | CEMS          | ≥95% per quarter | §60.45b    |
| NOX         | CEMS          | ≥95% per quarter | §60.45b    |
| Opacity     | COMS          | ≥95% per quarter | §60.46b    |
| Fuel Sulfur | Fuel analysis | Per delivery     | §60.44b(h) |

### DAHS Calculation Requirements

1. **30-Day Rolling Average for SO2**
   - Same methodology as Subpart Da
   - Track against 0.50 lb/MMBtu OR 90% reduction (alternative)

2. **30-Day Rolling Average for NOX**
   - Calculate from hourly CEMS data
   - Track against 0.50-0.70 lb/MMBtu (varies by combustion type)

3. **Fuel Sulfur Alternative**
   - If using fuel sulfur monitoring instead of CEMS
   - Calculate emission rate from sulfur content and heat input
   - Maintain per-delivery records

### Reporting Requirements

| Report           | Frequency  | Content                     |
| ---------------- | ---------- | --------------------------- |
| Excess Emissions | Semiannual | Duration, magnitude, causes |
| Fuel Analysis    | Quarterly  | Sulfur content by fuel type |

---

## Subpart Dc - Small Industrial Boilers (10-100 MMBtu/hr)

### Monitoring Requirements

| Parameter | Method         | Frequency         | Reference |
| --------- | -------------- | ----------------- | --------- |
| SO2       | Fuel analysis  | Per delivery      | §60.44c   |
| Opacity   | COMS or visual | Continuous/weekly | §60.46c   |

### DAHS Calculation Requirements

1. **Fuel Sulfur Tracking**
   - Record sulfur content per fuel delivery
   - Maintain supplier certifications
   - No CEMS required - simplified compliance

2. **Opacity Monitoring**
   - 20% opacity limit (6-minute average)
   - Track exceedances for reporting

### Key Difference from Db

- Dc units do NOT require SO2 or NOX CEMS
- Compliance primarily via fuel certification
- Much simpler DAHS requirements

---

## Implementation Priority

Based on market coverage and common facility types, implement DAHS Part 60 capabilities in this order:

## Subpart IIII - Stationary CI Engines (Diesel)

### Overview

Compression ignition (diesel) engines used for power generation, pumping, compression at industrial and oil & gas facilities.

### Monitoring Requirements

| Parameter        | Method                    | Frequency    | Reference |
| ---------------- | ------------------------- | ------------ | --------- |
| Engine operation | Non-resettable hour meter | Continuous   | §60.4209  |
| Fuel usage       | Delivery records          | Per delivery | §60.4207  |

### DAHS Calculation Requirements

1. **Operating Hour Tracking**
   - Track cumulative operating hours
   - Non-resettable hour meter required
   - Used to determine maintenance schedules and compliance periods

2. **Tiered Standards by Model Year**
   - Standards vary by engine model year (Tier 1, 2, 3, 4)
   - DAHS should track engine tier for limit applicability

### Key Point for DAHS

- **No CEMS required** - Compliance via EPA engine certification
- Primary DAHS role: operating hour tracking and maintenance logging
- Much simpler than boiler/turbine subparts

---

## Subpart JJJJ - Stationary SI Engines (Natural Gas/LPG)

### Overview

Spark ignition engines (natural gas, propane, gasoline) at industrial, oil & gas, and commercial facilities.

### Monitoring Requirements

| Parameter            | Method                    | Frequency  | Reference |
| -------------------- | ------------------------- | ---------- | --------- |
| Engine operation     | Non-resettable hour meter | Continuous | §60.4237  |
| Catalyst temperature | Thermocouple (if used)    | Continuous | §60.4236  |

### DAHS Calculation Requirements

1. **Rich-Burn vs Lean-Burn Tracking**
   - Different emission limits apply
   - DAHS should track engine combustion type

2. **Catalyst Monitoring (if applicable)**
   - Track catalyst inlet temperature
   - Flag if temperature drops below minimum for catalyst function

### Key Point for DAHS

- **No CEMS required** - Compliance via EPA/CARB certification
- If using catalyst: continuous temperature monitoring required
- Primary DAHS role: operating hours + catalyst monitoring

---

## Subpart Ja - Petroleum Refineries (2008+)

### Overview

More stringent than Subpart J for refineries constructed/modified after May 14, 2007. Adds flare monitoring and process heater requirements.

### Monitoring Requirements

| Parameter       | Method | Frequency  | Reference |
| --------------- | ------ | ---------- | --------- |
| SO2             | CEMS   | Continuous | §60.105a  |
| NOX             | CEMS   | Continuous | §60.105a  |
| CO              | CEMS   | Continuous | §60.105a  |
| O2              | CEMS   | Continuous | §60.105a  |
| Flare Flow Rate | CPMS   | Continuous | §60.107a  |
| Flare Pilot     | CPMS   | Continuous | §60.107a  |
| H2S in Fuel Gas | CPMS   | Continuous | §60.107a  |

### DAHS Calculation Requirements

1. **7-Day Rolling Averages for FCCU**
   - PM: 0.5 kg/Mg coke (more stringent than J's 1.0)
   - SO2: 50 ppmvd
   - NOX: 80 ppmvd

2. **Flare Event Tracking**
   - Monitor flare flow rate continuously
   - Trigger alert when flow exceeds routine levels
   - Must report flare events within 2 days

3. **Process Heater Limits**
   - SO2: 40 ppmvd (365-day rolling!)
   - NOX: 40 ppmvd (30-day rolling)

### Key Differences from Subpart J

| Aspect           | Subpart J | Subpart Ja    |
| ---------------- | --------- | ------------- |
| PM Limit         | 1.0 kg/Mg | 0.5 kg/Mg     |
| Averaging        | Varies    | 7-day rolling |
| Flare monitoring | Limited   | Comprehensive |
| Process heaters  | Minimal   | Full coverage |

---

## Implementation Priority

Based on market coverage and common facility types, implement DAHS Part 60 capabilities in this order:

### Indexed in NERO (Ready for DAHS Integration) - 14 Subparts

**CEM-Based Subparts (require CEMS/DAHS):**

1. **Subpart Da** - Electric utility steam generators (large sources, Part 75 overlap)
2. **Subpart Db** - Industrial boilers >100 MMBtu/hr
3. **Subpart Dc** - Small boilers 10-100 MMBtu/hr (fuel-based compliance)
4. **Subpart KKKK** - Combustion turbines 2006+ (4-hour rolling NOX)
5. **Subpart GG** - Legacy gas turbines pre-2006
6. **Subpart TTTT** - GHG for EGUs (CO2 lb/MWh)
7. **Subpart J** - Petroleum refineries legacy (FCCU, Claus, fuel gas)
8. **Subpart Ja** - Petroleum refineries 2008+ (flare monitoring)
9. **Subpart IIII** - CI engines/diesel (certification-based)
10. **Subpart JJJJ** - SI engines/natural gas (certification-based)

**LDAR/Non-CEM Subparts (equipment leaks, storage):**

11. **Subpart VV** - SOCMI equipment leaks 1983 (LDAR with Method 21)
12. **Subpart VVa** - SOCMI equipment leaks 2006+ (LDAR with OGI option)
13. **Subpart Kb** - VOL storage vessels (tank controls)
14. **Subpart OOOOa** - Oil & gas 2016+ (wellheads, compressors, LDAR)

### Pending NERO Indexing (Phase 5+)

15. **Subpart OOOO** - Oil & gas 2011-2015 (legacy methane rule)
16. **Subpart OOOOb** - Oil & gas 2024+ (updated methane rule)
17. **Subparts UUUU/UUUUU** - GHG for additional sources

---

## Testing Requirements

The TDD tests in `src/agents/regsbot/part60-knowledge.test.ts` document specific assertions that verify DAHS capabilities:

```typescript
// Example: Subpart Da requires 30-day rolling SO2 average
it('Da has 30-day rolling average for SO2', () => {
  const da = getSubpartKnowledge('Da')
  const so2Standard = da.emissionStandards.find((s) => s.parameter === 'SO2')
  expect(so2Standard?.averagingPeriod).toBe('30-day rolling')
})

// Example: Subpart KKKK requires 4-hour rolling for NOX
it('KKKK has 4-hour rolling average for NOX', () => {
  const kkkk = getSubpartKnowledge('KKKK')
  const noxStandard = kkkk.emissionStandards.find((s) => s.parameter === 'NOX')
  expect(noxStandard?.averagingPeriod).toBe('4-hour rolling')
})
```

Run the full test suite to verify NERO's Part 60 knowledge base:

```bash
npx vitest run src/agents/regsbot/part60
```

---

## NERO ↔ DAHS Collaboration Model

> **NERO = Regulatory Knowledge** ("What does CFR require?")
> **DAHS = Operational Compliance** ("Is my system configured correctly?")

The systems are **complementary, not duplicative**. NERO provides the regulatory source of truth; DAHS handles operational configuration and data handling.

### What DAHS Already Has

DAHS has its own `ecmps-code-tables.ts` with 18 internal code tables for:

- MP Editor configuration (dropdowns, validation)
- Component type mappings
- Span/range scales
- QA test types and frequencies

These tables exist for **operational reasons** (user interface, data entry) - not regulatory interpretation.

### What NERO Provides (Via Shared MCP)

NERO adds **regulatory intelligence** that DAHS tables don't have:

| Capability                  | Description                                                  | DAHS Use Case                                 |
| --------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| **Validation Oracle**       | "Is method code CEM valid for SO2 at coal-fired EGU?"        | Second opinion on MP Editor configurations    |
| **Formula Verification**    | Exact calculation equations with CFR citations               | Verify formula implementations are correct    |
| **Regulatory Reference**    | Direct CFR section citations for any code                    | Display help text, audit documentation        |
| **Applicability Context**   | Which subparts/methods apply to specific equipment types     | Context-aware suggestions in MP Editor        |
| **SPTS Substitution Logic** | 2,160-hour lookback, 90th/95th/max percentile rules          | Validate missing data substitution algorithms |
| **Cross-Regulation Links**  | Part 60 ↔ Part 75 overlaps (e.g., Da sources with Acid Rain) | Identify when multiple regulations apply      |

### What NERO Does NOT Provide

- ❌ **Configuration Generation** - DAHS has its own MP Editor workflow
- ❌ **Applicability Determination Wizard** - Out of scope for shared MCP
- ❌ **Full Regulatory Text** - Use eCFR API directly if needed
- ❌ **Monitoring Plan Creation** - DAHS handles this operationally

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Shared MCP Server                           │
│                C:\WebApp\shared\epa-compliance-mcp              │
├─────────────────────────────────────────────────────────────────┤
│  Tools:                                                         │
│  • lookup_method_code(code) → CFR, DAHS requirements           │
│  • lookup_formula_code(code) → equation, variables, CFR        │
│  • validate_method_for_parameter(method, param, source_type)   │
│  • get_substitute_data_requirements(method_code)               │
│  • get_part60_requirements(subpart, equipment_type)            │
│  • validate_rata_frequency(source_type, test_span)             │
└─────────────────────────────────────────────────────────────────┘
          ↑                                      ↑
          │                                      │
    ┌─────┴─────┐                         ┌──────┴──────┐
    │   NERO    │                         │    DAHS     │
    │  RegsBot  │                         │  MP Editor  │
    │           │                         │             │
    │ Regulatory│                         │ Operational │
    │ Knowledge │                         │ Compliance  │
    └───────────┘                         └─────────────┘
```

---

## Next Steps

### Completed by NERO Team ✅

1. **Part 60 Knowledge Base** - 14 subparts indexed with full regulatory specs (148 tests)
2. **EPA Codes Mapping** - Method codes, formula codes, parameter codes → CFR (47 tests)
3. **DAHS-specific explanations** - `explainMethodForDAHS()` and `explainFormulaForDAHS()` functions
4. **Question-aware answers** - RegsBot answers RATA frequency, linearity, missing data questions with specific CFR references
5. **LDAR/Non-CEM Subparts** - VV, VVa, Kb, OOOOa indexed (26 new tests)

### Shared MCP Server Development

1. **Define MCP Tool Schema** - JSON schema for each tool exposed via MCP
2. **Validation Oracle API** - `validate_method_for_parameter()` returns pass/fail with CFR citation
3. **Formula Test Vectors** - Known-good calculation examples for DAHS to verify against
4. **Rate Limiting** - Prevent abuse of shared resource

### DAHS Team Integration Points

1. **Import Shared MCP Client** - Connect to `C:\WebApp\shared\epa-compliance-mcp`
2. **MP Editor Enhancement** - Add "Verify" button that queries NERO for regulatory validation
3. **Formula Audit Trail** - Log which CFR section each formula implementation references
4. **Help Text** - Display NERO regulatory context in tooltip/sidebar

### Validation Use Cases

```typescript
// Example: DAHS asks NERO to validate a method code
const result = await mcp.call('validate_method_for_parameter', {
  methodCode: 'CEM',
  parameter: 'SO2',
  sourceType: 'coal-fired-boiler',
  subpart: 'Da',
})
// Returns: { valid: true, cfr: "40 CFR 75.11", notes: "Requires span of..." }

// Example: DAHS asks NERO to verify formula implementation
const formula = await mcp.call('lookup_formula_code', {
  code: 'F-23',
})
// Returns: { equation: "SO2_rate = ...", variables: [...], cfr: "40 CFR 75 Appendix F" }
```

### Pending NERO Work (Phase 5+)

1. **Subpart OOOO** - Oil & gas 2011-2015 (legacy rule)
2. **Subpart OOOOb** - Oil & gas 2024+ (updated methane rule)
3. **Subparts UUUU/UUUUU** - GHG for additional sources
4. **Part 63 MATS** - Mercury, HCl, PM for coal-fired units

---

## References

- [40 CFR Part 60 - Standards of Performance for New Stationary Sources](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-60)
- [40 CFR Part 75 - Continuous Emission Monitoring](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-75)
- [EPA ECMPS Reporting Instructions](https://www.epa.gov/power-sector/reporting-instructions-ecmps) - Source for EPA method/formula codes
- NERO Regulatory Coverage Matrix: `docs/features/regulatory-coverage-matrix.md`
- Part 60 Knowledge Base: `src/agents/regsbot/part60-knowledge.ts`
- Part 60 TDD Tests: `src/agents/regsbot/part60-knowledge.test.ts`
- **NEW** EPA Codes Mapping: `src/agents/regsbot/epa-codes.ts`
- **NEW** EPA Codes Tests: `src/agents/regsbot/epa-codes.test.ts`
- Shared MCP Server: `C:\WebApp\shared\epa-compliance-mcp`
