/**
 * eCFR API Client
 *
 * Client for the Electronic Code of Federal Regulations API
 * https://www.ecfr.gov/developers/documentation/api/v1
 */

import type {
  ECFRTitle,
  ECFRStructureNode,
  ECFRSection,
  ECFRSearchResult,
  ECFRQuery,
  ECFRSearchQuery,
} from '../../types/ecfr-api'

const ECFR_BASE_URL = 'https://www.ecfr.gov/api/versioner/v1'

/**
 * eCFR API Client
 */
export class ECFRClient {
  private baseUrl: string

  constructor(baseUrl: string = ECFR_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Get list of all titles
   */
  async getTitles(): Promise<ECFRTitle[]> {
    const response = await fetch(`${this.baseUrl}/titles`)
    if (!response.ok) {
      throw new Error(`eCFR API error: ${response.status} ${response.statusText}`)
    }
    const data = (await response.json()) as { titles: ECFRTitle[] }
    return data.titles
  }

  /**
   * Get structure for a title (chapters, parts, subparts)
   */
  async getTitleStructure(titleNumber: number, date?: string): Promise<ECFRStructureNode> {
    const dateParam = date ?? 'current'
    const response = await fetch(
      `${this.baseUrl}/structure/${dateParam}/title-${titleNumber.toString()}.json`
    )
    if (!response.ok) {
      throw new Error(`eCFR API error: ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<ECFRStructureNode>
  }

  /**
   * Get full content of a specific section
   */
  async getSection(query: ECFRQuery): Promise<ECFRSection> {
    const { title, part, section, date } = query
    const dateParam = date ?? 'current'

    // Build the URL path
    // e.g., /full/current/title-40/chapter-I/subchapter-C/part-60/section-60.4
    let path = `${this.baseUrl}/full/${dateParam}/title-${title.toString()}`

    if (part !== undefined) {
      path += `/part-${part.toString()}`
    }
    if (section !== undefined) {
      path += `/section-${part?.toString() ?? ''}.${section}`
    }

    const response = await fetch(`${path}.json`)
    if (!response.ok) {
      throw new Error(`eCFR API error: ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<ECFRSection>
  }

  /**
   * Search eCFR content
   */
  async search(query: ECFRSearchQuery): Promise<ECFRSearchResult> {
    const params = new URLSearchParams()
    params.set('query', query.query)

    if (query.title !== undefined) params.set('title', query.title.toString())
    if (query.part !== undefined) params.set('part', query.part.toString())
    if (query.page !== undefined) params.set('page', query.page.toString())
    if (query.per_page !== undefined) params.set('per_page', query.per_page.toString())
    if (query.order !== undefined) params.set('order', query.order)

    const response = await fetch(`${this.baseUrl}/search?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`eCFR API error: ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<ECFRSearchResult>
  }

  /**
   * Get a specific Part's content (e.g., Part 75)
   */
  async getPart(
    titleNumber: number,
    partNumber: number,
    date?: string
  ): Promise<ECFRStructureNode> {
    const dateParam = date ?? 'current'
    const response = await fetch(
      `${this.baseUrl}/structure/${dateParam}/title-${titleNumber.toString()}/part-${partNumber.toString()}.json`
    )
    if (!response.ok) {
      throw new Error(`eCFR API error: ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<ECFRStructureNode>
  }

  /**
   * Get a specific Subpart's sections
   */
  async getSubpart(
    titleNumber: number,
    partNumber: number,
    subpartId: string,
    date?: string
  ): Promise<ECFRStructureNode> {
    const dateParam = date ?? 'current'
    const response = await fetch(
      `${this.baseUrl}/structure/${dateParam}/title-${titleNumber.toString()}/part-${partNumber.toString()}/subpart-${subpartId}.json`
    )
    if (!response.ok) {
      throw new Error(`eCFR API error: ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<ECFRStructureNode>
  }
}

// Default singleton instance
export const ecfrClient = new ECFRClient()
