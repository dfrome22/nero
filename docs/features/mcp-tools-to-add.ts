/**
 * NEW MCP TOOLS TO ADD TO C:\WebApp\shared\epa-compliance-mcp\src\index.ts
 *
 * Copy this code and add it BEFORE the "// START SERVER" section
 *
 * Also add these imports at the top of the file:
 */

// ============================================================================
// ADD THESE IMPORTS AT THE TOP OF THE FILE
// ============================================================================

/*
Add these data structures after the existing interface definitions:
*/

// QA Test Requirements per Monitoring Method
interface QATest {
  type: string
  description: string
  frequency: string
  acceptanceCriteria: string
  cfr: string
  notes?: string
}

const QA_REQUIREMENTS: Record<string, QATest[]> = {
  CEM: [
    {
      type: 'RATA',
      description: 'Relative Accuracy Test Audit',
      frequency: 'Semi-annual (or Annual if <8,760 op hrs)',
      acceptanceCriteria: '±7.5% RA (or ±10 ppm if ref <100 ppm)',
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
}

// Substitute Data Percentile Tiers
interface PercentileTier {
  hoursRange: string
  minHours: number
  maxHours: number
  percentile: string
  description: string
}

const SUBSTITUTE_DATA_PERCENTILE_TIERS: PercentileTier[] = [
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

// Monitoring Method Codes
const MONITORING_METHOD_CODES: Record<
  string,
  {
    code: string
    description: string
    cfr: string
    parameters: string[]
    dahsRequirements: string
  }
> = {
  CEM: {
    code: 'CEM',
    description: 'Continuous Emission Monitoring System',
    cfr: '40 CFR 75.10-75.18',
    parameters: ['SO2', 'NOX', 'CO2', 'NOXR', 'O2', 'FLOW'],
    dahsRequirements:
      'DAHS must record hourly concentrations, apply calibration factors, perform QA/QC per Appendix B.',
  },
  AD: {
    code: 'AD',
    description: 'Appendix D (Fuel Sampling and Analysis)',
    cfr: '40 CFR 75 Appendix D',
    parameters: ['SO2', 'CO2', 'HI'],
    dahsRequirements:
      'DAHS must record fuel flow rates, GCV values, fuel sulfur content. Calculate emissions using Appendix D equations.',
  },
  AE: {
    code: 'AE',
    description: 'Appendix E (Gas-Fired Units NOx Emission Rate)',
    cfr: '40 CFR 75 Appendix E',
    parameters: ['NOXR'],
    dahsRequirements:
      'DAHS must use correlation curves from Appendix E tests. Interpolate NOx rate based on heat input.',
  },
  LME: {
    code: 'LME',
    description: 'Low Mass Emissions (Appendix G)',
    cfr: '40 CFR 75.19, Appendix G',
    parameters: ['SO2', 'NOX', 'CO2', 'HI'],
    dahsRequirements:
      'DAHS must use fuel-based calculations per §75.19. Limited to qualifying low-emitting units (<25 tons/year).',
  },
}

// ============================================================================
// TOOL 1: validate_method_for_parameter
// ============================================================================

server.tool(
  'validate_method_for_parameter',
  'Validate if a monitoring method is appropriate for a parameter and source type. Returns CFR citation and requirements.',
  {
    methodCode: z.string().describe('The monitoring method code (CEM, AD, AE, LME, etc.)'),
    parameterCode: z.string().describe('The parameter code (SO2, NOX, CO2, HI, etc.)'),
    sourceType: z.string().describe('The source type (coal-fired boiler, gas turbine, etc.)'),
    capacity: z.number().optional().describe('Optional capacity in MW for LME eligibility check'),
  },
  async ({ methodCode, parameterCode, sourceType, capacity }) => {
    const method = methodCode.toUpperCase()
    const param = parameterCode.toUpperCase()
    const source = sourceType.toLowerCase()
    const requirements: string[] = []
    const warnings: string[] = []
    let valid = true
    let cfrCitation = '40 CFR 75'

    // CEM validation
    if (method === 'CEM') {
      const cemParams = ['SO2', 'NOX', 'NOXR', 'CO2', 'O2', 'FLOW']
      if (!cemParams.includes(param)) {
        valid = false
        warnings.push(`CEM not applicable for ${param}. CEM supports: ${cemParams.join(', ')}`)
      }
      cfrCitation = '40 CFR 75.10-75.18'
      requirements.push('Hourly data recording', 'Daily calibration', 'Quarterly linearity')
      requirements.push('Semi-annual RATA (or annual if <8,760 op hours)')
    }

    // Appendix D validation
    if (method === 'AD') {
      const adParams = ['SO2', 'CO2', 'HI']
      if (!adParams.includes(param)) {
        valid = false
        warnings.push(`Appendix D not applicable for ${param}. AD supports: ${adParams.join(', ')}`)
      }
      if (source.includes('coal')) {
        valid = false
        warnings.push('Appendix D not allowed for coal-fired units for SO2. Use CEMS.')
      }
      cfrCitation = '40 CFR 75 Appendix D'
      requirements.push('Fuel flow metering', 'GCV sampling per lot (oil) or monthly (gas)')
      requirements.push('Annual flowmeter accuracy test')
    }

    // LME validation
    if (method === 'LME') {
      cfrCitation = '40 CFR 75.19'
      if (capacity !== undefined && capacity > 25) {
        warnings.push(`Capacity ${capacity} MW may exceed LME threshold. Verify <25 tons/year.`)
      }
      requirements.push('Fuel-based calculations per §75.19')
      requirements.push('Annual LME eligibility verification')
      requirements.push('<25 tons SO2/year AND <25 tons NOx/year')
    }

    // Appendix E validation
    if (method === 'AE') {
      if (param !== 'NOXR') {
        valid = false
        warnings.push('Appendix E only applies to NOx rate (NOXR)')
      }
      if (!source.includes('gas')) {
        warnings.push('Appendix E typically used for gas-fired units')
      }
      cfrCitation = '40 CFR 75 Appendix E'
      requirements.push('Initial correlation test')
      requirements.push('Retest every 20 QA operating quarters (5 years)')
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ valid, cfrCitation, requirements, warnings }, null, 2),
        },
      ],
    }
  }
)

