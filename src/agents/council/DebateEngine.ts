/**
 * Debate Engine - Mock Agent Response Generator
 *
 * This engine simulates realistic agent responses for the War Council.
 * Each agent has a distinct personality, expertise, and response patterns.
 *
 * In production, this would route to real LLM/MCP integrations.
 * For now, it provides rich mock responses that demonstrate the
 * intended behavior of the multi-agent debate system.
 */

import type {
  CouncilAgentType,
  CouncilMessage,
  CouncilCommand,
  CouncilSession,
  AgentFinding,
  SharedContext,
} from '@/types/council'
import { COUNCIL_MEMBERS } from '@/types/council'

// =============================================================================
// AGENT PERSONALITY TEMPLATES
// =============================================================================

interface AgentPersonality {
  responseStyle: string
  priorities: string[]
  vocabulary: string[]
  signaturePatterns: string[]
}

export const AGENT_PERSONALITIES: Record<CouncilAgentType, AgentPersonality> = {
  regsbot: {
    responseStyle: 'formal, citation-heavy, authoritative',
    priorities: [
      'regulatory compliance',
      'accurate citations',
      'legal requirements',
      'audit readiness',
    ],
    vocabulary: [
      'pursuant to',
      'in accordance with',
      'as specified in',
      'the regulation mandates',
      'compliance requirement',
    ],
    signaturePatterns: [
      'Per 40 CFR {section}, {requirement}.',
      'The applicable regulation ({citation}) states that {requirement}.',
      'Regulatory citation: {citation}',
    ],
  },
  dahsbot: {
    responseStyle: 'technical, practical, implementation-focused',
    priorities: ['system architecture', 'data flow', 'implementation feasibility', 'performance'],
    vocabulary: [
      'implementation',
      'data pipeline',
      'system integration',
      'polling interval',
      'calculation engine',
    ],
    signaturePatterns: [
      'From an implementation perspective, {observation}.',
      'The DAHS system handles this via {mechanism}.',
      'Technical consideration: {detail}.',
    ],
  },
  requirementsbot: {
    responseStyle: 'structured, user-centric, traceability-focused',
    priorities: ['user journeys', 'personas', 'gap analysis', 'requirement traceability'],
    vocabulary: [
      'user story',
      'acceptance criteria',
      'persona',
      'workflow',
      'requirement',
      'traceability',
    ],
    signaturePatterns: [
      'As a {persona}, I need {capability} so that {benefit}.',
      'Requirement Gap: {gap_description}',
      'This traces back to requirement {req_id}.',
    ],
  },
  figmabot: {
    responseStyle: 'visual, design-oriented, user-experience focused',
    priorities: ['UI/UX', 'accessibility', 'design patterns', 'component reuse'],
    vocabulary: [
      'wireframe',
      'component',
      'interaction pattern',
      'visual hierarchy',
      'accessibility',
    ],
    signaturePatterns: [
      'From a UX perspective, {observation}.',
      'The UI component should {behavior}.',
      'Design consideration: {detail}.',
    ],
  },
  testingbot: {
    responseStyle: 'critical, edge-case focused, evidence-driven, TDD advocate',
    priorities: [
      'test coverage',
      'edge cases',
      'automation IDs',
      'acceptance criteria',
      'test-first',
      'evidence',
    ],
    vocabulary: [
      'test case',
      'edge case',
      'automation ID',
      'data-testid',
      'Playwright',
      'acceptance criteria',
      'evidence',
      'assertion',
    ],
    signaturePatterns: [
      '⚠️ Edge Case: {scenario}',
      '🧪 Test Case: Given {precondition}, When {action}, Then {expected}',
      '🎯 Automation ID: data-testid="{id}"',
      '📋 Acceptance Criteria: {criteria}',
    ],
  },
  copilotbot: {
    responseStyle: 'code-aware, technical debt focused, actionable',
    priorities: ['code quality', 'TODO tracking', 'technical debt', 'documentation'],
    vocabulary: ['TODO', 'FIXME', 'refactor', 'technical debt', 'code smell', 'issue'],
    signaturePatterns: [
      '📝 TODO: {task}',
      '⚠️ Technical Debt: {issue}',
      '🔧 Suggested Fix: {solution}',
    ],
  },
}

