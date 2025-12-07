import { describe, it, expect, beforeEach } from 'vitest'
import { CopilotBotService } from './index'
import type { CommentMarker } from '../../utils/comment-scanner'

describe('CopilotBotService', () => {
  let service: CopilotBotService

  beforeEach(() => {
    service = new CopilotBotService()
  })

  describe('generateGitHubIssues', () => {
    it('should generate issues from markers', () => {
      const markers: CommentMarker[] = [
        {
          type: 'TODO',
          file: 'src/test.ts',
          line: 10,
          content: 'Implement feature X',
          context: '// TODO: Implement feature X',
        },
        {
          type: 'FIXME',
          file: 'src/bug.ts',
          line: 20,
          content: 'Fix critical bug',
          context: '// FIXME: Fix critical bug',
        },
      ]

      const issues = service.generateGitHubIssues(markers)

      expect(issues).toHaveLength(2)
      expect(issues[0]?.title).toBe('[TODO] Implement feature X')
      expect(issues[0]?.labels).toContain('enhancement')
      expect(issues[1]?.title).toBe('[FIXME] Fix critical bug')
      expect(issues[1]?.labels).toContain('bug')
    })

    it('should include appropriate labels for TODO', () => {
      const markers: CommentMarker[] = [
        {
          type: 'TODO',
          file: 'src/test.ts',
          line: 10,
          content: 'Task',
          context: '// TODO: Task',
        },
      ]

      const issues = service.generateGitHubIssues(markers)

      expect(issues[0]?.labels).toEqual(
        expect.arrayContaining(['automated', 'from-comment', 'enhancement'])
      )
    })

    it('should include appropriate labels for FIXME', () => {
      const markers: CommentMarker[] = [
        {
          type: 'FIXME',
          file: 'src/test.ts',
          line: 10,
          content: 'Bug',
          context: '// FIXME: Bug',
        },
      ]

      const issues = service.generateGitHubIssues(markers)

      expect(issues[0]?.labels).toEqual(
        expect.arrayContaining(['automated', 'from-comment', 'bug', 'high-priority'])
      )
    })

    it('should include appropriate labels for HACK', () => {
      const markers: CommentMarker[] = [
        {
          type: 'HACK',
          file: 'src/test.ts',
          line: 10,
          content: 'Workaround',
          context: '// HACK: Workaround',
        },
      ]

      const issues = service.generateGitHubIssues(markers)

      expect(issues[0]?.labels).toEqual(
        expect.arrayContaining(['automated', 'from-comment', 'tech-debt', 'refactor'])
      )
    })

    it('should include appropriate labels for NOTE', () => {
      const markers: CommentMarker[] = [
        {
          type: 'NOTE',
          file: 'src/test.ts',
          line: 10,
          content: 'Important note',
          context: '// NOTE: Important note',
        },
      ]

      const issues = service.generateGitHubIssues(markers)

      expect(issues[0]?.labels).toEqual(
        expect.arrayContaining(['automated', 'from-comment', 'documentation'])
      )
    })
  })

  describe('groupIssuesByFile', () => {
    it('should group issues by file', () => {
      const markers: CommentMarker[] = [
        {
          type: 'TODO',
          file: 'src/a.ts',
          line: 10,
          content: 'First',
          context: '// TODO: First',
        },
        {
          type: 'TODO',
          file: 'src/a.ts',
          line: 20,
          content: 'Second',
          context: '// TODO: Second',
        },
        {
          type: 'FIXME',
          file: 'src/b.ts',
          line: 30,
          content: 'Third',
          context: '// FIXME: Third',
        },
      ]

      const issues = service.generateGitHubIssues(markers)
      const grouped = service.groupIssuesByFile(issues)

      expect(grouped.size).toBe(2)
      expect(grouped.get('src/a.ts')).toHaveLength(2)
      expect(grouped.get('src/b.ts')).toHaveLength(1)
    })
  })

  describe('generateScanSummary', () => {
    it('should generate a summary of scan results', () => {
      const scanResult = {
        markers: [
          {
            type: 'TODO' as const,
            file: 'src/a.ts',
            line: 10,
            content: 'Task 1',
            context: '// TODO: Task 1',
          },
          {
            type: 'FIXME' as const,
            file: 'src/a.ts',
            line: 20,
            content: 'Bug 1',
            context: '// FIXME: Bug 1',
          },
          {
            type: 'TODO' as const,
            file: 'src/b.ts',
            line: 30,
            content: 'Task 2',
            context: '// TODO: Task 2',
          },
        ],
        totalFiles: 2,
        totalMarkers: 3,
        scanDate: new Date('2024-01-01').toISOString(),
      }

      const summary = service.generateScanSummary(scanResult)

      expect(summary).toContain('Comment Scan Summary')
      expect(summary).toContain('**Total Markers Found:** 3')
      expect(summary).toContain('**Files Affected:** 2')
      expect(summary).toContain('**TODO**: 2')
      expect(summary).toContain('**FIXME**: 1')
      expect(summary).toContain('src/a.ts')
      expect(summary).toContain('src/b.ts')
    })

    it('should handle empty results', () => {
      const scanResult = {
        markers: [],
        totalFiles: 0,
        totalMarkers: 0,
        scanDate: new Date().toISOString(),
      }

      const summary = service.generateScanSummary(scanResult)

      expect(summary).toContain('**Total Markers Found:** 0')
      expect(summary).toContain('**Files Affected:** 0')
    })
  })

  describe('scanRepository', () => {
    it('should return a scan result with correct structure', async () => {
      const result = await service.scanRepository()

      expect(result).toHaveProperty('markers')
      expect(result).toHaveProperty('totalFiles')
      expect(result).toHaveProperty('totalMarkers')
      expect(result).toHaveProperty('scanDate')
      expect(Array.isArray(result.markers)).toBe(true)
    })

    it('should filter by marker types', async () => {
      const result = await service.scanRepository({
        includeTypes: ['TODO', 'FIXME'],
      })

      expect(result).toBeDefined()
      // Since executeGrep is mocked, markers will be empty
      expect(result.markers).toEqual([])
    })
  })
})
