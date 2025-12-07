# CopilotBot - Comment Scanner & GitHub Issue Creator

## Overview

CopilotBot is a specialized agent that scans the repository for Copilot-generated comments (TODO, FIXME, HACK, XXX, NOTE) and provides tools to create GitHub issues from them. This helps teams track and manage technical debt, planned improvements, and known issues discovered during development.

## Purpose

- **Automate Issue Creation**: Convert code comments into tracked GitHub issues
- **Track Technical Debt**: Identify HACK and FIXME markers that need attention
- **Prioritize Work**: Automatically categorize and label issues based on marker type
- **Maintain Code Quality**: Ensure important notes and TODOs don't get forgotten

## Features

### 1. Repository Scanning

- Scans source files for comment markers
- Supports multiple marker types: TODO, FIXME, HACK, XXX, NOTE
- Configurable filtering by marker type
- Excludes common directories (node_modules, .git, dist, coverage)

### 2. Issue Generation

- Generates GitHub-ready issue templates
- Automatic labeling based on marker type:
  - **FIXME**: `bug`, `high-priority`, `automated`, `from-comment`
  - **TODO**: `enhancement`, `automated`, `from-comment`
  - **HACK**: `tech-debt`, `refactor`, `automated`, `from-comment`
  - **XXX**: `needs-review`, `automated`, `from-comment`
  - **NOTE**: `documentation`, `automated`, `from-comment`

### 3. Prioritization

Markers are automatically prioritized:

1. FIXME (highest priority - critical bugs)
2. TODO (medium priority - planned features)
3. HACK (medium priority - technical debt)
4. XXX (low priority - needs review)
5. NOTE (lowest priority - documentation)

### 4. Reporting

- Summary view with statistics
- Group by file or by type
- Detailed scan reports with context

## Architecture

### Core Components

```
src/
├── utils/
│   ├── comment-scanner.ts      # Parser and utilities
│   └── comment-scanner.test.ts # 16 tests
├── agents/
│   └── copilotbot/
│       ├── index.ts            # Service implementation
│       └── index.test.ts       # 10 tests
└── pages/
    └── agents/
        └── CopilotBot.tsx      # UI page
```

### Data Flow

```
User selects marker types
        ↓
CopilotBotService.scanRepository()
        ↓
executeGrep() → grep output
        ↓
parseGrepOutput() → CommentMarker[]
        ↓
filterMarkersByType() → filtered markers
        ↓
prioritizeMarkers() → sorted markers
        ↓
generateGitHubIssues() → GitHubIssue[]
        ↓
Display results + issue templates
```

## Types

### CommentMarker

```typescript
interface CommentMarker {
  type: 'TODO' | 'FIXME' | 'HACK' | 'XXX' | 'NOTE'
  file: string
  line: number
  content: string
  context?: string
}
```

### ScanResult

```typescript
interface ScanResult {
  markers: CommentMarker[]
  totalFiles: number
  totalMarkers: number
  scanDate: string
}
```

### GitHubIssue

```typescript
interface GitHubIssue {
  title: string
  body: string
  labels: string[]
  marker: CommentMarker
}
```

## Usage

### Basic Workflow

1. **Navigate to CopilotBot** (`/agents/copilot`)
2. **Select marker types** to scan (FIXME, TODO, HACK, XXX, NOTE)
3. **Click "Scan Repository"** to find all markers
4. **Review results** and generated issue templates
5. **Use issue templates** to create GitHub issues (manual or automated)

### Example Scan Result

```markdown
# Comment Scan Summary

**Scan Date:** 12/7/2025, 5:00:00 PM
**Total Markers Found:** 4
**Files Affected:** 4

## Markers by Type

- **TODO**: 3
- **FIXME**: 1

## Markers by File

### src/components/ApiKeyConfig.tsx

- Line 194: [TODO] Handle file upload

### src/agents/regsbot/index.ts

- Line 2372: [TODO] Use LLM for better summarization

### src/agents/part75-orchestrator/regbrain-agent.ts

- Line 26: [TODO] Add ORIS code fetching via ECMPS API

### src/orchestration/workflow-executor.ts

- Line 59: [TODO] Add figmabot and testingbot when ready
```

### Example Issue Template

```markdown
## TODO Comment Found

**File:** `src/components/ApiKeyConfig.tsx`
**Line:** 194

### Description

Handle file upload

### Context
```

// TODO: Handle file upload

```

---
*This issue was automatically generated from a TODO comment in the codebase.*
*Generated on: 2025-12-07T17:00:00.000Z*
```