// =============================================================================
// TESTINGBOT SPECIALIZED RESPONSES
// =============================================================================

interface TestCase {
  id: string
  title: string
  given: string
  when: string
  then: string
  automationId?: string
  playwrightCode?: string
  edgeCases?: string[]
  priority: 'P0' | 'P1' | 'P2' | 'P3'
}

interface TestingBotAnalysis {
  testCases: TestCase[]
  edgeCases: string[]
  automationIds: Record<string, string>
  playwrightSnippets: string[]
  acceptanceCriteria: string[]
  warnings: string[]
}

/**
 * TestingBot's specialized analysis generator
 * Generates edge cases, test cases, automation IDs, and Playwright code
 */
function generateTestingBotAnalysis(_topic: string, context: SharedContext): TestingBotAnalysis {
  const facility = context.facility

  // Generate test cases based on topic
  const testCases: TestCase[] = [
    {
      id: 'TC-001',
      title: 'Verify CEMS data display with valid readings',
      given: `A ${facility?.name ?? 'facility'} with active CEMS monitoring`,
      when: 'User navigates to the emissions dashboard',
      then: 'Current SO2, NOx, and CO2 readings are displayed with timestamps',
      automationId: 'emissions-dashboard-readings',
      playwrightCode: `await expect(page.getByTestId('emissions-dashboard-readings')).toBeVisible()
await expect(page.getByTestId('so2-value')).toHaveText(/\\d+\\.?\\d* lb\\/MMBtu/)`,
      edgeCases: ['What if CEMS is offline?', 'What if reading is NULL?'],
      priority: 'P0',
    },
    {
      id: 'TC-002',
      title: 'Validate RATA deadline notification',
      given: 'A unit with RATA due in 30 days',
      when: 'Compliance Manager views the alerts panel',
      then: 'A warning notification appears with days remaining and action link',
      automationId: 'rata-deadline-alert',
      playwrightCode: `await expect(page.getByTestId('rata-deadline-alert')).toContainText('RATA Due')
await page.getByTestId('rata-action-link').click()
await expect(page).toHaveURL(/\\/qa-tests\\/rata/)`,
      edgeCases: ['What if RATA is overdue?', 'What if multiple units have RATA due?'],
      priority: 'P0',
    },
    {
      id: 'TC-003',
      title: 'Handle missing substitute data',
      given: 'An hour with missing CEMS data requiring substitution',
      when: 'The calculation engine processes hourly emissions',
      then: 'Substitute data methodology is applied per 40 CFR 75.33',
      automationId: 'substitute-data-indicator',
      playwrightCode: `await expect(page.getByTestId('substitute-data-indicator')).toBeVisible()
await expect(page.getByTestId('sub-data-methodology')).toContainText('Maximum Potential')`,
      edgeCases: [
        'What if 3+ consecutive hours missing?',
        'What if substitute value exceeds capacity?',
      ],
      priority: 'P0',
    },
  ]

  const edgeCases = [
    '🔴 Edge Case: What happens when CEMS reports negative values?',
    '🔴 Edge Case: How does the system handle daylight saving time transitions?',
    '🔴 Edge Case: What if user has read-only permissions?',
    '🔴 Edge Case: How does pagination work with 10,000+ hourly records?',
    '🔴 Edge Case: What happens during a browser refresh mid-calculation?',
    '🔴 Edge Case: How are timezone differences handled for multi-site users?',
    '🔴 Edge Case: What if the API returns a 504 timeout?',
    '🔴 Edge Case: How does the system behave with slow network (3G)?',
  ]

  const automationIds: Record<string, string> = {
    'emissions-dashboard': 'data-testid="emissions-dashboard"',
    'facility-selector': 'data-testid="facility-selector"',
    'unit-dropdown': 'data-testid="unit-dropdown"',
    'date-range-picker': 'data-testid="date-range-picker"',
    'generate-report-btn': 'data-testid="generate-report-btn"',
    'export-csv-btn': 'data-testid="export-csv-btn"',
    'compliance-status': 'data-testid="compliance-status"',
    'alert-banner': 'data-testid="alert-banner"',
    'rata-deadline-alert': 'data-testid="rata-deadline-alert"',
    'cems-status-indicator': 'data-testid="cems-status-indicator"',
  }

  const playwrightSnippets = [
    `// Playwright: Navigate to facility and verify compliance status
test('displays compliance status for selected facility', async ({ page }) => {
  await page.goto('/agents/regs')
  await page.getByTestId('facility-selector').selectOption('${facility?.name ?? 'Keystone'}')
  await page.getByTestId('generate-report-btn').click()
  await expect(page.getByTestId('compliance-status')).toBeVisible()
})`,
    `// Playwright: Test RATA notification workflow
test('RATA deadline triggers notification', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByTestId('rata-deadline-alert')).toBeVisible()
  await page.getByTestId('rata-action-link').click()
  await expect(page).toHaveURL(/qa-tests/)
})`,
    `// Playwright: Accessibility check
test('emissions dashboard meets a11y standards', async ({ page }) => {
  await page.goto('/emissions')
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Verify keyboard navigation
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('facility-selector')).toBeFocused()
})`,
  ]

  const acceptanceCriteria = [
    'AC-1: Given a logged-in Compliance Manager, When viewing the dashboard, Then all active units with pending compliance items are listed',
    'AC-2: Given a RATA deadline within 30 days, When the user logs in, Then a warning banner is displayed with days remaining',
    'AC-3: Given CEMS data for the past hour, When calculations run, Then emissions are displayed within 5 minutes of the hour ending',
    'AC-4: Given missing CEMS data, When substitute methodology is applied, Then the substituted value is flagged with methodology code',
    'AC-5: Given a user without edit permissions, When attempting to modify settings, Then a "Read Only" message is displayed',
  ]

  const warnings = [
    '⚠️ TDD Reminder: Write tests BEFORE implementing the RATA notification feature',
    '⚠️ Missing: No E2E test for the substitute data workflow - add to Playwright suite',
    '⚠️ Coverage Gap: Error states not tested - need tests for API failures',
    '⚠️ A11y: Ensure all interactive elements have proper ARIA labels',
    '⚠️ Evidence: QA needs screenshots/recordings of test execution for audit trail',
  ]

  return {
    testCases,
    edgeCases,
    automationIds,
    playwrightSnippets,
    acceptanceCriteria,
    warnings,
  }
}

