# RegsBot

> Supreme Commander of EPA Knowledge

## Overview

RegsBot is the authoritative source of regulatory truth. It builds and maintains the **Evidence Library** and processes **permit documents** to extract regulatory obligations that drive DAHS configuration and development.

## Primary Use Case: Permit Processing

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  BA Uploads  │ →   │  OCR + Text  │ →   │   Scan for   │ →   │   Extract    │
│  Permit PDF  │     │  Extraction  │     │  Regulatory  │     │  Obligations │
└──────────────┘     └──────────────┘     │   Language   │     └──────────────┘
                                          └──────────────┘
                                                 │
                                                 ▼
                      ┌──────────────────────────────────────────┐
                      │          PERMIT OBLIGATIONS              │
                      │  • Monitoring requirements               │
                      │  • Reporting schedules                   │
                      │  • Emission limits & thresholds          │
                      │  • Calculation methods                   │
                      │  • Calibration schedules                 │
                      │  • QA/QC requirements                    │
                      └──────────────────────────────────────────┘
                                                 │
                                                 ▼
                      ┌──────────────────────────────────────────┐
                      │      → RequirementsBot for Gap Analysis  │
                      │        "Can DAHS accomplish this?"       │
                      └──────────────────────────────────────────┘
```

## Capabilities

### 1. Document Ingestion

**Permit PDFs** (Primary)

- PDF upload with multi-page support
- OCR text extraction with confidence scoring
- Page reference preservation
- Low-confidence region highlighting for BA review

**Other Sources**

- eCFR sections by citation (e.g., "40 CFR 60.4")
- EPA guidance documents
- State regulatory references
- DAHS specification documents
- Manual text entry

### 2. Regulatory Language Detection

Scans extracted text for compliance-related patterns:

- **Monitoring Language**: "shall monitor", "continuous monitoring", "CEMS", "parameter tracking"
- **Reporting Language**: "submit reports", "quarterly", "annual compliance", "deviation notification"
- **Limit Language**: "shall not exceed", "emission limit", "threshold", "ppm", "lb/hr"
- **Calculation Language**: "calculate", "average", "rolling", "block average", "heat input"
- **QA Language**: "calibration", "RATA", "CGA", "linearity", "audit"
- **Recordkeeping Language**: "maintain records", "retain for X years", "document"

### 3. Obligation Extraction

For each identified regulatory requirement, extracts:

```typescript
interface PermitObligation {
  id: string
  permitId: string
  pageReference: string // "Page 3, Section 2.1"
  originalText: string // Exact permit language
  obligationType: ObligationType // monitoring, reporting, limit, etc.
  summary: string // Plain-language summary
  regulatoryBasis?: string // "40 CFR 60.4" if cited
  frequency?: string // "hourly", "daily", "quarterly"
  parameters?: string[] // ["SO2", "NOx", "CO"]
  thresholds?: Record<string, string> // { "SO2": "< 50 ppm" }
  confidence: number // Extraction confidence
  confirmedByHuman: boolean
}
```

### 4. Citation Anchoring

Every extracted obligation maintains traceability:

- Source document reference
- Page number and section
- Exact text excerpt
- Link to regulatory basis (eCFR, state rule)

## Outputs

### EvidenceLibrary Artifact

Contains all processed evidence items with citations.

### PermitObligation Set

Structured list of obligations extracted from permits, ready for:

- Gap analysis against DAHS capabilities
- Requirement generation
- Test specification

## Workflow Integration

### Permit-to-Config Pipeline

```
Start → [Upload Permit] → RegsBot → ApprovalGate → RequirementsBot → [Gap Analysis] → ...
```

1. **RegsBot** processes permit, extracts obligations
2. **BA reviews** at Approval Gate (confirms OCR, validates extractions)
3. **RequirementsBot** receives obligations, compares to DAHS profile
4. **Gap Analysis** identifies what DAHS can/cannot do
5. **Development Items** generated for unsupported obligations

## API Integrations

### eCFR API (https://www.ecfr.gov/developers/documentation/api/v1)

RegsBot uses the eCFR API to:

- Look up specific CFR sections (e.g., 40 CFR 75.11)
- Search for regulatory terms across Title 40
- Get full text of Parts and Subparts
- Track effective dates and amendments

**Key Endpoints Used:**

- `/titles` - List all CFR titles
- `/structure/{date}/title-{n}` - Get title structure
- `/full/{date}/title-{n}/part-{p}/section-{s}` - Get section content
- `/search` - Full-text search

### ECMPS/CAMD API (EPA Clean Air Markets Division)

RegsBot uses CAMD APIs to:

- Look up facility information by ORIS code
- Get Part 75 monitoring plans
- Retrieve monitoring methods, systems, and spans
- Check program participation (ARP, CSAPR, MATS)

**Key Data Retrieved:**

- Facility details (name, location, unit types)
- Monitoring plan configurations
- Active monitoring systems and components
- Unit program participation
- Emissions data (quarterly/annual)

## Supported Regulatory Programs

RegsBot has built-in knowledge of:

| Program | CFR Reference           | Description                          |
| ------- | ----------------------- | ------------------------------------ |
| Part 75 | 40 CFR 75               | Continuous Emission Monitoring       |
| ARP     | 40 CFR 72-73            | Acid Rain Program                    |
| CSAPR   | 40 CFR 97               | Cross-State Air Pollution Rule       |
| MATS    | 40 CFR 63 Subpart UUUUU | Mercury and Air Toxics Standards     |
| NSPS    | 40 CFR 60               | New Source Performance Standards     |
| NESHAP  | 40 CFR 63               | National Emission Standards for HAPs |

## OCR Quality Assurance

### Confidence Thresholds

| Confidence  | Status | Action Required    |
| ----------- | ------ | ------------------ |
| ≥ 0.95      | High   | Auto-accepted      |
| 0.80 - 0.94 | Medium | Flagged for review |
| < 0.80      | Low    | Must be confirmed  |

### BA Review Interface

For low-confidence regions:

- Highlight region on original PDF
- Show extracted text
- Allow correction
- Track who confirmed and when

## Acceptance Criteria

- [ ] Can upload permit PDFs (multi-page)
- [ ] OCR extracts text with confidence scores
- [ ] Low-confidence regions flagged for review
- [ ] Detects regulatory/compliance language patterns
- [ ] Extracts structured obligations from text
- [ ] Obligations include page references
- [ ] Obligations link to regulatory basis when cited
- [ ] BA can confirm/correct OCR results
- [ ] Produces EvidenceLibrary artifact
- [ ] Produces PermitObligation set for downstream agents
