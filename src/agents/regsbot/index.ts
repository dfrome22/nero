/**
 * RegsBot Agent
 *
 * Supreme Commander of EPA Knowledge
 *
 * Responsibilities:
 * - Process permit PDFs (OCR + text extraction)
 * - Scan for regulatory/compliance language
 * - Extract obligations from permits
 * - Query eCFR for regulation details
 * - Query ECMPS for Part 75 monitoring plans
 * - Build Evidence Library with citations
 */

import type { ECFRSearchResult, ECFRSection } from '../../types/ecfr-api'
import { REGULATORY_LANGUAGE_PATTERNS } from '../../types/ecfr-api'
import type { CAMDFacility, MonitoringPlan } from '../../types/ecmps-api'
import type {
  CitationAnchor,
  EvidenceItem,
  EvidenceLibraryData,
  ObligationType,
  PermitDocument,
  PermitObligation,
} from '../../types/orchestration'
import { ECFRClient, ecfrClient } from './ecfr-client'
import { ECMPSClient, ecmpsClient } from './ecmps-client'

// ============================================================================
// REGSBOT SERVICE
// ============================================================================

export interface RegsBotConfig {
  ecfrClient?: ECFRClient
  ecmpsClient?: ECMPSClient
}

export class RegsBotService {
  private ecfr: ECFRClient
  private ecmps: ECMPSClient

  constructor(config: RegsBotConfig = {}) {
    this.ecfr = config.ecfrClient ?? ecfrClient
    this.ecmps = config.ecmpsClient ?? ecmpsClient
  }

  // ============================================================================
  // REGULATION LOOKUP
  // ============================================================================

  /**
   * Look up a specific CFR section
   * @example lookupRegulation({ title: 40, part: 75, section: "11" })
   */
  async lookupRegulation(title: number, part: number, section?: string): Promise<ECFRSection> {
    return this.ecfr.getSection({ title, part, section })
  }

  /**
   * Search eCFR for specific terms
   */
  async searchRegulations(query: string, title?: number, part?: number): Promise<ECFRSearchResult> {
    return this.ecfr.search({ query, title, part })
  }

  /**
   * Get Part 75 monitoring provisions
   */
  async getPart75Provisions(): Promise<ECFRSection> {
    return this.ecfr.getSection({ title: 40, part: 75 })
  }

  /**
   * Get MATS (Subpart UUUUU) provisions
   */
  async getMATSProvisions(): Promise<ECFRSection> {
    return this.ecfr.getSection({ title: 40, part: 63, subpart: 'UUUUU' })
  }

  // ============================================================================
  // FACILITY & MONITORING PLAN LOOKUP
  // ============================================================================

  /**
   * Get facility information from CAMD
   */
  async getFacilityInfo(orisCode: number): Promise<CAMDFacility> {
    return this.ecmps.getFacility(orisCode)
  }

  /**
   * Get monitoring plan for a facility
   */
  async getMonitoringPlan(orisCode: number): Promise<MonitoringPlan> {
    return this.ecmps.getMonitoringPlan({ orisCode })
  }

  /**
   * Get regulatory programs for a facility
   */
  async getFacilityPrograms(orisCode: number): Promise<string[]> {
    return this.ecmps.getFacilityPrograms(orisCode)
  }

  // ============================================================================
  // PERMIT TEXT ANALYSIS
  // ============================================================================

  /**
   * Scan text for regulatory language patterns
   * Returns matches organized by category
   */
  scanForRegulatoryLanguage(text: string): Record<string, string[]> {
    const results: Record<string, string[]> = {}
    const lowerText = text.toLowerCase()

    for (const [category, patterns] of Object.entries(REGULATORY_LANGUAGE_PATTERNS)) {
      const matches: string[] = []
      for (const pattern of patterns) {
        if (lowerText.includes(pattern.toLowerCase())) {
          matches.push(pattern)
        }
      }
      if (matches.length > 0) {
        results[category] = matches
      }
    }

    return results
  }

  /**
   * Extract regulatory citations from text (e.g., "40 CFR 60.4")
   */
  extractCitations(text: string): CitationAnchor[] {
    const citations: CitationAnchor[] = []

    // Pattern: XX CFR YY.ZZ or XX CFR Part YY
    const cfrPattern = /(\d{1,2})\s*CFR\s*(?:Part\s*)?(\d{1,3})(?:\.(\d+[a-z]?))?/gi
    let match

    while ((match = cfrPattern.exec(text)) !== null) {
      const title = match[1]
      const part = match[2]
      const section = match[3]
      const fullMatch = match[0]

      // Get surrounding context (50 chars before and after)
      const start = Math.max(0, match.index - 50)
      const matchLength = fullMatch.length
      const end = Math.min(text.length, match.index + matchLength + 50)
      const excerpt = text.slice(start, end)

      if (title !== undefined && part !== undefined) {
        const sectionSuffix = section !== undefined && section !== '' ? `.${section}` : ''
        citations.push({
          sourceType: 'eCFR',
          sourceId: `${title}-CFR-${part}${sectionSuffix}`,
          location: `${title} CFR ${part}${sectionSuffix}`,
          excerpt: `...${excerpt}...`,
          confidence: 1.0,
        })
      }
    }

    return citations
  }