// ============================================================================
// TOOL 2: lookup_formula_equation
// ============================================================================

server.tool(
  'lookup_formula_equation',
  'Get the detailed equation, variables, and CFR section for a formula code. Enhanced version of getFormulaMapping.',
  {
    formulaCode: z.string().describe('The ECMPS formula code (D-5, F-20, G-4, 19-1, etc.)'),
  },
  async ({ formulaCode }) => {
    // Extend with more detailed equation info
    const formulaDetails: Record<
      string,
      {
        equation: string
        variables: Array<{ name: string; units: string; source: string }>
        cfrSection: string
        exampleCalculation?: string
      }
    > = {
      'D-5': {
        equation: 'SO2 = HI × Default_Rate (0.0006 for pipeline natural gas)',
        variables: [
          { name: 'HI', units: 'MMBtu', source: 'Heat input from fuel flow × GCV' },
          {
            name: 'Default_Rate',
            units: 'lb/MMBtu',
            source: 'Default SO2 emission rate per fuel type',
          },
        ],
        cfrSection: '40 CFR 75 Appendix D §2.3.1',
        exampleCalculation: 'SO2_LB = 100 MMBtu × 0.0006 = 0.06 lb',
      },
      'F-20': {
        equation: 'HI = Fuel_Flow × GCV × 10⁻⁶',
        variables: [
          { name: 'Fuel_Flow', units: 'scf or lb', source: 'Fuel flowmeter' },
          { name: 'GCV', units: 'Btu/scf or Btu/lb', source: 'Fuel sampling or supplier' },
        ],
        cfrSection: '40 CFR 75 Appendix F §5.5',
        exampleCalculation: 'HI_MMBTU = 1,000,000 scf × 1,020 Btu/scf × 1E-6 = 1,020 MMBtu',
      },
      'F-23': {
        equation: 'SO2 = HI × Default_SO2_Rate',
        variables: [
          { name: 'HI', units: 'MMBtu', source: 'Heat input calculation' },
          {
            name: 'Default_SO2_Rate',
            units: 'lb/MMBtu',
            source: 'Default rate for low-sulfur fuel',
          },
        ],
        cfrSection: '40 CFR 75.11(e)(1)',
      },
      'F-24A': {
        equation: 'NOx_LB = NOXR × HI',
        variables: [
          { name: 'NOXR', units: 'lb/MMBtu', source: 'NOx-diluent CEMS or Appendix E' },
          { name: 'HI', units: 'MMBtu', source: 'Heat input calculation' },
        ],
        cfrSection: '40 CFR 75 Appendix F §6',
        exampleCalculation: 'NOX_LB = 0.15 lb/MMBtu × 1,020 MMBtu = 153 lb',
      },
      'G-1': {
        equation: 'CO2 = CO2% × Flow × MWco2 × K',
        variables: [
          { name: 'CO2%', units: '%', source: 'CO2 CEMS' },
          { name: 'Flow', units: 'scfh', source: 'Stack flow monitor' },
          { name: 'MWco2', units: 'constant', source: '44 lb/lb-mole' },
          { name: 'K', units: 'constant', source: 'Conversion factor' },
        ],
        cfrSection: '40 CFR 75 Appendix G §1',
      },
      'G-4': {
        equation: 'CO2 = Fc × HI × MWco2 × K',
        variables: [
          { name: 'Fc', units: 'scf/MMBtu', source: 'Carbon-based F-factor for fuel type' },
          { name: 'HI', units: 'MMBtu', source: 'Heat input calculation' },
        ],
        cfrSection: '40 CFR 75 Appendix G §4',
      },
    }

    const details = formulaDetails[formulaCode.toUpperCase()] || formulaDetails[formulaCode]

    if (!details) {
      // Fall back to basic formula lookup
      const basic = formulas[formulaCode]
      if (basic) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  formulaCode,
                  ...basic,
                  note: 'Detailed equation not available, showing basic mapping',
                },
                null,
                2
              ),
            },
          ],
        }
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `Unknown formula code: ${formulaCode}` }, null, 2),
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ formulaCode, ...details }, null, 2),
        },
      ],
    }
  }
)

