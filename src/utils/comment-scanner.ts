/**
 * Comment Scanner Utility
 *
 * Scans repository for Copilot-generated comments (TODO, FIXME, HACK, XXX, NOTE)
 * and prepares them for GitHub issue creation.
 */

export interface CommentMarker {
  type: 'TODO' | 'FIXME' | 'HACK' | 'XXX' | 'NOTE'
  file: string
  line: number
  content: string
  context?: string // surrounding code context
  implementationStatus?: 'implemented' | 'not-implemented' | 'partial' | 'unknown'
  verificationNote?: string
}

export interface ScanResult {
  markers: CommentMarker[]
  totalFiles: number
  totalMarkers: number
  scanDate: string
}

/**
 * Parses grep output to extract comment markers
 * Format: filepath:lineNumber:content
 */
export function parseGrepOutput(grepOutput: string): CommentMarker[] {
  const lines = grepOutput.split('\n').filter((line) => line.trim())
  const markers: CommentMarker[] = []

  for (const line of lines) {
    // Parse format: ./src/components/ApiKeyConfig.tsx:194:                  // TODO: Handle file upload
    const regex = /^(.+?):(\d+):(.+)$/
    const match = regex.exec(line)
    if (!match) continue

    const [, filePath, lineNumber, content] = match
    if (
      typeof filePath !== 'string' ||
      typeof lineNumber !== 'string' ||
      typeof content !== 'string'
    )
      continue

    const cleanPath = filePath.replace(/^\.\//, '')

    // Extract marker type and content
    const markerRegex = /(TODO|FIXME|HACK|XXX|NOTE)[:\s]+(.*)/i
    const markerMatch = markerRegex.exec(content)
    if (!markerMatch) continue

    const [, type, markerContent] = markerMatch
    if (typeof type !== 'string' || typeof markerContent !== 'string') continue

    markers.push({
      type: type.toUpperCase() as CommentMarker['type'],
      file: cleanPath,
      line: parseInt(lineNumber, 10),
      content: markerContent.trim(),
      context: content.trim(),
    })
  }

  return markers
}

/**
 * Groups markers by file
 */
export function groupMarkersByFile(markers: CommentMarker[]): Map<string, CommentMarker[]> {
  const grouped = new Map<string, CommentMarker[]>()

  for (const marker of markers) {
    const existing = grouped.get(marker.file) ?? []
    existing.push(marker)
    grouped.set(marker.file, existing)
  }

  return grouped
}

/**
 * Formats a marker for display
 */
export function formatMarker(marker: CommentMarker): string {
  return `**${marker.type}** (Line ${marker.line}): ${marker.content}`
}

/**
 * Generates a GitHub issue title from a marker
 */
export function generateIssueTitle(marker: CommentMarker): string {
  const shortContent =
    marker.content.length > 60 ? marker.content.substring(0, 60) + '...' : marker.content
  return `[${marker.type}] ${shortContent}`
}

/**
 * Generates a GitHub issue body from a marker
 */
export function generateIssueBody(marker: CommentMarker): string {
  return `## ${marker.type} Comment Found

**File:** \`${marker.file}\`
**Line:** ${marker.line}

### Description
${marker.content}

### Context
\`\`\`
${marker.context ?? 'No context available'}
\`\`\`

---
*This issue was automatically generated from a ${marker.type} comment in the codebase.*
*Generated on: ${new Date().toISOString()}*
`
}

/**
 * Prioritizes markers for issue creation
 * FIXME > TODO > HACK > XXX > NOTE
 */
export function prioritizeMarkers(markers: CommentMarker[]): CommentMarker[] {
  const priority: Record<CommentMarker['type'], number> = {
    FIXME: 1,
    TODO: 2,
    HACK: 3,
    XXX: 4,
    NOTE: 5,
  }

  return [...markers].sort((a, b) => {
    const priorityDiff = priority[a.type] - priority[b.type]
    if (priorityDiff !== 0) return priorityDiff
    // If same priority, sort by file then line
    return a.file.localeCompare(b.file) || a.line - b.line
  })
}

/**
 * Filters markers by type
 */
export function filterMarkersByType(
  markers: CommentMarker[],
  types: CommentMarker['type'][]
): CommentMarker[] {
  return markers.filter((marker) => types.includes(marker.type))
}

/**
 * Analyzes a marker to determine if it might already be implemented
 * Looks for common patterns that suggest implementation
 */
export function verifyImplementationStatus(
  marker: CommentMarker,
  fileContent: string
): CommentMarker {
  const lines = fileContent.split('\n')
  const markerLineIndex = marker.line - 1
  const contextRange = 20 // lines to check before and after

  // Get surrounding code for analysis
  const startLine = Math.max(0, markerLineIndex - contextRange)
  const endLine = Math.min(lines.length, markerLineIndex + contextRange)
  const surroundingCode = lines.slice(startLine, endLine).join('\n')

  // Patterns that suggest the TODO might be implemented
  const implementedPatterns = [
    /implements?.*\w+/i,
    /function\s+\w+/,
    /class\s+\w+/,
    /export\s+(const|function|class|interface)/,
    /async\s+\w+/,
  ]

  // Patterns that suggest it's NOT implemented (excluding the TODO comment itself)
  const notImplementedPatterns = [
    /console\.(warn|error|log)\(['"].*not.*implement/i,
    /throw\s+new\s+Error\(['"].*not.*implement/i,
    /\/\/\s*placeholder/i,
    /\/\/\s*stub/i,
    /return\s+['"']?mock/i,
  ]

  // Count matches
  const implementedMatches = implementedPatterns.filter((pattern) =>
    pattern.test(surroundingCode)
  ).length

  const notImplementedMatches = notImplementedPatterns.filter((pattern) =>
    pattern.test(surroundingCode)
  ).length

  // Determine status based on evidence
  let status: CommentMarker['implementationStatus'] = 'unknown'
  let note = ''

  // Strong evidence it's NOT implemented
  if (notImplementedMatches > 0) {
    status = 'not-implemented'
    note = 'Found placeholder/stub code or "not implemented" error'
  }
  // Strong evidence of implementation (multiple patterns)
  else if (implementedMatches >= 3) {
    status = 'partial'
    note = 'Found substantial implementation code, but TODO comment still present'
  }
  // Some evidence of implementation
  else if (implementedMatches >= 1) {
    status = 'unknown'
    note = 'Found some implementation code - manual verification recommended'
  }
  // No clear evidence either way
  else {
    status = 'not-implemented'
    note = 'No implementation code detected nearby'
  }

  return {
    ...marker,
    implementationStatus: status,
    verificationNote: note,
  }
}
