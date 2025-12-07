import { useNavigate } from 'react-router-dom'
import AgentCard from '../components/AgentCard'
import styles from './Dashboard.module.css'

interface Agent {
  id: string
  title: string
  description: string
  icon: string
  status: 'online' | 'offline' | 'busy'
  path: string
  role: 'knowledge' | 'product' | 'design' | 'validation'
  mcpTools: string[]
}

const agents: Agent[] = [
  {
    id: 'regs',
    title: 'RegsBot',
    description:
      'Supreme Commander of EPA knowledge. Processes eCFR, Part 60/63/75, state permits. Validates that solutions meet regulatory requirements.',
    icon: '📜',
    status: 'online',
    path: '/agents/regs',
    role: 'knowledge',
    mcpTools: ['eCFR lookup', 'ECMPS API', 'Part 60/63 knowledge', 'Applicability engine'],
  },
  {
    id: 'dahs',
    title: 'DAHSBot',
    description:
      'Product Expert. Knows DAHS inside-out: modules, features, configuration. Proposes how DAHS can meet requirements and validates implementation feasibility.',
    icon: '🖥️',
    status: 'online',
    path: '/agents/dahs',
    role: 'product',
    mcpTools: ['Feature mapping', 'Gap analysis', 'Config proposals', 'Implementation paths'],
  },
  {
    id: 'requirements',
    title: 'RequirementsBot',
    description:
      'The Translator. Creates user personas, journey maps, functional requirements. Bridges regulations to product capabilities.',
    icon: '📋',
    status: 'online',
    path: '/agents/requirements',
    role: 'design',
    mcpTools: ['User personas', 'Journey mapping', 'Functional specs', 'Gap tracking'],
  },
  {
    id: 'figma',
    title: 'FigmaBot',
    description:
      'UI/UX Designer. Generates wireframes, component libraries. Collaborates with RequirementsBot and validates with DAHSBot.',
    icon: '🎨',
    status: 'offline',
    path: '/agents/figma',
    role: 'design',
    mcpTools: ['Wireframe generation', 'Component mapping', 'A11y validation', 'Design tokens'],
  },
  {
    id: 'testing',
    title: 'TestingBot',
    description:
      'Quality Guardian. Generates test specs, acceptance criteria. Validates all agents outputs meet TDD contracts.',
    icon: '🧪',
    status: 'online',
    path: '/agents/testing',
    role: 'validation',
    mcpTools: ['Test generation', 'Acceptance criteria', 'Coverage analysis', 'TDD contracts'],
  },
  {
    id: 'copilot',
    title: 'CopilotBot',
    description:
      'Code Scout. Scans for TODOs, FIXMEs, HACKs. Creates GitHub issues. Tracks technical debt across the codebase.',
    icon: '🔍',
    status: 'online',
    path: '/agents/copilot',
    role: 'validation',
    mcpTools: ['Comment scanning', 'Issue creation', 'Tech debt tracking', 'Priority ranking'],
  },
]

// Agent collaboration flows
const collaborationFlows = [
  {
    id: 'reg-to-impl',
    name: 'Regulation → Implementation',
    description: 'Validate a regulatory requirement can be implemented in DAHS',
    agents: ['RegsBot', 'DAHSBot'],
    flow: 'RegsBot identifies requirement → DAHSBot proposes implementation → RegsBot validates compliance',
  },
  {
    id: 'req-to-ui',
    name: 'Requirements → UI Design',
    description: 'Generate wireframes from functional requirements',
    agents: ['RequirementsBot', 'FigmaBot', 'DAHSBot'],
    flow: 'RequirementsBot specs feature → FigmaBot designs UI → DAHSBot confirms feasibility',
  },
  {
    id: 'full-validation',
    name: 'Full Validation Pipeline',
    description: 'Complete check across all agents',
    agents: ['RegsBot', 'RequirementsBot', 'DAHSBot', 'TestingBot'],
    flow: 'RegsBot → RequirementsBot → DAHSBot → TestingBot validates all outputs',
  },
]

