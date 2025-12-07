/**
 * Agent Council / War Council Types
 *
 * This module defines the conversation protocol for multi-agent debates,
 * collaboration sessions, and adversarial validation flows.
 *
 * The "Council Chamber" metaphor treats each agent as a council member
 * with specialized expertise who can be called upon to speak, debate,
 * or validate other agents' statements.
 */

// =============================================================================
// AGENT IDENTITY & ROLES
// =============================================================================

/** Council-specific agent type (lowercase for consistency) */
export type CouncilAgentType =
  | 'regsbot'
  | 'dahsbot'
  | 'requirementsbot'
  | 'figmabot'
  | 'testingbot'
  | 'copilotbot'

/** Extended agent info for council participation */
export interface CouncilMember {
  id: CouncilAgentType
  name: string
  role: 'knowledge' | 'product' | 'design' | 'validation'
  title: string // e.g., "Regulatory Counsel", "Product Architect"
  emoji: string
  expertise: string[]
  personality: 'analytical' | 'creative' | 'critical' | 'balanced'
}

/** Pre-defined council members */
export const COUNCIL_MEMBERS: Record<CouncilAgentType, CouncilMember> = {
  regsbot: {
    id: 'regsbot',
    name: 'RegsBot',
    role: 'knowledge',
    title: 'Regulatory Counsel',
    emoji: '📜',
    expertise: ['40 CFR Part 75', 'EPA Regulations', 'CEMS Requirements', 'Citations'],
    personality: 'analytical',
  },
  dahsbot: {
    id: 'dahsbot',
    name: 'DAHSBot',
    role: 'product',
    title: 'Product Architect',
    emoji: '🖥️',
    expertise: ['DAHS Systems', 'Data Flow', 'Calculations', 'Implementation'],
    personality: 'balanced',
  },
  requirementsbot: {
    id: 'requirementsbot',
    name: 'RequirementsBot',
    role: 'design',
    title: 'Requirements Engineer',
    emoji: '📋',
    expertise: ['User Journeys', 'Gap Analysis', 'Personas', 'Specifications'],
    personality: 'creative',
  },
  figmabot: {
    id: 'figmabot',
    name: 'FigmaBot',
    role: 'design',
    title: 'UX Architect',
    emoji: '🎨',
    expertise: ['Wireframes', 'Components', 'Design Systems', 'Accessibility'],
    personality: 'creative',
  },
  testingbot: {
    id: 'testingbot',
    name: 'TestingBot',
    role: 'validation',
    title: 'Quality Advocate',
    emoji: '🧪',
    expertise: ['Test Specs', 'Acceptance Criteria', 'Edge Cases', 'Validation'],
    personality: 'critical',
  },
  copilotbot: {
    id: 'copilotbot',
    name: 'CopilotBot',
    role: 'validation',
    title: 'Code Sentinel',
    emoji: '🤖',
    expertise: ['TODO Tracking', 'Code Review', 'Technical Debt', 'GitHub Issues'],
    personality: 'analytical',
  },
}

// =============================================================================
// MESSAGE & CONVERSATION TYPES
// =============================================================================

/** A single message in the council */
export interface CouncilMessage {
  id: string
  timestamp: Date
  speaker: CouncilAgentType
  type: 'statement' | 'challenge' | 'response' | 'question' | 'verdict' | 'citation'
  content: string
  /** Optional reference to what this message is responding to */
  inResponseTo?: string
  /** Optional citations (for RegsBot) */
  citations?: string[]
  /** Confidence level 0-1 */
  confidence?: number
  /** Tags for filtering */
  tags?: string[]
}

/** A debate round between agents */
export interface DebateRound {
  id: string
  roundNumber: number
  topic: string
  challenger: CouncilAgentType
  defender: CouncilAgentType
  mediator?: CouncilAgentType
  messages: CouncilMessage[]
  verdict?: {
    winner?: CouncilAgentType
    consensus: boolean
    summary: string
  }
}

