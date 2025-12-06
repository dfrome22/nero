# NERO Regulatory Coverage Matrix

> **Last Updated:** December 2025  
> **Purpose:** Strategic roadmap for EPA regulatory coverage across Part 60, Part 63, and Part 75

---

## Executive Summary

NERO currently has **full Part 75 capability** through ECMPS/CAMD integration, **17 Part 60 subparts indexed**, and **4 Part 63 subparts indexed** (MATS, IB MACT, RICE, Combustion Turbines) with 707 TDD tests. This document maps out the complete regulatory landscape and prioritizes expansion to serve additional markets (refineries, chemical plants, oil & gas, industrial facilities).

---

## Current NERO Capabilities

| Regulation         | Status     | Integration    | Notes                                                                |
| ------------------ | ---------- | -------------- | -------------------------------------------------------------------- |
| **40 CFR Part 75** | ✅ READY   | ECMPS/CAMD API | Full MP config, QA/QC, emissions calcs, EDR                          |
| **40 CFR Part 60** | ✅ 17 DONE | Knowledge Base | Da,Db,Dc,GG,KKKK,TTTT,J,Ja,IIII,JJJJ,VV,VVa,Kb,OOOOa,OOOO,OOOOb,UUUU |
| **40 CFR Part 63** | ✅ 4 DONE  | Knowledge Base | UUUUU (MATS), DDDDD (IB MACT), ZZZZ (RICE), YYYY (Turbines)          |

---

## Part 75 - Continuous Emission Monitoring (Complete)

### Acid Rain Program & Cross-State Air Pollution Rule

| Component          | Description             | Equipment Types     | Parameters              | NERO Status |
| ------------------ | ----------------------- | ------------------- | ----------------------- | ----------- |
| **Subpart A**      | Applicability           | Utility Units >25MW | -                       | ✅ Ready    |
| **Subpart B**      | Monitoring Requirements | Boilers, Turbines   | SO2, NOX, CO2, Flow, O2 | ✅ Ready    |
| **Subpart C**      | Missing Data Procedures | All CEM units       | All                     | ✅ Ready    |
| **Subpart D**      | SO2 Mass Emissions      | Coal/Oil units      | SO2                     | ✅ Ready    |
| **Subpart E**      | NOX Mass Emissions      | All combustion      | NOX                     | ✅ Ready    |
| **Subpart F**      | Recordkeeping           | All                 | All                     | ✅ Ready    |
| **Subpart G**      | QA/QC Requirements      | All CEM units       | All                     | ✅ Ready    |
| **Subpart H**      | Heat Input & CO2        | All combustion      | HI, CO2                 | ✅ Ready    |
| **Appendices A-F** | Specifications          | All                 | All                     | ✅ Ready    |

---

## Part 60 - New Source Performance Standards (NSPS)

### Combustion Sources - Boilers & Steam Generators

| Subpart | Equipment                           | Size Threshold  | Construction Date | Parameters                                 | Primary Industries      | NERO Status |
| ------- | ----------------------------------- | --------------- | ----------------- | ------------------------------------------ | ----------------------- | ----------- |
| **D**   | Fossil-Fuel Steam Generators        | >250 MMBtu/hr   | Pre-1971          | PM, SO2, NOX                               | Utilities, Industrial   | 🔴 Future   |
| **Da**  | Electric Utility Steam Generators   | >250 MMBtu/hr   | After 9/18/78     | PM, SO2, NOX                               | Electric Utilities      | ✅ Done     |
| **Db**  | Industrial Steam Generators         | >100 MMBtu/hr   | After 6/19/84     | PM, SO2, NOX                               | Refining, Chemical, Mfg | ✅ Done     |
| **Dc**  | Small Industrial Steam Generators   | 10-100 MMBtu/hr | After 6/9/89      | PM, SO2                                    | All Industrial          | ✅ Done     |
| **Cb**  | Large Municipal Waste Combustors    | >250 tpd        | After 12/20/89    | PM, SO2, HCl, NOX, CO, Hg, Cd, Pb, Dioxins | Waste-to-Energy         | 🔴 Future   |
| **Eb**  | Hospital/Medical Waste Incinerators | All             | After 6/20/96     | PM, CO, Dioxins, HCl, SO2, NOX, Pb, Cd, Hg | Healthcare, Waste       | 🔴 Future   |

