/**
 * EPA Monitoring Method Codes and Formula Codes to CFR Mapping
 *
 * Based on EPA ECMPS Reporting Instructions:
 * https://www.epa.gov/power-sector/reporting-instructions-ecmps
 *
 * These codes are used in monitoring plans (monitoringMethodCode, formulaCode)
 * and directly reference 40 CFR Part 75 sections.
 */

// =============================================================================
// MONITORING METHOD CODES
// =============================================================================

export interface MonitoringMethodCode {
  code: string
  description: string
  cfr: string
  cfrSection: string
  parameters: string[]
  dahsRequirements: string
}

/**
 * Monitoring Method Codes per 40 CFR Part 75
 * These appear in monitoringMethodData.monitoringMethodCode
 */
export const MONITORING_METHOD_CODES: Record<string, MonitoringMethodCode> = {
  // CEMS-based methods
  CEM: {
    code: 'CEM',
    description: 'Continuous Emission Monitoring System',
    cfr: '40 CFR 75.10-75.18',
    cfrSection: '§75.10-75.18',
    parameters: ['SO2', 'NOX', 'CO2', 'NOXR', 'O2', 'FLOW'],
    dahsRequirements:
      'DAHS must record hourly concentrations, apply calibration factors, perform QA/QC per Appendix B, calculate mass emissions per Appendix F.',
  },

  // Appendix D - Fuel-based methods
  AD: {
    code: 'AD',
    description: 'Appendix D (Fuel Sampling and Analysis)',
    cfr: '40 CFR 75 Appendix D',
    cfrSection: 'Appendix D',
    parameters: ['SO2', 'CO2', 'HI'],
    dahsRequirements:
      'DAHS must record fuel flow rates (scfh or lb/hr), GCV values, fuel sulfur content. Calculate emissions using Appendix D equations D-2 through D-12.',
  },

  // Appendix E - CEMS alternative
  AE: {
    code: 'AE',
    description: 'Appendix E (Gas-Fired Units NOx Emission Rate)',
    cfr: '40 CFR 75 Appendix E',
    cfrSection: 'Appendix E',
    parameters: ['NOXR'],
    dahsRequirements:
      'DAHS must use correlation curves from Appendix E tests. Interpolate NOx rate based on heat input or load. Requires periodic retesting.',
  },

  // Appendix G - CO2 for gas-fired
  AG: {
    code: 'AG',
    description: 'Appendix G (CO2 from Gas-Fired Units)',
    cfr: '40 CFR 75 Appendix G',
    cfrSection: 'Appendix G',
    parameters: ['CO2'],
    dahsRequirements:
      'DAHS must calculate CO2 using fuel carbon content and fuel flow. Apply Appendix G equations G-1 through G-4.',
  },

  // Calculation methods
  CALC: {
    code: 'CALC',
    description: 'Calculation (derived from other parameters)',
    cfr: '40 CFR 75 Subpart GGGGG, 40 CFR 97',
    cfrSection: '§97 / Subpart GGGGG',
    parameters: ['NOX', 'CO2'],
    dahsRequirements:
      'DAHS must calculate NOx mass from rate × heat input. For common stacks, apportion based on unit heat input.',
  },

  // Low Mass Emissions
  LME: {
    code: 'LME',
    description: 'Low Mass Emissions (Appendix G)',
    cfr: '40 CFR 75.19, Appendix G',
    cfrSection: '§75.19',
    parameters: ['SO2', 'NOX', 'CO2', 'HI'],
    dahsRequirements:
      'DAHS must use fuel-based calculations per §75.19. Simpler monitoring but limited to qualifying low-emitting units (<25 tons/year).',
  },

  // NOx Rate methods
  NOXR: {
    code: 'NOXR',
    description: 'NOx Emission Rate (from NOx-diluent system)',
    cfr: '40 CFR 75.12',
    cfrSection: '§75.12',
    parameters: ['NOX'],
    dahsRequirements:
      'DAHS must calculate NOx mass from NOXR × HI. Formula: NOx (lb) = NOXR (lb/mmBtu) × HI (mmBtu).',
  },

  // Fuel-specific methods
  FSA: {
    code: 'FSA',
    description: 'Fuel Sampling and Analysis',
    cfr: '40 CFR 75 Appendix D',
    cfrSection: 'Appendix D',
    parameters: ['SO2', 'HI'],
    dahsRequirements:
      'DAHS must store fuel sample results (sulfur %, GCV), apply to fuel flow for emission calculations.',
  },

  // Operating parameters
  EXP: {
    code: 'EXP',
    description: 'Expected Value (Operating Time)',
    cfr: '40 CFR 75.57',
    cfrSection: '§75.57',
    parameters: ['OP'],
    dahsRequirements: 'DAHS must record operating time fraction (0.00-1.00) for each hour.',
  },

  // Unit-level methods for common stacks
  CEMF23: {
    code: 'CEMF23',
    description: 'CEMS with F-23 for Low Sulfur Fuel',
    cfr: '40 CFR 75.11(e)(1)',
    cfrSection: '§75.11(e)(1)',
    parameters: ['SO2'],
    dahsRequirements:
      'DAHS must apply F-23 calculation for low sulfur fuel hours. Use default SO2 emission rate when very low sulfur fuel is burned.',
  },

  // Mass balance methods
  MB: {
    code: 'MB',
    description: 'Mass Balance (for HCl/HF)',
    cfr: '40 CFR 63.10010',
    cfrSection: 'Part 63 Subpart UUUUU',
    parameters: ['HCL', 'HF'],
    dahsRequirements:
      'DAHS must calculate HCl/HF from fuel chlorine/fluorine content × fuel usage.',
  },

  // Predictive Emission Monitoring
  PEMS: {
    code: 'PEMS',
    description: 'Predictive Emission Monitoring System',
    cfr: '40 CFR 75.48',
    cfrSection: '§75.48',
    parameters: ['NOX', 'SO2'],
    dahsRequirements:
      'DAHS must use certified PEMS correlations. Requires periodic RATA and cylinder gas audits.',
  },
}

