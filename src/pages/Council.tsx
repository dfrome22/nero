/**
 * War Council / Agent Council Page
 *
 * This is the command center where users orchestrate multi-agent conversations.
 * Think of it as a war room or court chamber where each agent has a seat
 * and can be called upon to speak, debate, or validate findings.
 */

import type { ReactNode } from 'react'
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './Council.module.css'
import type {
  CouncilSession,
  CouncilMessage,
  CouncilPreset,
  CouncilMember,
  CouncilCommand,
  CouncilAgentType,
} from '@/types/council'
import { COUNCIL_MEMBERS, COUNCIL_PRESETS, MOCK_COUNCIL_SESSION } from '@/types/council'

// =============================================================================
// AGENT AVATAR COMPONENT
// =============================================================================

interface AgentAvatarProps {
  agent: CouncilMember
  size?: 'sm' | 'md' | 'lg'
  speaking?: boolean
  onClick?: () => void
  selected?: boolean
}

function AgentAvatar({
  agent,
  size = 'md',
  speaking = false,
  onClick,
  selected = false,
}: AgentAvatarProps): ReactNode {
  return (
    <button
      className={`${styles['avatar']} ${styles[`avatar-${size}`]} ${styles[`avatar-${agent.role}`]} ${speaking ? styles['speaking'] : ''} ${selected ? styles['selected'] : ''}`}
      onClick={onClick}
      title={`${agent.name} - ${agent.title}`}
      type="button"
    >
      <span className={styles['avatarEmoji']}>{agent.emoji}</span>
      {size !== 'sm' && <span className={styles['avatarName']}>{agent.name}</span>}
      {speaking && <span className={styles['speakingIndicator']}>💬</span>}
    </button>
  )
}

// =============================================================================
// MESSAGE BUBBLE COMPONENT
// =============================================================================

interface MessageBubbleProps {
  message: CouncilMessage
  member: CouncilMember
}