// =============================================================================
// RESPONSE GENERATORS BY AGENT
// =============================================================================

type ResponseGenerator = (
  prompt: string,
  context: SharedContext,
  session: CouncilSession
) => CouncilMessage

const RESPONSE_GENERATORS: Record<CouncilAgentType, ResponseGenerator> = {
  regsbot: (prompt, context, _session) => {
    const citations = [
      '40 CFR 75.10(a)(1)',
      '40 CFR 75.21',
      '40 CFR 75.33',
      '40 CFR 97 Subpart CCCCC',
    ]
    const selectedCitations = citations.slice(0, Math.floor(Math.random() * 3) + 1)

    const responses = [
      `Pursuant to the applicable regulations, I must highlight several compliance requirements for ${context.facility?.name ?? 'this facility'}. Per 40 CFR 75.10(a)(1), continuous emission monitoring systems (CEMS) must sample, analyze, and record SO2 concentrations at least once every 15 minutes. Additionally, ${context.facility?.state ?? 'the state'} has specific reporting deadlines under the CSAPR program.`,

      `I have reviewed the regulatory framework applicable to this discussion. The key requirements are:
1. **Monitoring**: 40 CFR 75 Subpart B mandates continuous monitoring
2. **QA Testing**: Annual RATA required per 40 CFR 75.21
3. **Recordkeeping**: 40 CFR 75.57 specifies 3-year retention
4. **Reporting**: Quarterly electronic reports per 40 CFR 75.64

Any proposed implementation must satisfy these requirements or we risk enforcement action.`,

      `From a regulatory compliance perspective, the question "${prompt}" touches on several key requirements. I want to ensure we have proper citations for any claims made. The applicable regulation (40 CFR 75.10) is clear on the monitoring requirements. However, I note that DAHSBot's implementation approach should be validated against these specific regulatory provisions before proceeding.`,
    ]

    return {
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      speaker: 'regsbot',
      type: 'statement',
      content:
        responses[Math.floor(Math.random() * responses.length)] ?? 'Regulatory analysis complete.',
      citations: selectedCitations,
      confidence: 0.92 + Math.random() * 0.06,
      tags: ['regulatory', 'compliance', 'citation'],
    }
  },

  dahsbot: (prompt, context, _session) => {
    const responses = [
      `From an implementation perspective, I can confirm the DAHS system architecture supports the discussed requirements. Our data pipeline processes CEMS readings every ${context.facility ? '1 minute' : '5 minutes'} and stores them in the emissions database. The calculation engine applies the appropriate emission rate formulas per the configured methodology.

Key technical considerations:
- **Polling Frequency**: Configurable from 1-15 minutes
- **Data Validation**: Real-time QA flags for out-of-range values
- **Failover**: Automatic substitute data activation if CEMS offline > 2 hours`,

      `I can implement what RegsBot has outlined. The DAHS system has the following capabilities relevant to this discussion:

1. **Real-time Monitoring**: WebSocket connections to CEMS analyzers
2. **Calculation Engine**: Supports all 40 CFR 75 methodologies
3. **Alerting**: Configurable thresholds with email/SMS notifications
4. **Reporting**: Pre-built templates for quarterly EDR submissions

However, I have a concern about the timeline. The RATA notification feature RegsBot mentioned would require approximately 2 sprints to implement with proper testing.`,

      `Technical assessment of "${prompt}":

The DAHS database schema already supports this workflow. We have tables for:
- \`emission_readings\` - Raw CEMS data
- \`calculated_emissions\` - Hourly/quarterly rollups
- \`qa_tests\` - RATA, CGA, linearity results
- \`substitute_data\` - Missing data periods

I recommend we leverage the existing \`notifications\` microservice for any alerting requirements. This avoids building duplicate infrastructure.`,
    ]

    return {
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      speaker: 'dahsbot',
      type: 'response',
      content:
        responses[Math.floor(Math.random() * responses.length)] ?? 'Technical assessment complete.',
      confidence: 0.85 + Math.random() * 0.1,
      tags: ['implementation', 'technical', 'architecture'],
    }
  },

  requirementsbot: (prompt, _context, _session) => {
    const responses = [
      `I can translate this discussion into actionable requirements. Based on the council's deliberation, I've identified the following user stories:

**US-001: RATA Deadline Notification**
As a **Compliance Manager**,
I need **proactive notification 30/14/7 days before RATA deadlines**
So that **I can schedule QA testing without regulatory violations**.

**Acceptance Criteria:**
- Given a unit with upcoming RATA, When deadline is 30 days away, Then email notification sent
- Given notification received, When user clicks link, Then navigates to QA scheduling page
- Given RATA completed, When results uploaded, Then notification cleared

**Traceability:** Links to 40 CFR 75.21 requirement (per RegsBot)`,

      `Analyzing the gap between current state and requirements:

**Gap Analysis Summary:**
| Gap ID | Description | Priority | Owner |
|--------|-------------|----------|-------|
| GAP-001 | No automated RATA notifications | P1 | DAHSBot |
| GAP-002 | Missing substitute data audit trail | P1 | RegsBot |
| GAP-003 | No mobile-responsive compliance dashboard | P2 | FigmaBot |

**Persona Impact:**
- Compliance Manager: Blocking - cannot meet deadlines without notifications
- Plant Operator: Medium - substitute data workflow is manual
- Auditor: High - needs evidence trail for all calculations`,

      `Based on "${prompt}", I recommend the following workflow:

**User Journey: Compliance Manager - Daily Monitoring**
1. Login → Dashboard shows units with issues (data-testid="compliance-dashboard")
2. Click unit → Detailed emissions view with trending
3. Review alerts → RATA/CGA deadlines highlighted
4. Take action → Schedule test or acknowledge alert
5. Generate report → Export for auditor review

Each step should have clear acceptance criteria that TestingBot can validate.`,
    ]

    return {
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      speaker: 'requirementsbot',
      type: 'statement',
      content:
        responses[Math.floor(Math.random() * responses.length)] ??
        'Requirements analysis complete.',
      confidence: 0.88 + Math.random() * 0.08,
      tags: ['requirements', 'user-story', 'gap-analysis'],
    }
  },

  figmabot: (_prompt, _context, _session) => {
    const responses = [
      `From a UX design perspective, I have several recommendations for the compliance dashboard:

**Visual Hierarchy:**
- Critical alerts (RATA overdue) → Red banner, top of viewport
- Warning alerts (RATA < 30 days) → Amber badge, prominent
- Informational → Subtle indicators, non-intrusive

**Component Recommendations:**
- Use existing \`AlertBanner\` component with severity prop
- Status indicators should follow our traffic light pattern
- All interactive elements need \`data-testid\` for automation

**Accessibility (WCAG 2.1 AA):**
- Color alone cannot convey status - add icons
- Ensure 4.5:1 contrast ratio on all text
- Keyboard navigation must reach all actions
- Screen reader announcements for dynamic alerts`,

      `I've sketched wireframes for the RATA notification workflow:

**Screen 1: Dashboard Alert State**
\`\`\`
┌─────────────────────────────────────────┐
│ ⚠️ RATA Due in 14 days for Unit 1     │
│    [Schedule Test] [Dismiss]            │
└─────────────────────────────────────────┘
\`\`\`

**Screen 2: QA Scheduling Modal**
\`\`\`
┌─────────────────────────────────────────┐
│ Schedule RATA for Unit 1                │
│                                         │
│ Date: [___________] 📅                  │
│ Time: [___________] ⏰                  │
│ Vendor: [Select vendor ▼]              │
│                                         │
│ [Cancel]              [Schedule Test]   │
└─────────────────────────────────────────┘
\`\`\`

All components will use our design system tokens and include proper test IDs.`,
    ]

    return {
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      speaker: 'figmabot',
      type: 'statement',
      content:
        responses[Math.floor(Math.random() * responses.length)] ?? 'Design analysis complete.',
      confidence: 0.9 + Math.random() * 0.05,
      tags: ['design', 'ux', 'wireframe', 'accessibility'],
    }
  },

  testingbot: (prompt, context, _session) => {
    const analysis = generateTestingBotAnalysis(prompt, context)
    const firstTestCase = analysis.testCases[0]

    const baseResponses = [
      `🧪 **TestingBot Quality Assurance Analysis**

Before we proceed with implementation, let me highlight critical testing considerations:

**📋 Acceptance Criteria (Testable):**
${analysis.acceptanceCriteria.slice(0, 3).join('\n')}

**🔴 Edge Cases to Consider:**
${analysis.edgeCases.slice(0, 4).join('\n')}

**🎯 Required Automation IDs:**
\`\`\`
${Object.entries(analysis.automationIds)
  .slice(0, 5)
  .map(([name, id]) => `${name}: ${id}`)
  .join('\n')}
\`\`\`

**⚠️ TDD Reminder:** Write tests FIRST! I expect to see failing tests before any implementation code is merged.`,

      `🧪 **Quality Gate Checklist**

I'm flagging several items before this feature can be considered "done":

**Pre-Implementation:**
☐ Unit tests written for core logic
☐ Integration test stubs created
☐ E2E test scenarios documented
☐ Automation IDs assigned to all interactive elements

**Implementation Evidence Required:**
☐ Screenshot of passing unit tests
☐ Coverage report showing >80% line coverage
☐ Playwright video of happy path workflow
☐ Accessibility audit results (axe-core)

**Playwright Snippet for QA:**
\`\`\`typescript
${analysis.playwrightSnippets[0] ?? '// Playwright test snippet will be generated'}
\`\`\`

**My Concerns:**
1. RequirementsBot's user story lacks specific error state handling
2. DAHSBot hasn't addressed the failover scenario testing
3. No performance acceptance criteria defined (response time SLA?)

I recommend we add explicit test cases for all error states before marking requirements complete.`,
    ]

    // Add test case specification response if we have test cases
    const responses =
      firstTestCase !== undefined
        ? [
            ...baseResponses,
            `🧪 **Test Case Specification**

I've generated the following test cases for QA validation:

**${firstTestCase.id}: ${firstTestCase.title}** (${firstTestCase.priority})
- **Given:** ${firstTestCase.given}
- **When:** ${firstTestCase.when}
- **Then:** ${firstTestCase.then}
- **Automation ID:** \`${firstTestCase.automationId}\`

**Playwright Implementation:**
\`\`\`typescript
${firstTestCase.playwrightCode}
\`\`\`

**Edge Cases for ${firstTestCase.id}:**
${firstTestCase.edgeCases?.map((e) => `- ${e}`).join('\n') ?? 'No edge cases defined'}

---

${analysis.warnings.slice(0, 2).join('\n')}`,
          ]
        : baseResponses

    return {
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      speaker: 'testingbot',
      type: 'statement',
      content:
        responses[Math.floor(Math.random() * responses.length)] ?? 'Testing analysis complete.',
      confidence: 0.95,
      tags: ['testing', 'qa', 'automation', 'edge-cases', 'playwright', 'tdd'],
    }
  },

  copilotbot: (prompt, _context, _session) => {
    const responses = [
      `🤖 **Code Quality Scan Results**

I've analyzed the codebase for items related to this discussion:

**TODOs Found:**
- \`src/components/AlertBanner.tsx:45\` - TODO: Add RATA-specific alert type
- \`src/services/notifications.ts:112\` - FIXME: Email template not styled
- \`src/pages/QATests.tsx:78\` - TODO: Implement scheduling modal

**Technical Debt:**
- The \`notifications\` service uses deprecated axios syntax
- Missing TypeScript types for QA test responses
- No error boundary around the emissions dashboard

**Suggested GitHub Issues:**
1. "Add RATA deadline notification component" - Priority: High
2. "Refactor notifications service to use fetch API" - Priority: Medium
3. "Add error boundary to emissions dashboard" - Priority: High

Shall I create these issues automatically?`,

      `🤖 **Codebase Analysis for "${prompt}"**

**Relevant Files:**
- \`src/types/qa-tests.ts\` - Types for RATA/CGA/linearity
- \`src/services/compliance.ts\` - Compliance calculation logic
- \`src/components/ComplianceReport.tsx\` - Report UI (851 lines - consider splitting)

**Code Smells Detected:**
⚠️ \`ComplianceReport.tsx\` is too large - recommend extracting sections to separate components
⚠️ Duplicate date formatting logic in 4 files - extract to utility
⚠️ Magic numbers in \`calculateEmissions.ts\` - should be constants

**Action Items I Can Help With:**
- Generate boilerplate for new RATA notification component
- Create GitHub issue templates for the gaps identified
- Update CHANGELOG.md when feature is complete`,
    ]

    return {
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      speaker: 'copilotbot',
      type: 'statement',
      content: responses[Math.floor(Math.random() * responses.length)] ?? 'Code analysis complete.',
      confidence: 0.88,
      tags: ['code-quality', 'todo', 'technical-debt', 'github'],
    }
  },
}