### Turbines & Engines

| Subpart  | Equipment                                | Size Threshold | Construction Date | Parameters        | Primary Industries | NERO Status |
| -------- | ---------------------------------------- | -------------- | ----------------- | ----------------- | ------------------ | ----------- |
| **GG**   | Stationary Gas Turbines                  | >10 MMBtu/hr   | After 10/3/77     | SO2, NOX          | Power, Industrial  | ✅ Done     |
| **KKKK** | Stationary Combustion Turbines           | >10 MMBtu/hr   | After 2/18/05     | NOX, SO2          | Power, Industrial  | ✅ Done     |
| **IIII** | Stationary CI ICE (Compression Ignition) | Various        | After 7/11/05     | NOX, PM, CO, NMHC | O&G, Industrial    | ✅ Done     |
| **JJJJ** | Stationary SI ICE (Spark Ignition)       | Various        | After 6/12/06     | NOX, CO, VOC      | O&G, Industrial    | ✅ Done     |

### Petroleum Refining

| Subpart  | Equipment                                               | Parameters            | Primary Industries | NERO Status |
| -------- | ------------------------------------------------------- | --------------------- | ------------------ | ----------- |
| **J**    | Petroleum Refineries (Original) - FCCU, Claus, Fuel Gas | PM, CO, SO2, H2S      | Refining           | ✅ Done     |
| **Ja**   | Petroleum Refineries (Updated)                          | PM, CO, SO2, H2S, NOX | Refining           | ✅ Done     |
| **GGG**  | Petroleum Refinery Equipment Leaks                      | VOC (Fugitives)       | Refining           | 🔴 Future   |
| **GGGa** | Petroleum Refinery Equipment Leaks                      | VOC (Fugitives)       | Refining           | 🔴 Future   |
| **QQQ**  | Petroleum Refinery Wastewater                           | VOC                   | Refining           | 🔴 Future   |

### Oil & Gas Production

| Subpart   | Equipment                            | Parameters    | Primary Industries | NERO Status |
| --------- | ------------------------------------ | ------------- | ------------------ | ----------- |
| **K**     | Storage Vessels (Petroleum)          | VOC           | O&G, Refining      | 🔴 Future   |
| **Ka**    | Storage Vessels (Petroleum Liquids)  | VOC           | O&G, Refining      | 🔴 Future   |
| **Kb**    | VOC Storage Vessels                  | VOC           | All                | ✅ Done     |
| **KKK**   | Onshore Natural Gas Processing - SO2 | SO2           | O&G Midstream      | 🔴 Future   |
| **LLL**   | Onshore Natural Gas Processing - SO2 | SO2           | O&G Midstream      | 🔴 Future   |
| **OOOO**  | Crude Oil & Natural Gas (2011-2015)  | VOC, SO2      | O&G Upstream       | ✅ Done     |
| **OOOOa** | Crude Oil & Natural Gas Production   | VOC, SO2, CH4 | O&G Upstream       | ✅ Done     |
| **OOOOb** | Oil & Natural Gas (2024+ Methane)    | CH4, VOC      | O&G Upstream       | ✅ Done     |

### Chemical Manufacturing (SOCMI)

| Subpart | Equipment               | Parameters      | Primary Industries | NERO Status |
| ------- | ----------------------- | --------------- | ------------------ | ----------- |
| **VV**  | SOCMI Equipment Leaks   | VOC (Fugitives) | Chemical           | ✅ Done     |
| **VVa** | SOCMI Equipment Leaks   | VOC (Fugitives) | Chemical           | ✅ Done     |
| **NNN** | SOCMI Distillation      | VOC             | Chemical           | 🔴 Future   |
| **RRR** | SOCMI Reactor Processes | VOC             | Chemical           | 🔴 Future   |
| **III** | SOCMI Air Oxidation     | VOC             | Chemical           | 🔴 Future   |
| **DDD** | Polymer Manufacturing   | VOC             | Chemical           | 🔴 Future   |