function MessageBubble({ message, member }: MessageBubbleProps): ReactNode {
  const typeIcon: Record<CouncilMessage['type'], string> = {
    statement: '📢',
    challenge: '⚔️',
    response: '💭',
    question: '❓',
    verdict: '⚖️',
    citation: '📜',
  }

  return (
    <div className={`${styles['message']} ${styles[`message-${member.role}`]}`}>
      <div className={styles['messageHeader']}>
        <AgentAvatar agent={member} size="sm" />
        <span className={styles['messageSpeaker']}>{member.name}</span>
        <span className={styles['messageType']}>
          {typeIcon[message.type]} {message.type}
        </span>
        <span className={styles['messageTime']}>{message.timestamp.toLocaleTimeString()}</span>
        {message.confidence !== undefined && (
          <span className={styles['messageConfidence']}>
            {Math.round(message.confidence * 100)}% confident
          </span>
        )}
      </div>
      <div className={styles['messageContent']}>{message.content}</div>
      {Boolean(message.citations?.length) && (
        <div className={styles['messageCitations']}>
          📚 Citations: {message.citations?.join(', ')}
        </div>
      )}
      {Boolean(message.tags?.length) && (
        <div className={styles['messageTags']}>
          {message.tags?.map((tag) => (
            <span key={tag} className={styles['tag']}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COUNCIL ROSTER (Sidebar of agents)
// =============================================================================

interface CouncilRosterProps {
  participants: CouncilAgentType[]
  onSummon: (agent: CouncilAgentType) => void
  speakingAgent: CouncilAgentType | undefined
}

function CouncilRoster({ participants, onSummon, speakingAgent }: CouncilRosterProps): ReactNode {
  const allAgents = Object.values(COUNCIL_MEMBERS)
  const activeAgents = allAgents.filter((a) => participants.includes(a.id))
  const inactiveAgents = allAgents.filter((a) => !participants.includes(a.id))

  return (
    <aside className={styles['roster']}>
      <h3 className={styles['rosterTitle']}>⚔️ Council Members</h3>

      <div className={styles['rosterSection']}>
        <h4>Active</h4>
        {activeAgents.map((agent) => (
          <div key={agent.id} className={styles['rosterMember']}>
            <AgentAvatar
              agent={agent}
              size="md"
              speaking={speakingAgent === agent.id}
              onClick={() => {
                onSummon(agent.id)
              }}
            />
            <div className={styles['rosterMemberInfo']}>
              <span className={styles['rosterTitle']}>{agent.title}</span>
              <span className={styles['rosterExpertise']}>
                {agent.expertise.slice(0, 2).join(', ')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {inactiveAgents.length > 0 && (
        <div className={styles['rosterSection']}>
          <h4>Available</h4>
          {inactiveAgents.map((agent) => (
            <div key={agent.id} className={`${styles['rosterMember']} ${styles['inactive']}`}>
              <AgentAvatar
                agent={agent}
                size="sm"
                onClick={() => {
                  onSummon(agent.id)
                }}
              />
              <span className={styles['rosterMemberName']}>{agent.name}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

// =============================================================================
// COMMAND PALETTE
// =============================================================================

interface CommandPaletteProps {
  participants: CouncilAgentType[]
  onCommand: (command: CouncilCommand) => void
}

function CommandPalette({ participants, onCommand }: CommandPaletteProps): ReactNode {
  const [prompt, setPrompt] = useState('')
  const [targetAgent, setTargetAgent] = useState<CouncilAgentType | 'all'>('all')

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!prompt.trim()) return

    if (targetAgent === 'all') {
      onCommand({ type: 'ask-all', prompt })
    } else {
      onCommand({ type: 'summon', agent: targetAgent, prompt })
    }
    setPrompt('')
  }

  return (
    <form className={styles['commandPalette']} onSubmit={handleSubmit}>
      <div className={styles['commandRow']}>
        <select
          className={styles['commandTarget']}
          value={targetAgent}
          onChange={(e) => {
            setTargetAgent(e.target.value as CouncilAgentType | 'all')
          }}
        >
          <option value="all">📣 Ask All</option>
          {participants.map((p) => {
            const member = COUNCIL_MEMBERS[p]
            return (
              <option key={p} value={p}>
                {member.emoji} {member.name}
              </option>
            )
          })}
        </select>
        <input
          type="text"
          className={styles['commandInput']}
          placeholder="Enter your question or command..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value)
          }}
        />
        <button type="submit" className={styles['commandSubmit']}>
          🎤 Speak
        </button>
      </div>

      <div className={styles['commandActions']}>
        <button
          type="button"
          className={styles['actionButton']}
          onClick={() => {
            onCommand({
              type: 'challenge',
              challenger: 'regsbot',
              target: 'dahsbot',
              topic: 'implementation',
            })
          }}
        >
          ⚔️ Start Debate
        </button>
        <button
          type="button"
          className={styles['actionButton']}
          onClick={() => {
            onCommand({ type: 'conclude' })
          }}
        >
          ⚖️ Conclude
        </button>
        <button
          type="button"
          className={styles['actionButton']}
          onClick={() => {
            onCommand({ type: 'defer', reason: 'Need more information' })
          }}
        >
          ⏸️ Defer
        </button>
      </div>
    </form>
  )
}

// =============================================================================
// PRESET SELECTOR
// =============================================================================

interface PresetSelectorProps {
  onSelect: (preset: CouncilPreset) => void
}

function PresetSelector({ onSelect }: PresetSelectorProps): ReactNode {
  return (
    <div className={styles['presets']}>
      <h3>🏛️ Council Presets</h3>
      <div className={styles['presetGrid']}>
        {COUNCIL_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={styles['presetCard']}
            onClick={() => {
              onSelect(preset)
            }}
          >
            <span className={styles['presetIcon']}>{preset.icon}</span>
            <span className={styles['presetName']}>{preset.name}</span>
            <span className={styles['presetDesc']}>{preset.description}</span>
            <span className={styles['presetParticipants']}>
              {preset.participants.map((p) => COUNCIL_MEMBERS[p].emoji).join(' ')}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COUNCIL PAGE
// =============================================================================

export function Council(): ReactNode {
  const [session, setSession] = useState<CouncilSession | null>(null)
  const [speakingAgent, setSpeakingAgent] = useState<CouncilAgentType | undefined>()
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [session?.transcript.length])

  const startSession = (preset: CouncilPreset): void => {
    // For demo, use mock session but could create fresh
    const newSession: CouncilSession = {
      ...MOCK_COUNCIL_SESSION,
      id: `session-${Date.now()}`,
      title: preset.name,
      participants: preset.participants,
      status: 'in-progress',
      transcript: [],
    }
    setSession(newSession)
  }

  const loadDemoSession = (): void => {
    setSession(MOCK_COUNCIL_SESSION)
  }

  const handleCommand = (command: CouncilCommand): void => {
    if (!session) return

    // TODO: IMPLEMENT - Real command handling
    // For now, add a mock response based on command type

    const mockResponse: CouncilMessage = {
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      speaker: command.type === 'summon' ? command.agent : 'regsbot',
      type: command.type === 'challenge' ? 'challenge' : 'statement',
      content: getMockResponse(command),
      confidence: 0.85,
    }

    setSpeakingAgent(mockResponse.speaker)
    setTimeout(() => {
      setSpeakingAgent(undefined)
    }, 2000)

    setSession({
      ...session,
      transcript: [...session.transcript, mockResponse],
      updatedAt: new Date(),
    })
  }

  const handleSummon = (agent: CouncilAgentType): void => {
    if (!session) return

    // Add agent to participants if not already
    if (!session.participants.includes(agent)) {
      setSession({
        ...session,
        participants: [...session.participants, agent],
      })
    }

    handleCommand({ type: 'summon', agent, prompt: 'Please share your perspective.' })
  }

  return (
    <div className={styles['council']}>
      <header className={styles['header']}>
        <h1>🏛️ War Council</h1>
        <p className={styles['subtitle']}>
          Orchestrate multi-agent debates and validations. Command your agents.
        </p>
        <Link to="/" className={styles['backLink']}>
          ← Back to Dashboard
        </Link>
      </header>

      {session === null ? (
        <div className={styles['noSession']}>
          <PresetSelector onSelect={startSession} />
          <div className={styles['demoSection']}>
            <button className={styles['demoButton']} onClick={loadDemoSession}>
              📜 Load Demo Session (CSAPR Compliance Review)
            </button>
          </div>
        </div>
      ) : (
        <div className={styles['sessionLayout']}>
          <CouncilRoster
            participants={session.participants}
            onSummon={handleSummon}
            speakingAgent={speakingAgent}
          />

          <main className={styles['main']}>
            <div className={styles['sessionHeader']}>
              <h2>{session.title}</h2>
              <span className={`${styles['statusBadge']} ${styles[`status-${session.status}`]}`}>
                {session.status}
              </span>
            </div>

            {Boolean(session.userPrompt) && (
              <div className={styles['userPrompt']}>
                <strong>📝 Original Request:</strong> {session.userPrompt}
              </div>
            )}

            <div className={styles['transcript']} ref={transcriptRef}>
              {session.transcript.length === 0 ? (
                <div className={styles['emptyTranscript']}>
                  <p>The council awaits your command. Summon an agent or ask a question.</p>
                </div>
              ) : (
                session.transcript.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} member={COUNCIL_MEMBERS[msg.speaker]} />
                ))
              )}
            </div>

            <CommandPalette participants={session.participants} onCommand={handleCommand} />
          </main>

          <aside className={styles['sidebar']}>
            <div className={styles['findingsPanel']}>
              <h3>📋 Findings</h3>
              {Object.entries(session.sharedContext.agentFindings)
                .filter(([_, findings]) => findings.length > 0)
                .map(([agentId, findings]) => (
                  <div key={agentId} className={styles['agentFindings']}>
                    <h4>
                      {COUNCIL_MEMBERS[agentId as CouncilAgentType].emoji}{' '}
                      {COUNCIL_MEMBERS[agentId as CouncilAgentType].name}
                    </h4>
                    {findings.map((f) => (
                      <div
                        key={f.id}
                        className={`${styles['finding']} ${styles[`finding-${f.status}`]}`}
                      >
                        <span className={styles['findingType']}>{f.type}</span>
                        <span className={styles['findingContent']}>{f.content}</span>
                        {Boolean(f.source) && (
                          <span className={styles['findingSource']}>📚 {f.source}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
            </div>

            <div className={styles['actionsPanel']}>
              <h3>✅ Action Items</h3>
              {session.sharedContext.actionItems.map((item) => (
                <div key={item.id} className={styles['actionItem']}>
                  <span className={`${styles['priority']} ${styles[`priority-${item.priority}`]}`}>
                    {item.priority}
                  </span>
                  <span className={styles['actionTitle']}>{item.title}</span>
                  <span className={styles['assignee']}>
                    → {COUNCIL_MEMBERS[item.assignedTo].emoji}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles['questionsPanel']}>
              <h3>❓ Open Questions</h3>
              <ul>
                {session.sharedContext.openQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MOCK RESPONSE GENERATOR
// =============================================================================

function getMockResponse(command: CouncilCommand): string {
  /**
   * TODO: IMPLEMENT - Real LLM/MCP Integration
   *
   * This is a placeholder that generates mock responses.
   * In production, this would:
   * 1. Route to the appropriate agent's MCP server
   * 2. Include full conversation context
   * 3. Stream the response back
   */

  switch (command.type) {
    case 'summon':
      return `[${COUNCIL_MEMBERS[command.agent].name}] I have been summoned. "${command.prompt}" — Let me analyze this from my perspective as ${COUNCIL_MEMBERS[command.agent].title}. Based on my expertise in ${COUNCIL_MEMBERS[command.agent].expertise.join(', ')}, I would recommend...`

    case 'ask-all':
      return `[Council] The question "${command.prompt}" has been posed to all members. Each agent is formulating their response based on their specialized knowledge...`

    case 'challenge':
      return `[${COUNCIL_MEMBERS[command.challenger].name}] I challenge ${COUNCIL_MEMBERS[command.target].name} on the topic of "${command.topic}". Please defend your position with citations.`

    case 'conclude':
      return `[Council Secretary] The council session is being concluded. Compiling final findings and recommendations...`

    case 'defer':
      return `[Council Secretary] Session deferred. Reason: ${command.reason}. All findings have been preserved.`

    default:
      return `[Council] Command received and processed.`
  }
}

export default Council