// =============================================================================
// FORMULA CODES
// =============================================================================

export interface FormulaCode {
  code: string
  description: string
  appendix: string
  cfr: string
  equation: string
  parameters: string[]
  dahsCalculation: string
}

/**
 * Formula Codes per 40 CFR Part 75 Appendices
 * These appear in monitoringFormulaData.formulaCode
 */
export const FORMULA_CODES: Record<string, FormulaCode> = {
  // Appendix D - SO2 Formulas
  'D-1': {
    code: 'D-1',
    description: 'SO2 Mass from Oil (Daily Sampling)',
    appendix: 'Appendix D',
    cfr: '40 CFR 75 Appendix D §2.1',
    equation: 'SO2 = Sulfur% × Fuel × 2 × 10⁻⁴',
    parameters: ['SO2'],
    dahsCalculation:
      'SO2_LB = (Sulfur_PCT / 100) × Fuel_LB × 2.0. Daily fuel sampling required for oil-fired units.',
  },
  'D-2': {
    code: 'D-2',
    description: 'SO2 Mass from Gas',
    appendix: 'Appendix D',
    cfr: '40 CFR 75 Appendix D §2.1',
    equation: 'SO2 = Sulfur_gr/100scf × Fuel_scf × (64/32) × 10⁻⁷',
    parameters: ['SO2'],
    dahsCalculation:
      'SO2_LB = Sulfur_GR100SCF × Fuel_SCF × 0.000002 × (64/32). For pipeline natural gas, default is 0.0006 lb/mmBtu.',
  },
  'D-5': {
    code: 'D-5',
    description: 'SO2 Mass from Gas (Default Emission Rate)',
    appendix: 'Appendix D',
    cfr: '40 CFR 75 Appendix D §2.3.1',
    equation: 'SO2 = HI × Default_Rate',
    parameters: ['SO2'],
    dahsCalculation:
      'SO2_LB = HI_MMBTU × 0.0006 (for pipeline natural gas). DAHS applies default rate when fuel qualifies.',
  },

  // Appendix F - NOx and Heat Input Formulas
  'F-1': {
    code: 'F-1',
    description: 'NOx Emission Rate (O2 diluent, dry basis)',
    appendix: 'Appendix F',
    cfr: '40 CFR 75 Appendix F §3',
    equation: 'NOXR = 1.194×10⁻⁷ × NOx_ppm × Fd × (20.9/(20.9-O2))',
    parameters: ['NOXR'],
    dahsCalculation:
      'NOXR_LBMMBTU = 1.194E-7 × NOx_PPM × Fd × (20.9 / (20.9 - O2_PCT)). Fd = 8710 for natural gas.',
  },
  'F-2': {
    code: 'F-2',
    description: 'NOx Emission Rate (CO2 diluent, dry basis)',
    appendix: 'Appendix F',
    cfr: '40 CFR 75 Appendix F §3',
    equation: 'NOXR = 1.194×10⁻⁷ × NOx_ppm × Fc × (100/CO2)',
    parameters: ['NOXR'],
    dahsCalculation:
      'NOXR_LBMMBTU = 1.194E-7 × NOx_PPM × Fc × (100 / CO2_PCT). Fc = 1040 for natural gas.',
  },
  'F-5': {
    code: 'F-5',
    description: 'Stack Gas Volumetric Flow Rate (Dry)',
    appendix: 'Appendix F',
    cfr: '40 CFR 75 Appendix F §4',
    equation: 'FLOW = Measured_Flow × (P_bar/P_std) × (T_std/T_stack)',
    parameters: ['FLOW'],
    dahsCalculation:
      'FLOW_SCFH = Measured × Pressure_Correction × Temperature_Correction. Apply WAF if rectangular duct.',
  },
  'F-20': {
    code: 'F-20',
    description: 'Heat Input from Gas (GCV Method)',
    appendix: 'Appendix F',
    cfr: '40 CFR 75 Appendix F §5.5',
    equation: 'HI = Fuel_Flow × GCV × 10⁻⁶',
    parameters: ['HI'],
    dahsCalculation:
      'HI_MMBTU = Fuel_SCF × GCV_BTUSCF × 1E-6. DAHS must track GCV by fuel lot or use pipeline default.',
  },
  'F-21': {
    code: 'F-21',
    description: 'Heat Input from Oil',
    appendix: 'Appendix F',
    cfr: '40 CFR 75 Appendix F §5.5',
    equation: 'HI = Fuel_Flow × GCV × 10⁻⁶',
    parameters: ['HI'],
    dahsCalculation:
      'HI_MMBTU = Fuel_LB × GCV_BTULB × 1E-6. Oil GCV typically from fuel sampling or default values.',
  },
  'F-23': {
    code: 'F-23',
    description: 'SO2 for Low Sulfur Fuel (Default Rate)',
    appendix: 'Appendix F',
    cfr: '40 CFR 75.11(e)(1)',
    equation: 'SO2 = HI × Default_SO2_Rate',
    parameters: ['SO2'],
    dahsCalculation:
      'SO2_LB = HI_MMBTU × Default_Rate. Used for very low sulfur fuel. DAHS must flag hours using F-23.',
  },
  'F-24A': {
    code: 'F-24A',
    description: 'NOx Mass from Rate × Heat Input',
    appendix: 'Appendix F',
    cfr: '40 CFR 75 Appendix F §6',
    equation: 'NOx_LB = NOXR × HI',
    parameters: ['NOX'],
    dahsCalculation:
      'NOX_LB = NOXR_LBMMBTU × HI_MMBTU. Standard NOx mass calculation from rate and heat input.',
  },

  // Appendix G - CO2 Formulas
  'G-1': {
    code: 'G-1',
    description: 'CO2 Mass from CEMS',
    appendix: 'Appendix G',
    cfr: '40 CFR 75 Appendix G §1',
    equation: 'CO2 = CO2% × Flow × MWco2 × K',
    parameters: ['CO2'],
    dahsCalculation: 'CO2_TON = CO2_PCT × FLOW_SCFH × 44 / 385.3 / 2000. Direct CEMS measurement.',
  },
  'G-4': {
    code: 'G-4',
    description: 'CO2 Mass from Fuel (Carbon Factor)',
    appendix: 'Appendix G',
    cfr: '40 CFR 75 Appendix G §4',
    equation: 'CO2 = Fc × HI × MWco2 × K',
    parameters: ['CO2'],
    dahsCalculation:
      'CO2_TON = 1040 × HI_MMBTU × (1/385.3) × 44 / 2000. Fc = 1040 scf CO2/mmBtu for natural gas.',
  },

  // NOx emission rate formulas
  '19-1': {
    code: '19-1',
    description: 'NOx Rate (F-factor with O2 diluent)',
    appendix: 'Appendix F',
    cfr: '40 CFR 75 Appendix F §3.1',
    equation: 'NOXR = K × NOx × Fd × (20.9/(20.9-O2))',
    parameters: ['NOXR'],
    dahsCalculation:
      'Same as F-1. K = 1.194×10⁻⁷. Apply diluent cap per §75.14(c) if O2 < 5.0% or CO2 > 14%.',
  },
  '19-2': {
    code: '19-2',
    description: 'NOx Rate (F-factor with CO2 diluent)',
    appendix: 'Appendix F',
    cfr: '40 CFR 75 Appendix F §3.2',
    equation: 'NOXR = K × NOx × Fc × (100/CO2)',
    parameters: ['NOXR'],
    dahsCalculation: 'Same as F-2. K = 1.194×10⁻⁷ lb/dscf × scf/mmBtu × (lb-mole/dscf).',
  },
  '19-3': {
    code: '19-3',
    description: 'NOx Rate from Mass/Heat Input',
    appendix: 'Appendix F',
    cfr: '40 CFR 75 Appendix F §3.3',
    equation: 'NOXR = NOx_mass / HI',
    parameters: ['NOXR'],
    dahsCalculation:
      'NOXR_LBMMBTU = NOX_LB / HI_MMBTU. Used when NOx mass is measured directly (e.g., from flow × concentration).',
  },

  // Fuel-specific formulas
  'N-GAS': {
    code: 'N-GAS',
    description: 'Total Gas Fuel Flow',
    appendix: 'Appendix D',
    cfr: '40 CFR 75 Appendix D §2.1.1',
    equation: 'Total_Gas = Sum of fuel flowmeters',
    parameters: ['FGAS'],
    dahsCalculation:
      'FGAS_SCF = Sum of all gas fuel flowmeters for the unit. DAHS must reconcile multiple fuel sources.',
  },
}

