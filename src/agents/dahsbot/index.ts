/**
 * DAHSBot Agent
 *
 * DAHS Product Knowledge Expert MCP
 *
 * PURPOSE: The DAHS (Data Acquisition and Handling System) product expert that:
 * - Knows the DAHS codebase and architecture
 * - Maps regulatory requirements to existing features
 * - Identifies gaps between requirements and current capabilities
 * - Proposes implementation approaches
 * - Can "debate" with other bots about best approaches
 *
 * INPUTS:
 * - Regulatory requirements (from RegsBot)
 * - User stories (from RequirementsBot)
 * - Feature requests
 * - Gap analysis queries
 *
 * OUTPUTS:
 * - Feature mappings (requirement → existing feature)
 * - Gap analysis (what's missing)
 * - Implementation proposals
 * - Effort estimates
 * - Architecture recommendations
 */

import type { RegulatoryCitation } from '../../types/orchestration'

// ============================================================================
// TYPES
// ============================================================================

export interface DAHSFeature {
  id: string
  name: string
  module: string
  description: string
  capabilities: string[]
  regulatoryBasis: string[]
  status: 'implemented' | 'partial' | 'planned' | 'not-started'
  version: string
}

export interface DAHSModule {
  id: string
  name: string
  description: string
  features: DAHSFeature[]
}

export interface RequirementMapping {
  requirementId: string
  requirementText: string
  source: 'RegsBot' | 'RequirementsBot' | 'manual'
  dahsFeature?: DAHSFeature
  coverageStatus: 'full' | 'partial' | 'none' | 'exceeds'
  gap?: string
  implementationNotes?: string
}

export interface GapAnalysisResult {
  totalRequirements: number
  fullyCovered: number
  partiallyCovered: number
  notCovered: number
  mappings: RequirementMapping[]
  recommendations: string[]
}

export interface ImplementationProposal {
  requirementId: string
  approach: string
  effort: 'small' | 'medium' | 'large' | 'epic'
  dependencies: string[]
  risks: string[]
  alternativeApproaches?: string[]
}

export interface DAHSBotResponse {
  query: string
  answer: string
  mappings?: RequirementMapping[]
  gaps?: GapAnalysisResult
  proposals?: ImplementationProposal[]
  citations: RegulatoryCitation[]
  confidence: 'high' | 'medium' | 'low'
  canHandle: boolean
  reasoning?: string
}

// ============================================================================
// DAHS PRODUCT KNOWLEDGE BASE
// ============================================================================