/** Full council session */
export interface CouncilSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'in-progress' | 'paused' | 'concluded'
  /** The user's original question/context */
  userPrompt: string
  /** Agents participating in this session */
  participants: CouncilAgentType[]
  /** Context package passed between agents */
  sharedContext: SharedContext
  /** All messages in chronological order */
  transcript: CouncilMessage[]
  /** Debate rounds (if structured debate mode) */
  debates?: DebateRound[]
  /** Final conclusions */
  conclusions?: CouncilConclusion[]
}

/** Shared context package that travels between agents */
export interface SharedContext {
  /** Original user request */
  originalRequest: string
  /** Facility/regulatory context */
  facility?: {
    name: string
    state: string
    unitTypes: string[]
    parameters: string[]
  }
  /** Findings from each agent */
  agentFindings: Record<CouncilAgentType, AgentFinding[]>
  /** Action items identified */
  actionItems: ActionItem[]
  /** Open questions */
  openQuestions: string[]
}

/** A finding contributed by an agent */
export interface AgentFinding {
  id: string
  agentId: CouncilAgentType
  type: 'fact' | 'concern' | 'recommendation' | 'gap' | 'requirement'
  content: string
  source?: string
  confidence: number
  status: 'proposed' | 'validated' | 'challenged' | 'resolved'
  /** Which agents have validated this */
  validatedBy?: CouncilAgentType[]
  /** Which agents have challenged this */
  challengedBy?: CouncilAgentType[]
}

/** Action item from council deliberations */
export interface ActionItem {
  id: string
  title: string
  description: string
  assignedTo: CouncilAgentType
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'blocked' | 'completed'
  dueBy?: string
}

/** Final conclusion from council */
export interface CouncilConclusion {
  id: string
  type: 'consensus' | 'majority' | 'split' | 'deferred'
  summary: string
  supportingAgents: CouncilAgentType[]
  dissentingAgents?: CouncilAgentType[]
  recommendations: string[]
  nextSteps: string[]
}

// =============================================================================
// COUNCIL COMMANDS (User -> Council)
// =============================================================================

/** Commands the user can issue to the council */
export type CouncilCommand =
  | { type: 'summon'; agent: CouncilAgentType; prompt: string }
  | { type: 'ask-all'; prompt: string }
  | { type: 'challenge'; challenger: CouncilAgentType; target: CouncilAgentType; topic: string }
  | { type: 'validate'; validator: CouncilAgentType; findingId: string }
  | { type: 'mediate'; mediator: CouncilAgentType; disputeIds: string[] }
  | { type: 'conclude'; summary?: string }
  | { type: 'defer'; reason: string }
  | { type: 'add-context'; context: Partial<SharedContext> }

// =============================================================================
// COUNCIL PRESETS (Common workflows)
// =============================================================================

/** Pre-defined council session templates */
export interface CouncilPreset {
  id: string
  name: string
  description: string
  icon: string
  participants: CouncilAgentType[]
  workflow: 'round-robin' | 'debate' | 'waterfall' | 'free-form'
  initialPromptTemplate: string
}

export const COUNCIL_PRESETS: CouncilPreset[] = [
  {
    id: 'compliance-review',
    name: 'Compliance Review Council',
    description: 'Full regulatory compliance review with validation',
    icon: '⚖️',
    participants: ['regsbot', 'dahsbot', 'testingbot'],
    workflow: 'waterfall',
    initialPromptTemplate:
      'Review compliance requirements for {facility} and validate implementation approach.',
  },
  {
    id: 'feature-design',
    name: 'Feature Design Council',
    description: 'Design a new feature with requirements and UX',
    icon: '🎯',
    participants: ['requirementsbot', 'figmabot', 'testingbot'],
    workflow: 'round-robin',
    initialPromptTemplate: 'Design a new feature for {feature_name} with full specifications.',
  },
  {
    id: 'adversarial-audit',
    name: 'Adversarial Audit',
    description: 'Agents challenge each other to find gaps',
    icon: '⚔️',
    participants: ['regsbot', 'dahsbot', 'requirementsbot', 'testingbot'],
    workflow: 'debate',
    initialPromptTemplate: 'Audit the {topic} implementation. Challenge all assumptions.',
  },
  {
    id: 'war-council',
    name: 'Full War Council',
    description: 'All agents convene for major decisions',
    icon: '🏰',
    participants: ['regsbot', 'dahsbot', 'requirementsbot', 'figmabot', 'testingbot', 'copilotbot'],
    workflow: 'free-form',
    initialPromptTemplate: 'The council is assembled. The matter before us: {topic}',
  },
]