// =============================================================================
// PARAMETER CODES
// =============================================================================

export interface ParameterCode {
  code: string
  description: string
  units: string
  cfr: string
  dahsRequirements: string
}

/**
 * Parameter Codes used in monitoring plans
 */
export const PARAMETER_CODES: Record<string, ParameterCode> = {
  SO2: {
    code: 'SO2',
    description: 'Sulfur Dioxide',
    units: 'lb or tons',
    cfr: '40 CFR 75.11',
    dahsRequirements:
      'DAHS must record hourly SO2 (lb), calculate daily/quarterly totals (tons). Track substitute data hours.',
  },
  NOX: {
    code: 'NOX',
    description: 'Nitrogen Oxides (Mass)',
    units: 'lb or tons',
    cfr: '40 CFR 75.12',
    dahsRequirements:
      'DAHS must calculate NOx mass = NOXR × HI. Report hourly (lb), quarterly (tons). Track by unit for common stacks.',
  },
  NOXR: {
    code: 'NOXR',
    description: 'NOx Emission Rate',
    units: 'lb/mmBtu',
    cfr: '40 CFR 75.12',
    dahsRequirements:
      'DAHS must calculate from NOx concentration, diluent, and F-factor. Apply Appendix F equations. Report to 3 decimal places.',
  },
  CO2: {
    code: 'CO2',
    description: 'Carbon Dioxide',
    units: 'tons',
    cfr: '40 CFR 75.13',
    dahsRequirements:
      'DAHS must calculate CO2 per Appendix G. For gas-fired, use carbon factor method. Report hourly and quarterly.',
  },
  HI: {
    code: 'HI',
    description: 'Heat Input',
    units: 'mmBtu',
    cfr: '40 CFR 75 Appendix F',
    dahsRequirements:
      'DAHS must calculate from fuel flow × GCV or from CEMS × F-factors. Critical for emission rate calculations.',
  },
  FLOW: {
    code: 'FLOW',
    description: 'Stack Gas Volumetric Flow Rate',
    units: 'scfh',
    cfr: '40 CFR 75.10(a)(2)',
    dahsRequirements:
      'DAHS must record hourly flow. Apply temperature/pressure corrections. Use for mass emission calculations.',
  },
  O2: {
    code: 'O2',
    description: 'Oxygen (Diluent)',
    units: '%',
    cfr: '40 CFR 75.10(a)(3)',
    dahsRequirements:
      'DAHS must record hourly O2%. Used as diluent for F-factor calculations. Apply diluent cap per §75.14(c).',
  },
  OP: {
    code: 'OP',
    description: 'Operating Time',
    units: 'fraction (0.00-1.00)',
    cfr: '40 CFR 75.57',
    dahsRequirements:
      'DAHS must record fraction of hour unit operated. Used for prorating emissions and heat input.',
  },
  FGAS: {
    code: 'FGAS',
    description: 'Fuel Gas Flow',
    units: 'scf or hscf',
    cfr: '40 CFR 75 Appendix D',
    dahsRequirements:
      'DAHS must total fuel gas from all flowmeters. Apply to heat input and emission calculations.',
  },
  FOIL: {
    code: 'FOIL',
    description: 'Fuel Oil Flow',
    units: 'lb or gal',
    cfr: '40 CFR 75 Appendix D',
    dahsRequirements:
      'DAHS must record fuel oil usage. Apply fuel sampling results for sulfur content and GCV.',
  },
}