### Minerals & Metals

| Subpart | Equipment                      | Parameters  | Primary Industries | NERO Status |
| ------- | ------------------------------ | ----------- | ------------------ | ----------- |
| **F**   | Portland Cement Plants         | PM, Opacity | Cement             | 🔴 Future   |
| **Y**   | Coal Prep Plants               | PM          | Mining, Power      | 🔴 Future   |
| **Z**   | Ferroalloy Production          | PM, CO      | Metals             | 🔴 Future   |
| **AA**  | Steel Plants (EAF)             | PM          | Metals             | 🔴 Future   |
| **AAa** | Steel Plants (EAF)             | PM          | Metals             | 🔴 Future   |
| **LL**  | Metallic Mineral Processing    | PM          | Mining             | 🔴 Future   |
| **OO**  | Nonmetallic Mineral Processing | PM          | Mining             | 🔴 Future   |

### Greenhouse Gas Subparts (Newer 4-Letter)

| Subpart  | Equipment                          | Parameters   | Primary Industries | NERO Status |
| -------- | ---------------------------------- | ------------ | ------------------ | ----------- |
| **TTTT** | GHG - Fossil Fuel Steam Generators | CO2, GHG     | Utilities          | ✅ Done     |
| **UUUU** | GHG - Combustion Turbines          | CO2, GHG     | Power Gen          | ✅ Done     |
| **QQQQ** | New Residential Wood Heaters       | PM           | Residential/Mfg    | 🔴 Future   |
| **MMMM** | Cement Kilns                       | PM, NOX, SO2 | Cement             | 🔴 Future   |

---

## Part 63 - NESHAPs & MATS (Hazardous Air Pollutants)

| Subpart    | Name                               | Equipment             | Parameters                            | Primary Industries | NERO Status        |
| ---------- | ---------------------------------- | --------------------- | ------------------------------------- | ------------------ | ------------------ |
| **UUUUU**  | MATS - Mercury & Air Toxics        | Coal/Oil-Fired EGU    | Hg, HCl, HF, PM (Filt), Non-Hg Metals | Electric Utilities | ✅ Done (67 tests) |
| **DDDDD**  | Industrial Boilers (Major Sources) | Industrial Boilers    | PM, HCl, Hg, CO, Dioxins              | Industrial         | ✅ Done            |
| **ZZZZ**   | Stationary RICE                    | Reciprocating Engines | CO, Formaldehyde, NMHC                | All                | ✅ Done (53 tests) |
| **YYYY**   | Stationary Combustion Turbines     | Gas Turbines          | Formaldehyde, HAP                     | Power, Industrial  | ✅ Done (37 tests) |
| **JJJJJJ** | Industrial Boilers (Area Sources)  | Industrial Boilers    | PM, Hg, CO                            | Industrial         | 🔴 Future          |
| **ZZZZZ**  | Iron & Steel (EAF)                 | Electric Arc Furnaces | PM, HAP                               | Metals             | 🔴 Future          |

---

## Regulatory Overlap Matrix

Shows which regulations apply simultaneously to common facility types:

| Facility Type                  | Part 75              | Part 60 Subparts | Part 63 Subparts | Notes                             |
| ------------------------------ | -------------------- | ---------------- | ---------------- | --------------------------------- |
| **Coal-Fired Power Plant**     | ✅ Full              | Da, TTTT         | UUUUU (MATS)     | Heavy overlap - same CEMS for all |
| **Natural Gas Combined Cycle** | ✅ Full              | KKKK, GG, UUUU   | YYYY             | NOX/CO2 monitoring shared         |
| **Simple Cycle Peakers**       | ⚠️ If >25MW          | KKKK, GG         | YYYY             | May be Part 75 exempt             |
| **Industrial Cogeneration**    | ⚠️ If grid-connected | Db, KKKK         | DDDDD            | Part 75 if selling power          |
| **Refinery Boiler**            | ❌                   | Db, J/Ja         | DDDDD            | Not Part 75, but needs CEMS       |
| **Refinery FCCU**              | ❌                   | J, Ja            | Various          | CO, SO2 CEMS required             |
| **Refinery Claus Unit**        | ❌                   | J, Ja            | Various          | SO2/H2S monitoring                |
| **Chemical Plant Boiler**      | ❌                   | Db, Dc           | DDDDD            | Part 60 + MACT                    |
| **O&G Compressor Engines**     | ❌                   | IIII, JJJJ       | ZZZZ             | Engine-specific rules             |
| **O&G Gas Processing**         | ❌                   | KKK, LLL, OOOOa  | Various          | Methane & VOC focus               |
| **O&G Wellhead/Production**    | ❌                   | OOOOa, OOOOb     | Various          | Methane rule                      |

---

## Market Segmentation View

### By Industry

| Industry                   | Key Equipment                          | Applicable Subparts                      | Market Size | NERO Priority     |
| -------------------------- | -------------------------------------- | ---------------------------------------- | ----------- | ----------------- |
| **Electric Utilities**     | Boilers, Turbines                      | Part 75, Da, KKKK, GG, TTTT, UUUU, UUUUU | Large       | ✅ Done           |
| **Petroleum Refining**     | FCCU, Claus, Boilers, Tanks            | J, Ja, Db, GG, KKKK, Kb                  | Large       | ✅ Done           |
| **Chemical Manufacturing** | Reactors, Distillation, Boilers, Leaks | VV, VVa, NNN, RRR, Db, Dc, DDDDD         | Large       | ✅ VV/VVa Done    |
| **Oil & Gas (Upstream)**   | Engines, Tanks, Flares                 | OOOOa, OOOOb, IIII, JJJJ, Kb, ZZZZ       | Large       | ✅ OOOOa Done     |
| **Oil & Gas (Midstream)**  | Compressors, Processing                | KKK, LLL, IIII, JJJJ                     | Medium      | ✅ IIII/JJJJ Done |
| **Pulp & Paper**           | Recovery Boilers, Lime Kilns           | Db, BB, CC                               | Medium      | 🔴 Future         |
| **Cement**                 | Kilns                                  | F, MMMM                                  | Medium      | 🔴 Future         |
| **Iron & Steel**           | EAF, BOF                               | AA, AAa, ZZZZZ                           | Medium      | 🔴 Future         |

### By Equipment Type

| Equipment Type                      | Applicable Subparts | Industries Using        | CEMS Required             | NERO Priority |
| ----------------------------------- | ------------------- | ----------------------- | ------------------------- | ------------- |
| **Utility Boilers (>250 MMBtu)**    | Da, TTTT, Part 75   | Utilities               | Yes - SO2, NOX, CO2, Flow | ✅ Done       |
| **Industrial Boilers (>100 MMBtu)** | Db                  | Refining, Chemical, Mfg | Often - SO2, NOX          | ✅ Done       |
| **Small Boilers (10-100 MMBtu)**    | Dc                  | All Industrial          | Sometimes                 | ✅ Done       |
| **Gas Turbines (>10 MMBtu)**        | GG, KKKK, UUUU      | Power, Industrial       | Yes - NOX, (CO2)          | ✅ Done       |
| **CI Engines (Diesel)**             | IIII, ZZZZ          | O&G, Industrial         | Sometimes                 | ✅ Done       |
| **SI Engines (Gas/LPG)**            | JJJJ, ZZZZ          | O&G, Industrial         | Sometimes                 | ✅ Done       |
| **FCCU (Fluid Cat Cracker)**        | J, Ja               | Refining                | Yes - PM, CO, SO2         | ✅ Done       |
| **Claus Sulfur Recovery**           | J, Ja               | Refining                | Yes - SO2, H2S            | ✅ Done       |
| **Storage Tanks**                   | K, Ka, Kb           | O&G, Refining, Chemical | Rarely                    | 🔴 Future     |
| **Equipment Leaks (Fugitives)**     | VV, VVa, GGG        | Chemical, Refining      | No - LDAR                 | 🔴 Future     |

