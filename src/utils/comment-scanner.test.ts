import { describe, it, expect } from 'vitest'
import {
  parseGrepOutput,
  groupMarkersByFile,
  formatMarker,
  generateIssueTitle,
  generateIssueBody,
  prioritizeMarkers,
  filterMarkersByType,
  verifyImplementationStatus,
  type CommentMarker,
} from './comment-scanner'

describe('comment-scanner', () => {
  describe('parseGrepOutput', () => {
    it('should parse grep output with TODO marker', () => {
      const grepOutput = `./src/components/ApiKeyConfig.tsx:194:                  // TODO: Handle file upload`

      const markers = parseGrepOutput(grepOutput)

      expect(markers).toHaveLength(1)
      expect(markers[0]).toMatchObject({
        type: 'TODO',
        file: 'src/components/ApiKeyConfig.tsx',
        line: 194,
        content: 'Handle file upload',
      })
    })

    it('should parse multiple markers', () => {
      const grepOutput = `./src/components/ApiKeyConfig.tsx:194:                  // TODO: Handle file upload
./src/agents/regsbot/index.ts:2372:    // TODO: Use LLM for better summarization
./src/orchestration/workflow-executor.ts:59:    // TODO: Add figmabot and testingbot when ready`

      const markers = parseGrepOutput(grepOutput)

      expect(markers).toHaveLength(3)
      expect(markers[0]?.file).toBe('src/components/ApiKeyConfig.tsx')
      expect(markers[1]?.file).toBe('src/agents/regsbot/index.ts')
      expect(markers[2]?.file).toBe('src/orchestration/workflow-executor.ts')
    })

    it('should handle FIXME markers', () => {
      const grepOutput = `./src/utils/test.ts:10:  // FIXME: This is broken`

      const markers = parseGrepOutput(grepOutput)

      expect(markers).toHaveLength(1)
      expect(markers[0]?.type).toBe('FIXME')
    })

    it('should handle HACK markers', () => {
      const grepOutput = `./src/utils/test.ts:10:  // HACK: Temporary workaround`

      const markers = parseGrepOutput(grepOutput)

      expect(markers).toHaveLength(1)
      expect(markers[0]?.type).toBe('HACK')
    })

    it('should handle empty output', () => {
      const markers = parseGrepOutput('')

      expect(markers).toHaveLength(0)
    })

    it('should handle markers with colons', () => {
      const grepOutput = `./src/test.ts:10:  // TODO: Fix this: it's important`

      const markers = parseGrepOutput(grepOutput)

      expect(markers).toHaveLength(1)
      expect(markers[0]?.content).toBe("Fix this: it's important")
    })
  })

  describe('groupMarkersByFile', () => {
    it('should group markers by file', () => {
      const markers: CommentMarker[] = [
        {
          type: 'TODO',
          file: 'src/a.ts',
          line: 10,
          content: 'First',
          context: 'context1',
        },
        {
          type: 'TODO',
          file: 'src/a.ts',
          line: 20,
          content: 'Second',
          context: 'context2',
        },
        {
          type: 'FIXME',
          file: 'src/b.ts',
          line: 30,
          content: 'Third',
          context: 'context3',
        },
      ]

      const grouped = groupMarkersByFile(markers)

      expect(grouped.size).toBe(2)
      expect(grouped.get('src/a.ts')).toHaveLength(2)
      expect(grouped.get('src/b.ts')).toHaveLength(1)
    })

    it('should handle empty array', () => {
      const grouped = groupMarkersByFile([])

      expect(grouped.size).toBe(0)
    })
  })

  describe('formatMarker', () => {
    it('should format a marker for display', () => {
      const marker: CommentMarker = {
        type: 'TODO',
        file: 'src/test.ts',
        line: 42,
        content: 'Fix this issue',
        context: '// TODO: Fix this issue',
      }

      const formatted = formatMarker(marker)

      expect(formatted).toBe('**TODO** (Line 42): Fix this issue')
    })
  })

  describe('generateIssueTitle', () => {
    it('should generate a short title', () => {
      const marker: CommentMarker = {
        type: 'TODO',
        file: 'src/test.ts',
        line: 42,
        content: 'Fix this issue',
        context: '// TODO: Fix this issue',
      }

      const title = generateIssueTitle(marker)

      expect(title).toBe('[TODO] Fix this issue')
    })

    it('should truncate long content', () => {
      const marker: CommentMarker = {
        type: 'TODO',
        file: 'src/test.ts',
        line: 42,
        content:
          'This is a very long TODO comment that should be truncated to keep the title reasonable',
        context: 'context',
      }

      const title = generateIssueTitle(marker)

      expect(title).toContain('[TODO]')
      expect(title).toContain('...')
      expect(title.length).toBeLessThanOrEqual(70)
    })
  })

  describe('generateIssueBody', () => {
    it('should generate a complete issue body', () => {
      const marker: CommentMarker = {
        type: 'TODO',
        file: 'src/test.ts',
        line: 42,
        content: 'Fix this issue',
        context: '// TODO: Fix this issue',
      }

      const body = generateIssueBody(marker)

      expect(body).toContain('## TODO Comment Found')
      expect(body).toContain('**File:** `src/test.ts`')
      expect(body).toContain('**Line:** 42')
      expect(body).toContain('Fix this issue')
      expect(body).toContain('// TODO: Fix this issue')
      expect(body).toContain('automatically generated')
    })
  })

  describe('prioritizeMarkers', () => {
    it('should sort markers by priority', () => {
      const markers: CommentMarker[] = [
        {
          type: 'NOTE',
          file: 'src/a.ts',
          line: 10,
          content: 'Note',
          context: 'context',
        },
        {
          type: 'TODO',
          file: 'src/b.ts',
          line: 20,
          content: 'Todo',
          context: 'context',
        },
        {
          type: 'FIXME',
          file: 'src/c.ts',
          line: 30,
          content: 'Fixme',
          context: 'context',
        },
        {
          type: 'HACK',
          file: 'src/d.ts',
          line: 40,
          content: 'Hack',
          context: 'context',
        },
      ]

      const prioritized = prioritizeMarkers(markers)

      expect(prioritized[0]?.type).toBe('FIXME')
      expect(prioritized[1]?.type).toBe('TODO')
      expect(prioritized[2]?.type).toBe('HACK')
      expect(prioritized[3]?.type).toBe('NOTE')
    })

    it('should sort by file and line when same priority', () => {
      const markers: CommentMarker[] = [
        {
          type: 'TODO',
          file: 'src/b.ts',
          line: 20,
          content: 'Second',
          context: 'context',
        },
        {
          type: 'TODO',
          file: 'src/a.ts',
          line: 10,
          content: 'First',
          context: 'context',
        },
      ]

      const prioritized = prioritizeMarkers(markers)

      expect(prioritized[0]?.file).toBe('src/a.ts')
      expect(prioritized[1]?.file).toBe('src/b.ts')
    })
  })

  describe('filterMarkersByType', () => {
    it('should filter markers by type', () => {
      const markers: CommentMarker[] = [
        {
          type: 'TODO',
          file: 'src/a.ts',
          line: 10,
          content: 'Todo',
          context: 'context',
        },
        {
          type: 'FIXME',
          file: 'src/b.ts',
          line: 20,
          content: 'Fixme',
          context: 'context',
        },
        {
          type: 'NOTE',
          file: 'src/c.ts',
          line: 30,
          content: 'Note',
          context: 'context',
        },
      ]

      const filtered = filterMarkersByType(markers, ['TODO', 'FIXME'])

      expect(filtered).toHaveLength(2)
      expect(filtered.map((m) => m.type)).toEqual(['TODO', 'FIXME'])
    })

    it('should return empty array when no matches', () => {
      const markers: CommentMarker[] = [
        {
          type: 'NOTE',
          file: 'src/a.ts',
          line: 10,
          content: 'Note',
          context: 'context',
        },
      ]

      const filtered = filterMarkersByType(markers, ['TODO'])

      expect(filtered).toHaveLength(0)
    })
  })

  describe('verifyImplementationStatus', () => {
    it('should detect not-implemented with error throw', () => {
      const marker: CommentMarker = {
        type: 'TODO',
        file: 'src/test.ts',
        line: 5,
        content: 'Implement feature',
        context: '// TODO: Implement feature',
      }

      const fileContent = `function test() {
  if (!implemented) {
    // TODO: Implement feature
    throw new Error('Feature not implemented')
  }
  return true
}`

      const result = verifyImplementationStatus(marker, fileContent)

      expect(result.implementationStatus).toBe('not-implemented')
      expect(result.verificationNote).toContain('not implemented')
    })

    it('should detect partial implementation', () => {
      const marker: CommentMarker = {
        type: 'TODO',
        file: 'src/test.ts',
        line: 5,
        content: 'Add more features',
        context: '// TODO: Add more features',
      }

      const fileContent = `export class MyClass {
  constructor() {}
  
  // TODO: Add more features
  public async myMethod() {
    return this.doSomething()
  }
  
  private doSomething() {
    return 'implemented'
  }
}`

      const result = verifyImplementationStatus(marker, fileContent)

      expect(result.implementationStatus).toBe('partial')
      expect(result.verificationNote).toContain('implementation code')
    })

    it('should detect console.warn for not implemented', () => {
      const marker: CommentMarker = {
        type: 'TODO',
        file: 'src/test.ts',
        line: 3,
        content: 'Handle file upload',
        context: '// TODO: Handle file upload',
      }

      const fileContent = `function handleUpload(file) {
  // TODO: Handle file upload
  console.warn('File upload handler not implemented')
}`

      const result = verifyImplementationStatus(marker, fileContent)

      expect(result.implementationStatus).toBe('not-implemented')
      expect(result.verificationNote).toContain('placeholder')
    })

    it('should mark as unknown when unclear', () => {
      const marker: CommentMarker = {
        type: 'TODO',
        file: 'src/test.ts',
        line: 2,
        content: 'Optimize algorithm',
        context: '// TODO: Optimize algorithm',
      }

      const fileContent = `// TODO: Optimize algorithm
function calculate(x) {
  return x * 2
}`

      const result = verifyImplementationStatus(marker, fileContent)

      expect(result.implementationStatus).toBe('unknown')
      expect(result.verificationNote).toContain('manual verification')
    })
  })
})
