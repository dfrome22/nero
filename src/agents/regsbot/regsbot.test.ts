/**
 * RegsBot Agent Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RegsBotService } from './index'

describe('RegsBotService', () => {
  let regsBot: RegsBotService

  beforeEach(() => {
    regsBot = new RegsBotService()
  })

  describe('scanForRegulatoryLanguage', () => {
    it('detects monitoring language', () => {
      const text = 'The facility shall monitor SO2 emissions using CEMS.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(results['monitoring']).toBeDefined()
      expect(results['monitoring']).toContain('CEMS')
    })

    it('detects reporting language', () => {
      const text = 'Submit quarterly reports to EPA Region 4.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(results['reporting']).toBeDefined()
      expect(results['reporting']).toContain('quarterly report')
    })

    it('detects limit language', () => {
      const text = 'Emissions shall not exceed 50 ppm SO2.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(results['limits']).toBeDefined()
      expect(results['limits']).toContain('shall not exceed')
    })

    it('detects QA language', () => {
      const text = 'Perform RATA testing annually and calibration drift checks daily.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(results['qa']).toBeDefined()
      expect(results['qa']).toContain('RATA')
    })

    it('detects program references', () => {
      const text = 'This unit is subject to Part 75 and the Acid Rain Program.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(results['programs']).toBeDefined()
      expect(results['programs']).toContain('Part 75')
      expect(results['programs']).toContain('Acid Rain Program')
    })

    it('returns empty object for text without regulatory language', () => {
      const text = 'The weather is nice today.'
      const results = regsBot.scanForRegulatoryLanguage(text)

      expect(Object.keys(results)).toHaveLength(0)
    })
  })

  describe('extractCitations', () => {
    it('extracts CFR citations with part and section', () => {
      const text = 'As required by 40 CFR 75.11, the facility must...'
      const citations = regsBot.extractCitations(text)

      expect(citations).toHaveLength(1)
      expect(citations[0]?.location).toBe('40 CFR 75.11')
    })

    it('extracts CFR citations with only part', () => {
      const text = 'Pursuant to 40 CFR Part 60, the following applies...'
      const citations = regsBot.extractCitations(text)

      expect(citations).toHaveLength(1)
      expect(citations[0]?.location).toBe('40 CFR 60')
    })

    it('extracts multiple citations', () => {
      const text = 'See 40 CFR 75.11 and 40 CFR 60.4 for requirements.'
      const citations = regsBot.extractCitations(text)

      expect(citations).toHaveLength(2)
    })

    it('handles citations with subpart letters', () => {
      const text = 'Under 40 CFR 60.4a, monitoring is required.'
      const citations = regsBot.extractCitations(text)

      expect(citations).toHaveLength(1)
      expect(citations[0]?.location).toBe('40 CFR 60.4a')
    })

    it('returns empty array for text without citations', () => {
      const text = 'No regulatory citations here.'
      const citations = regsBot.extractCitations(text)

      expect(citations).toHaveLength(0)
    })
  })

  describe('classifyObligationType', () => {
    it('classifies monitoring obligations', () => {
      expect(regsBot.classifyObligationType('The owner shall monitor SO2 continuously.')).toBe(
        'monitoring'
      )
      expect(regsBot.classifyObligationType('Install and operate a CEMS.')).toBe('monitoring')
    })

    it('classifies reporting obligations', () => {
      expect(regsBot.classifyObligationType('Submit quarterly reports.')).toBe('reporting')
      expect(regsBot.classifyObligationType('Notify the agency within 24 hours.')).toBe('reporting')
    })

    it('classifies recordkeeping obligations', () => {
      expect(regsBot.classifyObligationType('Maintain records for 5 years.')).toBe('recordkeeping')
    })

    it('classifies limit obligations', () => {
      expect(regsBot.classifyObligationType('Emissions shall not exceed 0.5 lb/MMBtu.')).toBe(
        'limit'
      )
      expect(regsBot.classifyObligationType('The emission limit is 100 ppm.')).toBe('limit')
    })

    it('classifies calculation obligations', () => {
      expect(regsBot.classifyObligationType('Calculate hourly average emissions.')).toBe(
        'calculation'
      )
    })

    it('classifies calibration/QA obligations', () => {
      expect(regsBot.classifyObligationType('Perform calibration drift checks daily.')).toBe(
        'calibration'
      )
      expect(regsBot.classifyObligationType('Conduct RATA testing annually.')).toBe('calibration')
    })

    it('classifies testing obligations', () => {
      expect(regsBot.classifyObligationType('Conduct performance test within 60 days.')).toBe(
        'testing'
      )
    })

    it('returns other for unclassified text', () => {
      expect(regsBot.classifyObligationType('General provision applies.')).toBe('other')
    })
  })

  describe('extractObligations', () => {
    it('extracts obligations from permit text', () => {
      const text = `
        The owner or operator shall monitor SO2 emissions continuously using CEMS.
        The facility shall not exceed 50 ppm NOx on a rolling 30-day average.
        Quarterly reports shall be submitted to EPA Region 4.
      `
      const obligations = regsBot.extractObligations('permit-123', text, 'Page 5')

      expect(obligations.length).toBeGreaterThan(0)
      expect(obligations[0]?.permitId).toBe('permit-123')
      expect(obligations[0]?.pageReference).toBe('Page 5')
    })

    it('assigns appropriate obligation types', () => {
      const text = 'The owner shall monitor SO2 emissions continuously.'
      const obligations = regsBot.extractObligations('permit-123', text, 'Page 1')

      expect(obligations[0]?.obligationType).toBe('monitoring')
    })

    it('extracts parameters from obligations', () => {
      const text = 'The facility shall monitor SO2, NOx, and CO2 emissions.'
      const obligations = regsBot.extractObligations('permit-123', text, 'Page 1')

      expect(obligations[0]?.parameters).toContain('SO2')
      expect(obligations[0]?.parameters).toContain('NOX')
      expect(obligations[0]?.parameters).toContain('CO2')
    })

    it('extracts frequency from obligations', () => {
      const text = 'The owner shall submit quarterly reports to the agency.'
      const obligations = regsBot.extractObligations('permit-123', text, 'Page 1')

      expect(obligations[0]?.frequency).toBe('quarterly')
    })
  })

  describe('buildEvidenceLibrary', () => {
    it('creates evidence library from items', () => {
      const items = [
        {
          id: 'item-1',
          sourceType: 'eCFR' as const,
          title: 'Part 75 Requirements',
          content: 'Sample content',
          citations: [],
          confirmedByHuman: false,
          createdAt: new Date().toISOString(),
        },
      ]

      const library = regsBot.buildEvidenceLibrary(items)

      expect(library.items).toHaveLength(1)
      expect(library.scope).toBe('project')
    })
  })
})