// =============================================================================
// MOCK DATA FOR DEVELOPMENT
// =============================================================================

/** Mock session for development/demo purposes */
export const MOCK_COUNCIL_SESSION: CouncilSession = {
  id: 'session-001',
  title: 'CSAPR Unit Implementation Review',
  createdAt: new Date('2025-12-07T10:00:00'),
  updatedAt: new Date('2025-12-07T10:30:00'),
  status: 'in-progress',
  userPrompt:
    'Review the compliance requirements for a new CSAPR unit in Pennsylvania and identify implementation gaps.',
  participants: ['regsbot', 'dahsbot', 'requirementsbot', 'testingbot'],
  sharedContext: {
    originalRequest: 'New CSAPR unit compliance review - PA facility',
    facility: {
      name: 'Keystone Generation Station',
      state: 'PA',
      unitTypes: ['Coal-fired boiler'],
      parameters: ['SO2', 'NOx', 'CO2'],
    },
    agentFindings: {
      regsbot: [
        {
          id: 'finding-001',
          agentId: 'regsbot',
          type: 'fact',
          content: '40 CFR 75.10 requires continuous SO2 monitoring with CEMS',
          source: '40 CFR 75.10(a)(1)',
          confidence: 0.98,
          status: 'validated',
          validatedBy: ['dahsbot'],
        },
        {
          id: 'finding-002',
          agentId: 'regsbot',
          type: 'requirement',
          content: 'RATA must be performed annually per 40 CFR 75.21',
          source: '40 CFR 75.21',
          confidence: 0.95,
          status: 'proposed',
        },
      ],
      dahsbot: [
        {
          id: 'finding-003',
          agentId: 'dahsbot',
          type: 'concern',
          content:
            'Current DAHS polling interval of 5 minutes may exceed 40 CFR 75 1-minute requirements',
          confidence: 0.85,
          status: 'challenged',
          challengedBy: ['regsbot'],
        },
      ],
      requirementsbot: [],
      figmabot: [],
      testingbot: [
        {
          id: 'finding-004',
          agentId: 'testingbot',
          type: 'gap',
          content: 'No automated test coverage for RATA deadline notifications',
          confidence: 0.9,
          status: 'proposed',
        },
      ],
      copilotbot: [],
    },
    actionItems: [
      {
        id: 'action-001',
        title: 'Verify polling interval compliance',
        description: 'DAHSBot to confirm 1-minute data collection capability',
        assignedTo: 'dahsbot',
        priority: 'high',
        status: 'in-progress',
      },
    ],
    openQuestions: [
      'Does the facility have existing CEMS infrastructure?',
      'What is the expected unit capacity factor?',
    ],
  },
  transcript: [
    {
      id: 'msg-001',
      timestamp: new Date('2025-12-07T10:00:00'),
      speaker: 'regsbot',
      type: 'statement',
      content:
        'I have reviewed the applicable regulations for a CSAPR unit in Pennsylvania. Key requirements include continuous monitoring under 40 CFR Part 75 Subpart B, with specific provisions for SO2 and NOx emissions.',
      citations: ['40 CFR 75.10', '40 CFR 75.11', '40 CFR 97 Subpart CCCCC'],
      confidence: 0.95,
    },
    {
      id: 'msg-002',
      timestamp: new Date('2025-12-07T10:05:00'),
      speaker: 'dahsbot',
      type: 'response',
      content:
        'Understood. Our DAHS system can handle the monitoring requirements. However, I want to flag a potential issue: our current default polling configuration uses 5-minute intervals. We may need to verify this meets the 1-minute averaging requirements.',
      inResponseTo: 'msg-001',
      confidence: 0.85,
    },
    {
      id: 'msg-003',
      timestamp: new Date('2025-12-07T10:08:00'),
      speaker: 'regsbot',
      type: 'challenge',
      content:
        'I must challenge that concern. 40 CFR 75.10(d)(1) specifies that the minimum data collection frequency is once per 15 minutes for most parameters. The 1-minute requirement only applies to the averaging period for calculated hourly emissions, not raw data polling. Please cite the specific regulation you are referencing.',
      inResponseTo: 'msg-002',
      citations: ['40 CFR 75.10(d)(1)'],
      confidence: 0.92,
    },
    {
      id: 'msg-004',
      timestamp: new Date('2025-12-07T10:12:00'),
      speaker: 'dahsbot',
      type: 'response',
      content:
        'You are correct, RegsBot. I was conflating the averaging period with the polling frequency. I withdraw my concern about the polling interval. Our 5-minute polling exceeds the 15-minute minimum requirement.',
      inResponseTo: 'msg-003',
      confidence: 0.95,
    },
    {
      id: 'msg-005',
      timestamp: new Date('2025-12-07T10:15:00'),
      speaker: 'testingbot',
      type: 'question',
      content:
        'While we have resolved the polling interval question, I notice there is no automated test coverage for RATA deadline notifications. Should I generate acceptance criteria for this requirement?',
      confidence: 0.88,
    },
    {
      id: 'msg-006',
      timestamp: new Date('2025-12-07T10:18:00'),
      speaker: 'requirementsbot',
      type: 'statement',
      content:
        'I can help translate that into user stories. Based on the discussion, I see a gap in our persona coverage: we need a "Compliance Manager" persona who receives proactive RATA deadline alerts. This is a P1 requirement.',
      tags: ['user-story', 'persona', 'gap'],
      confidence: 0.9,
    },
  ],
  debates: [
    {
      id: 'debate-001',
      roundNumber: 1,
      topic: 'Data Polling Frequency Requirements',
      challenger: 'regsbot',
      defender: 'dahsbot',
      messages: [],
      verdict: {
        winner: 'regsbot',
        consensus: true,
        summary:
          'RegsBot correctly cited 40 CFR 75.10(d)(1) showing 15-minute minimum polling. DAHSBot acknowledged the correction.',
      },
    },
  ],
}

// =============================================================================
// TO IMPLEMENT: Real Agent Integration
// =============================================================================

/**
 * TODO: IMPLEMENT - Real Agent Integration
 *
 * The following functionality needs to be implemented:
 *
 * 1. CouncilOrchestrator class
 *    - Start/pause/resume sessions
 *    - Route commands to appropriate agents
 *    - Manage turn-taking in structured debates
 *    - Aggregate findings and build consensus
 *
 * 2. Agent MCP Integration
 *    - Connect each agent to their MCP server
 *    - RegsBot → epa-compliance-mcp for regulations
 *    - DAHSBot → DAHS product knowledge MCP
 *    - etc.
 *
 * 3. Real-time Updates
 *    - WebSocket or SSE for live transcript updates
 *    - Streaming responses from LLM-backed agents
 *
 * 4. Persistence
 *    - Save/load council sessions
 *    - Export transcripts as markdown/PDF
 *
 * 5. Human-in-the-Loop
 *    - Approval gates for critical findings
 *    - User can override agent decisions
 *    - Escalation to human expert
 */