// =============================================================================
// DEBATE ENGINE CLASS
// =============================================================================

export class DebateEngine {
  private session: CouncilSession

  constructor(session: CouncilSession) {
    this.session = session
  }

  /**
   * Generate a response from a specific agent
   */
  generateResponse(agent: CouncilAgentType, prompt: string): CouncilMessage {
    const generator = RESPONSE_GENERATORS[agent]
    return generator(prompt, this.session.sharedContext, this.session)
  }

  /**
   * Generate a challenge response when one agent challenges another
   */
  generateChallenge(
    challenger: CouncilAgentType,
    target: CouncilAgentType,
    topic: string
  ): CouncilMessage {
    const challengerMember = COUNCIL_MEMBERS[challenger]
    const targetMember = COUNCIL_MEMBERS[target]

    const challengeTemplates = [
      `I challenge ${targetMember.name}'s assertion regarding ${topic}. From my perspective as ${challengerMember.title}, I see a potential issue: {concern}. Can you provide evidence or citations to support your position?`,

      `${targetMember.emoji} ${targetMember.name}, I must respectfully push back on your ${topic} analysis. As ${challengerMember.title}, my expertise suggests {alternative}. How do you reconcile this with your proposal?`,

      `Hold on, ${targetMember.name}. Before we proceed with the ${topic} approach, I need clarification. From ${challengerMember.expertise[0]} standpoint: {question}?`,
    ]

    const concerns: Record<CouncilAgentType, string[]> = {
      regsbot: [
        "I don't see proper regulatory citations for this approach",
        'This may not satisfy 40 CFR 75 requirements',
        "The audit trail requirements haven't been addressed",
      ],
      dahsbot: [
        'The implementation complexity is being underestimated',
        "Performance implications haven't been considered",
        "The data model doesn't support this workflow",
      ],
      requirementsbot: [
        'The user persona needs are not fully captured',
        'Traceability to original requirements is missing',
        'Edge cases in the user journey are undefined',
      ],
      figmabot: [
        'The UX for this workflow is unclear',
        'Accessibility requirements are not met',
        "The design doesn't follow our component patterns",
      ],
      testingbot: [
        'There are no acceptance criteria I can validate',
        'Edge cases are not documented',
        'Automation IDs are missing for testability',
      ],
      copilotbot: [
        "Existing code doesn't support this architecture",
        'This creates technical debt',
        'TODOs from related features are still unresolved',
      ],
    }

    const template =
      challengeTemplates[Math.floor(Math.random() * challengeTemplates.length)] ??
      'I have concerns: {concern}'
    const concernList = concerns[challenger]
    const concern = concernList[Math.floor(Math.random() * concernList.length)] ?? 'unspecified'
    const content = template
      .replace('{concern}', concern)
      .replace('{alternative}', concern)
      .replace('{question}', concern)

    return {
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      speaker: challenger,
      type: 'challenge',
      content,
      confidence: 0.85,
      tags: ['challenge', 'debate', topic],
    }
  }