// =============================================================================
// SUBSTITUTE DATA CODES
// =============================================================================

export interface SubstituteDataCode {
  code: string
  description: string
  cfr: string
  dahsRequirements: string
}

/**
 * Substitute Data Codes per 40 CFR 75 Subpart D
 */
export const SUBSTITUTE_DATA_CODES: Record<string, SubstituteDataCode> = {
  SPTS: {
    code: 'SPTS',
    description: 'Standard Part 75 Substitute Data',
    cfr: '40 CFR 75 Subpart D (§75.31-75.37)',
    dahsRequirements:
      'DAHS must apply substitute data per Subpart D: 90th percentile (0-24 hrs), 95th percentile (25-720 hrs), maximum (721+ hrs). Track 2,160-hour lookback.',
  },
  MHHI: {
    code: 'MHHI',
    description: 'Maximum Hourly Heat Input',
    cfr: '40 CFR 75 Subpart D',
    dahsRequirements:
      'DAHS must substitute maximum heat input from lookback period when HI data is missing.',
  },
  DAHS: {
    code: 'DAHS',
    description: 'DAHS Derived Data',
    cfr: '40 CFR 75.57',
    dahsRequirements: 'DAHS automatically generates substitute values per programmed algorithms.',
  },
}

// =============================================================================
// QUALIFICATION CODES
// =============================================================================