// ============================================================================
// TOOL 3: get_substitute_data_requirements
// ============================================================================

server.tool(
  'get_substitute_data_requirements',
  'Get substitute data requirements for a monitoring method, including percentile tiers and lookback rules.',
  {
    methodCode: z.string().describe('The monitoring method code (CEM, AD, etc.)'),
    parameterCode: z.string().optional().describe('Optional parameter code for specific rules'),
  },
  async ({ methodCode, parameterCode }) => {
    const method = methodCode.toUpperCase()

    // Different substitute data approaches by method
    const substituteDataByMethod: Record<
      string,
      {
        substituteDataCode: string
        lookbackHours: number
        percentileTiers: PercentileTier[]
        cfrSection: string
        notes: string
      }
    > = {
      CEM: {
        substituteDataCode: 'SPTS',
        lookbackHours: 2160,
        percentileTiers: SUBSTITUTE_DATA_PERCENTILE_TIERS,
        cfrSection: '40 CFR 75 Subpart D (§75.31-75.37)',
        notes:
          'Standard Part 75 substitute data. Use 90-day (2,160 hour) lookback period. Apply biased high percentiles based on hours missing.',
      },
      AD: {
        substituteDataCode: 'MHHI',
        lookbackHours: 2160,
        percentileTiers: SUBSTITUTE_DATA_PERCENTILE_TIERS,
        cfrSection: '40 CFR 75 Appendix D §3',
        notes:
          'For missing fuel flow, use maximum hourly heat input from lookback. For missing GCV, use highest value from sampling period.',
      },
      LME: {
        substituteDataCode: 'DAHS',
        lookbackHours: 720,
        percentileTiers: [],
        cfrSection: '40 CFR 75.19(d)',
        notes: 'LME uses simplified substitute data. Apply maximum fuel usage for missing hours.',
      },
    }

    const subData = substituteDataByMethod[method]

    if (!subData) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: `No substitute data rules for method: ${methodCode}`,
                availableMethods: Object.keys(substituteDataByMethod),
              },
              null,
              2
            ),
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              methodCode,
              parameterCode: parameterCode || 'all',
              ...subData,
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ============================================================================
// TOOL 4: get_qa_requirements
// ============================================================================

server.tool(
  'get_qa_requirements',
  'Get QA test requirements (RATA, linearity, daily cal, etc.) for a monitoring method.',
  {
    methodCode: z.string().describe('The monitoring method code (CEM, AD, AE, LME, etc.)'),
    parameterCode: z.string().optional().describe('Optional parameter code for specific QA rules'),
  },
  async ({ methodCode, parameterCode }) => {
    const method = methodCode.toUpperCase()
    const tests = QA_REQUIREMENTS[method]

    if (!tests) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: `No QA requirements for method: ${methodCode}`,
                availableMethods: Object.keys(QA_REQUIREMENTS),
              },
              null,
              2
            ),
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              methodCode,
              parameterCode: parameterCode || 'all',
              tests,
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ============================================================================
// TOOL 5: analyze_monitoring_plan
// ============================================================================