  /**
   * Generate findings from an agent based on context
   */
  generateFindings(agent: CouncilAgentType): AgentFinding[] {
    const context = this.session.sharedContext
    const findingsTemplates: Record<CouncilAgentType, AgentFinding[]> = {
      regsbot: [
        {
          id: `finding-${Date.now()}-1`,
          agentId: 'regsbot',
          type: 'requirement',
          content: `${context.facility?.name ?? 'Facility'} requires CEMS per 40 CFR 75.10`,
          source: '40 CFR 75.10(a)(1)',
          confidence: 0.98,
          status: 'validated',
        },
        {
          id: `finding-${Date.now()}-2`,
          agentId: 'regsbot',
          type: 'fact',
          content: 'Annual RATA required for all affected units',
          source: '40 CFR 75.21',
          confidence: 0.95,
          status: 'proposed',
        },
      ],
      testingbot: [
        {
          id: `finding-${Date.now()}-1`,
          agentId: 'testingbot',
          type: 'gap',
          content: 'No E2E test coverage for RATA notification workflow',
          confidence: 0.9,
          status: 'proposed',
        },
        {
          id: `finding-${Date.now()}-2`,
          agentId: 'testingbot',
          type: 'requirement',
          content: 'All interactive elements require data-testid attributes',
          confidence: 0.95,
          status: 'proposed',
        },
        {
          id: `finding-${Date.now()}-3`,
          agentId: 'testingbot',
          type: 'concern',
          content: 'Edge case not covered: What if RATA is overdue when user first logs in?',
          confidence: 0.88,
          status: 'proposed',
        },
      ],
      dahsbot: [
        {
          id: `finding-${Date.now()}-1`,
          agentId: 'dahsbot',
          type: 'fact',
          content: 'DAHS polling interval is configurable (1-15 minutes)',
          confidence: 0.92,
          status: 'validated',
        },
      ],
      requirementsbot: [
        {
          id: `finding-${Date.now()}-1`,
          agentId: 'requirementsbot',
          type: 'gap',
          content: 'Missing persona: "Auditor" who needs read-only compliance evidence',
          confidence: 0.85,
          status: 'proposed',
        },
      ],
      figmabot: [
        {
          id: `finding-${Date.now()}-1`,
          agentId: 'figmabot',
          type: 'recommendation',
          content: 'Use existing AlertBanner component with severity prop for RATA alerts',
          confidence: 0.9,
          status: 'proposed',
        },
      ],
      copilotbot: [
        {
          id: `finding-${Date.now()}-1`,
          agentId: 'copilotbot',
          type: 'concern',
          content: 'ComplianceReport.tsx (851 lines) should be split for maintainability',
          confidence: 0.87,
          status: 'proposed',
        },
      ],
    }

    return findingsTemplates[agent]
  }