  /**
   * Determine obligation type from text
   */
  classifyObligationType(text: string): ObligationType {
    const lowerText = text.toLowerCase()

    if (
      lowerText.includes('shall monitor') ||
      lowerText.includes('continuous monitoring') ||
      lowerText.includes('cems')
    ) {
      return 'monitoring'
    }
    if (
      lowerText.includes('report') ||
      lowerText.includes('submit') ||
      lowerText.includes('notify')
    ) {
      return 'reporting'
    }
    if (lowerText.includes('record') || lowerText.includes('maintain')) {
      return 'recordkeeping'
    }
    if (
      lowerText.includes('shall not exceed') ||
      lowerText.includes('emission limit') ||
      lowerText.includes('lb/') ||
      lowerText.includes('ppm')
    ) {
      return 'limit'
    }
    if (lowerText.includes('calculate') || lowerText.includes('average')) {
      return 'calculation'
    }
    if (
      lowerText.includes('calibrat') ||
      lowerText.includes('rata') ||
      lowerText.includes('audit')
    ) {
      return 'calibration'
    }
    if (lowerText.includes('test')) {
      return 'testing'
    }

    return 'other'
  }

  /**
   * Extract obligations from permit text
   */
  extractObligations(permitId: string, text: string, pageReference: string): PermitObligation[] {
    const obligations: PermitObligation[] = []

    // Split text into sentences/clauses that might be obligations
    // Look for "shall" statements which typically indicate requirements
    const shallPattern = /[^.]*shall[^.]+\./gi
    let match
    let index = 0

    while ((match = shallPattern.exec(text)) !== null) {
      const obligationText = match[0].trim()
      const obligationType = this.classifyObligationType(obligationText)

      obligations.push({
        id: `${permitId}-obl-${(index++).toString()}`,
        permitId,
        pageReference,
        originalText: obligationText,
        obligationType,
        summary: this.summarizeObligation(obligationText),
        regulatoryBasis: this.findRegulatoryBasis(obligationText),
        frequency: this.extractFrequency(obligationText),
        parameters: this.extractParameters(obligationText),
        confidence: 0.8, // Base confidence for extracted obligations
        confirmedByHuman: false,
      })
    }

    return obligations
  }

  /**
   * Generate a plain-language summary of an obligation
   */
  private summarizeObligation(text: string): string {
    // For now, return a truncated version
    // TODO: Use LLM for better summarization
    const maxLength = 200
    if (text.length <= maxLength) return text
    return `${text.slice(0, maxLength)}...`
  }

  /**
   * Find regulatory basis cited in text
   */
  private findRegulatoryBasis(text: string): string | undefined {
    const citations = this.extractCitations(text)
    const first = citations[0]
    return first?.location
  }

  /**
   * Extract frequency terms from text
   */
  private extractFrequency(text: string): string | undefined {
    const lowerText = text.toLowerCase()
    const frequencies = [
      'hourly',
      'daily',
      'weekly',
      'monthly',
      'quarterly',
      'semi-annually',
      'annually',
      'continuous',
    ]

    for (const freq of frequencies) {
      if (lowerText.includes(freq)) {
        return freq
      }
    }
    return undefined
  }

  /**
   * Extract parameter names from text
   */
  private extractParameters(text: string): string[] {
    const parameters: string[] = []
    const upperText = text.toUpperCase()

    const knownParams = [
      'SO2',
      'NOX',
      'NOx',
      'CO2',
      'CO',
      'O2',
      'HG',
      'HCL',
      'HF',
      'PM',
      'PM2.5',
      'PM10',
      'VOC',
      'OPACITY',
    ]

    for (const param of knownParams) {
      if (upperText.includes(param.toUpperCase())) {
        parameters.push(param)
      }
    }

    return parameters
  }

  // ============================================================================
  // EVIDENCE LIBRARY BUILDING
  // ============================================================================

  /**
   * Create an evidence item from a CFR section
   */
  async createEvidenceFromCFR(
    title: number,
    part: number,
    section?: string
  ): Promise<EvidenceItem> {
    const content = await this.lookupRegulation(title, part, section)

    return {
      id: `ecfr-${title.toString()}-${part.toString()}${section !== undefined && section !== '' ? `-${section}` : ''}`,
      sourceType: 'eCFR',
      title: content.title,
      content: content.content_text,
      citations: [
        {
          sourceType: 'eCFR',
          sourceId: content.citation,
          location: content.citation,
          excerpt: content.content_text.slice(0, 500),
          confidence: 1.0,
        },
      ],
      confirmedByHuman: false,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Create an evidence item from permit obligations
   */
  createEvidenceFromPermit(permit: PermitDocument, obligations: PermitObligation[]): EvidenceItem {
    const citations: CitationAnchor[] = obligations.map((obl) => ({
      sourceType: 'Permit' as const,
      sourceId: obl.id,
      location: obl.pageReference,
      excerpt: obl.originalText,
      confidence: obl.confidence,
    }))

    return {
      id: `permit-${permit.id}`,
      sourceType: 'Permit',
      title: `${permit.facilityName ?? 'Unknown Facility'} - ${permit.permitNumber ?? permit.filename}`,
      content: obligations.map((o) => o.originalText).join('\n\n'),
      citations,
      confirmedByHuman: false,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Build an evidence library from multiple sources
   */
  buildEvidenceLibrary(items: EvidenceItem[]): EvidenceLibraryData {
    return {
      items,
      scope: 'project',
    }
  }
}

// Default singleton instance
export const regsBotService = new RegsBotService()

// Re-export clients and types
export { EPA_REGULATORY_PROGRAMS, REGULATORY_LANGUAGE_PATTERNS } from '../../types/ecfr-api'
export { ECFRClient, ecfrClient } from './ecfr-client'
export { ECMPSClient, ecmpsClient } from './ecmps-client'