const DAHS_MODULES: DAHSModule[] = [
  {
    id: 'data-acquisition',
    name: 'Data Acquisition',
    description: 'Real-time data collection from CEMS and other monitoring equipment',
    features: [
      {
        id: 'cems-interface',
        name: 'CEMS Interface',
        module: 'data-acquisition',
        description: 'Connects to continuous emission monitoring systems',
        capabilities: [
          'SO2 concentration monitoring',
          'NOx concentration monitoring',
          'CO2 concentration monitoring',
          'O2 concentration monitoring',
          'Flow rate monitoring',
          'Opacity monitoring',
          'Real-time data polling',
          'Multiple protocol support (Modbus, OPC, serial)',
        ],
        regulatoryBasis: ['40 CFR 75.10', '40 CFR 75.11', '40 CFR 75.12'],
        status: 'implemented',
        version: '3.2.0',
      },
      {
        id: 'fuel-flow-interface',
        name: 'Fuel Flow Interface',
        module: 'data-acquisition',
        description: 'Collects fuel flow data for Appendix D calculations',
        capabilities: [
          'Mass flow rate collection',
          'Volumetric flow rate collection',
          'Fuel type tracking',
          'GCV data integration',
          'Tank level monitoring',
        ],
        regulatoryBasis: ['40 CFR 75 Appendix D', '40 CFR 75.19'],
        status: 'implemented',
        version: '3.2.0',
      },
      {
        id: 'sorbent-trap',
        name: 'Sorbent Trap Interface',
        module: 'data-acquisition',
        description: 'Mercury sorbent trap monitoring for MATS compliance',
        capabilities: [
          'Trap pair tracking',
          'Sample period management',
          'Lab result integration',
          'Breakthrough detection',
        ],
        regulatoryBasis: ['40 CFR 63 Subpart UUUUU', 'EPA Method 30B'],
        status: 'implemented',
        version: '3.1.0',
      },
    ],
  },
  {
    id: 'calculations',
    name: 'Emissions Calculations',
    description: 'EPA-approved calculation methodologies',
    features: [
      {
        id: 'hourly-avg',
        name: 'Hourly Averaging',
        module: 'calculations',
        description: 'Calculates hourly averages per Part 75 requirements',
        capabilities: [
          'Arithmetic averaging',
          'Time-weighted averaging',
          'Bias adjustment',
          'Data validation flags',
          'Minimum data requirements check',
        ],
        regulatoryBasis: ['40 CFR 75.10(d)', '40 CFR 75 Appendix F'],
        status: 'implemented',
        version: '3.2.0',
      },
      {
        id: 'mass-emissions',
        name: 'Mass Emissions',
        module: 'calculations',
        description: 'Calculates mass emissions (lbs/hr, tons)',
        capabilities: [
          'SO2 mass calculation',
          'NOx mass calculation',
          'CO2 mass calculation',
          'Heat input calculation',
          'Equation F-1 through F-23',
          'Unit conversion',
        ],
        regulatoryBasis: ['40 CFR 75 Appendix F'],
        status: 'implemented',
        version: '3.2.0',
      },
      {
        id: 'heat-input',
        name: 'Heat Input Calculation',
        module: 'calculations',
        description: 'Calculates heat input from various fuel types',
        capabilities: [
          'CEMS-based heat input (Equation F-15, F-16, F-17, F-18)',
          'Appendix D heat input',
          'Multiple fuel blending',
          'GCV application',
        ],
        regulatoryBasis: ['40 CFR 75 Appendix F', '40 CFR 75 Appendix D'],
        status: 'implemented',
        version: '3.2.0',
      },
      {
        id: 'emission-rate',
        name: 'Emission Rate Calculation',
        module: 'calculations',
        description: 'Calculates emission rates (lb/mmBtu)',
        capabilities: [
          'NOx rate calculation',
          'SO2 rate calculation',
          'Rolling averages',
          'Rate-based limits tracking',
        ],
        regulatoryBasis: ['40 CFR 75 Appendix F'],
        status: 'implemented',
        version: '3.2.0',
      },
    ],
  },
  {
    id: 'data-substitution',
    name: 'Missing Data Substitution',
    description: 'EPA-approved substitute data procedures',
    features: [
      {
        id: 'standard-subs',
        name: 'Standard Substitution',
        module: 'data-substitution',
        description: 'Standard Part 75 substitute data algorithms',
        capabilities: [
          'Lookback windows (2160 hours)',
          'Percentile calculations (90th, maximum)',
          'Initial missing data (720 hours)',
          'Subsequent missing data',
          'Parameter-specific rules',
        ],
        regulatoryBasis: ['40 CFR 75.33', '40 CFR 75.34', '40 CFR 75.35', '40 CFR 75.36'],
        status: 'implemented',
        version: '3.2.0',
      },
      {
        id: 'fuel-subs',
        name: 'Fuel Flow Substitution',
        module: 'data-substitution',
        description: 'Appendix D fuel flow substitute data',
        capabilities: ['Maximum fuel flow rate', 'Fuel-specific defaults', 'Orifice-based backup'],
        regulatoryBasis: ['40 CFR 75 Appendix D Section 2.4'],
        status: 'implemented',
        version: '3.2.0',
      },
    ],
  },
  {
    id: 'qa-tracking',
    name: 'QA/QC Tracking',
    description: 'Quality assurance test tracking and scheduling',
    features: [
      {
        id: 'test-tracking',
        name: 'QA Test Tracking',
        module: 'qa-tracking',
        description: 'Tracks all required QA tests',
        capabilities: [
          'RATA tracking',
          'Linearity tracking',
          'CGA tracking (daily calibrations)',
          '7-day calibration error',
          'Cycle time tests',
          'Leak checks',
          'DAHS verification',
        ],
        regulatoryBasis: ['40 CFR 75 Appendix A', '40 CFR 75 Appendix B'],
        status: 'implemented',
        version: '3.2.0',
      },
      {
        id: 'test-scheduling',
        name: 'QA Test Scheduling',
        module: 'qa-tracking',
        description: 'Schedules upcoming QA tests with reminders',
        capabilities: [
          'Grace period tracking',
          'Operating quarter detection',
          'Email notifications',
          'Calendar integration',
        ],
        regulatoryBasis: ['40 CFR 75.21'],
        status: 'implemented',
        version: '3.0.0',
      },
      {
        id: 'test-evaluation',
        name: 'Test Result Evaluation',
        module: 'qa-tracking',
        description: 'Evaluates QA test results against acceptance criteria',
        capabilities: [
          'Pass/fail determination',
          'Tolerance checking',
          'Out-of-control detection',
          'Conditional data validation',
        ],
        regulatoryBasis: ['40 CFR 75 Appendix A', '40 CFR 75 Appendix B'],
        status: 'implemented',
        version: '3.2.0',
      },
    ],
  },
  {
    id: 'reporting',
    name: 'Regulatory Reporting',
    description: 'EDR generation and submission',
    features: [
      {
        id: 'edr-generation',
        name: 'EDR Generation',
        module: 'reporting',
        description: 'Generates quarterly Electronic Data Reports',
        capabilities: [
          'XML file generation',
          'All EDR record types',
          'Schema validation',
          'Error checking',
          'Resubmission tracking',
        ],
        regulatoryBasis: ['40 CFR 75.64', '40 CFR 75.73'],
        status: 'implemented',
        version: '3.2.0',
      },
      {
        id: 'ecmps-submit',
        name: 'ECMPS Submission',
        module: 'reporting',
        description: 'Direct submission to EPA ECMPS',
        capabilities: [
          'API integration',
          'Certificate management',
          'Submission history',
          'Error response handling',
        ],
        regulatoryBasis: ['40 CFR 75.64'],
        status: 'implemented',
        version: '3.1.0',
      },
      {
        id: 'mats-reporting',
        name: 'MATS Reporting',
        module: 'reporting',
        description: 'MATS compliance reporting',
        capabilities: ['Mercury emissions reporting', 'HAP metals reporting', 'Acid gas reporting'],
        regulatoryBasis: ['40 CFR 63 Subpart UUUUU'],
        status: 'partial',
        version: '3.2.0',
      },
    ],
  },
  {
    id: 'monitoring-plan',
    name: 'Monitoring Plan Management',
    description: 'Electronic monitoring plan maintenance',
    features: [
      {
        id: 'mp-editor',
        name: 'Monitoring Plan Editor',
        module: 'monitoring-plan',
        description: 'Create and edit monitoring plans',
        capabilities: [
          'Unit configuration',
          'Stack configuration',
          'Method assignments',
          'System definitions',
          'Formula assignments',
        ],
        regulatoryBasis: ['40 CFR 75.53'],
        status: 'implemented',
        version: '3.2.0',
      },
      {
        id: 'mp-import',
        name: 'Monitoring Plan Import',
        module: 'monitoring-plan',
        description: 'Import monitoring plans from ECMPS',
        capabilities: ['XML import', 'ECMPS API sync', 'Version comparison'],
        regulatoryBasis: ['40 CFR 75.53'],
        status: 'implemented',
        version: '3.0.0',
      },
    ],
  },
]