## API Reference

### CopilotBotService

#### scanRepository(options?: ScanOptions): Promise<ScanResult>

Scans the repository for comment markers.

**Options:**

- `includeTypes`: Array of marker types to include (default: all types)
- `excludePatterns`: File patterns to exclude (default: ['node_modules', '.git', 'dist', 'coverage'])
- `rootPath`: Root path to scan (default: 'src/')

#### generateGitHubIssues(markers: CommentMarker[]): GitHubIssue[]

Converts markers to GitHub issue payloads with appropriate labels.

#### groupIssuesByFile(issues: GitHubIssue[]): Map<string, GitHubIssue[]>

Groups issues by file for batch processing.

#### generateScanSummary(result: ScanResult): string

Generates a markdown summary of scan results.

### Utility Functions

#### parseGrepOutput(grepOutput: string): CommentMarker[]

Parses grep output to extract comment markers.

#### prioritizeMarkers(markers: CommentMarker[]): CommentMarker[]

Sorts markers by priority (FIXME > TODO > HACK > XXX > NOTE).

#### filterMarkersByType(markers: CommentMarker[], types: string[]): CommentMarker[]

Filters markers by type.

#### generateIssueTitle(marker: CommentMarker): string

Generates a GitHub issue title (max 60 chars + marker type).

#### generateIssueBody(marker: CommentMarker): string

Generates a complete GitHub issue body with file, line, description, and context.

## Testing

### Test Coverage

- **comment-scanner.test.ts**: 16 tests
  - parseGrepOutput (6 tests)
  - groupMarkersByFile (2 tests)
  - formatMarker (1 test)
  - generateIssueTitle (2 tests)
  - generateIssueBody (1 test)
  - prioritizeMarkers (2 tests)
  - filterMarkersByType (2 tests)

- **copilotbot/index.test.ts**: 10 tests
  - generateGitHubIssues (5 tests - one per marker type)
  - groupIssuesByFile (1 test)
  - generateScanSummary (2 tests)
  - scanRepository (2 tests)

### Running Tests

```bash
# Run CopilotBot tests only
npm test -- src/utils/comment-scanner.test.ts src/agents/copilotbot/index.test.ts

# Run all tests
npm test
```

## Future Enhancements

### P1 - Automation

- [ ] Direct GitHub API integration for issue creation
- [ ] Batch issue creation with rate limiting
- [ ] Deduplicate existing issues before creating new ones
- [ ] Update existing issues if markers change

### P2 - Advanced Features

- [ ] Regex pattern customization for finding markers
- [ ] Custom label mappings
- [ ] Integration with project boards
- [ ] Assignee suggestions based on file history
- [ ] Milestone assignment based on priority

### P3 - Analytics

- [ ] Trend analysis (markers over time)
- [ ] Team metrics (markers by author)
- [ ] Technical debt dashboard
- [ ] Issue resolution tracking

## Implementation Notes

### Current Limitations

1. **Mock Implementation**: The `executeGrep()` method currently returns empty string. In production, it would:
   - Execute `grep -rn "TODO|FIXME|HACK|XXX|NOTE" --include="*.ts" --include="*.tsx" rootPath`
   - Or use Node.js fs/glob to scan files directly
   - Parse the output to extract markers

2. **Manual Issue Creation**: Currently generates issue templates for manual creation. Future versions will support direct GitHub API integration.

3. **No Deduplication**: Doesn't check if issues already exist for markers.

### Best Practices

1. **Use Specific Markers**: Write clear, actionable comments

   ```typescript
   // FIXME: Memory leak in event listener - needs cleanup in useEffect
   // TODO: Add error boundary for API failures
   // HACK: Temporary workaround for Safari bug - remove after browser update
   ```

2. **Include Context**: Add enough detail for future developers

   ```typescript
   // TODO: Implement pagination when API supports it (ETA: Q2 2025)
   // FIXME: Race condition in async state updates - see issue #123
   ```

3. **Regular Scans**: Run CopilotBot weekly to track progress on markers

## Related Documentation

- [VISION.md](../VISION.md) - Multi-agent architecture overview
- [TODO.md](../TODO.md) - Project roadmap and current tasks
- [Agent Collaboration](./agent-collaboration.md) - Inter-agent communication patterns

## Changelog

### v0.1.0 (December 2025)

- Initial implementation
- Support for 5 marker types (TODO, FIXME, HACK, XXX, NOTE)
- Basic scanning and issue generation
- UI page with filtering and summary views
- 26 comprehensive tests
- Full documentation