export interface QualificationCode {
  code: string
  description: string
  cfr: string
  benefits: string
}

/**
 * Unit Qualification Codes for special monitoring provisions
 */
export const QUALIFICATION_CODES: Record<string, QualificationCode> = {
  GF: {
    code: 'GF',
    description: 'Gas-Fired Unit',
    cfr: '40 CFR 75.19',
    benefits:
      '≥90% gas-fired qualifies for Appendix D/G methods. Simpler SO2/CO2 monitoring using fuel-based calculations.',
  },
  LOWSULF: {
    code: 'LOWSULF',
    description: 'Low Sulfur Fuel Exemption',
    cfr: '40 CFR 75.11',
    benefits: 'Units burning exclusively low-sulfur fuel may use F-23 default SO2 emission rate.',
  },
  PEAKING: {
    code: 'PEAKING',
    description: 'Peaking Unit',
    cfr: '40 CFR 75.19(c)(1)(iv)',
    benefits: 'Operates <10% capacity factor. May qualify for reduced monitoring requirements.',
  },
}

// =============================================================================
// QA TEST REQUIREMENTS
// =============================================================================

export interface QATest {
  type: string
  description: string
  frequency: string
  acceptanceCriteria: string
  cfr: string
  notes?: string
}

export interface PercentileTier {
  hoursRange: string
  minHours: number
  maxHours: number
  percentile: string
  description: string
}

/**
 * Standard Part 75 substitute data percentile tiers
 * Per 40 CFR 75 Subpart D (§75.31-75.37)
 */
export const SUBSTITUTE_DATA_PERCENTILE_TIERS: PercentileTier[] = [
  {
    hoursRange: '0-24',
    minHours: 0,
    maxHours: 24,
    percentile: '90th',
    description: 'First 24 hours of missing data: use 90th percentile from lookback',
  },
  {
    hoursRange: '25-720',
    minHours: 25,
    maxHours: 720,
    percentile: '95th',
    description: 'Hours 25-720 of missing data: use 95th percentile from lookback',
  },
  {
    hoursRange: '721-2160',
    minHours: 721,
    maxHours: 2160,
    percentile: 'maximum',
    description: 'Hours 721+ of missing data: use maximum value from lookback',
  },
]

/**
 * QA Test Requirements per Monitoring Method
 * Per 40 CFR 75 Appendix B and §75.20-75.24
 */