// Flatten features for easy lookup
const ALL_FEATURES: DAHSFeature[] = DAHS_MODULES.flatMap((m) => m.features)

// ============================================================================
// DAHSBOT SERVICE
// ============================================================================

export class DAHSBotService {
  private modules: DAHSModule[] = DAHS_MODULES
  private features: DAHSFeature[] = ALL_FEATURES

  /**
   * Main query interface - answer questions about DAHS capabilities
   */
  async query(question: string): Promise<DAHSBotResponse> {
    const q = question.toLowerCase()

    // Detect query type
    if (q.includes('can') && (q.includes('handle') || q.includes('do') || q.includes('support'))) {
      return this.canHandle(question)
    }

    if (q.includes('gap') || q.includes('missing') || q.includes('need')) {
      return this.analyzeGaps(question)
    }

    if (q.includes('how') && (q.includes('implement') || q.includes('work'))) {
      return this.explainImplementation(question)
    }

    if (q.includes('feature') || q.includes('capability') || q.includes('module')) {
      return this.listCapabilities(question)
    }

    // Default: general query
    return this.generalQuery(question)
  }

  /**
   * Check if DAHS can handle a specific requirement
   */
  canHandle(requirement: string): DAHSBotResponse {
    const keywords = this.extractKeywords(requirement)
    const matchingFeatures = this.findMatchingFeatures(keywords)
    const bestMatch = matchingFeatures[0]

    if (bestMatch !== undefined) {
      const coverageStatus = bestMatch.status === 'implemented' ? 'full' : 'partial'

      return {
        query: requirement,
        answer: `✅ **Yes, DAHS can handle this!**

The **${bestMatch.name}** feature in the ${bestMatch.module} module covers this requirement.

**Capabilities:**
${bestMatch.capabilities.map((c) => `• ${c}`).join('\n')}

**Regulatory Basis:** ${bestMatch.regulatoryBasis.join(', ')}
**Status:** ${bestMatch.status} (v${bestMatch.version})`,
        mappings: [
          {
            requirementId: 'req-1',
            requirementText: requirement,
            source: 'manual',
            dahsFeature: bestMatch,
            coverageStatus,
          },
        ],
        citations: bestMatch.regulatoryBasis.map((r) => ({
          source: 'ecfr' as const,
          reference: r,
          title: r,
          excerpt: `Regulatory basis for ${bestMatch.name}`,
          url: `https://ecfr.gov/current/title-40/part-75`,
        })),
        confidence: 'high',
        canHandle: true,
        reasoning: `Matched to ${bestMatch.name} based on keywords: ${keywords.join(', ')}`,
      }
    }

    return {
      query: requirement,
      answer: `⚠️ **This may require development.**

I couldn't find an existing DAHS feature that directly addresses this requirement. 

**Possible approaches:**
1. Extend an existing module
2. Develop a new feature
3. Configure existing features differently

Would you like me to propose an implementation approach?`,
      citations: [],
      confidence: 'low',
      canHandle: false,
      reasoning: `No matching features found for keywords: ${keywords.join(', ')}`,
    }
  }