  /**
   * Process a user command and generate appropriate responses
   */
  processCommand(command: CouncilCommand): CouncilMessage[] {
    const messages: CouncilMessage[] = []

    switch (command.type) {
      case 'summon':
        messages.push(this.generateResponse(command.agent, command.prompt))
        break

      case 'ask-all':
        // Each participant responds
        for (const agent of this.session.participants) {
          messages.push(this.generateResponse(agent, command.prompt))
        }
        break

      case 'challenge':
        messages.push(this.generateChallenge(command.challenger, command.target, command.topic))
        // Target responds to challenge
        messages.push(
          this.generateResponse(command.target, `Responding to challenge about ${command.topic}`)
        )
        break

      case 'conclude':
        messages.push({
          id: `msg-${Date.now()}`,
          timestamp: new Date(),
          speaker: 'regsbot', // Secretary role
          type: 'verdict',
          content: `**Council Session Concluded**

Summary of Findings:
- ${this.session.sharedContext.agentFindings.regsbot.length} regulatory requirements identified
- ${this.session.sharedContext.agentFindings.testingbot.length} testing gaps flagged
- ${this.session.sharedContext.actionItems.length} action items assigned

Next Steps:
1. DAHSBot to implement RATA notification feature
2. TestingBot to write E2E tests before implementation
3. FigmaBot to finalize wireframes for QA scheduling modal
4. RequirementsBot to update user stories with edge cases

${command.summary ?? 'The council has reached consensus on the path forward.'}`,
          confidence: 1.0,
          tags: ['verdict', 'conclusion'],
        })
        break

      default:
        messages.push({
          id: `msg-${Date.now()}`,
          timestamp: new Date(),
          speaker: 'regsbot',
          type: 'statement',
          content: 'Command received and processed.',
          confidence: 1.0,
        })
    }

    return messages
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createDebateEngine(session: CouncilSession): DebateEngine {
  return new DebateEngine(session)
}

// =============================================================================
// TODO: REAL INTEGRATION
// =============================================================================

/**
 * TODO: IMPLEMENT - Real Agent MCP Integration
 *
 * Replace mock generators with real MCP calls:
 *
 * 1. RegsBot → epa-compliance-mcp
 *    - Use get_monitoring_requirements for CEMS reqs
 *    - Use search_permits for facility context
 *    - Include real citations from eCFR
 *
 * 2. DAHSBot → dahs-product-mcp (to be created)
 *    - Query product roadmap
 *    - Check implementation status
 *    - Get technical constraints
 *
 * 3. TestingBot → testing-mcp (to be created)
 *    - Generate test cases from requirements
 *    - Suggest Playwright code based on UI specs
 *    - Track test coverage metrics
 *
 * 4. LLM Integration
 *    - Use Claude/GPT for natural language generation
 *    - Fine-tune prompts per agent personality
 *    - Stream responses for real-time feel
 */