server.tool(
  'analyze_monitoring_plan',
  'Analyze a monitoring plan to determine applicable Part 60 subparts and Part 75 overlap.',
  {
    locations: z
      .array(
        z.object({
          unitType: z.string().describe('Unit type (boiler, turbine, engine, etc.)'),
          fuelType: z.string().describe('Fuel type (coal, gas, oil, diesel, etc.)'),
          parameters: z
            .array(z.string())
            .describe('Parameters being monitored (SO2, NOX, CO2, etc.)'),
          methods: z.array(z.string()).describe('Monitoring methods (CEM, AD, LME, etc.)'),
          capacity: z.number().optional().describe('Capacity in MW or MMBtu/hr'),
        })
      )
      .describe('Array of monitoring plan locations to analyze'),
  },
  async ({ locations }) => {
    const applicableSubparts: Array<{
      subpart: string
      title: string
      reason: string
      confidence: 'high' | 'medium' | 'low'
    }> = []
    const warnings: string[] = []
    const recommendations: string[] = []
    let part75Overlap = false
    let part75Notes: string | undefined

    // Simple subpart matching based on unit type and parameters
    const subpartRules: Array<{
      subpart: string
      title: string
      unitPatterns: string[]
      fuelPatterns: string[]
      parameters: string[]
      part75: boolean
    }> = [
      {
        subpart: 'Da',
        title: 'Electric Utility Steam Generating Units',
        unitPatterns: ['boiler', 'steam', 'utility'],
        fuelPatterns: ['coal', 'oil', 'gas'],
        parameters: ['SO2', 'NOX', 'PM'],
        part75: true,
      },
      {
        subpart: 'Db',
        title: 'Industrial Steam Generating Units',
        unitPatterns: ['boiler', 'steam'],
        fuelPatterns: ['coal', 'oil', 'gas'],
        parameters: ['SO2', 'NOX'],
        part75: true,
      },
      {
        subpart: 'KKKK',
        title: 'Stationary Combustion Turbines',
        unitPatterns: ['turbine', 'ct', 'cct'],
        fuelPatterns: ['gas', 'oil'],
        parameters: ['NOX', 'SO2'],
        part75: true,
      },
      {
        subpart: 'GG',
        title: 'Stationary Gas Turbines (Legacy)',
        unitPatterns: ['turbine'],
        fuelPatterns: ['gas', 'oil'],
        parameters: ['NOX', 'SO2'],
        part75: false,
      },
      {
        subpart: 'IIII',
        title: 'Stationary CI Engines',
        unitPatterns: ['diesel', 'ci', 'compression'],
        fuelPatterns: ['diesel', 'oil'],
        parameters: ['NOX', 'PM', 'CO'],
        part75: false,
      },
      {
        subpart: 'JJJJ',
        title: 'Stationary SI Engines',
        unitPatterns: ['engine', 'si', 'spark', 'recip'],
        fuelPatterns: ['gas', 'natural', 'lpg'],
        parameters: ['NOX', 'CO', 'VOC'],
        part75: false,
      },
    ]

    for (const location of locations) {
      const unitLower = location.unitType.toLowerCase()
      const fuelLower = location.fuelType.toLowerCase()

      for (const rule of subpartRules) {
        const unitMatch = rule.unitPatterns.some((p) => unitLower.includes(p))
        const fuelMatch = rule.fuelPatterns.some((p) => fuelLower.includes(p))
        const paramMatch = location.parameters.some((p) =>
          rule.parameters.includes(p.toUpperCase())
        )

        if (unitMatch && (fuelMatch || paramMatch)) {
          const existing = applicableSubparts.find((s) => s.subpart === rule.subpart)
          if (!existing) {
            let confidence: 'high' | 'medium' | 'low' = 'low'
            if (unitMatch && fuelMatch && paramMatch) confidence = 'high'
            else if (unitMatch && (fuelMatch || paramMatch)) confidence = 'medium'

            applicableSubparts.push({
              subpart: rule.subpart,
              title: rule.title,
              reason: `${location.unitType} with ${location.fuelType} monitoring ${location.parameters.join(', ')}`,
              confidence,
            })

            if (rule.part75) {
              part75Overlap = true
              part75Notes = `Subpart ${rule.subpart} coordinates with Part 75. Use Part 75 CEMS data and QA procedures.`
            }
          }
        }
      }

      // Check LME eligibility
      if (location.methods.includes('LME')) {
        if (location.capacity !== undefined && location.capacity > 25) {
          warnings.push(
            `LME used for ${location.unitType} but capacity (${location.capacity} MW) may exceed threshold.`
          )
        }
        recommendations.push('Verify LME eligibility per §75.19(a): <25 tons/year SO2 AND NOx')
      }

      // Appendix D for oil
      if (location.methods.includes('AD') && fuelLower.includes('oil')) {
        recommendations.push(
          `Appendix D for oil: ensure sulfur sampling per delivery per Appendix D §2.2`
        )
      }
    }

    // Sort by confidence
    applicableSubparts.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.confidence] - order[b.confidence]
    })

    if (part75Overlap) {
      recommendations.push(
        'Part 75 overlap detected. Use Part 75 substitute data procedures (more stringent).'
      )
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              applicableSubparts,
              part75Overlap,
              part75Notes,
              warnings,
              recommendations,
            },
            null,
            2
          ),
        },
      ],
    }
  }
)