  /**
   * Analyze gaps between requirements and DAHS capabilities
   */
  analyzeGaps(context: string): DAHSBotResponse {
    // This would be enhanced to accept a list of requirements from RequirementsBot
    const gaps: GapAnalysisResult = {
      totalRequirements: 0,
      fullyCovered: 0,
      partiallyCovered: 0,
      notCovered: 0,
      mappings: [],
      recommendations: [
        'MATS reporting needs enhancement for full acid gas support',
        'Consider adding RGGI-specific CO2 tracking features',
        'Mercury CEMS integration could be expanded',
      ],
    }

    return {
      query: context,
      answer: `📊 **DAHS Gap Analysis**

Based on Part 75 core requirements, DAHS provides:
• **Full Coverage:** Data acquisition, calculations, standard substitution, QA tracking, EDR reporting
• **Partial Coverage:** MATS reporting (mercury complete, acid gas partial)
• **Planned:** Enhanced RGGI support, expanded mercury features

**Key Strengths:**
✅ Complete Part 75 CEMS data handling
✅ All Appendix F calculations
✅ Full substitute data implementation
✅ Comprehensive QA test tracking
✅ EDR generation and ECMPS submission

**Areas for Enhancement:**
⚠️ MATS acid gas reporting
⚠️ State-specific program variations
⚠️ Advanced analytics/ML predictions`,
      gaps,
      citations: [],
      confidence: 'high',
      canHandle: true,
    }
  }

  /**
   * Explain how DAHS implements something
   */
  explainImplementation(question: string): DAHSBotResponse {
    const keywords = this.extractKeywords(question)
    const matchingFeatures = this.findMatchingFeatures(keywords)
    const feature = matchingFeatures[0]

    if (feature === undefined) {
      return {
        query: question,
        answer:
          'I need more context to explain the implementation. Could you be more specific about which feature or requirement?',
        citations: [],
        confidence: 'low',
        canHandle: false,
      }
    }

    return {
      query: question,
      answer: `🔧 **How DAHS Implements: ${feature.name}**

**Module:** ${feature.module}
**Description:** ${feature.description}

**Implementation Details:**
${feature.capabilities.map((c) => `• ${c}`).join('\n')}

**Regulatory Compliance:**
This feature is designed to meet:
${feature.regulatoryBasis.map((r) => `• ${r}`).join('\n')}

**Integration Points:**
• Receives data from: Data Acquisition module
• Feeds into: Calculations, Reporting modules
• Validated by: QA Tracking module`,
      citations: feature.regulatoryBasis.map((r) => ({
        source: 'ecfr' as const,
        reference: r,
        title: r,
        excerpt: `Implementation details for ${feature.name}`,
        url: `https://ecfr.gov/current/title-40/part-75`,
      })),
      confidence: 'high',
      canHandle: true,
    }
  }

