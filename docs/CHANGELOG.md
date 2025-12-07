# Changelog

All notable changes to NERO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Part 60 NSPS Phase 5: O&G + GHG Subparts** (61 TDD tests)
  - Subpart OOOO (O&G 2011-2015 vintage) - VOC, SO2 from well completions, storage vessels
  - Subpart OOOOb (O&G 2024+ methane rule) - CH4, VOC with super-emitter response program, 95%+ control
  - Subpart UUUU (GHG for existing combustion turbines) - CO2 emissions at 120 lb/MMBtu limit
  - OGI and Method 21 monitoring for fugitive emissions
  - Cross-references to Part 63 YYYY (turbines) and Part 98 (GHG reporting)
  - `hasPart63Overlap()` function for Part 60→Part 63 cross-reference detection
- **Part 63 NESHAPs Phase 3: Combustion Turbines** (37 TDD tests)
  - Subpart YYYY (Stationary Combustion Turbines) - formaldehyde, organic HAP
  - Formaldehyde limit of 91 ppbvd @ 15% O2 for new and existing turbines
  - Oxidation catalyst monitoring with CPMS for inlet temperature
  - Work practices: fuel specifications, startup/shutdown procedures, catalyst maintenance
  - Cross-references to Part 60 KKKK (new turbines) and GG (older turbines)
  - `hasPart60Overlap()` function for Part 63→Part 60 cross-reference detection
- **Enhanced Calculation Engine** (85 new tests, 270 total)
  - Formula validation with syntax, semantics, units, and regulatory compliance checking
  - Configuration management with full audit trails and change tracking
  - Dependency tracking with upstream/downstream analysis and cycle detection
  - Formula registry with standard ECMPS/Part 75 calculations
  - Impact analysis for proposed configuration changes
  - Complete documentation in `docs/features/calculation-engine.md`
  - Types: `Formula`, `CalculationConfig`, `DependencyGraph`, `AuditTrail`, `ImpactAnalysis`
  - Components:
    - `formula-validator.ts`: Validates formulas and inputs
    - `configuration-service.ts`: CRUD operations with audit trails
    - `dependency-tracker.ts`: Builds and analyzes dependency graphs
    - `formula-registry.ts`: Pre-defined standard formulas
  - Standard formulas:
    - Heat Input (Appendix F)
    - SO2/NOx/CO2 Mass Emissions
    - NOx Emission Rate
    - LME NOx Rate (Quarterly)
    - Appendix D SO2 Mass
- **Regulatory Coverage Matrix Updates**
  - 17 Part 60 subparts now indexed (up from 14)
  - 4 Part 63 subparts now indexed (up from 3)
  - 729 total TDD tests passing

### Previous Additions (Phase 1-4)

- **Part 60 NSPS Knowledge Base** (68 TDD tests)
  - Pre-indexed regulatory knowledge for 5 priority subparts: Da, TTTT, GG, KKKK, J
  - Type definitions: `Part60SubpartKnowledge`, `Part60EmissionStandard`, `Part60MonitoringSpec`, `Part60ReportingReq`
  - Query functions: `findSubpartsByEquipment()`, `findSubpartsByIndustry()`, `findSubpartsByParameter()`
  - Cross-reference system with `hasPartOverlap()` for Part 60↔Part 75 detection
  - Integration with `RegsBotService.queryApplicableSubparts()` for automatic Part 60 detection
- **DAHS Integration Requirements Document** (`docs/features/dahs-part60-integration.md`)
  - Detailed specifications for each indexed subpart
  - Monitoring, calculation, and reporting requirements
  - Implementation priority guidance for DAHS team
- **Regulatory Coverage Matrix** (`docs/features/regulatory-coverage-matrix.md`)
  - Comprehensive roadmap covering Part 60, 63, 75
  - Market segmentation by industry and equipment type
  - 7-phase build priority plan

### Changed

- `RegsBotService.queryApplicableSubparts()` now detects Part 60 subparts alongside Part 75
- TODO.md updated with Part 60 expansion progress tracking

### Technical Notes

- 729 RegsBot tests now passing (Part 60, Part 63, EPA Codes, Calculation Engine)
- TypeScript compiles clean with strict mode
- Part 60 knowledge base supports future eCFR fallback integration

---

## [0.2.0] - Previous Release

### Added

- Initial project scaffolding with React 19 + TypeScript
- Vite build configuration with path aliases
- Left-hand navigation sidebar with agent links
- Dashboard with agent cards module layout
- Placeholder pages for all four agents (RegsBot, RequirementsBot, FigmaBot, TestingBot)
- TDD infrastructure:
  - Vitest for unit testing with React Testing Library
  - Playwright for E2E testing
  - Strict ESLint configuration
  - Strict TypeScript configuration
- CSS Modules styling system
- Core documentation structure (VISION, CHANGELOG, TODO)

### Technical Decisions

- Chose Vitest over Jest for better Vite integration
- Chose Playwright over Cypress for better cross-browser support
- Strict TypeScript with all null checks enabled
- ESLint strict type-checked configuration
- CSS Modules over Tailwind for explicit styling

## [0.1.0] - 2024-12-03

### Added

- Project initialization
- Basic project structure