export const QA_REQUIREMENTS: Record<string, QATest[]> = {
  CEM: [
    {
      type: 'RATA',
      description: 'Relative Accuracy Test Audit',
      frequency: 'Semi-annual (or Annual if <8,760 op hrs)',
      acceptanceCriteria: '±7.5% RA (or ±10 ppm if ref <100 ppm, or ±15% if bias-adjusted)',
      cfr: '40 CFR 75.22, Appendix B §6',
      notes: 'Annual allowed if unit operates <8,760 hrs in prior 3 years',
    },
    {
      type: 'LINEARITY',
      description: 'Linearity Check',
      frequency: 'Quarterly',
      acceptanceCriteria: '±5% of span value (or ±0.5% CO2/O2)',
      cfr: '40 CFR 75.21, Appendix B §6.2',
      notes: 'Three gas levels: low (0-20%), mid (50-60%), high (80-100% of span)',
    },
    {
      type: 'DAILY_CAL',
      description: 'Daily Calibration Error Test',
      frequency: 'Daily (every 26 hours max)',
      acceptanceCriteria: '±2.5% of span value',
      cfr: '40 CFR 75 Appendix B §2.1',
      notes: 'Zero and high-level calibration gases required',
    },
    {
      type: 'CGA',
      description: 'Cylinder Gas Audit',
      frequency: 'Quarterly (in lieu of linearity for some units)',
      acceptanceCriteria: '±5% RA at mid-level gas',
      cfr: '40 CFR 75.21(d), Appendix B §5',
      notes: 'Alternative to linearity for peaking units',
    },
    {
      type: 'FLOW_RATA',
      description: 'Flow RATA',
      frequency: 'Annual (or per QA operating quarter)',
      acceptanceCriteria: '±7.5% RA vs reference method',
      cfr: '40 CFR 75.22, Appendix B §6.5',
      notes: 'Required for flow monitors; minimum 12 runs',
    },
    {
      type: 'LEAK_CHECK',
      description: 'Leak Check (Flow Monitors)',
      frequency: 'Quarterly',
      acceptanceCriteria: 'No detectable leakage',
      cfr: '40 CFR 75 Appendix B §2.2',
      notes: 'Required for differential pressure flow monitors',
    },
  ],
  AD: [
    {
      type: 'FLOWMETER_ACCURACY',
      description: 'Fuel Flowmeter Accuracy Test',
      frequency: 'Annual',
      acceptanceCriteria: '±2% of reference value',
      cfr: '40 CFR 75 Appendix D §2.1.5',
      notes: 'In-situ or lab calibration acceptable',
    },
    {
      type: 'GCV_SAMPLING',
      description: 'Gross Calorific Value Sampling',
      frequency: 'Per fuel lot (oil) or Monthly (gas)',
      acceptanceCriteria: 'Lab analysis per ASTM methods',
      cfr: '40 CFR 75 Appendix D §2.2-2.3',
      notes: 'Pipeline gas may use supplier data or daily sampling',
    },
    {
      type: 'SULFUR_SAMPLING',
      description: 'Fuel Sulfur Content Sampling',
      frequency: 'Per fuel lot (oil) or Monthly (gas)',
      acceptanceCriteria: 'Lab analysis per ASTM methods',
      cfr: '40 CFR 75 Appendix D §2.2-2.3',
      notes: 'Required for SO2 mass calculation',
    },
    {
      type: 'OILMETER_ACCURACY',
      description: 'Oil Flowmeter Accuracy Test',
      frequency: 'Annual',
      acceptanceCriteria: '±2% of reference value',
      cfr: '40 CFR 75 Appendix D §2.1.5',
      notes: 'Applies to volumetric or mass oil flow meters',
    },
  ],
  AE: [
    {
      type: 'APPENDIX_E_TEST',
      description: 'Appendix E Correlation Test',
      frequency: 'Initial + Retest per major mod',
      acceptanceCriteria: 'Valid correlation curve established',
      cfr: '40 CFR 75 Appendix E §2',
      notes: 'Creates NOx rate vs heat input/load curve',
    },
    {
      type: 'APPENDIX_E_RETEST',
      description: 'Appendix E Retest',
      frequency: 'Every 20 QA operating quarters (5 years)',
      acceptanceCriteria: 'New correlation within ±10% of original',
      cfr: '40 CFR 75 Appendix E §2.3',
      notes: 'May extend to 8 years if combustion unchanged',
    },
  ],
  LME: [
    {
      type: 'LME_FUEL_FLOW',
      description: 'LME Fuel Flow Verification',
      frequency: 'Annual',
      acceptanceCriteria: 'Fuel flow records reconciled',
      cfr: '40 CFR 75.19(c)',
      notes: 'Simplified monitoring for low-emitting units',
    },
    {
      type: 'LME_ELIGIBILITY',
      description: 'LME Eligibility Verification',
      frequency: 'Annual',
      acceptanceCriteria: '<25 tons SO2/year, <25 tons NOx/year',
      cfr: '40 CFR 75.19(a)',
      notes: 'Unit must recertify if exceeds thresholds',
    },
  ],
  NOXR: [
    {
      type: 'RATA',
      description: 'NOx Rate RATA',
      frequency: 'Semi-annual (or Annual if <8,760 op hrs)',
      acceptanceCriteria: '±7.5% RA (or ±0.015 lb/MMBtu if ref <0.200)',
      cfr: '40 CFR 75.22, Appendix B §6',
      notes: 'Tests NOx-diluent monitoring system as a unit',
    },
    {
      type: 'LINEARITY',
      description: 'NOx and Diluent Linearity',
      frequency: 'Quarterly',
      acceptanceCriteria: '±5% of span (or ±0.5% for O2/CO2)',
      cfr: '40 CFR 75.21, Appendix B §6.2',
      notes: 'Both NOx and diluent analyzers tested',
    },
  ],
}

