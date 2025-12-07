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
}

const agents: Agent[] = [
  {
    id: 'regs',
    title: 'RegsBot',
    description:
      'Supreme Commander of EPA knowledge. Processes eCFR regulations, EPA sources, and state permits to provide authoritative regulatory guidance.',
    icon: '📜',
    status: 'online',
    path: '/agents/regs',
  },
  {
    id: 'requirements',
    title: 'RequirementsBot',
    description:
      'Translates regulatory requirements into actionable specs. Creates user personas, workflows, journey maps, and functional requirements for DAHS.',
    icon: '📋',
    status: 'online',
    path: '/agents/requirements',
  },
  {
    id: 'figma',
    title: 'FigmaBot',
    description:
      'Scaffolds UI/UX experiences from requirements. Generates wireframes, component libraries, and iterates with RequirementsBot for compliance.',
    icon: '🎨',
    status: 'offline',
    path: '/agents/figma',
  },
  {
    id: 'testing',
    title: 'TestingBot',
    description:
      'Implements TDD infrastructure. Generates test specifications, acceptance criteria, and design contracts for development teams.',
    icon: '🧪',
    status: 'online',
    path: '/agents/testing',
  },
  {
    id: 'copilot',
    title: 'CopilotBot',
    description:
      'Scans repository for Copilot-generated comments (TODO, FIXME, HACK, XXX, NOTE) and creates GitHub issues automatically for better task tracking.',
    icon: '🤖',
    status: 'online',
    path: '/agents/copilot',
  },
]

function Dashboard(): React.JSX.Element {
  const navigate = useNavigate()

  const handleAgentClick = (path: string): void => {
    void navigate(path)
  }

  return (
    <div className={styles['dashboard']}>
      <header className={styles['header']}>
        <h1 className={styles['title']}>Dashboard</h1>
        <p className={styles['subtitle']}>
          Multi-Agent AI Orchestration for EPA Regulatory Compliance
        </p>
      </header>

      <section className={styles['agents']}>
        <h2 className={styles['sectionTitle']}>Agent Fleet</h2>
        <div className={styles['grid']}>
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              title={agent.title}
              description={agent.description}
              icon={agent.icon}
              status={agent.status}
              onClick={(): void => {
                handleAgentClick(agent.path)
              }}
            />
          ))}
        </div>
      </section>

      <section className={styles['stats']}>
        <h2 className={styles['sectionTitle']}>System Status</h2>
        <div className={styles['statsGrid']}>
          <div className={styles['statCard']}>
            <span className={styles['statValue']}>5</span>
            <span className={styles['statLabel']}>Total Agents</span>
          </div>
          <div className={styles['statCard']}>
            <span className={styles['statValue']}>4</span>
            <span className={styles['statLabel']}>Online</span>
          </div>
          <div className={styles['statCard']}>
            <span className={styles['statValue']}>0</span>
            <span className={styles['statLabel']}>Active Tasks</span>
          </div>
          <div className={styles['statCard']}>
            <span className={styles['statValue']}>--</span>
            <span className={styles['statLabel']}>Docs Processed</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