  /**
   * List DAHS capabilities
   */
  listCapabilities(context: string): DAHSBotResponse {
    const moduleList = this.modules
      .map(
        (m) => `**${m.name}**
${m.features.map((f) => `  • ${f.name} (${f.status})`).join('\n')}`
      )
      .join('\n\n')

    return {
      query: context,
      answer: `📦 **DAHS Modules & Capabilities**

${moduleList}

**Total Features:** ${this.features.length}
**Implemented:** ${this.features.filter((f) => f.status === 'implemented').length}
**Partial:** ${this.features.filter((f) => f.status === 'partial').length}
**Planned:** ${this.features.filter((f) => f.status === 'planned').length}`,
      citations: [],
      confidence: 'high',
      canHandle: true,
    }
  }

  /**
   * General query handler
   */
  generalQuery(question: string): DAHSBotResponse {
    return {
      query: question,
      answer: `I'm DAHSBot, the DAHS product expert. I can help you with:

• **"Can DAHS handle [requirement]?"** - Check if we support something
• **"Show me DAHS capabilities"** - List all features
• **"How does DAHS implement [feature]?"** - Explain implementation
• **"What gaps exist for [program]?"** - Gap analysis

Ask me anything about the DAHS product!`,
      citations: [],
      confidence: 'medium',
      canHandle: true,
    }
  }

  /**
   * Extract keywords from text for matching
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = []
    const t = text.toLowerCase()

    // Parameters
    if (t.includes('so2') || t.includes('sulfur')) keywords.push('SO2')
    if (t.includes('nox') || t.includes('nitrogen')) keywords.push('NOx')
    if (t.includes('co2') || t.includes('carbon dioxide')) keywords.push('CO2')
    if (t.includes('o2') || t.includes('oxygen')) keywords.push('O2')
    if (t.includes('flow')) keywords.push('flow')
    if (t.includes('opacity')) keywords.push('opacity')
    if (t.includes('mercury') || t.includes('hg')) keywords.push('mercury')

    // Features
    if (t.includes('cems')) keywords.push('cems')
    if (t.includes('fuel') || t.includes('appendix d')) keywords.push('fuel')
    if (t.includes('qa') || t.includes('test') || t.includes('rata')) keywords.push('qa')
    if (t.includes('calculat') || t.includes('mass') || t.includes('heat input'))
      keywords.push('calculation')
    if (t.includes('substitut') || t.includes('missing data')) keywords.push('substitution')
    if (t.includes('report') || t.includes('edr') || t.includes('quarterly'))
      keywords.push('reporting')
    if (t.includes('monitoring plan') || t.includes('mp')) keywords.push('monitoring-plan')
    if (t.includes('mats')) keywords.push('mats')

    return keywords
  }

  /**
   * Find features matching keywords
   */
  private findMatchingFeatures(keywords: string[]): DAHSFeature[] {
    if (keywords.length === 0) return []

    return this.features
      .map((feature) => {
        let score = 0
        const featureText =
          `${feature.name} ${feature.description} ${feature.capabilities.join(' ')} ${feature.regulatoryBasis.join(' ')}`.toLowerCase()

        for (const keyword of keywords) {
          if (featureText.includes(keyword.toLowerCase())) {
            score++
          }
        }

        return { feature, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.feature)
  }

  /**
   * Get all modules
   */
  getModules(): DAHSModule[] {
    return this.modules
  }

  /**
   * Get all features
   */
  getFeatures(): DAHSFeature[] {
    return this.features
  }
}

// Export singleton instance
export const dahsBot = new DAHSBotService()