/**
 * Get QA requirements for a monitoring method
 */
export function getQARequirements(methodCode: string): QATest[] {
  return QA_REQUIREMENTS[methodCode.toUpperCase()] ?? []
}

/**
 * Get substitute data percentile tier for given missing hours
 */
export function getPercentileTier(missingHours: number): PercentileTier | undefined {
  return SUBSTITUTE_DATA_PERCENTILE_TIERS.find(
    (tier) => missingHours >= tier.minHours && missingHours <= tier.maxHours
  )
}

/**
 * Get all substitute data percentile tiers
 */
export function getPercentileTiers(): PercentileTier[] {
  return SUBSTITUTE_DATA_PERCENTILE_TIERS
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get monitoring method details by code
 */
export function getMonitoringMethod(code: string): MonitoringMethodCode | undefined {
  return MONITORING_METHOD_CODES[code.toUpperCase()]
}

/**
 * Get formula details by code
 */
export function getFormula(code: string): FormulaCode | undefined {
  return FORMULA_CODES[code.toUpperCase()] ?? FORMULA_CODES[code]
}

/**
 * Get parameter details by code
 */
export function getParameter(code: string): ParameterCode | undefined {
  return PARAMETER_CODES[code.toUpperCase()]
}

/**
 * Find monitoring methods applicable to a parameter
 */
export function findMethodsByParameter(parameterCode: string): MonitoringMethodCode[] {
  const param = parameterCode.toUpperCase()
  return Object.values(MONITORING_METHOD_CODES).filter((m) => m.parameters.includes(param))
}

/**
 * Find formulas applicable to a parameter
 */
export function findFormulasByParameter(parameterCode: string): FormulaCode[] {
  const param = parameterCode.toUpperCase()
  return Object.values(FORMULA_CODES).filter((f) => f.parameters.includes(param))
}

/**
 * Get CFR reference for a monitoring method code
 */
export function getMethodCFR(code: string): string {
  return MONITORING_METHOD_CODES[code.toUpperCase()]?.cfr ?? 'See 40 CFR 75'
}

/**
 * Get CFR reference for a formula code
 */
export function getFormulaCFR(code: string): string {
  return (
    (FORMULA_CODES[code.toUpperCase()] ?? FORMULA_CODES[code])?.cfr ?? 'See 40 CFR 75 Appendix F'
  )
}

/**
 * Explain a monitoring method in DAHS-friendly terms
 */
export function explainMethodForDAHS(code: string): string {
  const method = getMonitoringMethod(code)
  if (!method) return `Unknown monitoring method code: ${code}`

  return `${method.code} (${method.description}): Per ${method.cfr}, this method applies to ${method.parameters.join(', ')}. ${method.dahsRequirements}`
}

/**
 * Explain a formula in DAHS-friendly terms
 */
export function explainFormulaForDAHS(code: string): string {
  const formula = getFormula(code)
  if (!formula) return `Unknown formula code: ${code}`

  return `${formula.code} (${formula.description}): Per ${formula.cfr}, equation: ${formula.equation}. ${formula.dahsCalculation}`
}