---

## Priority Build Order

| Priority | Subparts           | Target Market        | Why Prioritize                       | Estimated Effort | Dependencies               |
| -------- | ------------------ | -------------------- | ------------------------------------ | ---------------- | -------------------------- |
| **1**    | Da + TTTT + UUUUU  | Electric Utilities   | Extends existing Part 75 customers   | Medium           | Part 75 foundation         |
| **2**    | KKKK + GG + UUUU   | Gas Turbines         | Same customer base, common equipment | Medium           | Priority 1 patterns        |
| **3**    | Db + Dc            | Industrial Boilers   | Large market, CEMS-based             | Medium           | Boiler patterns from Da    |
| **4**    | J + Ja             | Petroleum Refineries | High-value, complex monitoring       | High             | CEMS patterns established  |
| **5**    | IIII + JJJJ + ZZZZ | Engines (O&G)        | Growing market, methane rules        | Medium           | New equipment type         |
| **6**    | OOOOa + OOOOb      | O&G Upstream         | Methane regulation expanding         | High             | Engine patterns            |
| **7**    | Kb + VV/VVa        | Storage & Leaks      | Lower CEMS needs                     | Low              | Different monitoring model |

---

## Knowledge Base Structure (Per Subpart)

Each indexed subpart should contain:

```typescript
interface SubpartKnowledge {
  subpart: string // "Da", "KKKK", etc.
  title: string // Full regulatory title
  applicability: {
    equipmentTypes: string[] // What equipment is covered
    sizeThresholds: string[] // Capacity limits
    constructionDates: string[] // Affected/Modified/Reconstructed dates
    exemptions: string[] // What's NOT covered
  }
  standards: {
    parameter: string // "SO2", "NOX", "PM", etc.
    limit: string // "1.2 lb/MMBtu", "0.15 lb/MMBtu"
    averagingPeriod: string // "30-day rolling", "1-hour", "annual"
    conditions: string[] // When limit applies
  }[]
  monitoring: {
    parameter: string
    method: string // "CEMS", "fuel sampling", "stack test"
    frequency: string // "continuous", "quarterly", "annual"
    specifications: string[] // Span, calibration, QA requirements
  }[]
  testMethods: {
    parameter: string
    methods: string[] // "Method 5", "Method 6C", etc.
    frequency: string
  }[]
  reporting: {
    reportType: string // "quarterly", "semiannual", "annual"
    contents: string[] // What must be reported
    submitTo: string // EPA, State, both
  }[]
  recordkeeping: {
    record: string
    retentionPeriod: string // "5 years", "2 years", etc.
  }[]
  crossReferences: {
    part75: string[] // Related Part 75 sections
    part63: string[] // Related MATS/NESHAP
    methods: string[] // Appendix A methods
  }
}
```

---

## Legend

| Symbol | Meaning                                             |
| ------ | --------------------------------------------------- |
| ✅     | **READY NOW** - Full functionality in NERO          |
| 🔶     | **TO BUILD** - Priority for near-term development   |
| 🔴     | **FUTURE** - Lower priority, specialized markets    |
| ⚠️     | **CONDITIONAL** - Depends on facility configuration |

---

## Next Steps

1. **Priority 1**: Build knowledge base for Da/TTTT/UUUUU (utility expansion)
2. **Priority 2**: Add KKKK/GG/UUUU (gas turbines)
3. **Wire eCFR fallback**: For unknown questions, query eCFR API dynamically
4. **MCP Integration**: Add subpart rules to shared MCP server
5. **UI Updates**: Allow users to select applicable subparts for their facility

---

## References

- [40 CFR Part 60 - NSPS](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-60)
- [40 CFR Part 63 - NESHAPs](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-63)
- [40 CFR Part 75 - CEMS](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-75)
- [EPA ECMPS/CAMD](https://ecmps.epa.gov)