function Dashboard(): React.JSX.Element {
  const navigate = useNavigate()

  const handleAgentClick = (path: string): void => {
    void navigate(path)
  }

  const onlineAgents = agents.filter((a) => a.status === 'online').length

  return (
    <div className={styles['dashboard']}>
      <header className={styles['header']}>
        <h1 className={styles['title']}>NERO Agent Ecosystem</h1>
        <p className={styles['subtitle']}>
          Adversarial Multi-Agent AI for EPA Regulatory Compliance
        </p>
        <p className={styles['tagline']}>
          Specialized agents debate, validate, and collaborate — each with their own MCP and expert
          knowledge
        </p>
      </header>

      {/* Agent Role Legend */}
      <section className={styles['legend']}>
        <span className={styles['legendItem']} data-role="knowledge">
          <span className={styles['legendDot']} />
          Knowledge
        </span>
        <span className={styles['legendItem']} data-role="product">
          <span className={styles['legendDot']} />
          Product
        </span>
        <span className={styles['legendItem']} data-role="design">
          <span className={styles['legendDot']} />
          Design
        </span>
        <span className={styles['legendItem']} data-role="validation">
          <span className={styles['legendDot']} />
          Validation
        </span>
      </section>

      {/* Agent Fleet */}
      <section className={styles['agents']}>
        <h2 className={styles['sectionTitle']}>Agent Fleet</h2>
        <div className={styles['grid']}>
          {agents.map((agent) => (
            <div key={agent.id} className={styles['agentWrapper']} data-role={agent.role}>
              <AgentCard
                title={agent.title}
                description={agent.description}
                icon={agent.icon}
                status={agent.status}
                onClick={(): void => {
                  handleAgentClick(agent.path)
                }}
              />
              <div className={styles['mcpBadges']}>
                {agent.mcpTools.slice(0, 2).map((tool) => (
                  <span key={tool} className={styles['mcpBadge']}>
                    {tool}
                  </span>
                ))}
                {agent.mcpTools.length > 2 && (
                  <span className={styles['mcpBadge']}>+{agent.mcpTools.length - 2} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collaboration Flows */}
      <section className={styles['collaboration']}>
        <h2 className={styles['sectionTitle']}>🤖⚔️🤖 Agent Collaboration Flows</h2>
        <p className={styles['sectionSubtitle']}>
          Agents challenge and validate each other&apos;s outputs for checks and balances
        </p>
        <div className={styles['flowsGrid']}>
          {collaborationFlows.map((flow) => (
            <div key={flow.id} className={styles['flowCard']}>
              <h3 className={styles['flowName']}>{flow.name}</h3>
              <p className={styles['flowDescription']}>{flow.description}</p>
              <div className={styles['flowAgents']}>
                {flow.agents.map((agent, i) => (
                  <span key={agent}>
                    <span className={styles['flowAgent']}>{agent}</span>
                    {i < flow.agents.length - 1 && <span className={styles['flowArrow']}>→</span>}
                  </span>
                ))}
              </div>
              <p className={styles['flowDetail']}>{flow.flow}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Debate Arena Teaser */}
      <section className={styles['arena']}>
        <h2 className={styles['sectionTitle']}>🏟️ Debate Arena</h2>
        <div className={styles['arenaCard']}>
          <p className={styles['arenaText']}>
            <strong>Coming Soon:</strong> Watch agents debate in real-time. RegsBot challenges
            DAHSBot&apos;s implementation. RequirementsBot mediates. TestingBot validates the final
            answer.
          </p>
          <div className={styles['arenaPreview']}>
            <span className={styles['arenaBotLeft']}>📜 RegsBot</span>
            <span className={styles['arenaVs']}>⚔️ VS ⚔️</span>
            <span className={styles['arenaBotRight']}>🖥️ DAHSBot</span>
          </div>
          <p className={styles['arenaMediators']}>
            Mediated by: 📋 RequirementsBot • Validated by: 🧪 TestingBot
          </p>
        </div>
      </section>

      {/* System Stats */}
      <section className={styles['stats']}>
        <h2 className={styles['sectionTitle']}>System Status</h2>
        <div className={styles['statsGrid']}>
          <div className={styles['statCard']}>
            <span className={styles['statValue']}>{agents.length}</span>
            <span className={styles['statLabel']}>Total Agents</span>
          </div>
          <div className={styles['statCard']}>
            <span className={styles['statValue']}>{onlineAgents}</span>
            <span className={styles['statLabel']}>Online</span>
          </div>
          <div className={styles['statCard']}>
            <span className={styles['statValue']}>12</span>
            <span className={styles['statLabel']}>MCP Tools</span>
          </div>
          <div className={styles['statCard']}>
            <span className={styles['statValue']}>964</span>
            <span className={styles['statLabel']}>TDD Tests</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
